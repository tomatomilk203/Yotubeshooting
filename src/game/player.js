/**
 * プレイヤー（自機）クラス
 */

class Player {
  constructor(x, y, skinId = 'default') {
    this.config = window.YT_SHOOTING_CONFIG;
    this.x = x;
    this.y = y;
    this.width = this.config.PLAYER_SIZE;
    this.height = this.config.PLAYER_SIZE;
    this.speed = this.config.PLAYER_SPEED;

    // 無敵状態
    this.isInvincible = false;
    this.invincibleTimer = 0;

    // 弾幕システム
    this.bullets = [];
    this.maxBullets = 1; // 初期は1発、赤文字を倒すと増える
    this.shootCooldown = 0;
    this.shootInterval = 150; // 150ミリ秒ごとに発射可能

    // スキンシステム
    this.skinManager = new window.YT_SkinManager();
    this.skinId = skinId;
    this.currentSkin = this.skinManager.getSkin(skinId);
    if (!this.currentSkin) {
      console.warn(`[Player] スキン '${skinId}' が見つかりません。デフォルトスキンを使用します。`);
      this.skinId = 'default';
      this.currentSkin = this.skinManager.getSkin('default');
    }

    // 見た目（後方互換性のため残す）
    this.color = this.currentSkin.color;
    this.angle = 0; // 進行方向
  }

  /**
   * プレイヤーの更新処理
   * @param {number} deltaTime - 前フレームからの経過時間（ミリ秒）
   * @param {Object} input - 入力状態
   * @param {Object} bounds - 画面境界 {width, height}
   */
  update(deltaTime, input, bounds) {
    // 無敵時間の更新
    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.invincibleTimer = 0;
      }
    }

    // 射撃クールダウン更新
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }

    // 自動射撃(常に発射)
    if (this.shootCooldown <= 0) {
      this.shoot();
      this.shootCooldown = this.shootInterval;
    }

    // キーボード入力での移動
    if (input.controlType === 'keyboard') {
      let dx = 0;
      let dy = 0;

      if (input.up) dy -= 1;
      if (input.down) dy += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;

      // 斜め移動の速度を正規化
      if (dx !== 0 && dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx /= magnitude;
        dy /= magnitude;
      }

      this.x += dx * this.speed;
      this.y += dy * this.speed;

      // 角度を更新（見た目用）
      if (dx !== 0 || dy !== 0) {
        this.angle = Math.atan2(dy, dx);
      }
    }

    // マウス入力での移動（スムーズ追従）
    if (input.controlType === 'mouse' && input.mouseX !== null && input.mouseY !== null) {
      const dx = input.mouseX - this.x;
      const dy = input.mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // マウスに向かってスムーズに移動
      if (distance > 5) {
        const moveSpeed = Math.min(this.speed, distance / 10);
        this.x += (dx / distance) * moveSpeed;
        this.y += (dy / distance) * moveSpeed;

        // 角度を更新
        this.angle = Math.atan2(dy, dx);
      }
    }

    // 画面外に出ないように制限
    this.x = Math.max(this.width / 2, Math.min(bounds.width - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(bounds.height - this.height / 2, this.y));

    // プレイヤー弾の更新
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // 画面外に出たら削除
      if (bullet.x > bounds.width + 50 || bullet.x < -50 ||
          bullet.y > bounds.height + 50 || bullet.y < -50) {
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * 弾を発射
   */
  shoot() {
    // maxBullets分だけ発射
    for (let i = 0; i < this.maxBullets; i++) {
      let angle = 0; // 右向き

      // 複数弾の場合は扇状に広がる
      if (this.maxBullets > 1) {
        const spread = Math.PI / 6; // 30度の扇
        const step = spread / (this.maxBullets - 1);
        angle = -spread / 2 + step * i;
      }

      this.bullets.push({
        x: this.x + this.width / 2,
        y: this.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        radius: 3,
        color: '#ffff00', // 黄色（見やすい）
        damage: 1
      });
    }
  }

  /**
   * プレイヤー弾を増やす(赤文字を倒した時)
   */
  increaseBullets() {
    this.maxBullets = Math.min(this.maxBullets + 1, 5); // 最大5発
  }

  /**
   * プレイヤーの描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 無敵時間中は点滅
    if (this.isInvincible) {
      const blinkRate = Math.floor(this.invincibleTimer / 100) % 2;
      if (blinkRate === 0) {
        return;
      }
    }

    // スキンを使用して描画
    this.skinManager.renderSkin(
      ctx,
      this.currentSkin,
      this.x,
      this.y,
      this.angle,
      this.width,
      this.height
    );

    // プレイヤー弾を描画
    this.bullets.forEach(bullet => {
      ctx.save();
      ctx.fillStyle = bullet.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // デバッグモード時に当たり判定を表示
    if (this.config.DEBUG) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * プレイヤー弾を取得
   * @returns {Array}
   */
  getBullets() {
    return this.bullets;
  }

  /**
   * プレイヤー弾を削除
   * @param {number} index
   */
  removeBullet(index) {
    if (index >= 0 && index < this.bullets.length) {
      this.bullets.splice(index, 1);
    }
  }

  /**
   * 当たり判定用の境界を取得
   * @returns {Object} {x, y, width, height}
   */
  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  /**
   * ダメージ処理
   * @returns {boolean} ダメージを受けたかどうか
   */
  takeDamage() {
    if (this.isInvincible) {
      return false;
    }

    this.isInvincible = true;
    this.invincibleTimer = this.config.INVINCIBLE_TIME;
    return true;
  }

  /**
   * 位置をリセット
   * @param {number} x
   * @param {number} y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.isInvincible = true;
    this.invincibleTimer = this.config.INVINCIBLE_TIME;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_Player = Player;
}
