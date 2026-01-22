/**
 * ゲームループ・状態管理
 */

class Game {
  constructor(overlay, ui, videoId) {
    this.config = window.YT_SHOOTING_CONFIG;
    this.overlay = overlay;
    this.ui = ui;
    this.videoId = videoId;

    // ゲーム状態
    this.state = 'idle'; // 'idle', 'playing', 'paused', 'gameover'
    this.score = 0;
    this.lives = this.config.INITIAL_LIVES;
    this.difficulty = 'normal';

    // ゲームオブジェクト
    this.player = null;
    this.danmakuEngine = null;
    this.collisionDetector = window.YT_CollisionDetector;

    // API・解析
    this.youtubeAPI = new window.YT_YouTubeAPI();
    this.aiAnalyzer = new window.YT_AIAnalyzer();
    this.storageManager = new window.YT_StorageManager();
    this.soundManager = new window.YT_SoundManager();
    this.achievementManager = new window.YT_AchievementManager(this.storageManager);

    // ループ制御
    this.lastTime = 0;
    this.animationFrameId = null;

    // 入力状態
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      mouseX: null,
      mouseY: null,
      controlType: 'mouse' // または 'keyboard'
    };

    // コメントデータ
    this.comments = [];
    this.aiParams = [];
    this.commentQueue = []; // 出現待ちコメントキュー
    this.spawnTimer = 0; // 次のコメント出現までの時間
    this.spawnInterval = 1000; // コメント出現間隔(ミリ秒)
    this.killCount = 0; // 倒した敵の数
    this.bossSpawned = false; // ボスが出現したか
    this.damageTaken = false; // ダメージを受けたか（ノーダメージ実績用）

    // ボス用の白文字弾幕タイマー
    this.bossWhiteTextTimer = 0;
    this.bossWhiteTextInterval = 5000; // 5秒間隔
    this.bossText = ''; // ボスのテキストを保存

    // ボス警告表示用
    this.bossWarningActive = false;
    this.bossWarningTimer = 0;
    this.bossWarningDuration = 3000; // 3秒間表示
    this.bossSpawnTimeout = null; // ボス出現タイマーID

    // 30秒毎の無敵弾幕タイマー
    this.massBarrageTimeout = null;
    this.massBarrageInterval = 30000; // 30秒

