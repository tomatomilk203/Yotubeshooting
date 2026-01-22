/**
 * YouTube Data API v3 連携モジュール
 */

class YouTubeAPI {
  constructor() {
    this.config = window.YT_SHOOTING_CONFIG;
    this.storageManager = new window.YT_StorageManager();

    // APIキーはconfigから取得（非同期ストレージは初期化後に確認）
    this.apiKey = this.config.YOUTUBE_API_KEY;
    this.baseURL = this.config.YOUTUBE_API_BASE_URL;

    // 非同期でストレージからAPIキーを取得して上書き
    this.initAPIKey();
  }

  async initAPIKey() {
    const storedKey = await this.storageManager.getAPIKey();
    if (storedKey) {
      this.apiKey = storedKey;
    }
  }

  /**
   * 動画のコメントを取得
   * @param {string} videoId - YouTube動画ID
   * @param {number} maxResults - 最大取得数（デフォルト100）
   * @returns {Promise<Array>} Comment オブジェクトの配列
   */
  async fetchComments(videoId, maxResults = 100) {
    // APIキーがPromiseの場合は待機
    if (this.apiKey instanceof Promise) {
      this.apiKey = await this.apiKey;
    }

    // APIキーがまだ初期化されていない場合はconfigから取得
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE' || this.apiKey === '[object Promise]') {
      this.apiKey = this.config.YOUTUBE_API_KEY;
    }

    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('[YouTube API] APIキーが設定されていません。');
      return [];
    }

    console.log(`[YouTube API] APIキー: ${this.apiKey.substring(0, 10)}...`);

    try {
      const url = new URL(`${this.baseURL}/commentThreads`);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('videoId', videoId);
      url.searchParams.append('maxResults', Math.min(maxResults, 100).toString());
      url.searchParams.append('order', 'relevance'); // 関連性の高い順
      url.searchParams.append('textFormat', 'plainText');
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.warn('[YouTube API] コメントが見つかりませんでした。');
        return [];
      }

      // コメントをパース
      const comments = data.items.map(item => this.parseComment(item));

      // コメントをランダムシャッフル（Fisher-Yates アルゴリズム）
      this.shuffleArray(comments);

      console.log(`[YouTube API] ${comments.length} 件のコメントを取得・シャッフルしました。`);
      return comments;

    } catch (error) {
      console.error('[YouTube API] コメント取得エラー:', error);
      return [];
    }
  }

  /**
   * APIレスポンスをCommentオブジェクトに変換
   * @param {Object} rawComment - API の生レスポンス
   * @returns {Object} Comment オブジェクト
   */
  parseComment(rawComment) {
    const snippet = rawComment.snippet.topLevelComment.snippet;

    return {
      id: rawComment.id,
      text: snippet.textDisplay || snippet.textOriginal || '',
      author: snippet.authorDisplayName || 'Anonymous',
      likeCount: snippet.likeCount || 0,
      publishedAt: snippet.publishedAt || new Date().toISOString()
    };
  }

  /**
   * 動画情報を取得（タイトル、説明、統計など）
   * @param {string} videoId
   * @returns {Promise<Object|null>}
   */
  async fetchVideoInfo(videoId) {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY_HERE') {
      console.warn('[YouTube API] APIキーが設定されていません。');
      return null;
    }

    try {
      const url = new URL(`${this.baseURL}/videos`);
      url.searchParams.append('part', 'snippet,statistics');
      url.searchParams.append('id', videoId);
      url.searchParams.append('key', this.apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return null;
      }

      const video = data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0)
      };

    } catch (error) {
      console.error('[YouTube API] 動画情報取得エラー:', error);
      return null;
    }
  }

  /**
   * APIキーを設定
   * @param {string} apiKey
   */
  setAPIKey(apiKey) {
    this.apiKey = apiKey;
    this.storageManager.setAPIKey(apiKey);
  }

  /**
   * APIキーが有効か確認
   * @returns {boolean}
   */
  hasValidAPIKey() {
    return this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE';
  }

  /**
   * 配列をランダムにシャッフル（Fisher-Yates アルゴリズム）
   * @param {Array} array - シャッフルする配列
   * @returns {Array} シャッフルされた配列（破壊的変更）
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_YouTubeAPI = YouTubeAPI;
}
