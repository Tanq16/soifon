let allCapturedData = [];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['networkRules', 'storageRules', 'capturedData'], (result) => {
    if (!result.networkRules) chrome.storage.local.set({ networkRules: [] });
    if (!result.storageRules) chrome.storage.local.set({ storageRules: [] });
    if (result.capturedData) allCapturedData = result.capturedData;
  });
});

chrome.storage.local.get(['capturedData'], (result) => {
  if (result.capturedData) allCapturedData = result.capturedData;
});

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method !== "POST") return;

    chrome.storage.local.get(['networkRules'], (result) => {
      const rules = result.networkRules || [];

      rules.forEach(rule => {
        try {
          const urlRegex = new RegExp(rule.urlPattern);
          if (!urlRegex.test(details.url)) return;

          console.log(`[Soifon] URL matched: ${rule.name}`);

          let bodyString = "";
          if (details.requestBody && details.requestBody.formData) {
            for (const key in details.requestBody.formData) {
              bodyString += `${key}=${details.requestBody.formData[key][0]}&`;
            }
          } else if (details.requestBody && details.requestBody.raw) {
            const decoder = new TextDecoder("utf-8");
            if (details.requestBody.raw[0] && details.requestBody.raw[0].bytes) {
              bodyString = decoder.decode(details.requestBody.raw[0].bytes);
            }
          }

          const bodyRegex = new RegExp(rule.valueRegex);
          const match = bodyString.match(bodyRegex);

          if (match && match[1]) {
            const capturedValue = match[1];
            console.log(`[Soifon] ✓ Captured: ${rule.name}, length: ${capturedValue.length}`);

            allCapturedData.unshift({
              name: rule.name,
              value: capturedValue,
              timestamp: new Date().toLocaleString()
            });

            if (allCapturedData.length > 50) allCapturedData.pop();

            chrome.storage.local.set({ capturedData: allCapturedData });

            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              title: 'Soifon',
              message: `✓ Captured: ${rule.name}`
            });
          }
        } catch (e) {
          console.error("[Soifon] Error:", e);
        }
      });
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['storageRules'], (result) => {
      const rules = result.storageRules || [];

      rules.forEach(rule => {
        try {
          const urlRegex = new RegExp(rule.urlPattern);
          if (!urlRegex.test(tab.url)) return;

          console.log(`[Soifon] Storage rule matched: ${rule.name}`);

          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: extractStorageValue,
            args: [rule.key]
          }).then((results) => {
            if (results && results[0] && results[0].result) {
              const storageData = results[0].result;

              if (storageData.value) {
                console.log(`[Soifon] ✓ Captured from ${storageData.source}: ${rule.name}`);

                allCapturedData.unshift({
                  name: rule.name,
                  value: storageData.value,
                  timestamp: new Date().toLocaleString()
                });

                if (allCapturedData.length > 50) allCapturedData.pop();

                chrome.storage.local.set({ capturedData: allCapturedData });

                chrome.notifications.create({
                  type: 'basic',
                  iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                  title: 'Soifon',
                  message: `✓ Captured: ${rule.name}`
                });
              }
            }
          }).catch(err => {
            console.error('[Soifon] Storage extraction error:', err);
          });

          chrome.cookies.getAll({ url: tab.url }, (cookies) => {
            const cookie = cookies.find(c => c.name === rule.key);
            if (cookie) {
              console.log(`[Soifon] ✓ Captured from cookie: ${rule.name}`);

              allCapturedData.unshift({
                name: rule.name,
                value: cookie.value,
                timestamp: new Date().toLocaleString()
              });

              if (allCapturedData.length > 50) allCapturedData.pop();

              chrome.storage.local.set({ capturedData: allCapturedData });

              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
                title: 'Soifon',
                message: `✓ Captured: ${rule.name}`
              });
            }
          });

        } catch (e) {
          console.error('[Soifon] Error:', e);
        }
      });
    });
  }
});

function extractStorageValue(key) {
  const sources = [
    { name: 'localStorage', storage: localStorage },
    { name: 'sessionStorage', storage: sessionStorage }
  ];

  for (const source of sources) {
    try {
      const value = source.storage.getItem(key);
      if (value) {
        return { source: source.name, value: value };
      }
    } catch (e) {
      console.error(`Error reading ${source.name}:`, e);
    }
  }

  return { source: null, value: null };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_CAPTURED_DATA') {
    sendResponse(allCapturedData);
  }
  if (msg.type === 'CLEAR_CAPTURED_DATA') {
    allCapturedData = [];
    chrome.storage.local.set({ capturedData: [] });
    sendResponse({ success: true });
  }
});
