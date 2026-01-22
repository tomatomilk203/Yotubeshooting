/**
 * 弾幕生成・描画エンジン
 */

class DanmakuEngine {
  constructor(canvasWidth, canvasHeight) {
    this.config = window.YT_SHOOTING_CONFIG;
    this.bullets = [];
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 弾幕生成タイマー
    this.spawnTimer = 0;
    this.spawnInterval = 2000; // ミリ秒
  }

  /**
   * コメントから弾幕オブジェクトを生成
   * @param {Object} comment - Comment オブジェクト
   * @param {Object} aiParams - AI解析パラメータ
   * @param {string} difficulty - 難易度 ('easy', 'normal', 'hard')
   * @returns {Object} Bullet オブジェクト
   */
  createBulletFromComment(comment, aiParams, difficulty) {
    // 赤ボス判定: emotionが'boss'の場合のみ
    const isBoss = aiParams.emotion === 'boss';

    // 文字数制限: 通常コメントは50文字、ボスは100文字（パフォーマンス改善）
    const maxLength = isBoss ? 100 : 50;
    const lineLength = 20;

    let text = comment.text.substring(0, maxLength);

    // 改行処理: 長い文字列を適切に改行
    const lines = [];
    for (let i = 0; i < text.length; i += lineLength) {
      lines.push(text.substring(i, i + lineLength));
    }

    // 色タイプを先に判定
    const colorType = this.getColorType(aiParams.color);

    // HELL難易度では灰色、緑、紫を出現させない（赤のみ）
    if (difficulty === 'hell' && (colorType === 'gray' || colorType === 'green' || colorType === 'purple')) {
      return null;
    }

    // 難易度別スコア倍率: EASY=1倍, NORMAL=2倍, HARD=3倍
    const scoreMultiplier = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3;

    // HP計算と色別設定
    let hp = 1;
    let finalColor = aiParams.color;
    let fontSize = aiParams.size;
    let scoreValue = 10; // デフォルト得点

    if (isBoss) {
      // 赤ボス: HELLは最低300+文字数×10、それ以外は1文字×♡10
      if (difficulty === 'hell') {
        hp = 300 + text.length * 10;
      } else {
        hp = text.length * 10;
      }
      finalColor = '#ff0000'; // 赤
      fontSize = aiParams.size * 4.0; // さらに大きく表示
      scoreValue = 250000;
    } else if (colorType === 'gray') {
      // 灰色: 無敵、倒せない障害物
      hp = Infinity;
      scoreValue = 0;
    } else if (colorType === 'purple') {
      // 紫レア: 1文字×♡1、25000点（通常の5倍）
      hp = text.length * 1;
      scoreValue = 25000;
    } else if (colorType === 'green') {
      // 緑: 3文字×♡1、基本50点×倍率（通常の5倍）
      hp = Math.ceil(text.length / 3);
      scoreValue = 50 * scoreMultiplier;
    } else {
      // 白（通常）: 10文字×♡1、基本50点×倍率（通常の5倍）
      hp = Math.ceil(text.length / 10);
      scoreValue = 50 * scoreMultiplier;
    }

    // HELL難易度の場合: 紫と灰色以外を全て赤色に変更
    if (difficulty === 'hell' && !isBoss && colorType !== 'purple' && colorType !== 'gray') {
      finalColor = '#ff0000'; // 赤色（紫と灰色は除く）
    }

    // 出現位置: 右端から登場
    const x = this.canvasWidth + 100;
    const y = Math.random() * this.canvasHeight * 0.8 + this.canvasHeight * 0.1;

    // 特殊弾幕の判定（ボス以外）
    let isHighSpeed = false;
    let isGiant = false;
    let actualText = lines;
    let actualSize = fontSize;
    let actualSpeed = -(2 + Math.random() * 4); // 通常速度

    if (!isBoss) {
      const specialRoll = Math.random();

      // 高速弾幕（5%確率）: 通常の3倍速、真っすぐ飛ぶ
      if (specialRoll < 0.05) {
        isHighSpeed = true;
        actualSpeed = actualSpeed * 3;
        console.log('[DanmakuEngine] 高速弾幕生成！');
      }
      // 巨大文字「草」（7%確率）: 5倍サイズ
      else if (specialRoll < 0.12) {
        isGiant = true;
        actualText = ['草'];
        actualSize = fontSize * 5;
        console.log('[DanmakuEngine] 巨大「草」生成！');
      }
    }

    const bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      commentId: comment.id,
      text: actualText, // 配列として保存
      author: comment.author,
      isBoss: isBoss,

      // 位置・移動
      x: x,
      y: y,
      vx: actualSpeed,
      vy: 0,

      // 見た目
      size: actualSize,
      color: finalColor,
      alpha: 0.9,

      // パラメータ
      hp: isGiant ? Math.ceil(hp * 2) : hp, // 巨大文字はHP2倍
      maxHp: isGiant ? Math.ceil(hp * 2) : hp,
      scoreValue: isGiant ? scoreValue * 2 : scoreValue, // 巨大文字はスコア2倍

      // 文字色別の状態
      colorType: colorType,
      invincible: colorType === 'gray', // 灰色は無敵
      hitFlash: 0, // 被弾時の点滅タイマー
      isStopped: false, // 赤ボス用: 停止したか
      isFullyVisible: false, // 赤ボス用: 全文字が表示されたか
      shootTimer: 0, // 赤ボス用: 弾幕発射タイマー
      shootInterval: 1500, // 1.5秒ごとに弾幕発射

      // 特殊弾幕フラグ
      isHighSpeed: isHighSpeed,
      isGiant: isGiant,

      // パターン
      pattern: isHighSpeed ? 'straight' : aiParams.pattern, // 高速弾幕は真っすぐ
      patternTime: 0,

      // その他
      emotion: aiParams.emotion,
      likeCount: comment.likeCount
    };

