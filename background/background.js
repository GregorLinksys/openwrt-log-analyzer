// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the URL matches our target pattern
  if (tab.url && tab.url.includes('/cgi-bin/luci/admin/status/logs')) {
    // Send message to content script
    chrome.tabs.sendMessage(tabId, { type: 'LOG_REQUEST' });
  }
});
