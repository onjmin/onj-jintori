// ============================================
// preload.js - レンダラーへ最小限の情報のみ公開
// （contextIsolation:true / nodeIntegration:false 環境）
// ============================================

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('zintiDesktop', {
  isDesktop: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version || '0.1.0'
});
