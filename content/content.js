// Debug logging helper
function debugLog(message) {
  console.log('[OpenWrt Log Parser]', message);
}

// Create and inject the log viewer UI
function injectLogViewer() {
  // Initialize UI and attach event handlers
  function initializeUI() {
    debugLog('Initializing UI...');
    
    // Find a good insertion point
    const logArea = document.querySelector('#syslog') || document.querySelector('textarea[readonly]');
    if (!logArea) {
      debugLog('Could not find log area');
      return;
    }
    debugLog('Found log area, creating viewer...');
    const container = document.createElement('div');
    container.id = 'openwrt-log-viewer';
    container.innerHTML = `
      <div class="log-viewer-header">
        <h3>Log Viewer</h3>
        <div class="log-controls">
          <div class="control-group">
            <label>Severity:</label>
            <select id="severity-filter" onchange="filterLogs()">
              <option value="all">All</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="notice">Notice</option>
            </select>
          </div>
          <div class="control-group">
            <label>Component:</label>
            <select id="component-filter" onchange="filterLogs()">
              <option value="all">All</option>
              <option value="dhcp">DHCP/Network</option>
              <option value="wireless">Wireless</option>
              <option value="system">System</option>
            </select>
          </div>
          <div class="control-group">
            <label>Issue Type:</label>
            <select id="issue-filter" onchange="filterLogs()">
              <option value="all">All</option>
              <option value="config">Configuration</option>
              <option value="connection">Connection</option>
              <option value="mlo">MLO</option>
              <option value="dhcp">DHCP</option>
            </select>
          </div>
          <div class="control-group">
            <label>Pattern:</label>
            <select id="pattern-filter" onchange="filterLogs()">
              <option value="all">All</option>
              <option value="frequent">Frequent Events</option>
              <option value="burst">Burst Events</option>
              <option value="periodic">Periodic Events</option>
            </select>
          </div>
          <div class="control-group">
            <input type="text" id="search-input" placeholder="Search logs..." oninput="filterLogs()">
          </div>
          <button onclick="parseLogs()">Refresh</button>
        </div>
      </div>
      <div class="log-container">
        <div class="log-entries"></div>
      </div>
    `;

    // Inject the viewer before the log area
    logArea.parentNode.insertBefore(container, logArea);

    // Add event listeners
    document.getElementById('log-type').addEventListener('change', parseLogs);
    document.getElementById('refresh-logs').addEventListener('click', parseLogs);
    document.getElementById('log-filter').addEventListener('input', filterLogs);

    // Initial parse
    parseLogs();
  }

  // Store parsed logs globally for filtering
  let currentLogs = [];

  // Parse and display logs
  function parseLogs() {
    const container = document.querySelector('.log-entries');
    if (!container) return;

    container.classList.add('loading');
    container.innerHTML = '';

    try {
      const logType = document.getElementById('log-type').value;
      
      // Find the original log content - try multiple selectors
      const logContent = document.querySelector('#syslog') || 
                        document.querySelector('textarea[readonly]') ||
                        document.querySelector('pre');

      if (!logContent) {
        handleError('No log content found. Please wait for the page to load completely.');
        return;
      }

      const rawLogs = logContent.value;
      if (!rawLogs) {
        throw new Error('Log content is empty');
      }

      // Parse logs
      const logs = rawLogs.split('\n').filter(line => line.trim());
      currentLogs = logs;

      // Display logs
      displayLogs(logs);
    } catch (error) {
      handleError(`Error parsing logs: ${error.message}`);
    } finally {
      container.classList.remove('loading');
    }
  }

  // Filter and display logs
  function filterLogs() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const severity = document.getElementById('severity-filter').value;
    const component = document.getElementById('component-filter').value;
    const issueType = document.getElementById('issue-filter').value;
    const pattern = document.getElementById('pattern-filter').value;

    const entries = document.querySelectorAll('.log-entry');

    entries.forEach(entry => {
      const text = entry.textContent.toLowerCase();
      const logLevel = entry.getAttribute('data-level');
      const logComponent = entry.getAttribute('data-component');
      const logIssue = entry.getAttribute('data-issue');
      const logPattern = entry.getAttribute('data-pattern');

      const matchesSearch = text.includes(searchTerm);
      const matchesSeverity = severity === 'all' || logLevel === severity;
      const matchesComponent = component === 'all' || logComponent === component;
      const matchesIssue = issueType === 'all' || logIssue === issueType;
      const matchesPattern = pattern === 'all' || logPattern === pattern;

      entry.style.display = 
        matchesSearch && 
        matchesSeverity && 
        matchesComponent && 
        matchesIssue && 
        matchesPattern ? '' : 'none';
    });
  }

  // Display logs in the UI
  function displayLogs(logs) {
    const container = document.querySelector('.log-entries');
    if (!container) return;

    logs.forEach(log => {
      // Parse log entry
      const [timestamp, level, ...messageParts] = log.split(' ');
      const message = messageParts.join(' ');

      // Categorize the log entry
      const component = getComponent(message);
      const issueType = getIssueType(message);
      const pattern = getPattern(timestamp, message);
      
      // Create a log entry element
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.setAttribute('data-level', getSeverity(level));
      entry.setAttribute('data-component', component);
      entry.setAttribute('data-issue', issueType);
      entry.setAttribute('data-pattern', pattern);
      
      entry.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-level">${level}</span>
        <span class="log-component">${component}</span>
        <span class="log-message">${message}</span>
      `;

      container.appendChild(entry);
    });
  }

  // Handle errors
  function handleError(message) {
    const container = document.querySelector('.log-entries');
    if (!container) return;

    container.innerHTML = `
      <div class="log-error">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
      </div>
    `;
  }

  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Wait for log content to be available
function waitForLogContent(callback, maxAttempts = 5) {
  let attempts = 0;

  function checkContent() {
    attempts++;
    debugLog(`Checking for log content (attempt ${attempts})...`);

    const logContent = document.querySelector('#syslog') || 
                      document.querySelector('textarea[readonly]') ||
                      document.querySelector('pre');

    if (logContent) {
      debugLog('Log content found, proceeding with initialization...');
      callback();
    } else if (attempts < maxAttempts) {
      debugLog('Log content not found, retrying...');
      setTimeout(checkContent, 1000);
    } else {
      debugLog('Could not find log content after multiple attempts');
      handleError('Could not find log content after multiple attempts');
    }
  }

  checkContent();
}

// Main initialization
function init() {
  debugLog('Extension initializing...');
  if (document.readyState === 'loading') {
    debugLog('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => waitForLogContent(injectLogViewer));
  } else {
    debugLog('Document already loaded, checking for log content...');
    waitForLogContent(injectLogViewer);
  }
}

// Helper functions for log categorization
function getSeverity(level) {
  if (level.includes('err')) return 'error';
  if (level.includes('warn')) return 'warning';
  if (level.includes('notice')) return 'notice';
  return 'info';
}

function getComponent(message) {
  if (message.includes('odhcpd') || message.includes('netifd')) return 'dhcp';
  if (message.includes('wlan') || message.includes('ieee80211')) return 'wireless';
  return 'system';
}

function getIssueType(message) {
  if (message.includes('default route') || message.includes('public prefix')) return 'config';
  if (message.includes('assoc req') || message.includes('station')) return 'connection';
  if (message.includes('MLO') || message.includes('T2LM')) return 'mlo';
  if (message.includes('lease of') || message.includes('udhcpc')) return 'dhcp';
  return 'other';
}

function getPattern(timestamp, message) {
  // Store message counts for pattern detection
  if (!window.messagePatterns) {
    window.messagePatterns = {
      counts: {},
      lastTimestamp: null
    };
  }
  
  const patterns = window.messagePatterns;
  const key = message.substring(0, 50); // Use first 50 chars as key
  
  // Update counts
  patterns.counts[key] = (patterns.counts[key] || 0) + 1;
  
  // Check time difference if we have a last timestamp
  if (patterns.lastTimestamp) {
    const timeDiff = new Date(timestamp) - new Date(patterns.lastTimestamp);
    if (timeDiff < 5000) return 'burst'; // Messages within 5 seconds
  }
  
  patterns.lastTimestamp = timestamp;
  
  // Check frequency
  if (patterns.counts[key] > 5) return 'frequent';
  
  // Check if message appears at regular intervals
  if (message.includes('lease') || message.includes('renew')) return 'periodic';
  
  return 'normal';
}

// Start the extension
init();

// Filter logs based on all criteria
function filterLogs() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const severity = document.getElementById('severity-filter').value;
  const component = document.getElementById('component-filter').value;
  const issueType = document.getElementById('issue-filter').value;
  const pattern = document.getElementById('pattern-filter').value;

  const entries = document.querySelectorAll('.log-entry');

  entries.forEach(entry => {
    const text = entry.textContent.toLowerCase();
    const logLevel = entry.getAttribute('data-level');
    const logComponent = entry.getAttribute('data-component');
    const logIssue = entry.getAttribute('data-issue');
    const logPattern = entry.getAttribute('data-pattern');

    const matchesSearch = text.includes(searchTerm);
    const matchesSeverity = severity === 'all' || logLevel === severity;
    const matchesComponent = component === 'all' || logComponent === component;
    const matchesIssue = issueType === 'all' || logIssue === issueType;
    const matchesPattern = pattern === 'all' || logPattern === pattern;

    entry.style.display = 
      matchesSearch && 
      matchesSeverity && 
      matchesComponent && 
      matchesIssue && 
      matchesPattern ? '' : 'none';
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOG_REQUEST') {
    // Auto-refresh logs when new request is detected
    fetchLogs();
  }
});

// Initialize when page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLogViewer);
} else {
  injectLogViewer();
}
