/**
 * Chrome Storage管理（chrome.storage.local使用）
 */

class StorageManager {
  constructor() {
    this.config = window.YT_SHOOTING_CONFIG;
  }

  /**
   * ハイスコアを取得
   * @returns {Promise<number>}
   */
  async getHighScore() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.HIGH_SCORE], (result) => {
        resolve(result[this.config.STORAGE_KEYS.HIGH_SCORE] || 0);
      });
    });
  }

  /**
   * ハイスコアを保存
   * @param {number} score
   * @returns {Promise<boolean>}
   */
  async setHighScore(score) {
    const currentHigh = await this.getHighScore();
    if (score > currentHigh) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [this.config.STORAGE_KEYS.HIGH_SCORE]: score }, () => {
          console.log(`[Storage] ハイスコア更新: ${score}`);
          resolve(true);
        });
      });
    }
    return false;
  }

  /**
   * 設定を取得
   * @returns {Promise<object>}
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.SETTINGS], (result) => {
        if (result[this.config.STORAGE_KEYS.SETTINGS]) {
          resolve(result[this.config.STORAGE_KEYS.SETTINGS]);
        } else {
          resolve(this.getDefaultSettings());
        }
      });
    });
  }

  /**
   * デフォルト設定を取得
   * @returns {object}
   */
  getDefaultSettings() {
    return {
      difficulty: 'normal',
      soundEnabled: true,
      controlType: 'mouse',
      showFPS: false
    };
  }

  /**
   * 設定を保存
   * @param {object} settings
   * @returns {Promise<boolean>}
   */
  async setSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.config.STORAGE_KEYS.SETTINGS]: settings }, () => {
        resolve(true);
      });
    });
  }

  /**
   * YouTube API キーを取得
   * @returns {Promise<string|null>}
   */
  async getAPIKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.API_KEY], (result) => {
        resolve(result[this.config.STORAGE_KEYS.API_KEY] || null);
      });
    });
  }

  /**
   * YouTube API キーを保存
   * @param {string} apiKey
   */
  setAPIKey(apiKey) {
    chrome.storage.local.set({ [this.config.STORAGE_KEYS.API_KEY]: apiKey });
  }

  /**
   * 全データをクリア
   */
  clearAll() {
    chrome.storage.local.clear(() => {
      console.log('[Storage] 全データをクリア');
    });
  }

  /**
   * コイン数を取得
   * @returns {Promise<number>}
   */
  async getCoins() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.COINS], (result) => {
        resolve(result[this.config.STORAGE_KEYS.COINS] || 0);
      });
    });
  }

  /**
   * コインを追加
   * @param {number} amount
   * @returns {Promise<number>} 新しい合計
   */
  async addCoins(amount) {
    const current = await this.getCoins();
    const newTotal = current + amount;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.config.STORAGE_KEYS.COINS]: newTotal }, () => {
        console.log(`[Storage] コイン追加: ${amount} (合計: ${newTotal})`);
        resolve(newTotal);
      });
    });
  }

  /**
   * コインを消費
   * @param {number} amount
   * @returns {Promise<boolean>} 成功したかどうか
   */
  async spendCoins(amount) {
    const current = await this.getCoins();
    if (current >= amount) {
      await this.addCoins(-amount);
      return true;
    }
    console.warn(`[Storage] コイン不足: 必要${amount}, 所持${current}`);
    return false;
  }

  /**
   * 解除済みスキンを取得
   * @returns {Promise<Array<string>>}
   */
  async getUnlockedSkins() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.UNLOCKED_SKINS], (result) => {
        resolve(result[this.config.STORAGE_KEYS.UNLOCKED_SKINS] || ['default']);
      });
    });
  }

  /**
   * スキンを解除
   * @param {string} skinId
   */
  async unlockSkin(skinId) {
    const skins = await this.getUnlockedSkins();
    if (!skins.includes(skinId)) {
      skins.push(skinId);
      chrome.storage.local.set({ [this.config.STORAGE_KEYS.UNLOCKED_SKINS]: skins }, () => {
        console.log(`[Storage] スキン解除: ${skinId}`);
      });
    }
  }

  /**
   * 選択中のスキンを取得
   * @returns {Promise<string>}
   */
  async getSelectedSkin() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.SELECTED_SKIN], (result) => {
        resolve(result[this.config.STORAGE_KEYS.SELECTED_SKIN] || 'default');
      });
    });
  }

  /**
   * スキンを選択
   * @param {string} skinId
   */
  setSelectedSkin(skinId) {
    chrome.storage.local.set({ [this.config.STORAGE_KEYS.SELECTED_SKIN]: skinId }, () => {
      console.log(`[Storage] スキン選択: ${skinId}`);
    });
  }

  /**
   * 実績データを取得
   * @returns {Promise<Object>}
   */
  async getAchievements() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.ACHIEVEMENTS], (result) => {
        resolve(result[this.config.STORAGE_KEYS.ACHIEVEMENTS] || {});
      });
    });
  }

  /**
   * 実績の進捗を更新
   * @param {string} id - 実績ID
   * @param {number} progress - 進捗値
   */
  async updateAchievementProgress(id, progress) {
    const achievements = await this.getAchievements();
    if (!achievements[id]) {
      achievements[id] = { unlocked: false, progress: 0 };
    }
    achievements[id].progress = progress;
    chrome.storage.local.set({ [this.config.STORAGE_KEYS.ACHIEVEMENTS]: achievements });
  }

  /**
   * 実績を解除
   * @param {string} id - 実績ID
   */
  async unlockAchievement(id) {
    const achievements = await this.getAchievements();
    if (!achievements[id]) {
      achievements[id] = { unlocked: false, progress: 0 };
    }
    if (!achievements[id].unlocked) {
      achievements[id].unlocked = true;
      achievements[id].unlockedAt = new Date().toISOString();
      chrome.storage.local.set({ [this.config.STORAGE_KEYS.ACHIEVEMENTS]: achievements }, () => {
        console.log(`[Storage] 実績解除: ${id}`);
      });
    }
  }

  /**
   * ゲーム統計を取得
   * @returns {Promise<Object>}
   */
  async getGameStats() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.config.STORAGE_KEYS.GAME_STATS], (result) => {
        if (result[this.config.STORAGE_KEYS.GAME_STATS]) {
          resolve(result[this.config.STORAGE_KEYS.GAME_STATS]);
        } else {
          resolve(this.getDefaultGameStats());
        }
      });
    });
  }

  /**
   * デフォルトゲーム統計を取得
   * @returns {Object}
   */
  getDefaultGameStats() {
    return {
      totalGames: 0,
      totalScore: 0,
      totalKills: 0,
      consecutiveClears: 0,
      bestScore: 0,
      noDamageClears: 0,
      difficultyClear: {
        easy: 0,
        normal: 0,
        hard: 0,
        hell: 0
      }
    };
  }

  /**
   * ゲーム統計を更新
   * @param {number} score - 今回のスコア
   * @param {number} kills - 今回の撃破数
   * @param {boolean} wasCleared - クリアしたか
   * @param {string} difficulty - 難易度
   * @param {boolean} noDamage - ノーダメージでクリアしたか
   */
  async updateGameStats(score, kills, wasCleared, difficulty, noDamage = false) {
    const stats = await this.getGameStats();

    stats.totalGames++;
    stats.totalScore += score;
    stats.totalKills += kills;

    if (score > stats.bestScore) {
      stats.bestScore = score;
    }

    if (wasCleared) {
      stats.consecutiveClears++;
      if (stats.difficultyClear[difficulty] !== undefined) {
        stats.difficultyClear[difficulty]++;
      }
      // ノーダメージクリアをカウント
      if (noDamage) {
        stats.noDamageClears = (stats.noDamageClears || 0) + 1;
      }
    } else {
      stats.consecutiveClears = 0;
    }

    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.config.STORAGE_KEYS.GAME_STATS]: stats }, () => {
        resolve(stats);
      });
    });
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_StorageManager = StorageManager;
}
