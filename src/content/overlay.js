/**
 * Canvas オーバーレイ管理
 */

class CanvasOverlay {
  constructor() {
    this.config = window.YT_SHOOTING_CONFIG;
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
    this.videoPlayer = null;
  }

  /**
   * オーバーレイを初期化
   * @returns {boolean} 成功したかどうか
   */
  init() {
    // YouTube動画プレイヤーを取得
    this.videoPlayer = document.querySelector('#movie_player') ||
                       document.querySelector('.html5-video-player');

    if (!this.videoPlayer) {
      console.error('[Overlay] YouTube動画プレイヤーが見つかりません');
      return false;
    }

    // Canvasを作成
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'yt-shooting-overlay';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // マウスイベントを透過
    this.canvas.style.zIndex = this.config.CANVAS_Z_INDEX.toString();

    // コンテキストを取得
    this.ctx = this.canvas.getContext('2d');

    // サイズを設定
    this.resize();

    // 動画プレイヤーに追加
    this.videoPlayer.style.position = 'relative';
    this.videoPlayer.appendChild(this.canvas);

    // リサイズ監視
    this.setupResizeObserver();

    this.isActive = false;
    console.log('[Overlay] オーバーレイを初期化しました');
    return true;
  }

  /**
   * リサイズ監視を設定
   */
  setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this.resize();
    });

    if (this.videoPlayer) {
      resizeObserver.observe(this.videoPlayer);
    }
  }

  /**
   * Canvas のサイズを動画プレイヤーに合わせる
   */
  resize() {
    if (!this.videoPlayer || !this.canvas) return;

    const rect = this.videoPlayer.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    console.log(`[Overlay] Canvas サイズ変更: ${rect.width}x${rect.height}`);
  }

  /**
   * オーバーレイを表示
   */
  show() {
    if (this.canvas) {
      this.canvas.style.display = 'block';
      this.isActive = true;
    }
  }

  /**
   * オーバーレイを非表示
   */
  hide() {
    if (this.canvas) {
      this.canvas.style.display = 'none';
      this.isActive = false;
    }
  }

  /**
   * Canvas をクリア
   */
  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * 半透明な背景を描画（オプション）
   */
  drawBackground() {
    if (this.ctx && this.canvas) {
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.config.BACKGROUND_ALPHA})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * 描画コンテキストを取得
   * @returns {CanvasRenderingContext2D|null}
   */
  getContext() {
    return this.ctx;
  }

  /**
   * Canvas 要素を取得
   * @returns {HTMLCanvasElement|null}
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Canvas のサイズを取得
   * @returns {Object} {width, height}
   */
  getSize() {
    if (this.canvas) {
      return {
        width: this.canvas.width,
        height: this.canvas.height
      };
    }
    return { width: 0, height: 0 };
  }

  /**
   * オーバーレイを削除
   */
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.isActive = false;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_CanvasOverlay = CanvasOverlay;
}
