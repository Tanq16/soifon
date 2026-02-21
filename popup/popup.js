function switchTab(tabId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`button[data-tab="${tabId}"]`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  loadCapturedData();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('add-net-btn').addEventListener('click', addNetworkRule);
  document.getElementById('add-store-btn').addEventListener('click', addStorageRule);
  document.getElementById('clear-captured-btn').addEventListener('click', clearCapturedData);
});

function loadCapturedData() {
  chrome.runtime.sendMessage({ type: 'GET_CAPTURED_DATA' }, (data) => {
    const list = document.getElementById('captured-list');
    const noData = document.getElementById('no-data');
    list.innerHTML = '';

    if (!data || data.length === 0) {
      noData.style.display = 'block';
      return;
    }

    noData.style.display = 'none';
    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item-card';
      div.innerHTML = `
        <strong>${item.name}</strong>
        <span style="font-size:10px; color:var(--overlay0); margin-left:10px;">${item.timestamp}</span>
        <button class="copy-btn" data-value="${encodeURIComponent(item.value)}">Copy</button>
        <div style="font-size:10px; color: var(--overlay1); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:4px;">
          ${item.value.substring(0, 100)}...
        </div>
      `;

      div.querySelector('.copy-btn').addEventListener('click', (e) => {
        const value = decodeURIComponent(e.target.dataset.value);
        navigator.clipboard.writeText(value).then(() => {
          e.target.innerText = 'Copied!';
          setTimeout(() => e.target.innerText = 'Copy', 1500);
        });
      });

      list.appendChild(div);
    });
  });
}

function clearCapturedData() {
  if (confirm('Clear all captured data?')) {
    chrome.runtime.sendMessage({ type: 'CLEAR_CAPTURED_DATA' }, () => {
      loadCapturedData();
    });
  }
}

function loadRules() {
  chrome.storage.local.get(['networkRules', 'storageRules'], (result) => {
    renderNetworkRules(result.networkRules || []);
    renderStorageRules(result.storageRules || []);
  });
}

function renderNetworkRules(rules) {
  const container = document.getElementById('network-rules-list');
  container.innerHTML = '';
  rules.forEach((rule, index) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <strong>${rule.name}</strong>
      <button class="del-btn" data-idx="${index}">Del</button>
      <div style="font-size:10px; color:var(--overlay1);">URL: ${rule.urlPattern}</div>
    `;
    div.querySelector('.del-btn').addEventListener('click', () => deleteRule(index));
    container.appendChild(div);
  });
}

function addNetworkRule() {
  const name = document.getElementById('net-name').value;
  const url = document.getElementById('net-url').value;
  const regex = document.getElementById('net-regex').value;

  if (!name || !url || !regex) return alert("Fill all fields");

  chrome.storage.local.get(['networkRules'], (res) => {
    const rules = res.networkRules || [];
    rules.push({ name, urlPattern: url, valueRegex: regex });
    chrome.storage.local.set({ networkRules: rules }, () => {
      loadRules();
      document.getElementById('net-name').value = '';
      document.getElementById('net-url').value = '';
      document.getElementById('net-regex').value = '';
    });
  });
}

function renderStorageRules(rules) {
  const container = document.getElementById('storage-rules-list');
  container.innerHTML = '';
  rules.forEach((rule, index) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <strong>${rule.name}</strong>
      <button class="del-btn" data-idx="${index}">Del</button>
      <div style="font-size:10px; color:var(--overlay1);">Key: ${rule.key}</div>
    `;
    div.querySelector('.del-btn').addEventListener('click', () => deleteStorageRule(index));
    container.appendChild(div);
  });
}

function addStorageRule() {
  const name = document.getElementById('store-name').value;
  const url = document.getElementById('store-url').value;
  const key = document.getElementById('store-key').value;

  if (!name || !url || !key) return alert("Fill all fields");

  chrome.storage.local.get(['storageRules'], (res) => {
    const rules = res.storageRules || [];
    rules.push({ name, urlPattern: url, key: key });
    chrome.storage.local.set({ storageRules: rules }, () => {
      loadRules();
      document.getElementById('store-name').value = '';
      document.getElementById('store-url').value = '';
      document.getElementById('store-key').value = '';
    });
  });
}

function deleteRule(index) {
  chrome.storage.local.get(['networkRules'], (res) => {
    const rules = res.networkRules || [];
    rules.splice(index, 1);
    chrome.storage.local.set({ networkRules: rules }, loadRules);
  });
}

function deleteStorageRule(index) {
  chrome.storage.local.get(['storageRules'], (res) => {
    const rules = res.storageRules || [];
    rules.splice(index, 1);
    chrome.storage.local.set({ storageRules: rules }, loadRules);
  });
}
