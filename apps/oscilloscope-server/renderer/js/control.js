// ── Control panel renderer ─────────────────────────────────────────────────
let authToken = null;

const authOverlay = document.getElementById('auth-overlay');
const authPw      = document.getElementById('auth-pw');
const authBtn     = document.getElementById('auth-btn');
const authError   = document.getElementById('auth-error');
const deviceList  = document.getElementById('device-list');
const pwStatus    = document.getElementById('pw-status');

// ── Auth ───────────────────────────────────────────────────────────────────
authBtn.addEventListener('click', doAuth);
authPw.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth(); });

async function doAuth() {
  const pw = authPw.value;
  authError.textContent = '';
  const res = await window.api.passwordVerify(pw);
  if (res.ok) {
    authToken = res.token;
    authOverlay.style.display = 'none';
    loadDevices();
  } else {
    authError.textContent = 'Helytelen jelszó.';
  }
}

// ── Devices ────────────────────────────────────────────────────────────────
async function loadDevices() {
  const res = await window.api.devicesList(authToken);
  if (res.ok) renderDevices(res.devices);
}

function renderDevices(devices) {
  deviceList.innerHTML = '';
  if (!devices || !devices.length) {
    deviceList.innerHTML = '<p style="color:#666; font-size:.85rem;">Nincs csatlakozott eszköz.</p>';
    return;
  }
  for (const d of devices) {
    const row = document.createElement('div');
    row.className = 'device-row' + (d.visible ? '' : ' dev-hidden');
    row.dataset.id = d.deviceId;
    row.innerHTML = `
      <span class="dev-color" style="background:${d.color}"></span>
      <span class="dev-name">${d.deviceName}</span>
      <input class="dev-name-input" type="text" value="${d.deviceName}" maxlength="40" />
      <button class="btn btn-ghost btn-sm toggle-btn">${d.visible ? '👁 Látható' : '🚫 Rejtett'}</button>
      <button class="btn btn-ghost btn-sm rename-btn">✏️ Átnevez</button>
    `;

    row.querySelector('.toggle-btn').addEventListener('click', async () => {
      const res = await window.api.deviceToggle(authToken, d.deviceId);
      if (res.ok) renderDevices(res.devices);
    });

    const nameSpan  = row.querySelector('.dev-name');
    const nameInput = row.querySelector('.dev-name-input');
    row.querySelector('.rename-btn').addEventListener('click', async () => {
      if (nameInput.style.display === 'none' || !nameInput.style.display) {
        nameInput.style.display = 'block';
        nameSpan.style.display  = 'none';
        nameInput.focus();
      } else {
        const res = await window.api.deviceRename(authToken, d.deviceId, nameInput.value.trim() || d.deviceName);
        if (res.ok) renderDevices(res.devices);
      }
    });

    deviceList.appendChild(row);
  }
}

// Live device updates from server
window.api.onControlDevices((devices) => {
  if (authToken) renderDevices(devices);
});

// ── Password change ────────────────────────────────────────────────────────
document.getElementById('pw-change-btn').addEventListener('click', async () => {
  const p1 = document.getElementById('new-pw').value;
  const p2 = document.getElementById('new-pw2').value;
  pwStatus.className = 'status-msg';
  if (!p1) { pwStatus.className += ' error-msg'; pwStatus.textContent = 'Add meg az új jelszót!'; return; }
  if (p1 !== p2) { pwStatus.className += ' error-msg'; pwStatus.textContent = 'A két jelszó nem egyezik!'; return; }
  const res = await window.api.passwordChange(authToken, p1);
  pwStatus.className = 'status-msg ' + (res.ok ? 'ok-msg' : 'error-msg');
  pwStatus.textContent = res.ok ? 'Jelszó módosítva.' : 'Hiba a módosítás során.';
  if (res.ok) { document.getElementById('new-pw').value = ''; document.getElementById('new-pw2').value = ''; }
});
