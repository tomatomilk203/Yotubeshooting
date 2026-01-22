# YouTube Shooting - セットアップガイド

## クイックスタート（5分で起動）

### ステップ1: YouTube Data API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: "YouTube Shooting"）
3. 左メニューから「APIとサービス」→「ライブラリ」を選択
4. 「YouTube Data API v3」を検索して選択
5. 「有効にする」をクリック
6. 「認証情報」タブに移動
7. 「認証情報を作成」→「APIキー」を選択
8. 作成されたAPIキーをコピー

### ステップ2: APIキーを設定

1. プロジェクトフォルダ内の `src/utils/config.js` を開く
2. 以下の行を編集:
   ```javascript
   YOUTUBE_API_KEY: 'YOUR_API_KEY_HERE',
   ```
   ↓
   ```javascript
   YOUTUBE_API_KEY: 'あなたのAPIキー',
   ```
3. ファイルを保存

### ステップ3: Chrome拡張機能として読み込む

1. Google Chromeを開く
2. アドレスバーに `chrome://extensions/` を入力してEnter
3. 右上の「デベロッパーモード」をONにする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトフォルダ（`youtube-shooting`）を選択
6. 拡張機能が読み込まれたことを確認

### ステップ4: テストプレイ

1. YouTubeで任意の動画を開く（例: https://www.youtube.com/watch?v=dQw4w9WgXcQ）
2. ページ右下に「START」ボタンが表示されるまで待つ（2秒程度）
3. 「START」ボタンをクリック
4. 難易度を選択（初めての場合は「EASY」推奨）
5. ゲーム開始！

## よくある質問

### Q: ボタンが表示されません

A: 以下を確認してください:
- YouTube動画ページ（`/watch?v=...`）であること
- ページを完全にリロード（Ctrl+F5）
- デベロッパーツール（F12）でコンソールエラーを確認

### Q: コメントが取得できません

A: 以下を確認してください:
- APIキーが正しく設定されているか
- YouTube Data API v3が有効化されているか
- ブラウザのコンソールでエラーメッセージを確認

### Q: ゲームが重いです

A: `src/utils/config.js` で以下を調整:
```javascript
MAX_BULLETS: 100,  // デフォルト200から減らす
```

### Q: アイコンが表示されません

A: アイコン画像は必須ではありません。`assets/icons/` フォルダに画像を追加すると表示されます。

## トラブルシューティング

### エラー: "YouTube API キーが設定されていません"

→ `src/utils/config.js` のAPIキーを確認してください

### エラー: "動画プレイヤーが見つかりません"

→ ページを再読み込みしてください。YouTubeのDOM構造が変更された可能性があります。

### ゲームが起動しない

1. `chrome://extensions/` で拡張機能を無効化→有効化
2. ページを再読み込み
3. Chromeを再起動

## API使用量の確認

YouTube Data API v3には無料枠があります（1日10,000ユニット）。

- コメント取得（100件）: 約1ユニット
- 動画情報取得: 約1ユニット

使用量の確認:
1. [Google Cloud Console](https://console.cloud.google.com/)
2. 「APIとサービス」→「ダッシュボード」
3. 「YouTube Data API v3」を選択

## 次のステップ

- [DESIGN.md](DESIGN.md) で詳細な設計を確認
- [README.md](README.md) で全機能を確認
- `src/utils/config.js` でゲームバランスをカスタマイズ

楽しんでください！
