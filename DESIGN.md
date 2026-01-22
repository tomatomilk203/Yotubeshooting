# YouTube Shooting - 設計書

## プロジェクト概要
YouTube動画ページ上でコメントを弾幕化するシューティングゲームChrome拡張機能

## アーキテクチャ

### ファイル構成
```
youtube-shooting/
├── manifest.json           # Chrome拡張マニフェスト
├── DESIGN.md              # 設計書（本ファイル）
├── README.md              # 使用方法・セットアップガイド
│
├── src/
│   ├── content/
│   │   ├── main.js        # コンテンツスクリプトのエントリーポイント
│   │   ├── overlay.js     # Canvas オーバーレイ管理
│   │   ├── ui.js          # UI コンポーネント管理
│   │   └── styles.css     # スタイルシート
│   │
│   ├── game/
│   │   ├── game.js        # ゲームループ・状態管理
│   │   ├── player.js      # プレイヤー（自機）クラス
│   │   ├── danmaku-engine.js  # 弾幕生成・描画エンジン
│   │   └── collision.js   # 当たり判定処理
│   │
│   ├── api/
│   │   ├── youtube-api.js # YouTube Data API 連携
│   │   └── ai-analyzer.js # AI コメント解析モジュール
│   │
│   ├── utils/
│   │   ├── config.js      # 設定・定数
│   │   └── storage.js     # ローカルストレージ管理
│   │
│   └── background/
│       └── background.js  # バックグラウンドスクリプト（API キー管理等）
│
└── assets/
    ├── icons/
    │   ├── icon16.png
    │   ├── icon48.png
    │   └── icon128.png
    └── sprites/
        └── player.png     # 自機スプライト
```

## 主要モジュール設計

### 1. main.js - エントリーポイント
**責務**: 拡張機能の初期化・YouTube ページ検出・モジュール連携

```javascript
主要関数:
- init(): void
  - YouTube 動画ページを検出
  - オーバーレイを初期化
  - イベントリスナーを設定

- isYouTubeVideoPage(): boolean
  - 現在のページが YouTube 動画ページか判定

- getVideoId(): string | null
  - URL から動画 ID を抽出
```

**依存関係**: overlay.js, youtube-api.js, ui.js

---

### 2. overlay.js - Canvas オーバーレイ管理
**責務**: Canvas 要素の生成・配置・リサイズ処理

```javascript
主要クラス: CanvasOverlay

プロパティ:
- canvas: HTMLCanvasElement
- ctx: CanvasRenderingContext2D
- isActive: boolean

メソッド:
- constructor()
  - Canvas 要素を生成
  - YouTube 動画プレイヤー上に配置

- show(): void
  - オーバーレイを表示

- hide(): void
  - オーバーレイを非表示

- resize(): void
  - 動画プレイヤーのサイズに合わせて Canvas をリサイズ

- clear(): void
  - Canvas をクリア

- getContext(): CanvasRenderingContext2D
  - 描画コンテキストを返却
```

**依存関係**: なし

---

### 3. youtube-api.js - YouTube Data API 連携
**責務**: コメントデータの取得・パース

```javascript
主要クラス: YouTubeAPI

プロパティ:
- apiKey: string
- baseURL: string

メソッド:
- fetchComments(videoId: string, maxResults: number = 100): Promise<Comment[]>
  - YouTube Data API v3 でコメントを取得
  - 戻り値: Comment オブジェクトの配列

- parseComment(rawComment: object): Comment
  - API レスポンスを Comment オブジェクトに変換

Comment 型:
{
  id: string,
  text: string,
  author: string,
  likeCount: number,
  publishedAt: string
}
```

**API 呼び出し例**:
```javascript
const api = new YouTubeAPI('YOUR_API_KEY');
const comments = await api.fetchComments('dQw4w9WgXcQ', 50);
```

**依存関係**: config.js (API キー)

---

### 4. danmaku-engine.js - 弾幕生成・描画エンジン
**責備**: コメントから弾幕オブジェクトを生成・更新・描画

