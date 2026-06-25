// Discord Activity: set server URL from current origin (same-origin deployment)
window.__SERVER_URL = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host;
window.__API_BASE = location.origin;
