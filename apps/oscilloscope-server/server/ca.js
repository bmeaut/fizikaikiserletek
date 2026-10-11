const forge   = require('node-forge');
const fs      = require('fs');
const path    = require('path');
const { execFile, spawn } = require('child_process');
const { app }  = require('electron');

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
  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true },
    { name: 'extKeyUsage', serverAuth: true },
    { name: 'subjectKeyIdentifier' },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 7, ip: '0.0.0.0' },   // certutil won't reject it; real IP matched at TLS
      ],
    },
  ]);
  cert.sign(caKey, forge.md.sha256.create());
  return { cert, key: keys.privateKey };
}

// ── Ensure certs exist on disk ─────────────────────────────────────────────

function ensureCerts() {
  const p = getPaths();
  // Regenerate everything if CA is missing
  if (!fs.existsSync(p.caCertFile) || !fs.existsSync(p.caKeyFile)) {
    const { caCert, caKey } = generateCA();
    const { cert, key }     = generateServerCert(caCert, caKey);

    fs.writeFileSync(p.caCertFile, forge.pki.certificateToPem(caCert));
    fs.writeFileSync(p.caKeyFile,  forge.pki.privateKeyToPem(caKey));
    fs.writeFileSync(p.certFile,   forge.pki.certificateToPem(cert));
    fs.writeFileSync(p.keyFile,    forge.pki.privateKeyToPem(key));

    // DER format for certutil
    const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(caCert)).getBytes();
    fs.writeFileSync(p.caDerFile, Buffer.from(derBytes, 'binary'));
  }

  return {
    cert: fs.readFileSync(p.certFile, 'utf8'),
    key:  fs.readFileSync(p.keyFile,  'utf8'),
  };
}

// ── CA trust store management (Windows certutil) ───────────────────────────

function isCaInstalled() {
  return fs.existsSync(getPaths().flagFile);
}

// Returns a promise that resolves to { ok, reason }
function installCaTrustedRoot() {
  return new Promise((resolve) => {
    const { caDerFile } = getPaths();
    if (!fs.existsSync(caDerFile)) {
      resolve({ ok: false, reason: 'ca-cert.der not found' });
      return;
    }
    // certutil is built into Windows; -addstore adds to LocalMachine root store
    execFile('certutil', ['-addstore', '-f', 'ROOT', caDerFile], (err, stdout, stderr) => {
      if (err) {
        resolve({ ok: false, reason: err.message });
      } else {
        fs.writeFileSync(getPaths().flagFile, 'installed');
        resolve({ ok: true });
      }
    });
  });
}

function removeCaTrustedRoot() {
  return new Promise((resolve) => {
    execFile('certutil', ['-delstore', 'ROOT', CA_NAME], (err) => {
      const flagFile = getPaths().flagFile;
      if (fs.existsSync(flagFile)) fs.unlinkSync(flagFile);
      resolve(!err);
    });
  });
}

// ── Elevated re-launch for CA install ─────────────────────────────────────
// We re-launch the app itself with --install-ca, elevated via PowerShell Start-Process.
// The child writes the flag file on success. We wait up to 30s for it.

function tryInstallCaElevated() {
  return new Promise((resolve) => {
    const { caDerFile, flagFile } = getPaths();
    if (!fs.existsSync(caDerFile)) { resolve({ ok: false, reason: 'missing der' }); return; }

    // Use PowerShell to run certutil elevated
    const psCmd = `Start-Process certutil -ArgumentList '-addstore','-f','ROOT','${caDerFile}' -Verb RunAs -Wait`;
    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', psCmd], { windowsHide: true });

    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) { finished = true; resolve({ ok: false, reason: 'timeout' }); }
    }, 30000);

    ps.on('close', (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (code === 0) {
        fs.writeFileSync(flagFile, 'installed');
        resolve({ ok: true });
      } else {
        resolve({ ok: false, reason: `exit code ${code}` });
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

module.exports = { ensureCerts, isCaInstalled, tryInstallCaElevated, removeCaTrustedRoot };
