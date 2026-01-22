// ========================================
// ポップアップUI管理（多言語対応版）
// ========================================

// 初期化
let i18n;

// ストレージキー定義
const STORAGE_KEYS = {
  HIGH_SCORE: 'yt_shooting_high_score',
  COINS: 'yt_shooting_coins',
  UNLOCKED_SKINS: 'yt_shooting_unlocked_skins',
  SELECTED_SKIN: 'yt_shooting_selected_skin',
  ACHIEVEMENTS: 'yt_shooting_achievements',
  GAME_STATS: 'yt_shooting_game_stats',
  GLITCH_ENABLED: 'yt_shooting_glitch_enabled'
};

// ========================================
// データ取得関数
// ========================================

// Chrome Storage APIを使用（localStorageではなく）
async function getCoins() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.COINS], (result) => {
      resolve(result[STORAGE_KEYS.COINS] || 0);
    });
  });
}

async function getUnlockedSkins() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.UNLOCKED_SKINS], (result) => {
      resolve(result[STORAGE_KEYS.UNLOCKED_SKINS] || ['default']);
    });
  });
}

async function getSelectedSkin() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.SELECTED_SKIN], (result) => {
      resolve(result[STORAGE_KEYS.SELECTED_SKIN] || 'default');
    });
  });
}

async function getAchievements() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.ACHIEVEMENTS], (result) => {
      resolve(result[STORAGE_KEYS.ACHIEVEMENTS] || {});
    });
  });
}

async function getGameStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.GAME_STATS], (result) => {
      if (result[STORAGE_KEYS.GAME_STATS]) {
        resolve(result[STORAGE_KEYS.GAME_STATS]);
      } else {
        resolve({
          totalGames: 0,
          totalScore: 0,
          totalKills: 0,
          consecutiveClears: 0,
          bestScore: 0,
          difficultyClear: { easy: 0, normal: 0, hard: 0, hell: 0 }
        });
      }
    });
  });
}

async function getGlitchEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.GLITCH_ENABLED], (result) => {
      const enabled = result[STORAGE_KEYS.GLITCH_ENABLED];
      resolve(enabled === undefined ? true : enabled);
    });
  });
}

// ========================================
// データ更新関数
// ========================================

function setSelectedSkin(skinId) {
  chrome.storage.local.set({ [STORAGE_KEYS.SELECTED_SKIN]: skinId });
}

async function unlockSkin(skinId) {
  const skins = await getUnlockedSkins();
  if (!skins.includes(skinId)) {
    skins.push(skinId);
    chrome.storage.local.set({ [STORAGE_KEYS.UNLOCKED_SKINS]: skins });
  }
}

async function spendCoins(amount) {
  const current = await getCoins();
  if (current >= amount) {
    chrome.storage.local.set({ [STORAGE_KEYS.COINS]: current - amount });
    return true;
  }
  return false;
}

function setGlitchEnabled(enabled) {
  chrome.storage.local.set({ [STORAGE_KEYS.GLITCH_ENABLED]: enabled });
  applyGlitchSettings(enabled);
}

function applyGlitchSettings(enabled) {
  const scanline = document.querySelector('.scanline');
  const crtOverlay = document.querySelector('.crt-overlay');
  const glitch = document.querySelector('.glitch');

  if (scanline) scanline.style.display = enabled ? 'block' : 'none';
  if (crtOverlay) crtOverlay.style.display = enabled ? 'block' : 'none';
  if (glitch) {
    if (enabled) {
      glitch.classList.add('glitch');
    } else {
      glitch.classList.remove('glitch');
    }
  }
}

// ========================================
// UI更新関数
// ========================================

async function updateCoinDisplay() {
  const coins = await getCoins();
  document.getElementById('coin-count').textContent = coins;
}

async function updateStatsDisplay() {
  const stats = await getGameStats();
  document.getElementById('best-score').textContent = stats.bestScore.toLocaleString();
  document.getElementById('total-kills').textContent = stats.totalKills.toLocaleString();
  document.getElementById('total-games').textContent = stats.totalGames.toLocaleString();
  document.getElementById('consecutive-clears').textContent = stats.consecutiveClears;
}

function updateAllText() {
  // data-i18n属性を持つ全要素を翻訳
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = i18n.t(key);
  });
}

