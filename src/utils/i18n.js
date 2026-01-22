/**
 * 国際化（i18n）管理モジュール
 * 日本語・英語の多言語対応
 */

class I18nManager {
  constructor() {
    this.translations = this.loadTranslations();
    this.currentLang = this.loadSavedLanguage();
  }

  /**
   * 保存された言語を読み込み（なければブラウザ言語を検出）
   * @returns {string} 'ja' or 'en'
   */
  loadSavedLanguage() {
    const saved = localStorage.getItem('yt_shooting_language');
    if (saved && this.translations[saved]) {
      return saved;
    }
    // 初回のみブラウザ言語で判定
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('ja') ? 'ja' : 'en';
  }

  /**
   * 翻訳データをロード
   * @returns {Object}
   */
  loadTranslations() {
    return {
      ja: {
        // ゲーム内UI
        gameStart: 'START',
        gamePause: 'PAUSE',
        gameResume: 'RESUME',
        gameExit: 'EXIT',
        gameOver: 'GAME OVER',
        gameClear: 'GAME CLEAR!',
        newRecord: 'NEW RECORD!',
        restart: 'RESTART',
        close: 'CLOSE',
        share: 'SHARE',
        score: 'SCORE',
        highScore: 'HIGH',
        lives: 'LIVES',
        coins: 'COINS',
        coinsEarned: 'COINS EARNED',
        bossWarning: 'BOSS COMING',
        boss: 'BOSS',

        // 難易度
        difficultySelect: '難易度を選択',
        difficultyEasy: 'EASY',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'HARD',
        difficultyHell: 'HELL',

        // ポップアップ - ヘッダー
        popupTitle: '🎮 YouTube Shooting',

        // ポップアップ - タブ
        tabHome: 'ホーム',
        tabSkins: 'スキン',
        tabAchievements: '実績',
        tabSettings: '設定',

        // ポップアップ - ホーム
        gameStartButton: 'ゲーム開始',
        gameStatusReady: '動画ページを開いてボタンをクリック',
        gameStatusNotOnYoutube: 'YouTubeの動画ページを開いてください',
        gameStatusLoading: 'ゲームを起動中...',
        homeWelcome: 'YouTube動画のコメントを弾幕シューティングゲームに変換！',
        homeYourRecords: 'あなたの記録',
        statBestScore: 'ベストスコア',
        statTotalKills: '総撃破数',
        statTotalGames: '総プレイ数',
        statConsecutiveClears: '連続クリア',
        homeHowToUseTitle: '使い方',
        homeHowToUse1: 'YouTube動画ページを開く',
        homeHowToUse2: '「START」ボタンをクリック',
        homeHowToUse3: '難易度を選択してプレイ！',
        homeControlsTitle: '操作方法',
        homeControlMouse: '<strong>マウス</strong>: カーソル移動で自機を操作',
        homeControlKeyboard: '<strong>キーボード</strong>: WASD / 矢印キー',
        homeControlShoot: '<strong>射撃</strong>: 自動発射',

        // ポップアップ - スキン
        skinsTitle: 'プレイヤースキン',
        skinsDescription: 'スキンを変更してプレイヤーの見た目をカスタマイズ！',
        skinInUse: '✓ 使用中',
        skinUnlocked: '✓ 解除済み',
        skinUnlockMethod: '解除方法',
        skinOr: 'または',
        skinEquip: '装着',
        skinBuy: '購入',
        skinRemaining: 'あと',

        // ポップアップ - 実績
        achievementsTitle: '実績',
        achievementsDescription: '実績を達成してコインやスキンを入手しよう！',
        achievementReward: '報酬',

        // ポップアップ - 設定
        settingsTitle: '設定',
        settingVolumeLabel: 'SE音量',
        settingResetButton: '全データをリセット',
        settingResetWarning: '※コイン、スキン、実績、統計が全て削除されます',
        settingResetConfirm: '本当に全データをリセットしますか？この操作は取り消せません。',
        settingResetComplete: '全データをリセットしました。',
        settingVersion: 'バージョン',
        settingHashtag: '#YoutubeShot で共有しよう！',

        // 実績通知
        achievementUnlocked: 'Achievement Unlocked!',

        // スキン名
        skinClassicGreen: 'Classic Green',
        skinClassicGreenDesc: '初期スキン',
        skinCrimsonBlade: 'Crimson Blade',
        skinCrimsonBladeDesc: '赤い戦士',
        skinGoldenStar: 'Golden Star',
        skinGoldenStarDesc: '伝説の星',

        // 実績名
        achScoreMaster: '得点王',
        achScoreMasterDesc: '1ゲームで10,000点達成',
        achScoreLegend: '得点神',
        achScoreLegendDesc: '1ゲームで50,000点達成',
        achGoldenManner: '黄金のテーブルマナー',
        achGoldenMannerDesc: '1ゲームで300,000点達成',
        achEnemySlayer: '血濡れた機体',
        achEnemySlayerDesc: '累計1,000体撃破',
        achEnemyDestroyer: '戦場の赤い死神',
        achEnemyDestroyerDesc: '累計5,000体撃破',
        achLonelyNight: '一人の夜に',
        achLonelyNightDesc: '累計10,000体撃破',
        achGoldenPraise: '黄金の賛辞を君に',
        achGoldenPraiseDesc: '累計500,000体撃破',
        achEasyConqueror: '簡単すぎ？',
        achEasyConquerorDesc: 'EASY難易度クリア',
        achNormalConqueror: '普通が一番！',
        achNormalConquerorDesc: 'NORMAL難易度クリア',
        achHardConqueror: 'もう限界！',
        achHardConquerorDesc: 'HARD難易度クリア',
        achHellConqueror: '限界を越えし者',
        achHellConquerorDesc: 'HELL難易度クリア',
        achNoDamage: '天上天下唯我独尊',
        achNoDamageDesc: '1ダメージも喰らわずクリア',
        achConsistencyKing: '困難なビュッフェ',
        achConsistencyKingDesc: '3連続クリア',
        achConsistencyGod: '困難なフルコース',
        achConsistencyGodDesc: '5連続クリア',
        achGoldenFullCourse: '黄金のフルコース',
        achGoldenFullCourseDesc: '49連続クリア',
        achSimpleGreeting: 'まずは簡単な挨拶',
        achSimpleGreetingDesc: '総プレイ数10回',
        achRoutine: '手慣れたルーティン',
        achRoutineDesc: '総プレイ数100回',
        achPlayToWatch: '動画は遊ぶために見る',
        achPlayToWatchDesc: '総プレイ数500回',
        achDanmakuKing: '黄金の弾幕王',
        achDanmakuKingDesc: '総プレイ数1000回',

        // SNS共有テキスト
        shareAchievement: '🏆 実績解除！',
        shareScore: '🎮 YouTube Shooting',
        shareDifficulty: '難易度',
        shareKills: '撃破数',
        shareClear: '難易度クリア！'
      },

      en: {
        // In-game UI
        gameStart: 'START',
        gamePause: 'PAUSE',
        gameResume: 'RESUME',
        gameExit: 'EXIT',
        gameOver: 'GAME OVER',
        gameClear: 'GAME CLEAR!',
        newRecord: 'NEW RECORD!',
        restart: 'RESTART',
        close: 'CLOSE',
        share: 'SHARE',
        score: 'SCORE',
        highScore: 'HIGH',
        lives: 'LIVES',
        coins: 'COINS',
        coinsEarned: 'COINS EARNED',
        bossWarning: 'BOSS COMING',
        boss: 'BOSS',

        // Difficulty
        difficultySelect: 'Select Difficulty',
        difficultyEasy: 'EASY',
        difficultyNormal: 'NORMAL',
        difficultyHard: 'HARD',
        difficultyHell: 'HELL',

        // Popup - Header
        popupTitle: '🎮 YouTube Shooting',

        // Popup - Tabs
        tabHome: 'Home',
        tabSkins: 'Skins',
        tabAchievements: 'Achievements',
        tabSettings: 'Settings',

        // Popup - Home
        gameStartButton: 'START GAME',
        gameStatusReady: 'Open a video page and click the button',
        gameStatusNotOnYoutube: 'Please open a YouTube video page',
        gameStatusLoading: 'Launching game...',
        homeWelcome: 'Transform YouTube comments into a bullet-hell shooting game!',
        homeYourRecords: 'Your Records',
        statBestScore: 'Best Score',
        statTotalKills: 'Total Kills',
        statTotalGames: 'Total Games',
        statConsecutiveClears: 'Consecutive Clears',
        homeHowToUseTitle: 'How to Play',
        homeHowToUse1: 'Open a YouTube video page',
        homeHowToUse2: 'Click the "START" button',
        homeHowToUse3: 'Select difficulty and play!',
        homeControlsTitle: 'Controls',
        homeControlMouse: '<strong>Mouse</strong>: Move cursor to control player',
        homeControlKeyboard: '<strong>Keyboard</strong>: WASD / Arrow keys',
        homeControlShoot: '<strong>Shooting</strong>: Auto-fire',

        // Popup - Skins
        skinsTitle: 'Player Skins',
        skinsDescription: 'Customize your player appearance with different skins!',
        skinInUse: '✓ In Use',
        skinUnlocked: '✓ Unlocked',
        skinUnlockMethod: 'Unlock via',
        skinOr: 'or',
        skinEquip: 'Equip',
        skinBuy: 'Buy',
        skinRemaining: 'Need',

        // Popup - Achievements
        achievementsTitle: 'Achievements',
        achievementsDescription: 'Complete achievements to earn coins and skins!',
        achievementReward: 'Reward',

        // Popup - Settings
        settingsTitle: 'Settings',
        settingVolumeLabel: 'SE Volume',
        settingResetButton: 'Reset All Data',
        settingResetWarning: '※ All coins, skins, achievements, and stats will be deleted',
        settingResetConfirm: 'Are you sure you want to reset all data? This cannot be undone.',
        settingResetComplete: 'All data has been reset.',
        settingVersion: 'Version',
        settingHashtag: 'Share with #YoutubeShot!',

        // Achievement notification
        achievementUnlocked: 'Achievement Unlocked!',

        // Skin names
        skinClassicGreen: 'Classic Green',
        skinClassicGreenDesc: 'Default skin',
        skinCrimsonBlade: 'Crimson Blade',
        skinCrimsonBladeDesc: 'Fierce red warrior',
        skinGoldenStar: 'Golden Star',
        skinGoldenStarDesc: 'Legendary star form',

        // Achievement names
        achScoreMaster: 'Score King',
        achScoreMasterDesc: 'Reach 10,000 points in a single game',
        achScoreLegend: 'Score God',
        achScoreLegendDesc: 'Reach 50,000 points in a single game',
        achGoldenManner: 'Golden Table Manners',
        achGoldenMannerDesc: 'Reach 300,000 points in a single game',
        achEnemySlayer: 'Blood-Stained Machine',
        achEnemySlayerDesc: 'Defeat 1,000 enemies (cumulative)',
        achEnemyDestroyer: 'Red Reaper of the Battlefield',
        achEnemyDestroyerDesc: 'Defeat 5,000 enemies (cumulative)',
        achLonelyNight: 'A Lonely Night',
        achLonelyNightDesc: 'Defeat 10,000 enemies (cumulative)',
        achGoldenPraise: 'Golden Praise for You',
        achGoldenPraiseDesc: 'Defeat 500,000 enemies (cumulative)',
        achEasyConqueror: 'Too Easy?',
        achEasyConquerorDesc: 'Clear EASY difficulty',
        achNormalConqueror: 'Normal is the Best!',
        achNormalConquerorDesc: 'Clear NORMAL difficulty',
        achHardConqueror: 'At My Limit!',
        achHardConquerorDesc: 'Clear HARD difficulty',
        achHellConqueror: 'Beyond All Limits',
        achHellConquerorDesc: 'Clear HELL difficulty',
        achNoDamage: 'Supreme Being',
        achNoDamageDesc: 'Clear without taking any damage',
        achConsistencyKing: 'Buffet of Challenges',
        achConsistencyKingDesc: 'Clear 3 games consecutively',
        achConsistencyGod: 'Full Course of Challenges',
        achConsistencyGodDesc: 'Clear 5 games consecutively',
        achGoldenFullCourse: 'Golden Full Course',
        achGoldenFullCourseDesc: 'Clear 49 games consecutively',
        achSimpleGreeting: 'A Simple Greeting',
        achSimpleGreetingDesc: 'Play 10 games total',
        achRoutine: 'Familiar Routine',
        achRoutineDesc: 'Play 100 games total',
        achPlayToWatch: 'Videos Are Meant to Play',
        achPlayToWatchDesc: 'Play 500 games total',
        achDanmakuKing: 'Golden Danmaku King',
        achDanmakuKingDesc: 'Play 1000 games total',

        // SNS share text
        shareAchievement: '🏆 Achievement Unlocked!',
        shareScore: '🎮 YouTube Shooting',
        shareDifficulty: 'Difficulty',
        shareKills: 'Kills',
        shareClear: 'CLEARED!'
      }
    };
  }

  /**
   * キーから翻訳テキストを取得
   * @param {string} key - 翻訳キー
   * @returns {string}
   */
  t(key) {
    return this.translations[this.currentLang][key] || key;
  }

  /**
   * 言語を切り替え
   * @param {string} lang - 'ja' or 'en'
   */
  setLanguage(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('yt_shooting_language', lang);
    }
  }

  /**
   * 現在の言語を取得
   * @returns {string}
   */
  getCurrentLanguage() {
    return this.currentLang;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_I18nManager = I18nManager;
}
