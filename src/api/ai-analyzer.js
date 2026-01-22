/**
 * AI コメント解析モジュール
 * コメント内容を解析して弾幕パラメータを決定
 */

class AIAnalyzer {
  constructor() {
    this.config = window.YT_SHOOTING_CONFIG;

    // 感情分析用のキーワード辞書
    this.keywords = {
      positive: ['すごい', '最高', '面白い', 'かわいい', '素晴らしい', 'good', 'awesome', 'great', 'love', 'nice', 'cool', '神', 'いいね', 'ありがとう', 'thank'],
      negative: ['つまらない', 'bad', '嫌い', 'hate', 'boring', 'ひどい', '最悪', 'worst', 'terrible'],
      aggressive: ['死ね', 'kill', '爆発', 'destroy', '壊す', 'やばい', 'ヤバい', 'クソ', 'くそ', 'マジで', 'うざい', 'うるさい'],
      excited: ['!', '!!', '!!!', 'wwww', 'www', 'lol', 'lmao', '草', '笑']
    };

    // AI生成コメント用のテンプレート
    this.commentTemplates = {
      positive: [
        'これは素晴らしい!',
        '最高ですね',
        'いいね!',
        'すごい!',
        'かっこいい!'
      ],
      negative: [
        'うーん...',
        'これは微妙',
        'いまいち',
        'もっと頑張れ'
      ],
      neutral: [
        'なるほど',
        'わかる',
        'ふむふむ',
        '見てます',
        'きた'
      ],
      excited: [
        'やばいwww',
        'すごすぎるwww',
        'これは神!!!',
        'まじか!!!',
        'えぐい!'
      ]
    };
  }

  /**
   * コメントを解析して弾幕パラメータを生成
   * @param {Object} comment - {id, text, author, likeCount, publishedAt}
   * @returns {Object} AIParams
   */
  analyzeComment(comment) {
    const text = comment.text.toLowerCase();

    // 感情を判定
    let emotion = 'neutral';
    let emotionScore = 0;

    // 攻撃的なコメントを最優先でチェック
    if (this.containsKeywords(text, this.keywords.aggressive)) {
      emotion = 'aggressive';
      emotionScore = 1.0;
    } else if (this.containsKeywords(text, this.keywords.positive)) {
      emotion = 'positive';
      emotionScore = 0.7;
    } else if (this.containsKeywords(text, this.keywords.negative)) {
      emotion = 'negative';
      emotionScore = 0.5;
    }

    // 興奮度をチェック
    const excitementLevel = this.getExcitementLevel(text);

    // 評価数に基づくパラメータ調整
    const likeMultiplier = Math.min(3.0, 1.0 + (comment.likeCount / 50));

    // 速度を決定（攻撃的 > ポジティブ > ネガティブ > ニュートラル）
    let baseSpeed = this.config.BULLET.MIN_SPEED;
    switch (emotion) {
      case 'aggressive':
        baseSpeed = 3.5;
        break;
      case 'positive':
        baseSpeed = 2.5;
        break;
      case 'negative':
        baseSpeed = 1.8;
        break;
      default:
        baseSpeed = 2.0;
    }

    const speed = Math.min(
      this.config.BULLET.MAX_SPEED,
      baseSpeed * likeMultiplier * (1 + excitementLevel * 0.3)
    );

    // サイズを決定（コメントの長さに比例）
    const textLength = comment.text.length;
    const size = Math.min(
      this.config.BULLET.MAX_SIZE,
      Math.max(
        this.config.BULLET.MIN_SIZE,
        0.8 + (textLength / 50)
      )
    );

    // 耐久力を決定（評価数に比例）
    const hp = Math.min(
      this.config.BULLET.MAX_HP,
      Math.max(
        this.config.BULLET.MIN_HP,
        Math.ceil(1 + comment.likeCount / 10)
      )
    );

    // 色を決定
    const color = this.getColorByEmotion(emotion, excitementLevel);

    // 弾道パターンを決定
    const pattern = this.getPatternByEmotion(emotion, excitementLevel);

    // 密度（生成頻度）
    const density = Math.min(1.0, 0.5 + emotionScore * 0.5);

    return {
      emotion,
      speed,
      density,
      size,
      color,
      hp,
      pattern,
      excitementLevel
    };
  }

  /**
   * 複数のコメントを一括解析
   * @param {Array} comments
   * @returns {Array} AIParams の配列
   */
  analyzeBatch(comments) {
    return comments.map(comment => this.analyzeComment(comment));
  }

