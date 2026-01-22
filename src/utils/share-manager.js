/**
 * SNS共有管理モジュール
 * Twitter/Xへの共有機能
 */

class ShareManager {
  constructor() {
    this.hashtag = 'YoutubeShot';
    this.twitterIntentURL = 'https://twitter.com/intent/tweet';
  }

  /**
   * 実績解除時の共有テキストを生成
   * @param {Object} achievement - 実績オブジェクト
   * @returns {string}
   */
  generateAchievementShareText(achievement) {
    return `🏆 実績解除！\n「${achievement.name}」\n${achievement.description}\n\n#${this.hashtag}`;
  }

  /**
   * スコア達成時の共有テキストを生成
   * @param {number} score - スコア
   * @param {string} difficulty - 難易度
   * @param {number} kills - 撃破数
   * @returns {string}
   */
  generateScoreShareText(score, difficulty, kills) {
    const difficultyText = {
      easy: 'EASY',
      normal: 'NORMAL',
      hard: 'HARD',
      hell: 'HELL'
    };

    return `🎮 YouTube Shooting\n難易度: ${difficultyText[difficulty] || difficulty}\nスコア: ${score.toLocaleString()}点\n撃破数: ${kills}体\n\n#${this.hashtag}`;
  }

  /**
   * ゲームクリア時の共有テキストを生成
   * @param {string} difficulty - 難易度
   * @param {number} score - スコア
   * @returns {string}
   */
  generateClearShareText(difficulty, score) {
    const difficultyText = {
      easy: 'EASY',
      normal: 'NORMAL',
      hard: 'HARD',
      hell: 'HELL'
    };

    const emoji = {
      easy: '🟢',
      normal: '🟡',
      hard: '🔴',
      hell: '👿'
    };

    return `${emoji[difficulty] || '🎮'} ${difficultyText[difficulty] || difficulty}難易度クリア！\n\nスコア: ${score.toLocaleString()}点\n\n#${this.hashtag}`;
  }

  /**
   * Twitter/Xで共有
   * @param {string} text - 共有テキスト
   */
  shareToTwitter(text) {
    const url = `${this.twitterIntentURL}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
    console.log('[ShareManager] Twitter共有:', text);
  }

  /**
   * 実績解除を共有
   * @param {Object} achievement - 実績オブジェクト
   */
  shareAchievement(achievement) {
    const text = this.generateAchievementShareText(achievement);
    this.shareToTwitter(text);
  }

  /**
   * スコアを共有
   * @param {number} score - スコア
   * @param {string} difficulty - 難易度
   * @param {number} kills - 撃破数
   */
  shareScore(score, difficulty, kills) {
    const text = this.generateScoreShareText(score, difficulty, kills);
    this.shareToTwitter(text);
  }

  /**
   * クリアを共有
   * @param {string} difficulty - 難易度
   * @param {number} score - スコア
   */
  shareClear(difficulty, score) {
    const text = this.generateClearShareText(difficulty, score);
    this.shareToTwitter(text);
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_ShareManager = ShareManager;
}
