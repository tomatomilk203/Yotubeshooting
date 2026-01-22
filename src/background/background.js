/**
 * YouTube Shooting - バックグラウンドスクリプト
 * Service Worker (Manifest V3)
 */

console.log('[YouTube Shooting Background] サービスワーカーが起動しました');

// インストール時
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[YouTube Shooting Background] 拡張機能がインストールされました');

    // 初回インストール時にウェルカムページを開く（オプション）
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('[YouTube Shooting Background] 拡張機能が更新されました');
  }
});

// メッセージリスナー（将来的な拡張用）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[YouTube Shooting Background] メッセージを受信:', message);

  // 例: YouTube API キーの管理
  if (message.type === 'GET_API_KEY') {
    chrome.storage.local.get(['youtube_api_key'], (result) => {
      sendResponse({ apiKey: result.youtube_api_key || null });
    });
    return true; // 非同期レスポンス
  }

  if (message.type === 'SET_API_KEY') {
    chrome.storage.local.set({ youtube_api_key: message.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// アクションボタンクリック時（オプション）
chrome.action.onClicked.addListener((tab) => {
  console.log('[YouTube Shooting Background] アクションボタンがクリックされました', tab);

  // YouTube ページでない場合は警告
  if (!tab.url.includes('youtube.com/watch')) {
    console.warn('[YouTube Shooting Background] YouTube 動画ページではありません');
  }
});