  /**
   * コメントがネガティブかどうかを判定（人気順下位10%のみ抽出）
   * @param {Object} comment - Comment オブジェクト
   * @param {Object} aiParam - AI解析結果
   * @param {Array} allComments - 全コメント（比較用）
   * @returns {boolean}
   */
  isNegativeComment(comment, aiParam, allComments) {
    if (!allComments || allComments.length === 0) {
      return false;
    }

    // キャッシュされた閾値を使用（パフォーマンス最適化）
    if (!this._cachedThreshold || this._cachedCommentsLength !== allComments.length) {
      // 全コメントをいいね数でソートして下位10%の閾値を計算
      const sortedByLikes = [...allComments].sort((a, b) => a.likeCount - b.likeCount);
      const bottom10PercentIndex = Math.floor(sortedByLikes.length * 0.1);
      this._cachedThreshold = sortedByLikes[bottom10PercentIndex]?.likeCount ?? 0;
      this._cachedCommentsLength = allComments.length;

      console.log(`[HELL判定] 全${allComments.length}件中、下位10%の閾値: いいね${this._cachedThreshold}以下`);
    }

    // このコメントが下位10%に入っているかチェック
    return comment.likeCount <= this._cachedThreshold;
  }

  /**
   * AI生成コメントを作成
   * @param {string} style - 'positive', 'negative', 'neutral', 'excited'
   * @returns {Object} Comment オブジェクト
   */
  generateAIComment(style = 'neutral') {
    const templates = this.commentTemplates[style] || this.commentTemplates.neutral;
    const text = templates[Math.floor(Math.random() * templates.length)];

    return {
      id: `ai_${Date.now()}_${Math.random()}`,
      text: text,
      author: 'AI Generated',
      likeCount: Math.floor(Math.random() * 20),
      publishedAt: new Date().toISOString()
    };
  }

  /**
   * AI生成コメントを複数作成
   * @param {number} count - 生成数
   * @returns {Array} Comment オブジェクトの配列
   */
  generateAIComments(count = 50) {
    const comments = [];
    const styles = ['positive', 'negative', 'neutral', 'excited'];

    for (let i = 0; i < count; i++) {
      // ランダムなスタイルを選択（ポジティブ寄りに調整）
      const rand = Math.random();
      let style;
      if (rand < 0.4) {
        style = 'positive';
      } else if (rand < 0.6) {
        style = 'excited';
      } else if (rand < 0.8) {
        style = 'neutral';
      } else {
        style = 'negative';
      }

      comments.push(this.generateAIComment(style));
    }

    return comments;
  }

  /**
   * キーワードが含まれているかチェック
   * @param {string} text
   * @param {Array} keywords
   * @returns {boolean}
   */
  containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  }

  /**
   * 興奮度を測定（感嘆符やw、絵文字の数）
   * @param {string} text
   * @returns {number} 0.0 - 1.0
   */
  getExcitementLevel(text) {
    const exclamations = (text.match(/!/g) || []).length;
    const wwws = (text.match(/w/g) || []).length;
    const excited = this.containsKeywords(text, this.keywords.excited);

    let level = 0;
    level += Math.min(0.5, exclamations * 0.1);
    level += Math.min(0.3, wwws * 0.05);
    level += excited ? 0.2 : 0;

    return Math.min(1.0, level);
  }

  /**
   * 感情に基づいて色を決定
   * @param {string} emotion
   * @param {number} excitementLevel
   * @returns {string} HEX カラーコード
   */
  getColorByEmotion(emotion, excitementLevel) {
    // 新仕様に合わせた色設定
    // 緑: 回復、紫: レア、白: 通常
    const colorMap = {
      positive: '#00ff00',    // 緑(回復)
      negative: '#ffffff',    // 白(通常)
      aggressive: '#ffffff',  // 白(通常)
      neutral: '#ffffff',     // 白(通常)
      boss: '#ff00ff'         // ボス(紫) - ただしAIは返さない
    };

    let baseColor = colorMap[emotion] || colorMap.neutral;

    // positiveでない場合のみ、ランダムで特殊色を決定（紫5%、灰色5%、合計10%）
    if (emotion !== 'positive') {
      const specialRoll = Math.random();
      if (specialRoll < 0.05) {
        baseColor = '#ff00ff'; // 紫レア（0-5%）
      } else if (specialRoll < 0.10) {
        baseColor = '#808080'; // 灰色無敵（5-10%）
      }
    }

    return baseColor;
  }

  /**
   * 感情に基づいて弾道パターンを決定
   * @param {string} emotion
   * @param {number} excitementLevel
   * @returns {string}
   */
  getPatternByEmotion(emotion, excitementLevel) {
    if (emotion === 'aggressive') {
      return excitementLevel > 0.5 ? 'spiral' : 'straight';
    } else if (emotion === 'positive') {
      return 'wave';
    } else if (excitementLevel > 0.7) {
      return 'random';
    }
    return 'straight';
  }

  /**
   * 色を明るくする
   * @param {string} hex - HEX カラーコード
   * @param {number} percent - 明るくする割合
   * @returns {string}
   */
  brightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + percent);
    const g = Math.min(255, ((num >> 8) & 0xff) + percent);
    const b = Math.min(255, (num & 0xff) + percent);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_AIAnalyzer = AIAnalyzer;
}