```javascript
主要クラス: DanmakuEngine

プロパティ:
- bullets: Bullet[]
- canvas: CanvasRenderingContext2D

メソッド:
- createBulletFromComment(comment: Comment, aiParams: AIParams): Bullet
  - コメントと AI 解析結果から弾幕オブジェクトを生成

- update(deltaTime: number): void
  - 全弾幕の位置を更新
  - 画面外の弾幕を削除

- render(ctx: CanvasRenderingContext2D): void
  - 全弾幕を Canvas に描画

- clear(): void
  - 全弾幕をクリア

Bullet 型:
{
  id: string,
  text: string,          // コメント内容
  x: number,             // X 座標
  y: number,             // Y 座標
  vx: number,            // X 方向速度
  vy: number,            // Y 方向速度
  size: number,          // サイズ倍率
  color: string,         // 色
  hp: number,            // 耐久力
  speed: number,         // 速度
  angle: number          // 進行角度
}
```

**弾幕レンダリングサンプルコード**:
```javascript
render(ctx) {
  this.bullets.forEach(bullet => {
    ctx.save();
    ctx.font = `${16 * bullet.size}px sans-serif`;
    ctx.fillStyle = bullet.color;
    ctx.globalAlpha = 0.9;

    // テキストを回転
    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(bullet.angle);
    ctx.fillText(bullet.text, 0, 0);

    ctx.restore();
  });
}
```

**依存関係**: ai-analyzer.js

---

### 5. game.js - ゲームループ・状態管理
**責務**: ゲーム全体の制御・ループ・スコア管理

```javascript
主要クラス: Game

プロパティ:
- state: 'idle' | 'playing' | 'paused' | 'gameover'
- score: number
- lives: number
- level: number
- player: Player
- danmakuEngine: DanmakuEngine
- lastTime: number

メソッド:
- start(): void
  - ゲーム開始
  - コメント取得 → 弾幕生成

- pause(): void
  - ゲーム一時停止

- resume(): void
  - ゲーム再開

- stop(): void
  - ゲーム終了

- gameLoop(timestamp: number): void
  - メインゲームループ (requestAnimationFrame)
  - 処理フロー:
    1. deltaTime 計算
    2. プレイヤー更新
    3. 弾幕更新
    4. 当たり判定
    5. 描画
    6. スコア・UI 更新

- handleCollision(): void
  - プレイヤーと弾幕の当たり判定
  - ライフ減少・ゲームオーバー判定

- addScore(points: number): void
  - スコア加算
```

**依存関係**: player.js, danmaku-engine.js, collision.js, ui.js

---

### 6. player.js - プレイヤー（自機）クラス
**責務**: プレイヤーの移動・描画・状態管理

```javascript
主要クラス: Player

プロパティ:
- x: number
- y: number
- width: number
- height: number
- speed: number
- isInvincible: boolean
- invincibleTime: number

メソッド:
- constructor(x: number, y: number)

- update(deltaTime: number, input: InputState): void
  - キーボード/マウス入力に応じて移動
  - 画面外判定

- render(ctx: CanvasRenderingContext2D): void
  - 自機を描画（三角形または画像）

- getBounds(): Rect
  - 当たり判定用の矩形を返却

- takeDamage(): void
  - ダメージ処理・無敵時間設定

InputState 型:
{
  up: boolean,
  down: boolean,
  left: boolean,
  right: boolean,
  mouseX: number,
  mouseY: number
}
```

**依存関係**: なし

---

### 7. collision.js - 当たり判定処理
**責務**: 矩形・円の衝突判定

```javascript
主要関数:

- checkRectCollision(rect1: Rect, rect2: Rect): boolean
  - 矩形同士の衝突判定（AABB）

- checkCircleCollision(circle1: Circle, circle2: Circle): boolean
  - 円同士の衝突判定

- checkPlayerBulletCollision(player: Player, bullet: Bullet): boolean
  - プレイヤーと弾幕の衝突判定

Rect 型:
{
  x: number,
  y: number,
  width: number,
  height: number
}

Circle 型:
{
  x: number,
  y: number,
  radius: number
}
```

**依存関係**: なし

---

### 8. ui.js - UI コンポーネント管理
**責務**: ゲーム UI の生成・更新・イベント処理