async function renderSkins() {
  const skinList = document.getElementById('skin-list');
  const unlockedSkins = await getUnlockedSkins();
  const selectedSkin = await getSelectedSkin();
  const coins = await getCoins();
  const achievements = await getAchievements();

  // スキン定義（翻訳付き）
  const skins = [
    {
      id: 'default',
      name: i18n.t('skinClassicGreen'),
      description: i18n.t('skinClassicGreenDesc'),
      color: '#00ff00',
      shape: 'triangle',
      cost: 0,
      achievementId: null
    },
    {
      id: 'red_triangle',
      name: i18n.t('skinCrimsonBlade'),
      description: i18n.t('skinCrimsonBladeDesc'),
      color: '#ff0000',
      shape: 'triangle',
      cost: 500,
      achievementId: 'score_10000'
    },
    {
      id: 'gold_star',
      name: i18n.t('skinGoldenStar'),
      description: i18n.t('skinGoldenStarDesc'),
      color: '#ffd700',
      shape: 'star',
      cost: 1000,
      achievementId: 'clear_hell'
    }
  ];

  skinList.innerHTML = '';

  skins.forEach(skin => {
    const isUnlocked = unlockedSkins.includes(skin.id);
    const isSelected = selectedSkin === skin.id;
    const canAfford = coins >= skin.cost;

    const card = document.createElement('div');
    card.className = 'skin-card pixel-corners';
    if (isUnlocked) card.classList.add('unlocked');
    if (isSelected) card.classList.add('selected');

    const preview = document.createElement('div');
    preview.className = 'skin-preview pixel-corners';
    preview.innerHTML = renderSkinPreview(skin);

    const info = document.createElement('div');
    info.className = 'skin-info';

    let statusText = '';
    if (isSelected) {
      statusText = `<div class="skin-status-badge equipped">✓ ${i18n.t('skinInUse')}</div>`;
    } else if (isUnlocked) {
      statusText = `<div class="skin-status-badge unlocked">✓ ${i18n.t('skinUnlocked')}</div>`;
    } else if (skin.cost === 0) {
      statusText = '';
    } else {
      // 解除方法を大きく表示
      let unlockHTML = `<div class="skin-unlock-info">`;
      unlockHTML += `<div class="unlock-title">${i18n.t('skinUnlockMethod')}</div>`;
      unlockHTML += `<div class="unlock-methods">`;
      if (skin.achievementId) {
        unlockHTML += `<div class="unlock-method">🏆 ${i18n.t('achScoreMaster')}</div>`;
      }
      if (skin.cost > 0) {
        unlockHTML += `<div class="unlock-method">💰 ${skin.cost} COINS</div>`;
      }
      unlockHTML += `</div></div>`;
      statusText = unlockHTML;
    }

    info.innerHTML = `
      <div class="skin-name">${skin.name}</div>
      <div class="skin-desc">${skin.description}</div>
      ${statusText}
    `;

    const actions = document.createElement('div');
    actions.className = 'skin-actions';

    if (isUnlocked) {
      if (!isSelected) {
        const selectBtn = document.createElement('button');
        selectBtn.className = 'cyber-btn';
        selectBtn.textContent = i18n.t('skinEquip');
        selectBtn.onclick = () => {
          setSelectedSkin(skin.id);
          renderSkins();
        };
        actions.appendChild(selectBtn);
      }
    } else if (skin.cost > 0) {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'cyber-btn';
      buyBtn.textContent = `${i18n.t('skinBuy')} (${skin.cost}💰)`;
      buyBtn.disabled = !canAfford;
      buyBtn.onclick = async () => {
        if (await spendCoins(skin.cost)) {
          await unlockSkin(skin.id);
          await updateCoinDisplay();
          await renderSkins();
        }
      };
      actions.appendChild(buyBtn);

      if (!canAfford) {
        const status = document.createElement('div');
        status.className = 'skin-status';
        status.style.fontSize = '8px';
        status.style.color = 'rgba(255,0,110,0.7)';
        status.textContent = `${i18n.t('skinRemaining')} ${skin.cost - coins}`;
        actions.appendChild(status);
      }
    }

    card.appendChild(preview);
    card.appendChild(info);
    if (actions.children.length > 0) {
      card.appendChild(actions);
    }
    skinList.appendChild(card);
  });
}

function renderSkinPreview(skin) {
  if (skin.shape === 'triangle') {
    return `<svg width="40" height="40" viewBox="0 0 40 40">
      <polygon points="20,8 32,28 8,28" fill="${skin.color}" stroke="#00f5ff" stroke-width="2"/>
    </svg>`;
  } else if (skin.shape === 'star') {
    return `<svg width="40" height="40" viewBox="0 0 40 40">
      <path d="M 20,6 L 24,16 L 34,18 L 27,25 L 29,35 L 20,29 L 11,35 L 13,25 L 6,18 L 16,16 Z"
        fill="${skin.color}" stroke="#00f5ff" stroke-width="2"/>
    </svg>`;
  }
  return '';
}

