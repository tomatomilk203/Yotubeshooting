/**
 * UI コンポーネント管理
 */

class GameUI {
  constructor() {
    this.container = null;
    this.scoreDisplay = null;
    this.killDisplay = null;
    this.livesDisplay = null;
    this.highScoreDisplay = null;
    this.startButton = null;
    this.pauseButton = null;
    this.exitButton = null;
    this.difficultyPanel = null;
    this.gameOverPanel = null;
    this.gameClearPanel = null;
    this.statsPanel = null; // 統計パネル（左上）
    this.livesPanel = null; // ライフパネル（右上）

    this.callbacks = {};
    this.isVisible = false;

    // 共有マネージャー
    this.shareManager = new window.YT_ShareManager();

    // 現在のゲーム情報（共有用）
    this.currentGameInfo = {
      score: 0,
      difficulty: 'normal',
      kills: 0,
      wasCleared: false
    };

    // STARTボタンのドラッグ用
    this.isDragging = false;
    this.dragStartTime = 0;
    this.startButtonPosition = { x: null, y: null };
  }

  /**
   * UI を初期化
   */
  init() {
    console.log('[UI] UI初期化開始...');

    // すでに存在する場合は削除
    const existing = document.getElementById('yt-shooting-ui');
    if (existing) {
      console.log('[UI] 既存UIを削除');
      existing.remove();
    }

    // コンテナを作成
    this.container = document.createElement('div');
    this.container.id = 'yt-shooting-ui';
    console.log('[UI] コンテナ作成完了');

    // 統計パネル（左上: SCORE, KILL）
    this.createStatsPanel();
    console.log('[UI] 統計パネル作成完了');

    // ライフパネル（右上: ♡）
    this.createLivesPanel();
    console.log('[UI] ライフパネル作成完了');

    // コントロールパネル（STARTボタン - ドラッグ移動可能）
    this.createControlPanel();
    console.log('[UI] コントロールパネル作成完了');

    // 難易度選択パネル
    this.createDifficultyPanel();
    console.log('[UI] 難易度パネル作成完了');

    // ゲームオーバーパネル
    this.createGameOverPanel();
    console.log('[UI] ゲームオーバーパネル作成完了');

    // ゲームクリアパネル
    this.createGameClearPanel();
    console.log('[UI] ゲームクリアパネル作成完了');

    // body に追加
    document.body.appendChild(this.container);
    console.log('[UI] コンテナをbodyに追加完了');

    // DOM に追加後、要素への参照を取得してイベントリスナーを設定
    this.bindStatsElements();
    this.bindControlElements();
    this.bindGameOverElements();

    console.log('[UI] UI を初期化しました');
  }

  /**
   * 統計パネルを作成（左上: SCORE KILL、右上: ♡）横一列表示
   */
  createStatsPanel() {
    const stats = document.createElement('div');
    stats.className = 'yt-shooting-stats';

    // 左上に配置、横一列
    stats.style.cssText = `
      display: none !important;
      position: absolute;
      top: 15px;
      left: 15px;
      pointer-events: none;
      z-index: 9999;
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: #fff;
      text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;
    `;

    // 横一列で SCORE と KILL
    stats.innerHTML = `
      SCORE:<span id="yt-shooting-score" style="color: #ffff00; margin-left: 8px;">0</span>
      <span style="margin-left: 20px;">KILL:<span id="yt-shooting-kill" style="color: #ff6666; margin-left: 8px;">0</span></span>
    `;

    this.container.appendChild(stats);
    this.statsPanel = stats;
  }

  /**
   * ライフパネルを作成（右上: ♡）
   */
  createLivesPanel() {
    const lives = document.createElement('div');
    lives.className = 'yt-shooting-lives-panel';

    // 右上に配置
    lives.style.cssText = `
      display: none !important;
      position: absolute;
      top: 15px;
      right: 15px;
      pointer-events: none;
      z-index: 9999;
      font-size: 28px;
      text-shadow: 2px 2px 0 #000;
    `;

    lives.innerHTML = `<span id="yt-shooting-lives">❤️❤️❤️</span>`;

    this.container.appendChild(lives);
    this.livesPanel = lives;
  }

