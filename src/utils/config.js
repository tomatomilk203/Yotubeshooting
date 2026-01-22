/**
 * グローバル設定・定数管理
 */

const CONFIG = {
  // YouTube API 設定
  YOUTUBE_API_KEY: 'AIzaSyBdNVqn3Ja39dn7FzRxjpoEHp6SfwJQ0Ys',
  YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  MAX_COMMENTS: 100,

  // ゲーム基本設定
  INITIAL_LIVES: 3,
  PLAYER_SPEED: 5,
  PLAYER_SIZE: 20,
  MAX_BULLETS: 100, // 弾幕の最大数（パフォーマンス改善: 200→100）

  // 難易度設定
  DIFFICULTY: {
    easy: {
      bulletSpeed: 0.7,
      spawnRate: 0.5,
      spawnInterval: 1200, // コメント出現間隔(ミリ秒) - パフォーマンス改善
      damageMultiplier: 0.8
    },
    normal: {
      bulletSpeed: 1.0,
      spawnRate: 1.0,
      spawnInterval: 700, // コメント出現間隔(ミリ秒) - パフォーマンス改善
      damageMultiplier: 1.0
    },
    hard: {
      bulletSpeed: 1.5,
      spawnRate: 1.5,
      spawnInterval: 450, // コメント出現間隔(ミリ秒) - パフォーマンス改善
      damageMultiplier: 1.2
    },
    hell: {
      bulletSpeed: 0.6, // 通常の60%の速度（20%アップ）
      spawnRate: 1.5,
      spawnInterval: 450, // ハードと同じ
      damageMultiplier: 1.0, // 体力倍率なし
      trackPlayer: true, // プレイヤーを追尾
      negativeOnly: true, // 下位10%コメントのみ
      allRed: true // 全て赤色（紫は除く）
    }
  },

  // Canvas・描画設定
  FPS: 60,
  BACKGROUND_ALPHA: 0.1, // オーバーレイの透明度
  CANVAS_Z_INDEX: 9999,

  // AI 設定
  AI_COMMENT_THRESHOLD: 10, // この数以下でAI生成モード
  AI_COMMENT_COUNT: 50, // AI生成コメント数

  // 弾幕パラメータ範囲
  BULLET: {
    MIN_SPEED: 1.0,
    MAX_SPEED: 5.0,
    MIN_SIZE: 0.5,
    MAX_SIZE: 2.0,
    MIN_HP: 1,
    MAX_HP: 10,
    BASE_FONT_SIZE: 16
  },

  // スコアリング
  SCORE: {
    BULLET_DESTROY: 10,
    COMBO_MULTIPLIER: 1.5,
    PERFECT_BONUS: 100
  },

  // プレイヤー無敵時間（ミリ秒）
  INVINCIBLE_TIME: 2000,

  // デバッグモード
  DEBUG: false,

  // ローカルストレージキー
  STORAGE_KEYS: {
    HIGH_SCORE: 'yt_shooting_high_score',
    SETTINGS: 'yt_shooting_settings',
    API_KEY: 'yt_shooting_api_key',
    COINS: 'yt_shooting_coins',
    UNLOCKED_SKINS: 'yt_shooting_unlocked_skins',
    SELECTED_SKIN: 'yt_shooting_selected_skin',
    ACHIEVEMENTS: 'yt_shooting_achievements',
    GAME_STATS: 'yt_shooting_game_stats'
  }
};

// 設定のバリデーション
function validateConfig() {
  if (CONFIG.YOUTUBE_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('[YouTube Shooting] YouTube API キーが設定されていません。');
  }

  if (CONFIG.MAX_BULLETS < 30) {
    console.warn('[YouTube Shooting] MAX_BULLETS が小さすぎます。');
  }
}

// 初期化時にバリデーション実行
validateConfig();

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_SHOOTING_CONFIG = CONFIG;
}