    return bullet;
  }

  /**
   * 色から文字タイプを判定
   * @param {string} color
   * @returns {string} 'green'|'red'|'white'|'purple'|'gray'
   */
  getColorType(color) {
    const c = color.toLowerCase().replace('#', '');

    // 紫: #ff00ff, #f0f
    if (c === 'ff00ff' || c === 'f0f' || c.includes('purple') || c.includes('magenta')) return 'purple';

    // 緑: #00ff00, #0f0
    if (c === '00ff00' || c === '0f0' || c.includes('green')) return 'green';

    // 赤: #ff0000, #f00
    if (c === 'ff0000' || c === 'f00' || c.includes('red')) return 'red';

    // 灰色: #808080
    if (c === '808080' || c.includes('gray') || c.includes('grey')) return 'gray';

    // デフォルトは白
    return 'white';
  }

  /**
   * 弾道パターンのデータを取得
   * @param {string} pattern
   * @returns {Object}
   */
  getPatternData(pattern) {
    switch (pattern) {
      case 'wave':
        return {
          amplitude: 2,
          frequency: 0.05
        };
      case 'spiral':
        return {
          rotationSpeed: 0.02
        };
      case 'random':
        return {
          changeInterval: 1000,
          lastChange: Date.now()
        };
      default: // 'straight'
        return {};
    }
  }

  /**
   * 弾幕を追加
   * @param {Object} bullet
   */
  addBullet(bullet) {
    if (this.bullets.length >= this.config.MAX_BULLETS) {
      // 最も古い弾幕を削除
      this.bullets.shift();
    }
    this.bullets.push(bullet);
  }

  /**
   * コメントリストから弾幕を一括生成
   * @param {Array} comments - Comment オブジェクトの配列
   * @param {Array} aiParamsArray - AI解析パラメータの配列
   */
  loadCommentsAsBullets(comments, aiParamsArray) {
    for (let i = 0; i < comments.length; i++) {
      const bullet = this.createBulletFromComment(comments[i], aiParamsArray[i]);
      this.addBullet(bullet);
    }
  }

  /**
   * 弾幕の更新処理
   * @param {number} deltaTime - ミリ秒
   * @param {Object} difficulty - 難易度設定
   */
  update(deltaTime, difficulty) {
    // 各弾幕を更新
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // パターンに応じた移動処理
      this.updateBulletMovement(bullet, deltaTime, difficulty);

      // 画面外判定
      if (this.isOutOfBounds(bullet)) {
        this.bullets.splice(i, 1);
        continue;
      }

      // HPが0以下なら削除
      if (bullet.hp <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }
    }
  }

  /**
   * 弾幕の移動を更新
   * @param {Object} bullet
   * @param {number} deltaTime
   * @param {Object} difficulty
   */
  updateBulletMovement(bullet, deltaTime, difficulty) {
    const speedMultiplier = difficulty.bulletSpeed || 1.0;
    bullet.patternTime += deltaTime;

    // 被弾時の点滅タイマー更新
    if (bullet.hitFlash > 0) {
      bullet.hitFlash -= deltaTime;
    }

    // 赤ボスの特殊処理 - 常に動く
    if (bullet.isBoss) {
      // 画面右4割の範囲を上下に動く
      const rightAreaX = this.canvasWidth * 0.6;
      const centerY = this.canvasHeight / 2;
      const moveRange = this.canvasHeight * 0.3;

      // 目標位置を計算（上下に往復）
      const targetY = centerY + Math.sin(bullet.patternTime * 0.001) * moveRange;

      // 目標位置に向かって移動
      const dy = targetY - bullet.y;
      bullet.y += dy * 0.02;

      // X位置は固定範囲内をゆっくり動く
      if (!bullet.reachedPosition) {
        bullet.x += bullet.vx * speedMultiplier;
        if (bullet.x <= rightAreaX) {
          bullet.reachedPosition = true;
        }
      } else {
        // 左右に少し揺れる
        bullet.x = rightAreaX + Math.sin(bullet.patternTime * 0.002) * 50;
      }

      // 白文字を発射
      bullet.shootTimer += deltaTime;
      if (bullet.shootTimer >= bullet.shootInterval) {
        this.shootBulletFromBoss(bullet);
        bullet.shootTimer = 0;
      }
    } else if (bullet.isBossBullet && bullet.pattern === 'wave') {
      // ボスの弾幕: 左に突き抜けながらグニャグニャ動く（追従しない）
      bullet.x += bullet.vx * speedMultiplier;

      // 上下の波のような動きを追加
      const waveOffset = Math.sin(bullet.patternTime * bullet.waveFrequency) * bullet.waveAmplitude;
      bullet.y += waveOffset;
    } else if (bullet.isMassBarrage) {
      // 30秒毎の無敵大量弾幕: 左に流れるだけ（追従しない）
      bullet.x += bullet.vx * speedMultiplier;
      // 少し上下にゆらゆら
      bullet.y += Math.sin(bullet.patternTime * 0.003) * 0.5;
    } else if (bullet.isHighSpeed) {
      // 高速弾幕: 真っすぐ飛ぶ（追従しない、上下動きなし）
      bullet.x += bullet.vx * speedMultiplier;
    } else {
      // 通常の敵の動き
      // HELL難易度の場合はプレイヤーを追尾（ただしボス弾と無敵弾幕は除く）
      if (difficulty.trackPlayer && window.currentGame?.player && !bullet.invincible) {
        const player = window.currentGame.player;
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // プレイヤーに向かって移動
          const speed = Math.abs(bullet.vx);
          bullet.x += (dx / distance) * speed * speedMultiplier;
          bullet.y += (dy / distance) * speed * speedMultiplier;
        }
      } else {
        // 通常の敵: 右から左に流れる
        bullet.x += bullet.vx * speedMultiplier;

        // 不規則な上下動き（巨大文字はゆっくり揺れる）
        if (bullet.isGiant) {
          bullet.y += Math.sin(bullet.patternTime * 0.001) * 1.0;
        } else {
          bullet.y += Math.sin(bullet.patternTime * 0.002) * (Math.random() * 1.5 + 0.5);
        }
      }
    }
  }

  /**
   * ボスから赤文字弾幕を発射
   * @param {Object} bullet
   */
  shootBulletFromBoss(bullet) {
    // ボスからプレイヤーに向かって赤い弾幕を発射（1文字ずつ）
    // プレイヤーの位置を取得
    const player = window.currentGame?.player;
    if (!player) return;

    for (let i = 0; i < 3; i++) {
      // プレイヤーに向かう角度を計算
      const dx = player.x - bullet.x;
      const dy = player.y - (bullet.y + bullet.text.length * 20);
      const baseAngle = Math.atan2(dy, dx);

      // 扇状に広がるように少しランダム性を追加
      const angle = baseAngle + (Math.random() - 0.5) * Math.PI / 6; // ±30度のばらつき
      const speed = 3 + Math.random() * 2;

      const bossBullet = {
        id: `boss_bullet_${Date.now()}_${Math.random()}`,
        commentId: 'boss_attack',
        text: ['●'], // 赤い丸
        author: 'BOSS',
        isBoss: false,
        isBossBullet: true, // ボスの攻撃弾であることを示すフラグ

        x: bullet.x,
        y: bullet.y + bullet.text.length * 20, // ボスの中心付近から発射
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,

        size: 1.5,
        color: '#ff0000', // 赤色
        alpha: 0.9,

        hp: 1,
        maxHp: 1,
        scoreValue: 0, // 倒しても得点なし

        colorType: 'red',
        hitFlash: 0,
        pattern: 'wave', // グニャグニャ動くようにwaveパターンを使用
        patternTime: 0,
        emotion: 'aggressive',
        likeCount: 0,

        // waveパターン用のパラメータ
        waveAmplitude: 3 + Math.random() * 2, // 波の振幅
        waveFrequency: 0.003 + Math.random() * 0.002 // 波の周波数
      };

      this.addBullet(bossBullet);
    }
  }

  /**
   * 30秒毎の無敵大量弾幕を生成
   * 固定テキスト: うおｗ・やあ・にょっす🐮✋
   */
  spawnMassBarrage() {
    const texts = ['うおｗ', 'やあ', 'にょっす🐮✋'];
    const bulletCount = 15; // 大量に出す

    for (let i = 0; i < bulletCount; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const y = (this.canvasHeight / (bulletCount + 1)) * (i + 1); // 画面全体に分散

      const bullet = {
        id: `mass_barrage_${Date.now()}_${i}`,
        commentId: 'mass_barrage',
        text: [text],
        author: 'SYSTEM',
        isBoss: false,
        isBossBullet: false,
        isMassBarrage: true, // 30秒弾幕フラグ

        x: this.canvasWidth + 50 + Math.random() * 100,
        y: y,
        vx: -(3 + Math.random() * 2), // 左に流れる
        vy: 0,

        size: 1.5,
        color: '#808080', // 灰色
        alpha: 0.9,

        hp: Infinity, // 無敵
        maxHp: Infinity,
        scoreValue: 0,

        colorType: 'gray',
        invincible: true,
        hitFlash: 0,
        pattern: 'straight',
        patternTime: 0,
        emotion: 'neutral',
        likeCount: 0
      };

      this.addBullet(bullet);
    }

    console.log('[DanmakuEngine] 30秒弾幕発射！');
  }

  /**
   * 弾幕が画面外かどうか判定
   * @param {Object} bullet
   * @returns {boolean}
   */
  isOutOfBounds(bullet) {
    const margin = 200; // マージン
    return (
      bullet.x < -margin ||
      bullet.x > this.canvasWidth + margin ||
      bullet.y < -margin ||
      bullet.y > this.canvasHeight + margin
    );
  }

  /**
   * 弾幕の描画
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 通常の弾幕描画
    this.bullets.forEach(bullet => {
      ctx.save();

      // テキストスタイル
      const fontSize = this.config.BULLET.BASE_FONT_SIZE * bullet.size;
      ctx.font = `bold ${fontSize}px sans-serif`;

      // 被弾時の点滅エフェクト
      if (bullet.hitFlash > 0 && Math.floor(bullet.hitFlash / 50) % 2 === 0) {
        ctx.fillStyle = '#ffffff'; // 白く点滅
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = bullet.color;
        ctx.globalAlpha = bullet.alpha;
      }

      ctx.textBaseline = 'top';

      // 複数行のテキストを描画
      bullet.text.forEach((line, index) => {
        const lineY = bullet.y + index * (fontSize + 5);

        // 縁取り(黒)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(line, bullet.x, lineY);

        // テキスト本体
        ctx.fillText(line, bullet.x, lineY);
      });

      ctx.restore();

      // デバッグモード: HPバーと当たり判定を表示
      if (this.config.DEBUG) {
        this.renderDebugInfo(ctx, bullet);
      }
    });

    // 紫レアのHPバーを画面中央上部に表示
    const rareBullets = this.bullets.filter(b => b.colorType === 'purple');
    if (rareBullets.length > 0) {
      // 最初のレアのHPを表示
      const rare = rareBullets[0];
      const hpRatio = rare.hp / rare.maxHp;
      const barWidth = 400;
      const barHeight = 20;
      const barX = (this.canvasWidth - barWidth) / 2;
      const barY = 20;

      ctx.save();

      // レア名表示
      ctx.fillStyle = '#ff00ff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('レアエネミー出現！', this.canvasWidth / 2, barY - 25);

      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HPバー
      ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      // 枠
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // HP数値表示
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${rare.hp} / ${rare.maxHp}`, this.canvasWidth / 2, barY + barHeight / 2 + 5);

      ctx.restore();
    }

    // 赤ボスのHPバーを表示（少し下に）
    const bossBullets = this.bullets.filter(b => b.isBoss);
    if (bossBullets.length > 0) {
      const boss = bossBullets[0];
      const hpRatio = boss.hp / boss.maxHp;
      const barWidth = 500;
      const barHeight = 25;
      const barX = (this.canvasWidth - barWidth) / 2;
      const barY = rareBullets.length > 0 ? 70 : 20; // レアがいたら下にずらす

      ctx.save();

      // ボス名表示
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', this.canvasWidth / 2, barY - 30);

      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // HPバー
      ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
      ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);

      // 枠
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // HP数値表示
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${boss.hp} / ${boss.maxHp}`, this.canvasWidth / 2, barY + barHeight / 2 + 6);

      ctx.restore();
    }
  }

  /**
   * デバッグ情報を描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} bullet
   */
  renderDebugInfo(ctx, bullet) {
    ctx.save();

    // 当たり判定範囲
    const radius = bullet.text.length * bullet.size * 4;
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // HPバー
    const barWidth = 50;
    const barHeight = 5;
    const hpRatio = bullet.hp / bullet.maxHp;

    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(bullet.x - barWidth / 2, bullet.y - 20, barWidth, barHeight);

    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.fillRect(bullet.x - barWidth / 2, bullet.y - 20, barWidth * hpRatio, barHeight);

    ctx.restore();
  }

  /**
   * 弾幕にダメージを与える
   * @param {number} index - 弾幕のインデックス
   * @param {number} damage - ダメージ量
   * @returns {boolean} 破壊されたかどうか
   */
  damageBullet(index, damage = 1) {
    if (index < 0 || index >= this.bullets.length) {
      return false;
    }

    this.bullets[index].hp -= damage;

    if (this.bullets[index].hp <= 0) {
      this.bullets.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * 全弾幕をクリア
   */
  clear() {
    this.bullets = [];
  }

  /**
   * Canvas サイズを更新
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * 弾幕の総数を取得
   * @returns {number}
   */
  getBulletCount() {
    return this.bullets.length;
  }

  /**
   * すべての弾幕を取得
   * @returns {Array}
   */
  getBullets() {
    return this.bullets;
  }
}

// グローバルに公開
if (typeof window !== 'undefined') {
  window.YT_DanmakuEngine = DanmakuEngine;
}