  /**
   * 統計パネルの要素への参照を取得
   */
  bindStatsElements() {
    this.scoreDisplay = document.getElementById('yt-shooting-score');
    this.killDisplay = document.getElementById('yt-shooting-kill');
    this.livesDisplay = document.getElementById('yt-shooting-lives');

    console.log('[UI] Stats elements bound:', {
      score: this.scoreDisplay,
      kill: this.killDisplay,
      lives: this.livesDisplay
    });
  }

  /**
   * コントロールパネルを作成（STARTボタンはドラッグ移動可能）
   */
  createControlPanel() {
    const controls = document.createElement('div');
    controls.className = 'yt-shooting-controls';
    controls.id = 'yt-shooting-controls';

    // 保存された位置があれば使用、なければデフォルト位置を計算
    const savedPos = this.loadStartButtonPosition();
    this.hasInitialPosition = !!savedPos;

    controls.style.cssText = `
      position: absolute;
      z-index: 10000;
      cursor: grab;
    `;

    if (savedPos) {
      controls.style.left = `${savedPos.x}px`;
      controls.style.top = `${savedPos.y}px`;
    }

    controls.innerHTML = `
      <button id="yt-shooting-start" class="yt-shooting-btn" style="font-size: 18px; padding: 15px 40px;">START</button>
      <button id="yt-shooting-pause" class="yt-shooting-btn" style="display:none;">PAUSE</button>
      <button id="yt-shooting-resume" class="yt-shooting-btn" style="display:none;">RESUME</button>
      <button id="yt-shooting-exit" class="yt-shooting-btn" style="display:none;">EXIT</button>
    `;

    this.container.appendChild(controls);
    this.controlPanel = controls;

    // 初期位置がない場合、DOM追加後に中央下に配置
    if (!savedPos) {
      requestAnimationFrame(() => {
        const player = document.querySelector('#movie_player');
        if (player && controls) {
          const playerRect = player.getBoundingClientRect();
          const controlRect = controls.getBoundingClientRect();
          const x = playerRect.left + (playerRect.width - controlRect.width) / 2;
          const y = playerRect.top + playerRect.height * 0.8 - controlRect.height / 2;
          controls.style.left = `${x}px`;
          controls.style.top = `${y}px`;
        }
      });
    }
  }

  /**
   * STARTボタンの位置を保存
   */
  saveStartButtonPosition(x, y) {
    try {
      localStorage.setItem('yt_shooting_start_pos', JSON.stringify({ x, y }));
    } catch (e) {
      console.warn('[UI] 位置の保存に失敗:', e);
    }
  }

  /**
   * STARTボタンの位置を読み込み
   */
  loadStartButtonPosition() {
    try {
      const saved = localStorage.getItem('yt_shooting_start_pos');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * コントロール要素への参照とイベントリスナーを設定
   */
  bindControlElements() {
    this.startButton = document.getElementById('yt-shooting-start');
    this.pauseButton = document.getElementById('yt-shooting-pause');
    this.resumeButton = document.getElementById('yt-shooting-resume');
    this.exitButton = document.getElementById('yt-shooting-exit');
    this.controlPanel = document.getElementById('yt-shooting-controls');

    // ドラッグ用の変数
    let isDragging = false;
    let dragStartTime = 0;
    let startX, startY, initialX, initialY;
    const LONG_PRESS_DURATION = 300; // 300ms長押しでドラッグ開始

    // マウスダウン
    this.controlPanel.addEventListener('mousedown', (e) => {
      if (e.target === this.startButton || e.target === this.controlPanel) {
        dragStartTime = Date.now();
        startX = e.clientX;
        startY = e.clientY;
        const rect = this.controlPanel.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        this.controlPanel.style.cursor = 'grabbing';
      }
    });

    // マウスムーブ
    document.addEventListener('mousemove', (e) => {
      if (dragStartTime > 0) {
        const elapsed = Date.now() - dragStartTime;
        if (elapsed >= LONG_PRESS_DURATION) {
          isDragging = true;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          this.controlPanel.style.left = `${initialX + dx}px`;
          this.controlPanel.style.top = `${initialY + dy}px`;
        }
      }
    });

    // マウスアップ
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        // ドラッグ終了、位置を保存
        const rect = this.controlPanel.getBoundingClientRect();
        this.saveStartButtonPosition(rect.left, rect.top);
        isDragging = false;
      } else if (dragStartTime > 0) {
        // クリック（ドラッグなし）
        const elapsed = Date.now() - dragStartTime;
        if (elapsed < LONG_PRESS_DURATION && e.target === this.startButton) {
          if (this.callbacks.onStart) {
            this.difficultyPanel.style.display = 'flex';
          }
        }
      }
      dragStartTime = 0;
      this.controlPanel.style.cursor = 'grab';
    });