    this.setupInputHandlers();
  }

  /**
   * ゲーム開始
   * @param {string} difficulty - 'easy', 'normal', 'hard'
   */
  async start(difficulty = 'normal') {
    console.log(`[Game] ゲーム開始 - 難易度: ${difficulty}`);

    // グローバルに自身を登録（弾幕がプレイヤー位置を参照するため）
    window.currentGame = this;

    this.difficulty = difficulty;
    this.state = 'playing';
    this.score = 0;
    this.lives = this.config.INITIAL_LIVES;
    this.killCount = 0; // リセット
    this.bossSpawned = false; // リセット
    this.bossWarningActive = false; // リセット
    this.bossWarningTimer = 0; // リセット
    this.damageTaken = false; // リセット（ノーダメージ実績用）

    // ボス出現タイマーをキャンセル（前回のゲームから残っている場合）
    if (this.bossSpawnTimeout) {
      clearTimeout(this.bossSpawnTimeout);
      this.bossSpawnTimeout = null;
    }

    // 難易度に応じた出現間隔を設定
    this.spawnInterval = this.config.DIFFICULTY[difficulty].spawnInterval;

    // Canvas サイズを取得
    const canvasSize = this.overlay.getSize();

    // 選択中のスキンを取得
    const selectedSkinId = await this.storageManager.getSelectedSkin();
    console.log(`[Game] 選択中のスキン: ${selectedSkinId}`);

    // プレイヤーを初期化（弾数もリセット）
    this.player = new window.YT_Player(
      canvasSize.width / 2,
      canvasSize.height / 2,
      selectedSkinId
    );

    // 弾幕エンジンを初期化
    this.danmakuEngine = new window.YT_DanmakuEngine(
      canvasSize.width,
      canvasSize.height
    );

    // コメントをロード
    await this.loadComments();

    // UI を更新
    this.ui.updateScore(this.score);
    this.ui.updateLives(this.lives);

    // オーバーレイを表示
    this.overlay.show();

    // 30秒毎の無敵弾幕タイマーを開始
    this.startMassBarrageTimer();

    // ゲームループ開始
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /**
   * 30秒毎の無敵弾幕タイマーを開始
   */
  startMassBarrageTimer() {
    // 既存のタイマーをクリア
    if (this.massBarrageTimeout) {
      clearTimeout(this.massBarrageTimeout);
    }

    const scheduleNextBarrage = () => {
      this.massBarrageTimeout = setTimeout(() => {
        if (this.state === 'playing' && this.danmakuEngine) {
          this.danmakuEngine.spawnMassBarrage();
          scheduleNextBarrage(); // 次の30秒をスケジュール
        }
      }, this.massBarrageInterval);
    };

    scheduleNextBarrage();
    console.log('[Game] 30秒弾幕タイマー開始');
  }

  /**
   * コメントをロードして弾幕化
   */
  async loadComments() {
    console.log('[Game] コメントをロード中...');

    // YouTube API でコメントを取得
    const comments = await this.youtubeAPI.fetchComments(
      this.videoId,
      this.config.MAX_COMMENTS
    );

    if (comments.length > 0) {
      this.comments = comments;
      console.log(`[Game] ${comments.length} 件のコメントを取得しました`);
    } else {
      // コメントが少ない場合は AI 生成
      console.log('[Game] コメントが少ないため AI 生成モードを使用します');
      this.comments = this.aiAnalyzer.generateAIComments(
        this.config.AI_COMMENT_COUNT
      );
    }

    // AI でコメントを解析
    this.aiParams = this.aiAnalyzer.analyzeBatch(this.comments);

    // コメントをキューに追加(時間差で出現させる)
    this.commentQueue = [];
    for (let i = 0; i < this.comments.length; i++) {
      const aiParam = this.aiParams[i];

      // HELL難易度の場合、下位10%コメントのみをフィルタ
      if (this.difficulty === 'hell') {
        // 総合的なネガティブ判定を使用
        if (this.aiAnalyzer.isNegativeComment(this.comments[i], aiParam, this.comments)) {
          this.commentQueue.push({
            comment: this.comments[i],
            aiParam: aiParam
          });
        }
      } else {
        this.commentQueue.push({
          comment: this.comments[i],
          aiParam: aiParam
        });
      }
    }

    // ログ出力
    if (this.difficulty === 'hell') {
      console.log(`[Game] HELL難易度: 全${this.comments.length}件中、${this.commentQueue.length}件の下位10%コメントをキューに追加（使い回しなし）`);
    } else {
      console.log(`[Game] ${this.commentQueue.length} 件のコメントをキューに追加しました`);
    }
  }

  /**
   * メインゲームループ
   * @param {number} timestamp
   */
  gameLoop(timestamp) {
    if (this.state !== 'playing') {
      return;
    }

    // Delta time を計算（ミリ秒）
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // 更新処理
    this.update(deltaTime);

    // 描画処理
    this.render();

    // 次のフレームをリクエスト
    this.animationFrameId = requestAnimationFrame((ts) => this.gameLoop(ts));
  }

  /**
   * 更新処理
   * @param {number} deltaTime - ミリ秒
   */
  update(deltaTime) {
    const canvasSize = this.overlay.getSize();
    const difficultySettings = this.config.DIFFICULTY[this.difficulty];

    // 難易度別のボス出現条件
    const bossThreshold = this.difficulty === 'easy' ? 40 : this.difficulty === 'normal' ? 60 : 100;
    if (this.killCount >= bossThreshold && !this.bossSpawned) {
      // ボス警告を表示
      this.bossWarningActive = true;
      this.bossWarningTimer = 0;
      console.log('[Game] BOSS COMING 警告を表示開始');

      // 3秒後にボス出現（タイマーIDを保存）
      this.bossSpawnTimeout = setTimeout(() => {
        if (this.state === 'playing') { // ゲーム実行中のみ出現
          this.spawnBoss();
          console.log('[Game] ボス出現');
        }
        this.bossSpawnTimeout = null;
      }, this.bossWarningDuration);

      // 二重実行を防ぐため、先にフラグを立てる
      this.bossSpawned = true;
    }

    // ボス警告タイマー更新
    if (this.bossWarningActive) {
      this.bossWarningTimer += deltaTime;
      if (this.bossWarningTimer >= this.bossWarningDuration) {
        this.bossWarningActive = false;
      }
    }

    // ボスが出現したら5秒ごとに白文字を画面埋め尽くす
    if (this.bossSpawned && this.bossText) {
      this.bossWhiteTextTimer += deltaTime;
      if (this.bossWhiteTextTimer >= this.bossWhiteTextInterval) {
        this.spawnBossWhiteText(canvasSize);
        this.bossWhiteTextTimer = 0;
      }
    }

    // キューが空になったら再補充（ループ）、シャッフルして順序をランダム化
    if (this.commentQueue.length === 0 && this.comments.length > 0) {
      console.log(`[Game] コメントキューが空になったため、再補充します`);

      // インデックス配列を作成してシャッフル
      const indices = Array.from({length: this.comments.length}, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      // シャッフルされた順序でキューに追加
      for (const i of indices) {
        const aiParam = this.aiParams[i];

        // HELL難易度の場合、下位10%コメントのみをフィルタ
        if (this.difficulty === 'hell') {
          if (this.aiAnalyzer.isNegativeComment(this.comments[i], aiParam, this.comments)) {
            this.commentQueue.push({
              comment: this.comments[i],
              aiParam: aiParam
            });
          }
        } else {
          this.commentQueue.push({
            comment: this.comments[i],
            aiParam: aiParam
          });
        }
      }
      console.log(`[Game] ${this.commentQueue.length}件のコメントをシャッフルしてキューに再追加しました`);
    }

    // コメント出現処理(時間差で少しずつ) - 出現数を減らす
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval && this.commentQueue.length > 0) {
      // 画面内の弾幕数を確認（最大20ワードに制限）
      const currentBulletCount = this.danmakuEngine.getBullets().length;

      // 50%の確率で出現させる（出現数を半分に） & 最大20ワードまで
      if (Math.random() < 0.5 && currentBulletCount < 20) {
        let item = this.commentQueue.shift();

        const bullet = this.danmakuEngine.createBulletFromComment(
          item.comment,
          item.aiParam,
          this.difficulty
        );

        // nullでない場合のみ追加（HELL難易度で灰色がnullになる場合がある）
        if (bullet) {
          this.danmakuEngine.addBullet(bullet);
        }
      }
      this.spawnTimer = 0;
    }

    // プレイヤー更新
    this.player.update(deltaTime, this.input, canvasSize);

    // 弾幕更新
    this.danmakuEngine.update(deltaTime, difficultySettings);

    // 当たり判定
    this.checkCollisions();
  }

  /**
   * 当たり判定処理
   */
  checkCollisions() {
    const enemyBullets = this.danmakuEngine.getBullets();
    const playerBullets = this.player.getBullets();

    // プレイヤー弾 vs 敵文字
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const pBullet = playerBullets[i];

      for (let j = enemyBullets.length - 1; j >= 0; j--) {
        const eBullet = enemyBullets[j];

        // 文字全体の当たり判定（矩形）
        const fontSize = this.config.BULLET.BASE_FONT_SIZE * eBullet.size;
        const charWidth = fontSize * 0.6;
        const textWidth = (eBullet.text[0] || '').length * charWidth;
        const textHeight = fontSize * eBullet.text.length + (eBullet.text.length - 1) * 5;

        // プレイヤー弾が敵文字の矩形内にあるか判定
        const hit = pBullet.x >= eBullet.x &&
                    pBullet.x <= eBullet.x + textWidth &&
                    pBullet.y >= eBullet.y &&
                    pBullet.y <= eBullet.y + textHeight;

        if (hit) { // 当たり判定の範囲
          // 無敵弾幕の場合は弾だけ消してダメージなし
          if (eBullet.invincible) {
            this.player.removeBullet(i);
            break; // 次のプレイヤー弾へ
          }

          // プレイヤー弾を削除
          this.player.removeBullet(i);

          // 敵文字にダメージ & 点滅
          eBullet.hp -= pBullet.damage;
          eBullet.hitFlash = 200; // 200ミリ秒点滅

          // SE: 敵被弾
          this.soundManager.play('enemyHit');

          if (eBullet.hp <= 0) {
            // 敵文字を破壊
            const points = eBullet.scoreValue || 10;
            this.score += points;
            this.killCount++; // 倒した数をカウント
            this.ui.updateScore(this.score);
            this.ui.updateKills(this.killCount);
            console.log(`[Game] 敵撃破! +${points}点 (合計: ${this.score}, 倒した数: ${this.killCount})`);

            // ボス以外は削除
            if (!eBullet.isBoss) {
              // SE: 敵撃破
              this.soundManager.play('enemyDefeat');
              this.danmakuEngine.bullets.splice(j, 1);
            } else {
              // SE: ボス撃破
              this.soundManager.play('bossDefeat');
              this.danmakuEngine.bullets.splice(j, 1);
              console.log('[Game] ボス撃破！ゲームクリア！');

              // ゲームクリア処理
              this.gameClear();
              return; // ゲームクリア後は処理を中断
            }

            // 10個倒すごとにプレイヤー強化
            if (this.killCount % 10 === 0) {
              this.player.increaseBullets();
              // SE: パワーアップ
              this.soundManager.play('hit');
              console.log('[Game] 10個撃破！弾数増加!');
            }

            // 色別の特殊効果
            if (eBullet.colorType === 'green') {
              // 緑: 回復
              this.lives = Math.min(this.lives + 1, 5);
              this.ui.updateLives(this.lives);
              // SE: 回復
              this.soundManager.play('heal');
              console.log('[Game] 回復! ライフ+1');
            }
          }
          console.log(`[Game] ヒット! 敵HP: ${eBullet.hp}/${eBullet.maxHp}`);

          break;
        }
      }
    }

    // プレイヤー vs 敵文字（ボスを含む全ての敵）
    const collisionIndices = this.collisionDetector.checkPlayerBulletsCollisions(
      this.player,
      enemyBullets
    );

    if (collisionIndices.length > 0) {
      // プレイヤーがダメージを受ける
      const damaged = this.player.takeDamage();

      if (damaged) {
        this.lives--;
        this.damageTaken = true; // ノーダメージ実績用フラグ
        this.ui.updateLives(this.lives);

        // SE: 自分被弾
        this.soundManager.play('damage');

        console.log(`[Game] ダメージ! 残機: ${this.lives}`);

        // ゲームオーバー判定
        if (this.lives <= 0) {
          this.gameOver();
        }

        // 衝突した敵文字を削除(黄色の場合のみ、ボスは削除しない)
        collisionIndices.sort((a, b) => b - a); // 降順ソート
        collisionIndices.forEach(index => {
          if (enemyBullets[index] && enemyBullets[index].colorType === 'yellow') {
            this.danmakuEngine.bullets.splice(index, 1);
          }
          // ボスとの衝突はログ出力
          if (enemyBullets[index] && enemyBullets[index].isBoss) {
            console.log('[Game] ボスに接触！ダメージを受けた');
          }
        });
      }
    }
  }

  /**
   * ボスを出現させる
   */
  spawnBoss() {
    console.log('[Game] ボス出現！50個撃破達成');

    // SE: ボス登場
    this.soundManager.play('bossAppear');

    // 実際のコメントから最もいいねが多いコメントを取得（最大100文字）
    let bossText = 'ボス登場！これが最後の戦いだ！全ての力を使って倒せ！';

    if (this.comments && this.comments.length > 0) {
      // いいね数でソートして最も人気のコメントを取得
      const sortedComments = [...this.comments].sort((a, b) => b.likeCount - a.likeCount);
      const topComment = sortedComments[0];

      if (topComment && topComment.text) {
        // 最大100文字に制限
        bossText = topComment.text.substring(0, 100);
      }
    }

    // ボスのテキストを保存
    this.bossText = bossText;

    // ボス用のコメントを生成
    const bossComment = {
      id: `boss_${Date.now()}`,
      text: bossText,
      author: 'BOSS',
      likeCount: 9999
    };

    const bossAiParam = {
      emotion: 'boss',
      color: '#ff0000',
      size: 1.0,
      pattern: 'straight'
    };

    const bossBullet = this.danmakuEngine.createBulletFromComment(
      bossComment,
      bossAiParam,
      this.difficulty
    );

    if (bossBullet) {
      this.danmakuEngine.addBullet(bossBullet);
    }
  }

  /**
   * ボスと同じ白文字を画面に埋め尽くす
   */
  spawnBossWhiteText(canvasSize) {
    // 画面の高さを20等分して、各位置から白文字を出現させる（画面を埋め尽くす量）
    const rowCount = 20;
    for (let i = 0; i < rowCount; i++) {
      const yPosition = (canvasSize.height / rowCount) * i + Math.random() * 20;

      const whiteTextComment = {
        id: `boss_white_${Date.now()}_${i}`,
        text: this.bossText,
        author: 'Boss Attack',
        likeCount: 0
      };

      const whiteTextAiParam = {
        emotion: 'neutral',
        color: '#ffffff',
        size: 0.8, // 通常サイズ
        pattern: 'straight'
      };

      const whiteTextBullet = this.danmakuEngine.createBulletFromComment(
        whiteTextComment,
        whiteTextAiParam,
        this.difficulty
      );

      if (whiteTextBullet) {
        // 右端から出現、指定のY位置に配置
        whiteTextBullet.y = yPosition;

        // ボスの白文字弾幕は無敵（倒せない）
        whiteTextBullet.invincible = true;
        whiteTextBullet.hp = Infinity;

        this.danmakuEngine.addBullet(whiteTextBullet);
      }
    }

    console.log('[Game] ボスの白文字弾幕を20個発射！');
  }

  /**
   * 描画処理
   */
  render() {
    const ctx = this.overlay.getContext();
    if (!ctx) return;

    // Canvas をクリア
    this.overlay.clear();

    // 弾幕を描画
    this.danmakuEngine.render(ctx);

    // プレイヤーを描画
    this.player.render(ctx);

    // ボス警告を描画（最前面）
    if (this.bossWarningActive) {
      this.renderBossWarning(ctx);
    }
  }

  /**
   * BOSS COMING 警告を描画
   * @param {CanvasRenderingContext2D} ctx
   */
  renderBossWarning(ctx) {
    const canvasSize = this.overlay.getSize();

    ctx.save();

    // 背景を半透明の赤で覆う（点滅効果）
    const alpha = 0.3 + Math.sin(this.bossWarningTimer / 100) * 0.2;
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // BOSS COMING テキスト
    const fontSize = Math.min(canvasSize.width, canvasSize.height) * 0.15;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // テキストの影（複数重ねて強調）
    ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#000000';
    ctx.fillText('BOSS COMING', canvasSize.width / 2, canvasSize.height / 2);

    // メインテキスト（白色）
    ctx.shadowBlur = 50;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BOSS COMING', canvasSize.width / 2, canvasSize.height / 2);

    ctx.restore();
  }

  /**
   * 当たり判定の枠線を描画（デバッグ用）
   * @param {CanvasRenderingContext2D} ctx
   */
  renderHitboxes(ctx) {
    ctx.save();

    // プレイヤーの当たり判定を■で囲む
    const playerRadius = this.player.width / 6; // collision.jsと同じ値
    const playerBoxSize = playerRadius * 2;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'; // 緑色
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.player.x - playerBoxSize / 2,
      this.player.y - playerBoxSize / 2,
      playerBoxSize,
      playerBoxSize
    );

    // 敵文字の当たり判定を■で囲む
    const enemyBullets = this.danmakuEngine.getBullets();
    enemyBullets.forEach(bullet => {
      // 文字のサイズを計算
      const fontSize = this.config.BULLET.BASE_FONT_SIZE * bullet.size;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(bullet.text[0] || '').width || fontSize * bullet.text[0].length;
      const textHeight = fontSize * bullet.text.length + (bullet.text.length - 1) * 5;

      // ボスは赤色、ボスの弾は橙色、通常敵は黄色
      if (bullet.isBoss) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'; // 赤色
      } else if (bullet.isBossBullet) {
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)'; // 橙色
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'; // 黄色
      }

      ctx.lineWidth = 2;

      // 文字全体を囲む矩形を描画
      ctx.strokeRect(
        bullet.x,
        bullet.y,
        textWidth,
        textHeight
      );
    });

    ctx.restore();
  }

  /**
   * ゲーム一時停止
   */
  pause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      console.log('[Game] ゲームを一時停止しました');
    }
  }

  /**
   * ゲーム再開
   */
  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
      console.log('[Game] ゲームを再開しました');
    }
  }

  /**
   * ゲーム終了
   */
  stop() {
    this.state = 'idle';

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // ボス出現タイマーをキャンセル
    if (this.bossSpawnTimeout) {
      clearTimeout(this.bossSpawnTimeout);
      this.bossSpawnTimeout = null;
    }

    // 30秒弾幕タイマーをキャンセル
    if (this.massBarrageTimeout) {
      clearTimeout(this.massBarrageTimeout);
      this.massBarrageTimeout = null;
    }

    this.overlay.hide();
    this.overlay.clear();

    console.log('[Game] ゲームを終了しました');
  }

  /**
   * ゲームオーバー処理
   */
  async gameOver() {
    this.state = 'gameover';

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // ボス出現タイマーをキャンセル
    if (this.bossSpawnTimeout) {
      clearTimeout(this.bossSpawnTimeout);
      this.bossSpawnTimeout = null;
    }

    // 30秒弾幕タイマーをキャンセル
    if (this.massBarrageTimeout) {
      clearTimeout(this.massBarrageTimeout);
      this.massBarrageTimeout = null;
    }

    console.log(`[Game] ゲームオーバー - スコア: ${this.score}`);

    // コイン計算
    const coinsEarned = Math.floor(this.score / 100);

    // 画面をクリア
    this.danmakuEngine.clear();
    this.overlay.clear();

    // ゲームオーバー画面を表示（まず表示）
    this.ui.showGameOver(this.score, false, coinsEarned, this.difficulty, this.killCount);

    // ハイスコア更新（非同期）
    this.storageManager.setHighScore(this.score).then(isNewRecord => {
      if (isNewRecord) {
        this.ui.updateHighScore(this.score);
        console.log('[Game] 新記録達成!');
      }
    });

    // コイン付与（非同期）
    this.storageManager.addCoins(coinsEarned).then(newTotal => {
      console.log(`[Game] コイン獲得: ${coinsEarned}枚 (合計: ${newTotal})`);
    });

    // ゲーム統計を更新（非同期）
    await this.storageManager.updateGameStats(this.score, this.killCount, false, this.difficulty);
    console.log(`[Game] ゲームオーバー統計更新完了 - kills: ${this.killCount}`);

    // 実績チェック（非同期）
    const newAchievements = await this.achievementManager.checkAchievements(
      this.score,
      this.killCount,
      false,
      this.difficulty
    );

    // 実績通知を表示（1秒後）
    if (newAchievements.length > 0) {
      setTimeout(() => {
        newAchievements.forEach((ach, index) => {
          setTimeout(() => {
            this.ui.showAchievementNotification(ach);
          }, index * 500); // 0.5秒ずつずらして表示
        });
      }, 1000);
    }

    // オーバーレイを非表示
    this.overlay.hide();
  }

  /**
   * ゲームクリア処理
   */
  async gameClear() {
    this.state = 'cleared';

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // ボス出現タイマーをキャンセル
    if (this.bossSpawnTimeout) {
      clearTimeout(this.bossSpawnTimeout);
      this.bossSpawnTimeout = null;
    }

    // 30秒弾幕タイマーをキャンセル
    if (this.massBarrageTimeout) {
      clearTimeout(this.massBarrageTimeout);
      this.massBarrageTimeout = null;
    }

    console.log(`[Game] ゲームクリア！ - スコア: ${this.score}`);

    // コイン計算
    const coinsEarned = Math.floor(this.score / 100);

    // 画面をクリア
    this.danmakuEngine.clear();
    this.overlay.clear();

    // ゲームクリア画面を表示（まず表示、後で非同期保存）
    this.ui.showGameClear(this.score, false, coinsEarned, this.difficulty, this.killCount);

    // ハイスコア更新（非同期）
    this.storageManager.setHighScore(this.score).then(isNewRecord => {
      if (isNewRecord) {
        this.ui.updateHighScore(this.score);
        console.log('[Game] 新記録達成!');
      }
    });

    // コイン付与（非同期）
    this.storageManager.addCoins(coinsEarned).then(newTotal => {
      console.log(`[Game] コイン獲得: ${coinsEarned}枚 (合計: ${newTotal})`);
    });

    // ノーダメージフラグを計算
    const noDamage = !this.damageTaken;

    // ゲーム統計を更新（非同期）- ノーダメージフラグも渡す
    await this.storageManager.updateGameStats(this.score, this.killCount, true, this.difficulty, noDamage);
    console.log(`[Game] ゲームクリア統計更新完了 - kills: ${this.killCount}, noDamage: ${noDamage}`);

    // 実績チェック（非同期）- クリア時はノーダメージフラグも渡す
    const newAchievements = await this.achievementManager.checkAchievements(
      this.score,
      this.killCount,
      true,
      this.difficulty,
      noDamage
    );
    console.log(`[Game] ノーダメージクリア: ${noDamage}`);

    // 実績通知を表示（1秒後）
    if (newAchievements.length > 0) {
      setTimeout(() => {
        newAchievements.forEach((ach, index) => {
          setTimeout(() => {
            this.ui.showAchievementNotification(ach);
          }, index * 500); // 0.5秒ずつずらして表示
        });
      }, 1000);
    }

    // オーバーレイを非表示
    this.overlay.hide();
  }

  /**
   * スコアを加算
   * @param {number} points
   */
  addScore(points) {
    this.score += points;
    this.ui.updateScore(this.score);
  }

  /**
   * 入力ハンドラを設定
   */
  setupInputHandlers() {
    // キーボード入力
    document.addEventListener('keydown', (e) => {
      if (this.state !== 'playing') return;

      let handled = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.input.up = true;
          this.input.controlType = 'keyboard';
          handled = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.input.down = true;
          this.input.controlType = 'keyboard';
          handled = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.input.left = true;
          this.input.controlType = 'keyboard';
          handled = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.input.right = true;
          this.input.controlType = 'keyboard';
          handled = true;
          break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    document.addEventListener('keyup', (e) => {
      if (this.state !== 'playing') return;

      let handled = false;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.input.up = false;
          handled = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.input.down = false;
          handled = true;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.input.left = false;
          handled = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.input.right = false;
          handled = true;
          break;
      }
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    // マウス入力
    const canvas = this.overlay.getCanvas();
    if (canvas) {
      canvas.addEventListener('mousemove', (e) => {
        if (this.state !== 'playing') return;

        const rect = canvas.getBoundingClientRect();
        this.input.mouseX = e.clientX - rect.left;
        this.input.mouseY = e.clientY - rect.top;
        this.input.controlType = 'mouse';
      });
    }
  }

  /**
   * 現在の状態を取得
   * @returns {string}
   */
  getState() {
    return this.state;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_Game = Game;
}
