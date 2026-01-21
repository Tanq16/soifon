// --- TAB SWITCHING ---
window.switchTab = (tabId) => {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadRules();
  loadCapturedData();
  
  document.getElementById('add-net-btn').addEventListener('click', addNetworkRule);
  document.getElementById('add-store-btn').addEventListener('click', addStorageRule);
});

// --- CAPTURED DATA LOGIC ---
async function loadCapturedData() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.runtime.sendMessage({ type: 'GET_TAB_DATA', tabId: tab.id }, (data) => {
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
        <span style="font-size:10px; color:#666">(${item.source})</span>
        <button class="copy-btn">Copy</button>
        <div style="font-size:10px; color: #888; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:4px;">
          ${item.value}
        </div>
      `;
      div.querySelector('.copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(item.value);
        div.querySelector('.copy-btn').innerText = 'Copied!';
        setTimeout(() => div.querySelector('.copy-btn').innerText = 'Copy', 1500);
      });
      list.appendChild(div);
    });
  });
}

// --- RULES LOGIC ---
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
    div.style.borderLeftColor = '#10b981';
    div.innerHTML = `
      <strong>${rule.name}</strong>
      <button class="del-btn" data-idx="${index}">Del</button>
      <div style="font-size:10px; color:#555;">URL: ${rule.urlPattern}</div>
    `;
    div.querySelector('.del-btn').addEventListener('click', () => deleteRule('networkRules', index));
    container.appendChild(div);
  });
}

function renderStorageRules(rules) {
  const container = document.getElementById('storage-rules-list');
  container.innerHTML = '';
  rules.forEach((rule, index) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.style.borderLeftColor = '#db2777';
    div.innerHTML = `
      <strong>${rule.name}</strong>
      <button class="del-btn" data-idx="${index}">Del</button>
      <div style="font-size:10px; color:#555;">${rule.source}: ${rule.key}</div>
    `;
    div.querySelector('.del-btn').addEventListener('click', () => deleteRule('storageRules', index));
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
      // clear inputs
      document.getElementById('net-name').value = '';
      document.getElementById('net-url').value = '';
      document.getElementById('net-regex').value = '';
    });
  });
}

function addStorageRule() {
  const name = document.getElementById('store-name').value;
  const url = document.getElementById('store-url').value;
  const type = document.getElementById('store-type').value;
  const key = document.getElementById('store-key').value;

  if (!name || !url || !key) return alert("Fill all fields");

  chrome.storage.local.get(['storageRules'], (res) => {
    const rules = res.storageRules || [];
    rules.push({ name, urlPattern: url, source: type, key: key });
    chrome.storage.local.set({ storageRules: rules }, () => {
      loadRules();
      // clear inputs
      document.getElementById('store-name').value = '';
      document.getElementById('store-url').value = '';
      document.getElementById('store-key').value = '';
    });
  });
}

function deleteRule(storeKey, index) {
  chrome.storage.local.get([storeKey], (res) => {
    const rules = res[storeKey] || [];
    rules.splice(index, 1);
    chrome.storage.local.set({ [storeKey]: rules }, loadRules);
  });
}
