{
  "manifest_version": 3,
  "name": "Universal Data Siphon",
  "version": "1.0",
  "description": "Extracts tokens from Network requests (auto-copy) and Storage (manual-copy).",
  "permissions": [
    "webRequest",
    "storage",
    "cookies",
    "scripting",
    "offscreen",
    "tabs",
    "notifications"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
