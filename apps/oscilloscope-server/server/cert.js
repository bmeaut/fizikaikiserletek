// Certificate management is now handled by ca.js.
// This shim keeps the server.js import working.
const { ensureCerts } = require('./ca');

async function getCert() {
  return ensureCerts();
}

module.exports = { getCert };
