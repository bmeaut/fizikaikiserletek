const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');
const { app } = require('electron');

function getConfigPath() {
  const dir = app.getPath('userData');
  return path.join(dir, 'config.json');
}

function readConfig() {
  const p = getConfigPath();
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

function writeConfig(obj) {
  fs.writeFileSync(getConfigPath(), JSON.stringify(obj, null, 2), 'utf8');
}

function isFirstRun() {
  return !readConfig().passwordHash;
}

async function setPassword(plain) {
  const hash = await bcrypt.hash(plain, 10);
  const cfg = readConfig();
  cfg.passwordHash = hash;
  writeConfig(cfg);
}

async function verifyPassword(plain) {
  const cfg = readConfig();
  if (!cfg.passwordHash) return false;
  return bcrypt.compare(plain, cfg.passwordHash);
}

async function changePassword(plain) {
  return setPassword(plain);
}

module.exports = { isFirstRun, setPassword, verifyPassword, changePassword };