async function renderAchievements() {
  const achievementList = document.getElementById('achievement-list');
  const unlockedAchievements = await getAchievements();
  const stats = await getGameStats();

  // 実績定義（翻訳付き）
  // icon: 画像ファイル名（assets/achievements/フォルダ内）、nullの場合はデフォルト表示
  const achievements = [
    { id: 'score_10000', name: i18n.t('achScoreMaster'), desc: i18n.t('achScoreMasterDesc'), type: 'score', threshold: 10000, reward: 'Skin', icon: 'score_10000.png' },
    { id: 'score_50000', name: i18n.t('achScoreLegend'), desc: i18n.t('achScoreLegendDesc'), type: 'score', threshold: 50000, reward: '1000💰', icon: 'score_50000.png' },
    { id: 'score_300000', name: i18n.t('achGoldenManner'), desc: i18n.t('achGoldenMannerDesc'), type: 'single_score', threshold: 300000, reward: '5000💰', icon: 'score_300000.png' },
    { id: 'kills_1000', name: i18n.t('achEnemySlayer'), desc: i18n.t('achEnemySlayerDesc'), type: 'kills', threshold: 1000, reward: '500💰', icon: 'kills_1000.png' },
    { id: 'kills_5000', name: i18n.t('achEnemyDestroyer'), desc: i18n.t('achEnemyDestroyerDesc'), type: 'kills', threshold: 5000, reward: '2000💰', icon: 'kills_5000.png' },
    { id: 'kills_10000', name: i18n.t('achLonelyNight'), desc: i18n.t('achLonelyNightDesc'), type: 'kills', threshold: 10000, reward: '3000💰', icon: 'kills_10000.png' },
    { id: 'kills_500000', name: i18n.t('achGoldenPraise'), desc: i18n.t('achGoldenPraiseDesc'), type: 'kills', threshold: 500000, reward: '10000💰', icon: 'kills_500000.png' },
    { id: 'clear_easy', name: i18n.t('achEasyConqueror'), desc: i18n.t('achEasyConquerorDesc'), type: 'difficulty_clear', threshold: 'easy', reward: '100💰', icon: 'clear_easy.png' },
    { id: 'clear_normal', name: i18n.t('achNormalConqueror'), desc: i18n.t('achNormalConquerorDesc'), type: 'difficulty_clear', threshold: 'normal', reward: '300💰', icon: 'clear_normal.png' },
    { id: 'clear_hard', name: i18n.t('achHardConqueror'), desc: i18n.t('achHardConquerorDesc'), type: 'difficulty_clear', threshold: 'hard', reward: '500💰', icon: 'clear_hard.png' },
    { id: 'clear_hell', name: i18n.t('achHellConqueror'), desc: i18n.t('achHellConquerorDesc'), type: 'difficulty_clear', threshold: 'hell', reward: 'Skin', icon: 'clear_hell.png' },
    { id: 'clear_no_damage', name: i18n.t('achNoDamage'), desc: i18n.t('achNoDamageDesc'), type: 'no_damage', threshold: 1, reward: '2000💰', icon: 'clear_no_damage.png' },
    { id: 'consecutive_3', name: i18n.t('achConsistencyKing'), desc: i18n.t('achConsistencyKingDesc'), type: 'consecutive', threshold: 3, reward: '300💰', icon: 'consecutive_3.png' },
    { id: 'consecutive_5', name: i18n.t('achConsistencyGod'), desc: i18n.t('achConsistencyGodDesc'), type: 'consecutive', threshold: 5, reward: '800💰', icon: 'consecutive_5.png' },
    { id: 'consecutive_49', name: i18n.t('achGoldenFullCourse'), desc: i18n.t('achGoldenFullCourseDesc'), type: 'consecutive', threshold: 49, reward: '20000💰', icon: 'consecutive_49.png' },
    { id: 'games_10', name: i18n.t('achSimpleGreeting'), desc: i18n.t('achSimpleGreetingDesc'), type: 'total_games', threshold: 10, reward: '100💰', icon: 'games_10.png' },
    { id: 'games_100', name: i18n.t('achRoutine'), desc: i18n.t('achRoutineDesc'), type: 'total_games', threshold: 100, reward: '500💰', icon: 'games_100.png' },
    { id: 'games_500', name: i18n.t('achPlayToWatch'), desc: i18n.t('achPlayToWatchDesc'), type: 'total_games', threshold: 500, reward: '2000💰', icon: 'games_500.png' },
    { id: 'games_1000', name: i18n.t('achDanmakuKing'), desc: i18n.t('achDanmakuKingDesc'), type: 'total_games', threshold: 1000, reward: '5000💰', icon: 'games_1000.png' }
  ];

  achievementList.innerHTML = '';

  achievements.forEach(ach => {
    const isUnlocked = unlockedAchievements[ach.id]?.unlocked || false;
    const progress = calculateProgress(ach, stats);

    const card = document.createElement('div');
    card.className = 'achievement-card pixel-corners';
    if (isUnlocked) card.classList.add('unlocked');

    const icon = document.createElement('div');
    icon.className = 'achievement-icon pixel-corners';

    // 画像アイコンを使用
    const img = document.createElement('img');
    img.src = `assets/achievements/${ach.icon}`;
    img.alt = ach.name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.onerror = () => { img.style.display = 'none'; icon.textContent = '🏆'; }; // 画像がない場合のフォールバック
    icon.appendChild(img);

    if (!isUnlocked) {
      icon.style.filter = 'grayscale(100%) opacity(0.4)';
    }

    const info = document.createElement('div');
    info.className = 'achievement-info';

    let progressHTML = '';
    if (!isUnlocked) {
      progressHTML = `
        <div class="achievement-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
          </div>
          <div class="progress-text">${progress.progress} / ${progress.max} (${progress.percentage}%)</div>
        </div>
      `;
    }

    info.innerHTML = `
      <div class="achievement-name">${ach.name}</div>
      <div class="achievement-desc">${ach.desc}</div>
      <div class="achievement-reward" style="color: #ffed4e; font-size: 10px; font-family: 'Press Start 2P';">${i18n.t('achievementReward')}: ${ach.reward}</div>
      ${progressHTML}
    `;

    card.appendChild(icon);
    card.appendChild(info);
    achievementList.appendChild(card);
  });
}

