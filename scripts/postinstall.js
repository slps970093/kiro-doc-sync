#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// 只在 Unix-like 系統上設定執行權限
if (os.platform() !== 'win32') {
  const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
  
  try {
    // 設定執行權限 (755)
    fs.chmodSync(cliPath, 0o755);
    console.log('✓ Set executable permissions on kiro-doc-sync');
  } catch (err) {
    console.warn('⚠ Could not set executable permissions:', err.message);
  }
}
