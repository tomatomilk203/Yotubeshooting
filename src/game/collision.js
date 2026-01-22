/**
 * 当たり判定処理モジュール
 */

class CollisionDetector {
  /**
   * 矩形同士の衝突判定（AABB）
   * @param {Object} rect1 - {x, y, width, height}
   * @param {Object} rect2 - {x, y, width, height}
   * @returns {boolean}
   */
  static checkRectCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * 円同士の衝突判定
   * @param {Object} circle1 - {x, y, radius}
   * @param {Object} circle2 - {x, y, radius}
   * @returns {boolean}
   */
  static checkCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
  }

  /**
   * 矩形と円の衝突判定
   * @param {Object} rect - {x, y, width, height}
   * @param {Object} circle - {x, y, radius}
   * @returns {boolean}
   */
  static checkRectCircleCollision(rect, circle) {
    // 矩形の最も近い点を見つける
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // 円の中心からその点までの距離を計算
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < circle.radius;
  }

  /**
   * プレイヤーと弾幕の衝突判定
   * @param {Object} player - Player インスタンス
   * @param {Object} bullet - Bullet オブジェクト
   * @returns {boolean}
   */
  static checkPlayerBulletCollision(player, bullet) {
    if (!player || !bullet) return false;
    if (player.isInvincible) return false;

    // プレイヤーの当たり判定を矩形として扱う
    const playerRadius = player.width / 6;
    const playerBoxSize = playerRadius * 2;
    const playerRect = {
      x: player.x - playerBoxSize / 2,
      y: player.y - playerBoxSize / 2,
      width: playerBoxSize,
      height: playerBoxSize
    };

    // 弾幕の当たり判定を文字全体の矩形として扱う
    const config = window.YT_SHOOTING_CONFIG;
    const fontSize = config.BULLET.BASE_FONT_SIZE * bullet.size;

    // 文字の幅と高さを計算（概算）
    const charWidth = fontSize * 0.6; // 日本語文字の平均幅
    const textWidth = (bullet.text[0] || '').length * charWidth;
    const textHeight = fontSize * bullet.text.length + (bullet.text.length - 1) * 5;

    const bulletRect = {
      x: bullet.x,
      y: bullet.y,
      width: textWidth,
      height: textHeight
    };

    return this.checkRectCollision(playerRect, bulletRect);
  }

  /**
   * 点が矩形内にあるか判定
   * @param {number} x
   * @param {number} y
   * @param {Object} rect - {x, y, width, height}
   * @returns {boolean}
   */
  static isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  /**
   * 点が円内にあるか判定
   * @param {number} x
   * @param {number} y
   * @param {Object} circle - {x, y, radius}
   * @returns {boolean}
   */
  static isPointInCircle(x, y, circle) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle.radius;
  }

  /**
   * 複数の弾幕との衝突をチェック
   * @param {Object} player - Player インスタンス
   * @param {Array} bullets - Bullet オブジェクトの配列
   * @returns {Array} 衝突した弾幕のインデックス配列
   */
  static checkPlayerBulletsCollisions(player, bullets) {
    const collisions = [];

    for (let i = 0; i < bullets.length; i++) {
      if (this.checkPlayerBulletCollision(player, bullets[i])) {
        collisions.push(i);
      }
    }

    return collisions;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_CollisionDetector = CollisionDetector;
}