function calculateProgress(achievement, stats) {
  let progress = 0;
  let max = achievement.threshold;

  switch (achievement.type) {
    case 'score':
      progress = stats.bestScore;
      break;
    case 'single_score':
      // 1ゲームでの最高スコア（bestScoreを使用）
      progress = stats.bestScore;
      break;
    case 'kills':
      progress = stats.totalKills;
      break;
    case 'difficulty_clear':
      progress = stats.difficultyClear[achievement.threshold] > 0 ? 1 : 0;
      max = 1;
      break;
    case 'no_damage':
      // ノーダメージクリアは別途トラッキングが必要（将来対応）
      progress = stats.noDamageClears || 0;
      max = 1;
      break;
    case 'consecutive':
      progress = stats.consecutiveClears;
      break;
    case 'total_games':
      progress = stats.totalGames;
      break;
  }

  const percentage = Math.min(100, Math.floor((progress / max) * 100));
  return { progress, max, percentage };
}

// ========================================
// タブ切り替え
// ========================================

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      if (targetTab === 'skins') {
        renderSkins();
      } else if (targetTab === 'achievements') {
        renderAchievements();
      }
    });
  });
}

// ========================================
// 言語切り替え
// ========================================

function setupLanguageSwitcher() {
  const langBtns = document.querySelectorAll('.lang-btn');

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      i18n.setLanguage(lang);

      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      updateAllText();
      renderSkins();
      renderAchievements();
    });
  });

  // 初期状態のボタンをアクティブに
  const currentLang = i18n.getCurrentLanguage();
  langBtns.forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ========================================
// 設定
// ========================================

async function setupSettings() {
  const volumeSlider = document.getElementById('volume-slider');
  const volumeValue = document.getElementById('volume-value');

  volumeSlider.addEventListener('input', (e) => {
    volumeValue.textContent = `${e.target.value}%`;
  });

  // 画面ブレ設定
  const glitchEnabled = await getGlitchEnabled();
  const glitchCheckbox = document.createElement('input');
  glitchCheckbox.type = 'checkbox';
  glitchCheckbox.id = 'glitch-toggle';
  glitchCheckbox.checked = glitchEnabled;
  glitchCheckbox.style.cssText = 'width: 20px; height: 20px; cursor: pointer; accent-color: #00f5ff;';

  const glitchLabel = document.createElement('label');
  glitchLabel.htmlFor = 'glitch-toggle';
  glitchLabel.textContent = i18n.getCurrentLanguage() === 'ja' ? '画面エフェクト (グリッチ・スキャンライン)' : 'Screen Effects (Glitch & Scanline)';
  glitchLabel.style.cssText = 'font-size: 11px; cursor: pointer;';

  const glitchContainer = document.createElement('div');
  glitchContainer.className = 'setting-item pixel-corners';
  glitchContainer.style.cssText = 'display: flex; align-items: center; gap: 15px;';
  glitchContainer.appendChild(glitchCheckbox);
  glitchContainer.appendChild(glitchLabel);

  const volumeItem = document.querySelector('.setting-item');
  volumeItem.parentNode.insertBefore(glitchContainer, volumeItem.nextSibling);

  glitchCheckbox.addEventListener('change', (e) => {
    setGlitchEnabled(e.target.checked);
  });

  // 初期状態を適用
  applyGlitchSettings(glitchEnabled);

  const resetBtn = document.getElementById('reset-data');
  resetBtn.addEventListener('click', () => {
    const confirmText = i18n.t('settingResetConfirm');
    if (confirm(confirmText)) {
      chrome.storage.local.clear(() => {
        alert(i18n.t('settingResetComplete'));
        location.reload();
      });
    }
  });
}

