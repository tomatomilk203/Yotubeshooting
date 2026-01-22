/**
 * 実績管理モジュール
 * 4タイプの実績を管理し、達成時に報酬を付与
 */

class AchievementManager {
  constructor(storageManager) {
    this.storageManager = storageManager;
    this.achievements = this.defineAchievements();
  }

  /**
   * 実績定義
   * @returns {Object}
   */
  defineAchievements() {
    return {
      // スコア系
      score_10000: {
        id: 'score_10000',
        name: 'Score Master',
        description: 'Reach 10,000 points in a single game',
        type: 'score',
        threshold: 10000,
        reward: { type: 'skin', skinId: 'red_triangle' },
        icon: '🏆'
      },
      score_50000: {
        id: 'score_50000',
        name: 'Score Legend',
        description: 'Reach 50,000 points in a single game',
        type: 'score',
        threshold: 50000,
        reward: { type: 'coins', amount: 1000 },
        icon: '👑'
      },
      score_300000: {
        id: 'score_300000',
        name: 'Golden Table Manners',
        description: 'Reach 300,000 points in a single game',
        type: 'score',
        threshold: 300000,
        reward: { type: 'coins', amount: 5000 },
        icon: '🍽️'
      },

      // 撃破数系（累積）
      kills_1000: {
        id: 'kills_1000',
        name: 'Enemy Slayer',
        description: 'Defeat 1,000 enemies (cumulative)',
        type: 'kills',
        threshold: 1000,
        reward: { type: 'coins', amount: 500 },
        icon: '⚔️'
      },
      kills_5000: {
        id: 'kills_5000',
        name: 'Enemy Destroyer',
        description: 'Defeat 5,000 enemies (cumulative)',
        type: 'kills',
        threshold: 5000,
        reward: { type: 'coins', amount: 2000 },
        icon: '💀'
      },
      kills_10000: {
        id: 'kills_10000',
        name: 'A Lonely Night',
        description: 'Defeat 10,000 enemies (cumulative)',
        type: 'kills',
        threshold: 10000,
        reward: { type: 'coins', amount: 3000 },
        icon: '🌙'
      },
      kills_500000: {
        id: 'kills_500000',
        name: 'Golden Praise for You',
        description: 'Defeat 500,000 enemies (cumulative)',
        type: 'kills',
        threshold: 500000,
        reward: { type: 'coins', amount: 50000 },
        icon: '🌟'
      },

      // 難易度クリア系
      clear_easy: {
        id: 'clear_easy',
        name: 'Easy Conqueror',
        description: 'Clear EASY difficulty',
        type: 'difficulty_clear',
        threshold: 'easy',
        reward: { type: 'coins', amount: 100 },
        icon: '🟢'
      },
      clear_normal: {
        id: 'clear_normal',
        name: 'Normal Conqueror',
        description: 'Clear NORMAL difficulty',
        type: 'difficulty_clear',
        threshold: 'normal',
        reward: { type: 'coins', amount: 300 },
        icon: '🟡'
      },
      clear_hard: {
        id: 'clear_hard',
        name: 'Hard Conqueror',
        description: 'Clear HARD difficulty',
        type: 'difficulty_clear',
        threshold: 'hard',
        reward: { type: 'coins', amount: 500 },
        icon: '🔴'
      },
      clear_hell: {
        id: 'clear_hell',
        name: 'Hell Conqueror',
        description: 'Clear HELL difficulty',
        type: 'difficulty_clear',
        threshold: 'hell',
        reward: { type: 'skin', skinId: 'gold_star' },
        icon: '👿'
      },
      clear_no_damage: {
        id: 'clear_no_damage',
        name: 'Supreme Being',
        description: 'Clear without taking any damage',
        type: 'no_damage',
        threshold: 1,
        reward: { type: 'coins', amount: 2000 },
        icon: '👼'
      },

      // 連続クリア系
      consecutive_3: {
        id: 'consecutive_3',
        name: 'Consistency King',
        description: 'Clear 3 games consecutively',
        type: 'consecutive',
        threshold: 3,
        reward: { type: 'coins', amount: 300 },
        icon: '🔥'
      },
      consecutive_5: {
        id: 'consecutive_5',
        name: 'Consistency God',
        description: 'Clear 5 games consecutively',
        type: 'consecutive',
        threshold: 5,
        reward: { type: 'coins', amount: 800 },
        icon: '✨'
      },
      consecutive_49: {
        id: 'consecutive_49',
        name: 'Golden Full Course',
        description: 'Clear 49 games consecutively',
        type: 'consecutive',
        threshold: 49,
        reward: { type: 'coins', amount: 10000 },
        icon: '🏅'
      },

      // 総プレイ数系
      games_10: {
        id: 'games_10',
        name: 'A Simple Greeting',
        description: 'Play 10 games total',
        type: 'total_games',
        threshold: 10,
        reward: { type: 'coins', amount: 100 },
        icon: '👋'
      },
      games_100: {
        id: 'games_100',
        name: 'Familiar Routine',
        description: 'Play 100 games total',
        type: 'total_games',
        threshold: 100,
        reward: { type: 'coins', amount: 500 },
        icon: '🎯'
      },
      games_500: {
        id: 'games_500',
        name: 'Videos Are Meant to Play',
        description: 'Play 500 games total',
        type: 'total_games',
        threshold: 500,
        reward: { type: 'coins', amount: 2000 },
        icon: '🎬'
      },
      games_1000: {
        id: 'games_1000',
        name: 'Golden Danmaku King',
        description: 'Play 1000 games total',
        type: 'total_games',
        threshold: 1000,
        reward: { type: 'coins', amount: 5000 },
        icon: '👑'
      }
    };
  }

