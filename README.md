# OpenWrt Log Analyzer Chrome Extension

A Chrome extension for parsing and analyzing System and Kernel logs from OpenWrt routers.

## Features

- Real-time log monitoring
- Support for both System and Kernel logs
- Log filtering and search functionality
- Auto-refresh capability
- Export logs to file
- Configurable refresh intervals
- Log level filtering

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select this directory

## Usage

1. Navigate to your OpenWrt router's web interface
2. The log viewer will automatically appear on the page
3. Use the controls to:
   - Switch between System and Kernel logs
   - Filter log entries by severity, component, and issue type
   - Search through logs
   - Monitor event patterns
   - Export logs
   - Configure auto-refresh

## Development

### Project Structure
```
openwrt-log-analyzer/
├── manifest.json           # Extension configuration
├── background/            # Background scripts
├── content/              # Content scripts
├── popup/               # Extension popup
├── styles/             # CSS styles
└── assets/            # Icons and images
```

### Building and Testing

1. Make changes to the source code
2. Test locally using Chrome's "Load unpacked" feature
3. Submit pull requests for review

### Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request