// ========================================
// 初期化
// ========================================

// ========================================
// ゲーム開始機能
// ========================================

function setupGameStart() {
  const startBtn = document.getElementById('start-game-btn');
  const statusEl = document.getElementById('game-status');

  if (!startBtn || !statusEl) {
    console.error('[Popup] ゲーム開始ボタンが見つかりません');
    return;
  }

  // 現在のタブがYouTube動画ページかチェック
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    if (!currentTab) {
      statusEl.textContent = i18n.t('gameStatusNotOnYoutube');
      startBtn.disabled = true;
      return;
    }

    const isYouTubeVideo = currentTab.url &&
      currentTab.url.includes('youtube.com/watch?v=');

    if (isYouTubeVideo) {
      statusEl.textContent = i18n.t('gameStatusReady');
      startBtn.disabled = false;
    } else {
      statusEl.textContent = i18n.t('gameStatusNotOnYoutube');
      startBtn.disabled = true;
    }
  });

  // ボタンクリック時の処理
  startBtn.addEventListener('click', () => {
    console.log('[Popup] ゲーム開始ボタンがクリックされました');

    statusEl.textContent = i18n.t('gameStatusLoading');
    startBtn.disabled = true;

    // アクティブなタブにメッセージを送信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startGame' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Popup] メッセージ送信エラー:', chrome.runtime.lastError.message);
            const errorMsg = i18n.getCurrentLanguage() === 'ja'
              ? 'ページを再読み込み(F5)してもう一度クリックしてください'
              : 'Please reload the page (F5) and click again';
            statusEl.textContent = errorMsg;
            setTimeout(() => {
              statusEl.textContent = i18n.t('gameStatusReady');
              startBtn.disabled = false;
            }, 4000);
          } else {
            console.log('[Popup] ゲーム起動成功:', response);
            const successMsg = i18n.getCurrentLanguage() === 'ja'
              ? 'ゲーム起動！ページを確認してください'
              : 'Game launched! Check the page';
            statusEl.textContent = successMsg;
            setTimeout(() => {
              statusEl.textContent = i18n.t('gameStatusReady');
              startBtn.disabled = false;
            }, 2000);
          }
        });
      }
    });
  });

  // STARTボタン非表示設定
  setupHideStartButton();
}

/**
 * STARTボタン非表示設定
 */
function setupHideStartButton() {
  const checkbox = document.getElementById('hide-start-btn');
  if (!checkbox) return;

  // 保存された設定を読み込み
  chrome.storage.local.get(['yt_shooting_hide_start'], (result) => {
    checkbox.checked = result.yt_shooting_hide_start || false;
  });

  // 設定変更時
  checkbox.addEventListener('change', () => {
    const isHidden = checkbox.checked;
    chrome.storage.local.set({ yt_shooting_hide_start: isHidden });

    // 現在のタブに設定を送信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleStartButton',
          hidden: isHidden
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Popup] 初期化開始');

  try {
    i18n = new window.YT_I18nManager();

    updateAllText();

    // 非同期でデータを読み込む
    await updateCoinDisplay();
    await updateStatsDisplay();

    setupTabs();
    setupLanguageSwitcher();
    await setupSettings();
    setupGameStart(); // ゲーム開始ボタンをセットアップ
    setupRefreshButton(); // 更新ボタンをセットアップ

    await renderSkins();
    await renderAchievements();

    console.log('[Popup] 初期化完了');
  } catch (error) {
    console.error('[Popup] 初期化エラー:', error);
  }
});

/**
 * 統計更新ボタンのセットアップ
 */
function setupRefreshButton() {
  const refreshBtn = document.getElementById('refresh-stats-btn');
  if (!refreshBtn) return;

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.textContent = '...';
    await updateStatsDisplay();
    await updateCoinDisplay();
    refreshBtn.textContent = '🔄';
  });
}