    this.pauseButton.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.pauseButton.style.display = 'none';
      this.resumeButton.style.display = 'inline-block';
    });

    this.resumeButton.addEventListener('click', () => {
      if (this.callbacks.onResume) this.callbacks.onResume();
      this.resumeButton.style.display = 'none';
      this.pauseButton.style.display = 'inline-block';
    });

    this.exitButton.addEventListener('click', () => {
      if (this.callbacks.onExit) this.callbacks.onExit();
    });
  }

  /**
   * 難易度選択パネルを作成
   */
  createDifficultyPanel() {
    this.difficultyPanel = document.createElement('div');
    this.difficultyPanel.className = 'yt-shooting-difficulty';
    this.difficultyPanel.style.display = 'none';

    this.difficultyPanel.innerHTML = `
      <div class="difficulty-content">
        <h2>SELECT DIFFICULTY</h2>
        <button class="difficulty-btn" data-level="easy">EASY</button>
        <button class="difficulty-btn" data-level="normal">NORMAL</button>
        <button class="difficulty-btn" data-level="hard">HARD</button>
        <button class="difficulty-btn difficulty-btn-hell" data-level="hell">HELL</button>
      </div>
    `;

    this.container.appendChild(this.difficultyPanel);

    // 難易度ボタンのイベント
    this.difficultyPanel.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const level = e.target.dataset.level;
        this.difficultyPanel.style.display = 'none';

        if (this.callbacks.onStart) {
          this.callbacks.onStart(level);
        }

        this.showGameControls();
      });
    });
  }

  /**
   * ゲームオーバーパネルを作成
   */
  createGameOverPanel() {
    this.gameOverPanel = document.createElement('div');
    this.gameOverPanel.className = 'yt-shooting-gameover';
    this.gameOverPanel.style.display = 'none';

    this.gameOverPanel.innerHTML = `
      <div class="gameover-content">
        <h1>GAME OVER</h1>
        <p class="final-score">SCORE: <span id="yt-shooting-final-score">0</span></p>
        <p class="high-score-notice" id="yt-shooting-new-record" style="display:none;">NEW RECORD!</p>
        <p class="coins-earned" id="yt-shooting-coins-earned">💰 COINS EARNED: 0</p>
        <button class="yt-shooting-btn share-btn" id="yt-shooting-share">🐦 SHARE</button>
        <button class="yt-shooting-btn" id="yt-shooting-restart">RESTART</button>
        <button class="yt-shooting-btn" id="yt-shooting-close">CLOSE</button>
      </div>
    `;

    this.container.appendChild(this.gameOverPanel);
  }

  /**
   * ゲームクリアパネルを作成
   */
  createGameClearPanel() {
    this.gameClearPanel = document.createElement('div');
    this.gameClearPanel.className = 'yt-shooting-gameclear';
    this.gameClearPanel.style.display = 'none';

    this.gameClearPanel.innerHTML = `
      <div class="gameclear-content">
        <h1 style="color: #00ff00;">GAME CLEAR!</h1>
        <p class="final-score">SCORE: <span id="yt-shooting-clear-score">0</span></p>
        <p class="high-score-notice" id="yt-shooting-clear-record" style="display:none;">NEW RECORD!</p>
        <p class="coins-earned" id="yt-shooting-clear-coins-earned">💰 COINS EARNED: 0</p>
        <button class="yt-shooting-btn share-btn" id="yt-shooting-clear-share">🐦 SHARE</button>
        <button class="yt-shooting-btn" id="yt-shooting-clear-restart">RESTART</button>
        <button class="yt-shooting-btn" id="yt-shooting-clear-close">CLOSE</button>
      </div>
    `;

    this.container.appendChild(this.gameClearPanel);
  }

  /**
   * ゲームオーバーパネルのイベントリスナーを設定
   */
  bindGameOverElements() {
    // ゲームオーバー - 共有ボタン
    document.getElementById('yt-shooting-share').addEventListener('click', () => {
      this.shareManager.shareScore(
        this.currentGameInfo.score,
        this.currentGameInfo.difficulty,
        this.currentGameInfo.kills
      );
    });

    // リスタート・クローズボタン
    document.getElementById('yt-shooting-restart').addEventListener('click', () => {
      this.gameOverPanel.style.display = 'none';
      this.difficultyPanel.style.display = 'flex';
    });

    document.getElementById('yt-shooting-close').addEventListener('click', () => {
      this.gameOverPanel.style.display = 'none';
      this.resetControls();
    });

    // ゲームクリア - 共有ボタン
    document.getElementById('yt-shooting-clear-share').addEventListener('click', () => {
      this.shareManager.shareClear(
        this.currentGameInfo.difficulty,
        this.currentGameInfo.score
      );
    });

    // クリア画面のボタン
    document.getElementById('yt-shooting-clear-restart').addEventListener('click', () => {
      this.gameClearPanel.style.display = 'none';
      this.difficultyPanel.style.display = 'flex';
    });

    document.getElementById('yt-shooting-clear-close').addEventListener('click', () => {
      this.gameClearPanel.style.display = 'none';
      this.resetControls();
    });
  }

  /**
   * イベントコールバックをバインド
   * @param {Object} callbacks - {onStart, onPause, onResume, onExit}
   */
  bindEvents(callbacks) {
    this.callbacks = callbacks;
  }

  /**
   * スコアを更新
   * @param {number} score
   */
  updateScore(score) {
    console.log('[UI] updateScore:', score, 'Element:', this.scoreDisplay);
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = score.toString();
      console.log('[UI] スコア表示更新:', this.scoreDisplay.textContent);
    } else {
      console.error('[UI] scoreDisplay が null です！');
    }
  }

  /**
   * ハイスコアを更新
   * @param {number} highScore
   */
  updateHighScore(highScore) {
    if (this.highScoreDisplay) {
      this.highScoreDisplay.textContent = highScore.toString();
    }
  }

  /**
   * キル数を更新
   * @param {number} kills
   */
  updateKills(kills) {
    if (this.killDisplay) {
      this.killDisplay.textContent = kills.toString();
    }
  }

  /**
   * 残機を更新
   * @param {number} lives
   */
  updateLives(lives) {
    if (this.livesDisplay) {
      const hearts = '❤️'.repeat(Math.max(0, lives));
      this.livesDisplay.textContent = hearts || '💀';
    }
  }

  /**
   * ゲームオーバー画面を表示
   * @param {number} finalScore
   * @param {boolean} isNewRecord
   * @param {number} coinsEarned
   * @param {string} difficulty
   * @param {number} kills
   */
  showGameOver(finalScore, isNewRecord = false, coinsEarned = 0, difficulty = 'normal', kills = 0) {
    // 共有用に情報を保存
    this.currentGameInfo = {
      score: finalScore,
      difficulty: difficulty,
      kills: kills,
      wasCleared: false
    };

    if (this.gameOverPanel) {
      document.getElementById('yt-shooting-final-score').textContent = finalScore.toString();

      const newRecordNotice = document.getElementById('yt-shooting-new-record');
      if (newRecordNotice) {
        newRecordNotice.style.display = isNewRecord ? 'block' : 'none';
      }

      const coinsEarnedElement = document.getElementById('yt-shooting-coins-earned');
      if (coinsEarnedElement) {
        coinsEarnedElement.textContent = `💰 COINS EARNED: ${coinsEarned}`;
      }

      this.gameOverPanel.style.display = 'flex';
    }

    this.hideGameControls();
  }

  /**
   * ゲームクリア画面を表示
   * @param {number} finalScore
   * @param {boolean} isNewRecord
   * @param {number} coinsEarned
   * @param {string} difficulty
   * @param {number} kills
   */
  showGameClear(finalScore, isNewRecord = false, coinsEarned = 0, difficulty = 'normal', kills = 0) {
    // 共有用に情報を保存
    this.currentGameInfo = {
      score: finalScore,
      difficulty: difficulty,
      kills: kills,
      wasCleared: true
    };

    if (this.gameClearPanel) {
      document.getElementById('yt-shooting-clear-score').textContent = finalScore.toString();

      const newRecordNotice = document.getElementById('yt-shooting-clear-record');
      if (newRecordNotice) {
        newRecordNotice.style.display = isNewRecord ? 'block' : 'none';
      }

      const coinsEarnedElement = document.getElementById('yt-shooting-clear-coins-earned');
      if (coinsEarnedElement) {
        coinsEarnedElement.textContent = `💰 COINS EARNED: ${coinsEarned}`;
      }

      this.gameClearPanel.style.display = 'flex';
    }

    this.hideGameControls();
  }

  /**
   * ゲームコントロールを表示
   */
  showGameControls() {
    this.startButton.style.display = 'none';
    this.pauseButton.style.display = 'inline-block';
    this.exitButton.style.display = 'inline-block';

    // ゲーム開始時にパネルを表示
    if (this.statsPanel) {
      this.statsPanel.style.cssText = this.statsPanel.style.cssText.replace('display: none', 'display: block');
    }
    if (this.livesPanel) {
      this.livesPanel.style.cssText = this.livesPanel.style.cssText.replace('display: none', 'display: block');
    }
    console.log('[UI] ゲームUI表示');
  }

  /**
   * ゲームコントロールを非表示
   */
  hideGameControls() {
    this.pauseButton.style.display = 'none';
    this.resumeButton.style.display = 'none';
    this.exitButton.style.display = 'none';
  }

  /**
   * コントロールをリセット
   */
  resetControls() {
    this.startButton.style.display = 'inline-block';
    this.pauseButton.style.display = 'none';
    this.resumeButton.style.display = 'none';
    this.exitButton.style.display = 'none';

    // パネルを非表示に戻す
    if (this.statsPanel) {
      this.statsPanel.style.cssText = this.statsPanel.style.cssText.replace('display: block', 'display: none');
    }
    if (this.livesPanel) {
      this.livesPanel.style.cssText = this.livesPanel.style.cssText.replace('display: block', 'display: none');
    }
    console.log('[UI] ゲームUI非表示');
  }

  /**
   * UI を表示
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * UI を非表示
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * 実績通知を表示
   * @param {Object} achievement - 実績オブジェクト
   */
  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-text">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
      <button class="achievement-share-btn" title="Share on X">🐦</button>
    `;

    this.container.appendChild(notification);

    // 共有ボタンのイベントリスナー
    const shareBtn = notification.querySelector('.achievement-share-btn');
    shareBtn.addEventListener('click', () => {
      this.shareManager.shareAchievement(achievement);
    });

    // アニメーション: 右からスライドイン
    setTimeout(() => notification.classList.add('show'), 10);

    // 5秒後にスライドアウトして削除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 5000);

    console.log('[UI] 実績通知表示:', achievement.name);
  }

  /**
   * UI を削除
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_GameUI = GameUI;
}
