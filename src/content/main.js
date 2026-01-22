/**
 * YouTube Shooting - メインエントリーポイント
 * コンテンツスクリプト
 */

(function() {
  'use strict';

  console.log('[YouTube Shooting] 拡張機能がロードされました');
  console.log('[YouTube Shooting] URL:', window.location.href);
  console.log('[YouTube Shooting] readyState:', document.readyState);

  // グローバル変数
  let overlay = null;
  let ui = null;
  let game = null;

  /**
   * 初期化処理
   */
  function init() {
    // YouTube 動画ページかチェック
    if (!isYouTubeVideoPage()) {
      console.log('[YouTube Shooting] YouTube 動画ページではありません');
      return;
    }

    // 動画 ID を取得
    const videoId = getVideoId();
    if (!videoId) {
      console.error('[YouTube Shooting] 動画 ID を取得できません');
      return;
    }

    console.log(`[YouTube Shooting] 動画 ID: ${videoId}`);

    // YouTubeプレイヤーの読み込みを待つ
    waitForYouTubePlayer(() => {
      console.log('[YouTube Shooting] YouTubeプレイヤー読み込み完了');
      setupGame(videoId);
    });
  }

  /**
   * YouTubeプレイヤーの読み込みを待つ
   * @param {Function} callback
   */
  function waitForYouTubePlayer(callback) {
    const maxAttempts = 50; // 最大5秒待つ（50回 × 100ms）
    let attempts = 0;

    const checkInterval = setInterval(() => {
      attempts++;

      // 動画プレイヤー要素を確認
      const player = document.querySelector('#movie_player');
      const videoElement = document.querySelector('video');

      if (player && videoElement) {
        clearInterval(checkInterval);
        // さらに少し待ってから初期化（YouTubeのUIが完全に描画されるまで）
        setTimeout(callback, 500);
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn('[YouTube Shooting] YouTubeプレイヤーの読み込みタイムアウト。強制的に初期化します。');
        clearInterval(checkInterval);
        callback();
      }
    }, 100);
  }

  /**
   * ゲームをセットアップ
   * @param {string} videoId
   */
  function setupGame(videoId) {
    console.log('[YouTube Shooting] ゲームセットアップ開始...');

    // 既存のUIをクリーンアップ
    if (ui) {
      console.log('[YouTube Shooting] 既存UIをクリーンアップ');
      ui.destroy();
      ui = null;
    }

    // オーバーレイを作成
    overlay = new window.YT_CanvasOverlay();
    if (!overlay.init()) {
      console.error('[YouTube Shooting] オーバーレイの初期化に失敗しました');
      return;
    }
    console.log('[YouTube Shooting] オーバーレイ初期化完了');

    // UI を作成
    ui = new window.YT_GameUI();
    ui.init();
    ui.show();
    console.log('[YouTube Shooting] UI初期化完了');

    // ゲームを作成
    game = new window.YT_Game(overlay, ui, videoId);
    console.log('[YouTube Shooting] ゲームインスタンス作成完了');

    // UI イベントをバインド
    ui.bindEvents({
      onStart: (difficulty) => {
        console.log(`[YouTube Shooting] ゲーム開始: ${difficulty}`);
        game.start(difficulty);
      },
      onPause: () => {
        console.log('[YouTube Shooting] ゲーム一時停止');
        game.pause();
      },
      onResume: () => {
        console.log('[YouTube Shooting] ゲーム再開');
        game.resume();
      },
      onExit: () => {
        console.log('[YouTube Shooting] ゲーム終了');
        game.stop();
        ui.resetControls();
      }
    });

    console.log('[YouTube Shooting] ゲームのセットアップが完了しました');

    // デバッグ: STARTボタンの状態を確認
    const startBtn = document.getElementById('yt-shooting-start');
    console.log('[YouTube Shooting] STARTボタン:', startBtn, 'display:', startBtn ? startBtn.style.display : 'なし');

    // デバッグ: 統計パネルの状態を確認
    const statsPanel = document.querySelector('.yt-shooting-stats');
    console.log('[YouTube Shooting] 統計パネル:', statsPanel, 'display:', statsPanel ? statsPanel.style.display : 'なし');

    // STARTボタンの初期表示状態をロード
    chrome.storage.local.get(['yt_shooting_hide_start'], (result) => {
      if (result.yt_shooting_hide_start && ui && ui.controlPanel) {
        ui.controlPanel.style.display = 'none';
        console.log('[YouTube Shooting] STARTボタンを非表示に設定');
      }
    });
  }

  /**
   * YouTube 動画ページか判定
   * @returns {boolean}
   */
  function isYouTubeVideoPage() {
    return (
      window.location.hostname === 'www.youtube.com' &&
      window.location.pathname === '/watch'
    );
  }

  /**
   * URL から動画 ID を抽出
   * @returns {string|null}
   */
  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  /**
   * ページ遷移を監視（SPAナビゲーション対応）
   */
  function observeNavigation() {
    let lastUrl = window.location.href;
    let debounceTimer = null;

    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[YouTube Shooting] ページ遷移を検出しました:', currentUrl);

        // 既存のタイマーをクリア
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // 既存のゲームをクリーンアップ
        cleanup();

        // 少し待ってから初期化（連続した遷移を防ぐ）
        debounceTimer = setTimeout(() => {
          console.log('[YouTube Shooting] 遷移後の初期化を開始');
          init();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[YouTube Shooting] ページ遷移の監視を開始しました');
  }

  /**
   * クリーンアップ処理
   */
  function cleanup() {
    if (game) {
      game.stop();
      game = null;
    }

    if (overlay) {
      overlay.destroy();
      overlay = null;
    }

    if (ui) {
      ui.destroy();
      ui = null;
    }

    console.log('[YouTube Shooting] クリーンアップしました');
  }

  /**
   * ページアンロード時のクリーンアップ
   */
  window.addEventListener('beforeunload', () => {
    cleanup();
  });

  // 初期化を実行 - 自動起動は無効化（ポップアップからのみ起動）
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', () => {
  //     console.log('[YouTube Shooting] DOMContentLoaded - 初期化開始');
  //     init();
  //   });
  // } else {
  //   console.log('[YouTube Shooting] ページ読み込み済み - 初期化開始');
  //   // ページが既に読み込まれている場合は少し待つ
  //   setTimeout(() => {
  //     init();
  //   }, 100);
  // }

  console.log('[YouTube Shooting] 自動起動は無効です。ポップアップから起動してください。');

  // SPA ナビゲーションを監視
  observeNavigation();

  // ========================================
  // ポップアップからのメッセージを受信
  // ========================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[YouTube Shooting] メッセージ受信:', request);

    if (request.action === 'startGame') {
      console.log('[YouTube Shooting] ポップアップからゲーム開始要求');

      // 既にUIがある場合はクリーンアップ
      cleanup();

      // ゲームを初期化
      if (isYouTubeVideoPage()) {
        const videoId = getVideoId();
        if (videoId) {
          setupGame(videoId);
          sendResponse({ success: true, message: 'Game started' });
        } else {
          sendResponse({ success: false, message: 'No video ID found' });
        }
      } else {
        sendResponse({ success: false, message: 'Not a YouTube video page' });
      }

      return true; // 非同期レスポンスを維持
    }

    // STARTボタンの表示/非表示切り替え
    if (request.action === 'toggleStartButton') {
      console.log('[YouTube Shooting] STARTボタン表示切り替え:', request.hidden ? '非表示' : '表示');

      if (ui && ui.controlPanel) {
        ui.controlPanel.style.display = request.hidden ? 'none' : 'block';
      }

      sendResponse({ success: true });
      return true;
    }
  });

})();
