# YouTube Shooting

YouTubeのコメントが弾幕シューティングゲームに変身！

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-ダウンロード-red?style=for-the-badge&logo=googlechrome)](https://chromewebstore.google.com/detail/mdndofnojmpkmglofeioeikbgpjbphka)

![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/mdndofnojmpkmglofeioeikbgpjbphka?style=flat-square)
![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/mdndofnojmpkmglofeioeikbgpjbphka?style=flat-square)
![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/mdndofnojmpkmglofeioeikbgpjbphka?style=flat-square)

---

## 概要

YouTube Shootingは、YouTubeの**実際のコメント**が弾幕となって襲いかかる新感覚シューティングゲームです。動画を見ながらプレイでき、コメントの内容によって敵の色や強さが変化します。

**[ランディングページを見る](https://tomatomilk203.github.io/Yotubeshooting/)**

---

## インストール

### Chrome Web Store（推奨）

[![Install from Chrome Web Store](https://img.shields.io/badge/インストール-Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/mdndofnojmpkmglofeioeikbgpjbphka)

### 手動インストール（開発者向け）

1. このリポジトリをダウンロードまたはクローン
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードしたフォルダを選択

---

## 遊び方

### 1. ゲームを開始

YouTubeで動画を開き、以下のいずれかでゲームを開始：
- 画面右上の **STARTボタン** をクリック
- 拡張機能アイコンをクリックして **ゲーム開始** を選択

### 2. 難易度を選択

| 難易度 | 特徴 | スコア倍率 |
|--------|------|-----------|
| **EASY** | 初心者向け、ゆっくり弾幕 | ×1 |
| **NORMAL** | 標準難易度、適度な挑戦 | ×2 |
| **HARD** | 上級者向け、高速弾幕 | ×3 |
| **HELL** | 地獄モード、追尾弾幕、ネガティブコメントのみ | ×3 |

### 3. 操作方法

| 操作 | キーボード | マウス |
|------|-----------|--------|
| 移動 | WASD / 矢印キー | カーソル移動 |
| 射撃 | 自動発射 | 自動発射 |
| 低速移動 | Shift長押し | - |
| 一時停止 | ESC | - |

### 4. 敵の種類

| 色 | 種類 | 特徴 |
|----|------|------|
| 白 | 通常 | 標準的な敵 |
| 緑 | ポジティブ | 柔らかい（HP低め） |
| 紫 | レア | 高得点（25,000点） |
| 赤 | ボス | 長文コメント、HPバー表示、倒すと250,000点 |
| 灰 | 無敵 | ダメージ不可、避けるしかない |

---

## 特徴

### リアルコメント弾幕
実際のYouTubeコメントがそのまま弾幕として出現。ポジティブ/ネガティブな内容で色が変化！

### 19種類の実績
スコア・キル数・連続クリアなど多彩な実績をアンロック！

### スキンシステム
コインを集めて機体スキンをアンロック。見た目をカスタマイズ！

### 日本語/英語対応
インターフェースは日本語・英語の両言語に完全対応。

---

## 実績一覧

| 実績名 | 条件 | 報酬 |
|--------|------|------|
| スコアマスター | 累計10,000点達成 | スキン解放 |
| スコアレジェンド | 累計50,000点達成 | 1,000コイン |
| 黄金のマナー | 1ゲームで300,000点 | 5,000コイン |
| エネミースレイヤー | 累計1,000体撃破 | 500コイン |
| エネミーデストロイヤー | 累計5,000体撃破 | 2,000コイン |
| イージー制覇 | EASYモードクリア | 100コイン |
| ノーマル制覇 | NORMALモードクリア | 300コイン |
| ハード制覇 | HARDモードクリア | 500コイン |
| ヘル制覇 | HELLモードクリア | スキン解放 |
| 血濡れの機体 | ノーダメージクリア | 2,000コイン |
| 安定王 | 3連続クリア | 300コイン |
| 安定神 | 5連続クリア | 800コイン |
| 弾幕の王 | 累計1,000ゲームプレイ | 5,000コイン |
| ...その他多数 | | |

---

## 技術仕様

- **Manifest V3** - 最新のChrome拡張機能規格
- **Vanilla JavaScript** - フレームワーク不使用
- **HTML5 Canvas API** - 60FPS描画
- **YouTube Data API v3** - コメント取得
- **ローカル処理** - プライバシー重視

### 対応ブラウザ

| ブラウザ | 対応状況 |
|----------|----------|
| Chrome | ✅ v88+ |
| Edge | ✅ Chromium版 |
| Brave | ✅ |
| Firefox | ⚠️ 未テスト |
| Safari | ❌ |

---

## プライバシー

- ✅ **ローカル処理のみ** - コメントはデバイス上で処理
- ✅ **データ収集なし** - 個人情報の追跡・保存なし
- ✅ **最小限の権限** - 必要なアクセスのみ要求
- ✅ **オープンソース** - コードは透明で監査可能

---

## ロードマップ

### 近日予定
- [ ] 追加のプレイヤースキン
- [ ] 新ゲームモード（ボスラッシュ、タイムアタック）
- [ ] パフォーマンス最適化

### 将来予定
- [ ] コミュニティリーダーボード
- [ ] マルチプレイヤーモード
- [ ] カスタム難易度設定

---

## コントリビューション

バグ報告・機能提案・プルリクエスト歓迎です！

1. **バグ報告** - [Issue](https://github.com/tomatomilk203/Yotubeshooting/issues)を開く
2. **機能提案** - アイデアを共有
3. **PR** - バグ修正や機能追加

---

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

---

## お問い合わせ

- **GitHub Issues**: [バグ報告・機能リクエスト](https://github.com/tomatomilk203/Yotubeshooting/issues)
- **Twitter**: [@Usui_good](https://twitter.com/Usui_good)

---

## サポート

YouTube Shootingを楽しんでいただけたら：

- ⭐ **このリポジトリにスター**
- 📢 **友達にシェア**
- ✍️ **Chrome Web Storeにレビューを投稿**
- 💬 **#YouTubeShooting でSNSにシェア**

---

<div align="center">

**Made with ❤️ by tomatomilk203**

[Chrome Web Store](https://chromewebstore.google.com/detail/mdndofnojmpkmglofeioeikbgpjbphka) •
[ランディングページ](https://tomatomilk203.github.io/Yotubeshooting/) •
[バグ報告](https://github.com/tomatomilk203/Yotubeshooting/issues)

</div>
