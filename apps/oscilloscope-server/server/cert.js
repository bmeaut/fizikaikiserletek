const forge  = require('node-forge');
const fs     = require('fs');
const path   = require('path');
const { app } = require('electron');

function getCertPath() {
  const dir = path.join(app.getPath('userData'), 'tls');
  fs.mkdirSync(dir, { recursive: true });
  return { certFile: path.join(dir, 'cert.pem'), keyFile: path.join(dir, 'key.pem') };
}

async function getCert() {
  const { certFile, keyFile } = getCertPath();
  if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
    return { cert: fs.readFileSync(certFile, 'utf8'), key: fs.readFileSync(keyFile, 'utf8') };
  }
  return generateCert(certFile, keyFile);
}

function generateCert(certFile, keyFile) {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter  = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [
    { name: 'commonName',       value: 'Oscilloscope Server' },
    { name: 'organizationName', value: 'Fizikai Kiserletek' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'subjectAltName', altNames: [
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
    ]},
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem  = forge.pki.privateKeyToPem(keys.privateKey);
  fs.writeFileSync(certFile, certPem);
  fs.writeFileSync(keyFile,  keyPem);
  return { cert: certPem, key: keyPem };
}

module.exports = { getCert };
