# Zinti デスクトップ版（Electron）

ブラウザ版 Zinti をデスクトップアプリ化したもの。中身は
`https://jintori.open2ch.net:2053/` を読み込むシンクライアントで、
ゲームサーバーは従来どおりリモートで動作する（このアプリには含まれない）。

Steam 配信を見据えた Windows/Mac/Linux 向けインストーラを生成できる。

## セットアップ

```bash
cd desktop
npm install
```

## 開発実行

```bash
npm start
```

接続先を切り替えたい場合は環境変数で上書きできる:

```bash
ZINTI_URL=https://localhost:2053/ npm start
```

## 配布ビルド（インストーラ生成）

```bash
npm run dist:win     # Windows (NSIS .exe インストーラ) ※Steam は主に Windows
npm run dist:mac     # macOS (.dmg) ※署名/公証は別途必要
npm run dist:linux   # Linux (AppImage)
```

生成物は `release/` に出力される。Windows ビルドは Windows 上、
もしくは Wine を入れた環境で実行する必要がある。

## アイコン

`assets/icon.png`（512x512）を使用。`.ico`/`.icns` は electron-builder が
ビルド時に自動変換する。差し替える場合は同サイズ以上の正方形 PNG を置く。
テーマアイコンの再生成は `node assets/gen-icon.js`。

## 構成

| ファイル | 役割 |
|----------|------|
| `main.js` | Electron メインプロセス（ウィンドウ生成・外部リンク処理・接続失敗画面） |
| `preload.js` | レンダラーへ `window.zintiDesktop` を最小公開 |
| `assets/icon.png` | アプリアイコン |
| `package.json` | 依存・electron-builder 設定 |

## Steam 配信メモ

- Steam に出すには Steamworks 開発者登録（Steam Direct, 1タイトルあたり $100）が必要。
- 実績/フレンド/ログイン等の Steam 連携を入れる場合は `greenworks`
  （Electron 用 Steamworks バインディング）を追加して Steam Overlay/API を組み込む。
- まずはこの Electron ラッパーをそのまま Steam の「実行ファイル」として登録すれば配信は可能。
