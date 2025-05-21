document.addEventListener('DOMContentLoaded', () => {
  const refreshInterval = document.getElementById('refresh-interval');
  
  // Load saved settings
  chrome.storage.local.get(['refreshInterval'], (result) => {
    if (result.refreshInterval) {
      refreshInterval.value = result.refreshInterval;
    }
  });
  
  // Save settings when changed
  refreshInterval.addEventListener('change', () => {
    chrome.storage.local.set({
      refreshInterval: refreshInterval.value
    });
  });
});
