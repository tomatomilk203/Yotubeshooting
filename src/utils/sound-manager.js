/**
 * 効果音管理
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true; // 効果音ON/OFF

    // chrome.runtime が利用可能か確認
    try {
      this.basePath = chrome.runtime.getURL('SE/');

      // 効果音ファイルを登録
      this.register('hit', 'パワーアップ.mp3'); // 10個撃破時
      this.register('bossDefeat', 'ボス撃破.mp3');
      this.register('bossAppear', 'ボス登場.mp3');
      this.register('heal', '回復.mp3');
      this.register('damage', '自分被弾.mp3');
      this.register('shoot', '弾発射.mp3');
      this.register('enemyDefeat', '敵撃破.mp3');
      this.register('enemyHit', '敵被弾.mp3');
    } catch (err) {
      console.error('[SoundManager] 初期化エラー:', err);
      this.basePath = '';
    }
  }

  /**
   * 効果音を登録
   * @param {string} name - 効果音の名前
   * @param {string} filename - ファイル名
   */
  register(name, filename) {
    const audio = new Audio(this.basePath + filename);
    audio.volume = 0.335; // デフォルト音量33.5% (50% × 0.67)
    this.sounds[name] = audio;
  }

  /**
   * 効果音を再生
   * @param {string} name - 効果音の名前
   */
  play(name) {
    if (!this.enabled) return;

    const sound = this.sounds[name];
    if (sound) {
      // 複製して再生（同時再生対応）
      const clone = sound.cloneNode();
      clone.volume = sound.volume;
      clone.play().catch(err => {
        console.warn(`[SoundManager] ${name} の再生に失敗:`, err);
      });
    } else {
      console.warn(`[SoundManager] ${name} が見つかりません`);
    }
  }

  /**
   * 音量を設定
   * @param {string} name - 効果音の名前
   * @param {number} volume - 音量 (0.0 〜 1.0)
   */
  setVolume(name, volume) {
    const sound = this.sounds[name];
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 全体の音量を設定
   * @param {number} volume - 音量 (0.0 〜 1.0)
   */
  setMasterVolume(volume) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }

  /**
   * 効果音のON/OFF
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_SoundManager = SoundManager;
}