```javascript
主要クラス: GameUI

プロパティ:
- container: HTMLElement
- scoreDisplay: HTMLElement
- livesDisplay: HTMLElement
- startButton: HTMLElement
- pauseButton: HTMLElement
- exitButton: HTMLElement

メソッド:
- constructor()
  - UI 要素を生成・配置

- updateScore(score: number): void
  - スコア表示を更新

- updateLives(lives: number): void
  - 残機表示を更新

- showGameOver(finalScore: number): void
  - ゲームオーバー画面を表示

- hide(): void
  - UI を非表示

- bindEvents(callbacks: UICallbacks): void
  - ボタンイベントをバインド

UICallbacks 型:
{
  onStart: () => void,
  onPause: () => void,
  onResume: () => void,
  onExit: () => void
}
```

**UI 基本構造**:
```html
<div id="yt-shooting-ui">
  <!-- スコア・残機表示（右上） -->
  <div class="stats">
    <div class="score">SCORE: <span>0</span></div>
    <div class="lives">LIVES: <span>❤️❤️❤️</span></div>
  </div>

  <!-- コントロールパネル（左下） -->
  <div class="controls">
    <button id="btn-start">START</button>
    <button id="btn-pause">PAUSE</button>
    <button id="btn-exit">EXIT</button>
  </div>

  <!-- 難易度選択（初回のみ） -->
  <div class="difficulty-select">
    <button data-level="easy">EASY</button>
    <button data-level="normal">NORMAL</button>
    <button data-level="hard">HARD</button>
  </div>
</div>
```

**依存関係**: styles.css

---

### 9. ai-analyzer.js - AI コメント解析モジュール
**責務**: コメント内容を解析して弾幕パラメータを決定

```javascript
主要クラス: AIAnalyzer

メソッド:
- analyzeComment(comment: Comment): AIParams
  - コメントの感情・長さ・評価を解析
  - 弾幕パラメータを算出

- analyzeBatch(comments: Comment[]): AIParams[]
  - 複数コメントを一括解析

- generateAIComment(style: string, context: string): string
  - AI がコメント文体を模倣して生成
  - コメント数が少ない動画用

AIParams 型（JSON レスポンス例）:
{
  emotion: 'positive' | 'negative' | 'neutral' | 'aggressive',
  speed: number,        // 1.0 - 5.0（速度倍率）
  density: number,      // 0.0 - 1.0（生成密度）
  size: number,         // 0.5 - 2.0（サイズ倍率）
  color: string,        // HEX カラーコード
  hp: number,           // 1 - 10（耐久力）
  pattern: 'straight' | 'wave' | 'spiral' | 'random'  // 弾道パターン
}
```

**AI 解析擬似コード**:
```javascript
analyzeComment(comment) {
  // 感情分析（簡易実装）
  const positiveWords = ['すごい', '最高', '面白い', 'good', 'awesome'];
  const negativeWords = ['つまらない', 'bad', '嫌い', 'クソ'];
  const aggressiveWords = ['死ね', 'kill', '爆発', 'destroy'];

  let emotion = 'neutral';
  if (aggressiveWords.some(w => comment.text.includes(w))) {
    emotion = 'aggressive';
  } else if (positiveWords.some(w => comment.text.includes(w))) {
    emotion = 'positive';
  } else if (negativeWords.some(w => comment.text.includes(w))) {
    emotion = 'negative';
  }

  // パラメータ算出
  const speed = 1.5 + (comment.likeCount / 100);
  const size = Math.min(2.0, 0.8 + comment.text.length / 50);
  const hp = Math.ceil(1 + comment.likeCount / 10);

  const colorMap = {
    positive: '#ffcc00',
    negative: '#0099ff',
    aggressive: '#ff3333',
    neutral: '#ffffff'
  };

  return {
    emotion,
    speed,
    density: 0.7,
    size,
    color: colorMap[emotion],
    hp,
    pattern: emotion === 'aggressive' ? 'spiral' : 'straight'
  };
}
```

**依存関係**: なし（将来的に Claude API 連携可能）

---

### 10. config.js - 設定・定数
**責務**: グローバル設定の一元管理

