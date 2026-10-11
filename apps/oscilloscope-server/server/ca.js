const forge   = require('node-forge');
const fs      = require('fs');
const path    = require('path');
const { execFile, spawn } = require('child_process');
const { app }  = require('electron');
const os       = require('os');

const CA_NAME  = 'OscilloscopeServerCA';

function getDataDir() {
  const dir = path.join(app.getPath('userData'), 'tls');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getPaths() {
  const dir = getDataDir();
  return {
    caKeyFile:   path.join(dir, 'ca-key.pem'),
    caCertFile:  path.join(dir, 'ca-cert.pem'),
    certFile:    path.join(dir, 'cert.pem'),
    keyFile:     path.join(dir, 'key.pem'),
    caDerFile:   path.join(dir, 'ca-cert.der'),
    flagFile:    path.join(dir, 'ca-installed.flag'),
  };
}

function getLocalIps() {
  const ips = ['127.0.0.1'];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

// ── Certificate generation ─────────────────────────────────────────────────

function generateCA() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter  = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [
    { name: 'commonName',       value: CA_NAME },
    { name: 'organizationName', value: 'Fizikai Kiserletek' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, critical: true },
    { name: 'subjectKeyIdentifier' },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { caCert: cert, caKey: keys.privateKey };
}

function generateServerCert(caCert, caKey) {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '02';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter  = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [{ name: 'commonName', value: 'Oscilloscope Server' }];
  cert.setSubject(attrs);
  cert.setIssuer(caCert.subject.attributes);

  // Include all local IPs in SAN so Chrome accepts the cert on any interface
  const altNames = [
    { type: 2, value: 'localhost' },
    ...getLocalIps().map(ip => ({ type: 7, ip })),
  ];

  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'subjectAltName', altNames },
  ]);
  cert.sign(caKey, forge.md.sha256.create());
  return { cert, key: keys.privateKey };
}

// ── Ensure certs exist on disk ─────────────────────────────────────────────

function ensureCerts() {
  const p = getPaths();
  if (!fs.existsSync(p.caCertFile) || !fs.existsSync(p.caKeyFile)) {
    const { caCert, caKey } = generateCA();
    const { cert, key }     = generateServerCert(caCert, caKey);

    fs.writeFileSync(p.caCertFile, forge.pki.certificateToPem(caCert));
    fs.writeFileSync(p.caKeyFile,  forge.pki.privateKeyToPem(caKey));
    fs.writeFileSync(p.certFile,   forge.pki.certificateToPem(cert));
    fs.writeFileSync(p.keyFile,    forge.pki.privateKeyToPem(key));

    // DER for certutil
    const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(caCert)).getBytes();
    fs.writeFileSync(p.caDerFile, Buffer.from(derBytes, 'binary'));
  }

  return {
    cert: fs.readFileSync(p.certFile, 'utf8'),
    key:  fs.readFileSync(p.keyFile,  'utf8'),
  };
}

// ── Regenerate server cert with current IPs (call if network changed) ──────

function regenerateServerCert() {
  const p = getPaths();
  if (!fs.existsSync(p.caCertFile)) return;
  const caCert = forge.pki.certificateFromPem(fs.readFileSync(p.caCertFile, 'utf8'));
  const caKey  = forge.pki.privateKeyFromPem(fs.readFileSync(p.caKeyFile,  'utf8'));
  const { cert, key } = generateServerCert(caCert, caKey);
  fs.writeFileSync(p.certFile, forge.pki.certificateToPem(cert));
  fs.writeFileSync(p.keyFile,  forge.pki.privateKeyToPem(key));
}

// ── Check if CA is actually in the Windows trust store ────────────────────
// Uses certutil -verifystore to confirm, not just the flag file.

function verifyCaInStore() {
  return new Promise((resolve) => {
    execFile('certutil', ['-verifystore', '-user', 'Root', CA_NAME],
      (err) => resolve(!err)
    );
  });
}

function isCaInstalled() {
  return fs.existsSync(getPaths().flagFile);
}

// ── Elevated install via PowerShell ───────────────────────────────────────

function tryInstallCaElevated() {
  return new Promise((resolve) => {
    const { caDerFile, flagFile } = getPaths();
    if (!fs.existsSync(caDerFile)) {
      resolve({ ok: false, reason: 'missing der' });
      return;
    }

    // Escape backslashes for PowerShell string
    const derEscaped = caDerFile.replace(/\\/g, '\\\\');

    // Run certutil elevated; -addstore ROOT (LocalMachine) requires admin.
    // We write a small temp ps1 to avoid quoting issues with spaces in path.
    const tmpScript = path.join(getDataDir(), '_install-ca.ps1');
    fs.writeFileSync(tmpScript,
      `certutil -addstore -f "Root" "${caDerFile}"\r\n`
    );

    const psCmd = `Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','${derEscaped.replace(/\\\\/g, '\\\\\\\\')}' -Verb RunAs -Wait`;

    // Simpler: just elevate certutil directly
    const certutilArgs = `-addstore -f Root "${caDerFile}"`;
    const psElevate = `Start-Process certutil -ArgumentList '${certutilArgs}' -Verb RunAs -Wait`;

    const ps = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command', psElevate,
    ], { windowsHide: true });

    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) { finished = true; resolve({ ok: false, reason: 'timeout' }); }
    }, 60000);

    ps.on('close', async (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      // Verify it actually landed — certutil exit 0 doesn't always mean success
      const verified = await verifyCaInStore();
      if (verified) {
        fs.writeFileSync(flagFile, 'installed');
        resolve({ ok: true });
      } else {
        resolve({ ok: false, reason: `certutil exit ${code}, not found in store` });
      }
    });

    ps.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      resolve({ ok: false, reason: err.message });
    });
  });
}

function removeCaTrustedRoot() {
  return new Promise((resolve) => {
    execFile('certutil', ['-delstore', 'Root', CA_NAME], (err) => {
      const flagFile = getPaths().flagFile;
      if (fs.existsSync(flagFile)) fs.unlinkSync(flagFile);
      resolve(!err);
    });
  });
}

module.exports = { ensureCerts, regenerateServerCert, isCaInstalled, tryInstallCaElevated, removeCaTrustedRoot };
