/**
 * スキン管理モジュール
 * プレイヤーの外見をカスタマイズ
 */

class SkinManager {
  constructor() {
    this.skins = this.defineSkins();
  }

  /**
   * スキン定義
   * @returns {Object}
   */
  defineSkins() {
    return {
      default: {
        id: 'default',
        name: 'Classic Green',
        description: 'The original player design',
        color: '#00ff00',
        shape: 'triangle',
        cost: 0,
        achievementId: null
      },
      red_triangle: {
        id: 'red_triangle',
        name: 'Crimson Blade',
        description: 'A fierce red warrior',
        color: '#ff0000',
        shape: 'triangle',
        cost: 500,
        achievementId: 'score_10000'
      },
      gold_star: {
        id: 'gold_star',
        name: 'Golden Star',
        description: 'Legendary star form',
        color: '#ffd700',
        shape: 'star',
        cost: 1000,
        achievementId: 'clear_hell'
      }
    };
  }

  /**
   * スキンIDが存在するかチェック
   * @param {string} skinId
   * @returns {boolean}
   */
  isValidSkin(skinId) {
    return this.skins.hasOwnProperty(skinId);
  }

  /**
   * スキンを取得
   * @param {string} skinId
   * @returns {Object|null}
   */
  getSkin(skinId) {
    return this.skins[skinId] || null;
  }

  /**
   * スキンをレンダリング
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} skin - スキンオブジェクト
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @param {number} angle - 回転角度（ラジアン）
   * @param {number} width - 幅
   * @param {number} height - 高さ
   */
  renderSkin(ctx, skin, x, y, angle, width, height) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (skin.shape === 'triangle') {
      this.renderTriangle(ctx, skin.color, width, height);
    } else if (skin.shape === 'star') {
      this.renderStar(ctx, skin.color, width, height);
    }

    ctx.restore();
  }

  /**
   * 三角形を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} color
   * @param {number} width
   * @param {number} height
   */
  renderTriangle(ctx, color, width, height) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0); // 上の頂点
    ctx.lineTo(-width / 2, height / 3); // 左下
    ctx.lineTo(-width / 2, -height / 3); // 左上
    ctx.closePath();
    ctx.fill();

    // 白い縁取り
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /**
   * 星形を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} color
   * @param {number} width
   * @param {number} height
   */
  renderStar(ctx, color, width, height) {
    const spikes = 5;
    const outerRadius = width / 2;
    const innerRadius = width / 4;

    ctx.fillStyle = color;
    ctx.beginPath();

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = radius * Math.cos(angle);
      const py = radius * Math.sin(angle);

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fill();

    // 白い縁取り
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 中心に小さい円を描画（星の中心装飾）
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius / 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 全スキンの配列を取得
   * @returns {Array<Object>}
   */
  getAllSkins() {
    return Object.values(this.skins);
  }

  /**
   * スキンがコインで購入可能かチェック
   * @param {string} skinId
   * @param {number} currentCoins
   * @returns {boolean}
   */
  canAffordSkin(skinId, currentCoins) {
    const skin = this.getSkin(skinId);
    if (!skin) return false;
    return currentCoins >= skin.cost;
  }

  /**
   * スキンが実績で解除可能かチェック
   * @param {string} skinId
   * @param {Object} achievements - 実績データ
   * @returns {boolean}
   */
  isUnlockedByAchievement(skinId, achievements) {
    const skin = this.getSkin(skinId);
    if (!skin || !skin.achievementId) return false;
    return achievements[skin.achievementId]?.unlocked || false;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_SkinManager = SkinManager;
}