  /**
   * ゲーム終了時に実績をチェック
   * @param {number} gameScore - 今回のスコア
   * @param {number} gameKills - 今回の撃破数
   * @param {boolean} wasCleared - クリアしたか
   * @param {string} difficulty - 難易度
   * @param {boolean} noDamage - ノーダメージでクリアしたか
   * @returns {Promise<Array<Object>>} 新しく解除された実績の配列
   */
  async checkAchievements(gameScore, gameKills, wasCleared, difficulty, noDamage = false) {
    const stats = await this.storageManager.getGameStats();
    const achievements = await this.storageManager.getAchievements();
    const newlyUnlocked = [];

    console.log('[Achievements] チェック開始:', { gameScore, gameKills, wasCleared, difficulty, noDamage, stats });

    for (const ach of Object.values(this.achievements)) {
      // 既に解除済みの実績はスキップ
      if (achievements[ach.id]?.unlocked) {
        continue;
      }

      let shouldUnlock = false;

      switch (ach.type) {
        case 'score':
          // 今回のスコアが閾値を超えたか
          shouldUnlock = gameScore >= ach.threshold;
          if (shouldUnlock) {
            console.log(`[Achievements] スコア実績達成: ${ach.name} (${gameScore} >= ${ach.threshold})`);
          }
          break;

        case 'kills':
          // 累積撃破数が閾値を超えたか（今回のキル数も加算して判定）
          const totalKillsWithCurrent = stats.totalKills + gameKills;
          shouldUnlock = totalKillsWithCurrent >= ach.threshold;
          if (shouldUnlock) {
            console.log(`[Achievements] 撃破数実績達成: ${ach.name} (${totalKillsWithCurrent} >= ${ach.threshold})`);
          }
          break;

        case 'difficulty_clear':
          // 指定難易度をクリアしたか
          shouldUnlock = wasCleared && difficulty === ach.threshold;
          if (shouldUnlock) {
            console.log(`[Achievements] 難易度クリア実績達成: ${ach.name} (${difficulty})`);
          }
          break;

        case 'no_damage':
          // ノーダメージでクリアしたか
          shouldUnlock = wasCleared && noDamage;
          if (shouldUnlock) {
            console.log(`[Achievements] ノーダメージ実績達成: ${ach.name}`);
          }
          break;

        case 'consecutive':
          // 連続クリア数が閾値を超えたか（今回クリアなら+1して判定）
          const consecutiveWithCurrent = wasCleared ? stats.consecutiveClears + 1 : 0;
          shouldUnlock = consecutiveWithCurrent >= ach.threshold;
          if (shouldUnlock) {
            console.log(`[Achievements] 連続クリア実績達成: ${ach.name} (${consecutiveWithCurrent} >= ${ach.threshold})`);
          }
          break;

        case 'total_games':
          // 総プレイ数が閾値を超えたか（今回のゲームも加算して判定）
          const totalGamesWithCurrent = stats.totalGames + 1;
          shouldUnlock = totalGamesWithCurrent >= ach.threshold;
          if (shouldUnlock) {
            console.log(`[Achievements] 総プレイ数実績達成: ${ach.name} (${totalGamesWithCurrent} >= ${ach.threshold})`);
          }
          break;
      }

      if (shouldUnlock) {
        await this.storageManager.unlockAchievement(ach.id);
        await this.grantReward(ach);
        newlyUnlocked.push(ach);
        console.log(`[Achievements] 実績解除: ${ach.name}`);
      }
    }

    console.log(`[Achievements] チェック完了: ${newlyUnlocked.length}件の実績を解除`);
    return newlyUnlocked;
  }

  /**
   * 実績の報酬を付与
   * @param {Object} achievement - 実績オブジェクト
   */
  async grantReward(achievement) {
    const reward = achievement.reward;

    if (reward.type === 'coins') {
      await this.storageManager.addCoins(reward.amount);
      console.log(`[Achievements] コイン報酬: ${reward.amount}枚`);
    } else if (reward.type === 'skin') {
      await this.storageManager.unlockSkin(reward.skinId);
      console.log(`[Achievements] スキン報酬: ${reward.skinId}`);
    }
  }

  /**
   * 全実績の配列を取得
   * @returns {Array<Object>}
   */
  getAllAchievements() {
    return Object.values(this.achievements);
  }

  /**
   * 実績を取得
   * @param {string} id - 実績ID
   * @returns {Object|null}
   */
  getAchievement(id) {
    return this.achievements[id] || null;
  }

  /**
   * 実績の進捗を計算
   * @param {Object} achievement - 実績オブジェクト
   * @param {Object} stats - ゲーム統計
   * @param {Object} achievements - 実績データ
   * @returns {Object} { progress: number, max: number, percentage: number }
   */
  calculateProgress(achievement, stats, achievements) {
    if (achievements[achievement.id]?.unlocked) {
      return { progress: achievement.threshold, max: achievement.threshold, percentage: 100 };
    }

    let progress = 0;
    let max = achievement.threshold;

    switch (achievement.type) {
      case 'score':
        progress = stats.bestScore;
        break;
      case 'kills':
        progress = stats.totalKills;
        break;
      case 'difficulty_clear':
        progress = stats.difficultyClear[achievement.threshold] > 0 ? 1 : 0;
        max = 1;
        break;
      case 'no_damage':
        progress = stats.noDamageClears || 0;
        max = 1;
        break;
      case 'consecutive':
        progress = stats.consecutiveClears;
        break;
      case 'total_games':
        progress = stats.totalGames;
        break;
    }

    const percentage = Math.min(100, Math.floor((progress / max) * 100));
    return { progress, max, percentage };
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_AchievementManager = AchievementManager;
}