```javascript
export const CONFIG = {
  // YouTube API
  YOUTUBE_API_KEY: 'YOUR_API_KEY_HERE',
  MAX_COMMENTS: 100,

  // ゲーム設定
  INITIAL_LIVES: 3,
  PLAYER_SPEED: 5,
  PLAYER_SIZE: 20,

  // 難易度
  DIFFICULTY: {
    easy: { bulletSpeed: 0.7, spawnRate: 0.5 },
    normal: { bulletSpeed: 1.0, spawnRate: 1.0 },
    hard: { bulletSpeed: 1.5, spawnRate: 1.5 }
  },

  // Canvas
  FPS: 60,
  BACKGROUND_ALPHA: 0.1,

  // AI
  AI_COMMENT_THRESHOLD: 10,  // この数以下で AI 生成モード
  AI_COMMENT_COUNT: 50
};
```

**依存関係**: なし

---

## データフロー

```
1. ページロード
   ↓
2. main.js が YouTube ページを検出
   ↓
3. overlay.js が Canvas を生成
   ↓
4. ui.js が UI を表示
   ↓
5. ユーザーが START ボタンをクリック
   ↓
6. youtube-api.js がコメントを取得
   ↓
7. ai-analyzer.js がコメントを解析
   ↓
8. danmaku-engine.js が弾幕を生成
   ↓
9. game.js がゲームループ開始
   ↓
10. player.js が入力を処理
   ↓
11. collision.js が当たり判定
   ↓
12. ui.js がスコア・残機を更新
```

## Chrome 拡張機能設計

### manifest.json 構造
- Manifest V3 を使用
- content_scripts で YouTube ページに注入
- permissions: activeTab, storage
- host_permissions: https://www.googleapis.com/* (YouTube API)

### 権限要求理由
- `activeTab`: YouTube ページへのアクセス
- `storage`: ハイスコア・設定の保存
- YouTube API: コメント取得（外部 API）

## セキュリティ・規約考慮

1. **YouTube 規約遵守**
   - コメント取得のみ（投稿・編集なし）
   - ローカル処理のみ（サーバー保存なし）
   - API レート制限の遵守

2. **軽量設計**
   - requestAnimationFrame でスムーズな描画
   - 弾幕数の上限設定（200 個まで）
   - Canvas のクリア最適化

3. **プライバシー**
   - ユーザーデータは送信しない
   - API キーはローカル保存

## 拡張機能のインストール・使用方法

1. Chrome で `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. プロジェクトフォルダを選択
5. YouTube 動画ページを開く
6. 右下に表示される START ボタンをクリック

## 将来追加可能な機能

### 1. AI ボス生成モード
- 高評価コメント上位 3 件を「ボス」として巨大弾幕化
- 体力バー・特殊攻撃パターンを実装
- ボス撃破でボーナスポイント

### 2. マルチコメント対戦
- 複数の動画コメントを同時に弾幕化
- プレイリスト対応
- エンドレスモード

### 3. カスタマイズ機能
- 自機の見た目変更（スキンシステム）
- 弾幕の表示スタイル（テキスト / アイコン / エフェクト）
- BGM・効果音の追加

### 4. ランキング機能
- ローカルハイスコア
- 動画ごとのランキング（localStorage）

### 5. コメント生成 AI の高度化
- Claude API と連携して文脈を理解
- 動画内容に沿ったコメント生成
- 感情の多様化（8 種類以上）

## 開発優先度

### Phase 1（MVP）
- [ ] Chrome 拡張の基本構造
- [ ] Canvas オーバーレイ表示
- [ ] YouTube API でコメント取得
- [ ] 基本的な弾幕生成・移動
- [ ] プレイヤー操作（マウス）
- [ ] 当たり判定
- [ ] スコア・残機システム

### Phase 2（機能拡張）
- [ ] AI コメント解析（感情・速度・色）
- [ ] 複数弾道パターン
- [ ] 難易度選択
- [ ] ハイスコア保存

### Phase 3（高度化）
- [ ] AI コメント生成モード
- [ ] パーティクルエフェクト
- [ ] サウンド対応
- [ ] ボスモード

## パフォーマンス目標

- 初期ロード: < 500ms
- FPS: 安定 60fps
- メモリ使用量: < 50MB
- CPU 使用率: < 10%（動画再生を妨げない）

---

**設計書バージョン**: 1.0
**最終更新**: 2025-12-17
