// ============================================
// main.js - Electron メインプロセス
// Zinti デスクトップ版（リモートURL読み込み方式）
// ============================================

const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// 接続先（ゲーム画面）。サーバーを切り替える場合はここを変更する。
const GAME_URL = process.env.ZINTI_URL || 'https://jintori.open2ch.net:2053/';

// このアプリ内に留めて表示するオリジン。これ以外への遷移は
// 既定ブラウザで開く（GitHub Issues 等の外部リンク対策）。
const ALLOWED_ORIGIN = new URL(GAME_URL).origin;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0b1220',
    title: 'Zinti',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true, // メニューバーは Alt で表示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadURL(GAME_URL);

  // ロード失敗（オフライン等）時に簡易エラー画面を表示
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, validatedURL) => {
    if (errorCode === -3) return; // ABORTED（リダイレクト等）は無視
    const msg = `サーバーに接続できませんでした。<br><small>${errorDesc} (${errorCode})</small>`;
    const html =
      `<html><head><meta charset="utf-8"><title>Zinti</title></head>` +
      `<body style="margin:0;height:100vh;display:flex;flex-direction:column;` +
      `align-items:center;justify-content:center;gap:16px;background:#0b1220;` +
      `color:#e2e8f0;font-family:sans-serif;text-align:center">` +
      `<h2>${msg}</h2>` +
      `<button onclick="location.reload()" style="padding:10px 24px;font-size:15px;` +
      `cursor:pointer;border:0;border-radius:8px;background:#0ea5e9;color:#fff">再接続</button>` +
      `</body></html>`;
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });

  // 外部リンク（window.open 等）は既定ブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // アプリ外オリジンへの遷移はブロックして既定ブラウザへ
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== ALLOWED_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// F11 でフルスクリーン切り替え、Ctrl+R で再読み込みの最小メニュー
function buildMenu() {
  const template = [
    {
      label: 'Zinti',
      submenu: [
        {
          label: '再読み込み',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload()
        },
        {
          label: 'フルスクリーン切替',
          accelerator: 'F11',
          click: () =>
            mainWindow && mainWindow.setFullScreen(!mainWindow.isFullScreen())
        },
        { type: 'separator' },
        { role: 'quit', label: '終了' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 多重起動を防止
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
