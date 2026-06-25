# Zinti - マルチプレイヤー陣取りゲーム

リアルタイムマルチプレイヤーの陣取りゲームサーバー＆クライアント。
WebSocket による低遅延通信と HTML5 Canvas によるレンダリングで動作する。

## Koyeb 無料鯖にデプロイする手順（ワイ用）

### 1. Docker イメージをビルド

```bash
docker build -t zinti:latest .
```

### 2. Koyeb にプッシュ

Koyeb のダッシュボード → Create App → Docker で以下を設定：

| 項目 | 設定値 |
|------|--------|
| Image | ローカルでビルドしたイメージを Container Registry に push して指定 |
| Port | `8000` |
| Instance Type | Eco (小) 0.5 vCPU, 1GB RAM ($5.36/月) または Free |

### 3. 環境変数（必須）

| 変数名 | 説明 |
|--------|------|
| `PORT=8000` | Koyeb が期待するポート（デフォルト8000: HTTP） |
| `ADMIN_PASSWORD=<任意>` | 管理画面ログイン用パスワード |

### 4. Discord Activity として動かす場合

**環境変数（おまけ）：**

| 変数名 | 説明 |
|--------|------|
| `DISCORD_CLIENT_ID=<アプリID>` | Discord Developer Portal で作成したアプリの CLIENT_ID |

**Discord Developer Portal 設定：**

1. https://discord.com/developers/applications でアプリ作成
2. 「Rich Presence → Activities → Activity Tab → URL Mappings」で `https://<koyeb-app>.koyeb.app/discord.html` を登録
3. 公開するときはアプリを公開状態にする必要あり

**起動URL：** `https://<koyeb-app>.koyeb.app/discord.html`

### 5. Discord から起動する

ボイスチャンネル → 「アクティビティ」ボタン → アプリを選択 → 自動で discord.html が開く

### 注意点

- MySQL は不要（無くても動く。ランキング保存されないだけ）
- SSL は Koyeb 側で勝手にやってくれる
- ブラウザ単体でも動く（Discord Activity 経由じゃなくても URL 開けば遊べる）
- **Koyeb 無料枠（$0）** は自動スケールダウンするので、誰も遊んでないとサーバーが止まる。初回アクセス時に20秒くらい待たされる。常時起動させたいなら Eco Small（$5.36/月）がおすすめ

**[DEMOはこちら](https://jintori.open2ch.net:2053/)**

## ゲーム画面

![ゲームプレビュー](docs/images/game-preview.png)

## 構成

```
zinti/
├── jintori.js              # メインサーバー（エントリーポイント）
├── msgpack.js                # MessagePack シリアライズ
├── modules/
│   ├── config.js             # 共有設定・定数・状態管理
│   ├── api.js                # HTTP API & 静的ファイル配信
│   ├── game.js               # ゲームロジック・ラウンド管理
│   ├── network.js            # WebSocket 接続・ブロードキャスト
│   ├── stats.js              # 統計収集・DB保存
│   ├── cpu.js                # CPU（AI）プレイヤー制御
│   ├── admin-auth.js         # 管理者認証・セッション管理
│   └── bot-auth.js           # Bot対策キャプチャ認証
├── public_html/
│   ├── index.html            # ゲーム画面
│   ├── admin.html            # 管理パネル
│   ├── admin-login.html      # 管理者ログイン
│   ├── style.css             # スタイルシート
│   └── client/
│       ├── client-config.js  # クライアント設定・グローバル状態
│       ├── client-network.js # WebSocket 通信処理
│       ├── client-game.js    # ゲーム描画・入力処理
│       └── client-ui.js      # UI 管理
├── sql/
│   ├── setup_db.sql          # DB スキーマ（テーブル・ビュー）
│   └── add_round_stats.sql   # 統計テーブル追加
├── docs/                     # プロトコル仕様書等
├── server-credentials.json   # MySQL 接続情報（※git管理外）
└── admin-credentials.json    # 管理者アカウント情報（※git管理外）
```

## 動作環境

| 項目 | 要件 |
|------|------|
| Node.js | v22 以上 |
| MySQL | 8.x（utf8mb4） |
| OS | Linux 推奨 |
| ポート | 2053（HTTPS/WSS） |

## 依存モジュール

| パッケージ | 用途 |
|-----------|------|
| `ws` | WebSocket サーバー |
| `mysql2` | MySQL 接続（Promise対応） |
| `mysql` | MySQL 接続（レガシー互換） |

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd zinti
```

### 2. 依存パッケージのインストール

```bash
npm install ws mysql mysql2
```

### 3. データベースの準備

MySQL にデータベースとテーブルを作成する。

```bash
mysql -u root -p < sql/setup_db.sql
mysql -u root -p jintori < sql/add_round_stats.sql
```

### 4. 認証情報ファイルの作成

**server-credentials.json**（MySQL接続情報）:

```json
{
  "mysql": {
    "host": "localhost",
    "user": "your_db_user",
    "password": "your_db_password",
    "database": "jintori",
    "connectionLimit": 5
  }
}
```

**admin-credentials.json**（管理者アカウント）:

```json
{
  "admin": "<SHA-256ハッシュ化パスワード>"
}
```

### 5. SSL証明書の配置（本番環境）

```
/var/www/sites/nodejs/ssl/<domain>/pkey.pem
/var/www/sites/nodejs/ssl/<domain>/cert.pem
```

SSL証明書がない場合は HTTP にフォールバックする。

### 6. サーバー起動

```bash
# 通常起動（ソロモード）
node jintori.js

# チームモード
node jintori.js team

# デバッグモード
node jintori.js debug
```

起動後 `https://<host>:2053` でアクセス可能。
