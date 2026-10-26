/**
 * =========================================================================
 * 🎮 APP.JS - 四年級速成打字業務邏輯、UI 互動與跨電腦雲端同步核心
 * 🤖 AI 迭代維護指南：
 *    - 本模組包含四大模式狀態機 (錯字魔王、輔助字型、字母配對、極速手速賽)
 *    - 包含排行榜渲染 (renderLeaderboardTable, renderSpeedLeaderboardTable)
 *    - 包含 Webhook 雙向資料傳輸 (sendReliableWebhook, fetchCloudLeaderboard)
 * =========================================================================
 */

const SafeStorage = window.SafeStorage = {
  _mem: {},
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const v = window.localStorage.getItem(key);
        if (v !== null) return v;
      }
    } catch(e) {}
    return this._mem[key] !== undefined ? this._mem[key] : null;
  },
  setItem(key, val) {
    const strVal = String(val);
    this._mem[key] = strVal;
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, strVal);
    } catch(e) {}
  },
  removeItem(key) {
    delete this._mem[key];
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
    } catch(e) {}
  },
  getAllKeys() {
    const keysSet = new Set(Object.keys(this._mem));
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          keysSet.add(window.localStorage.key(i));
        }
      }
    } catch(e) {}
    return Array.from(keysSet);
  }
};

function inspectWebhookStatus() {
  const url = getGasWebhookUrl();
  const lastSync = (typeof lastCloudSyncTime !== 'undefined' && lastCloudSyncTime) ? lastCloudSyncTime.toLocaleString() : '尚未成功連通';
  const msg = [
    '【四年級雲端天梯連線診斷報告】',
    '',
    '1. 當前偵測到的 Webhook 網址:',
    url ? url : '⚠️ (未填寫或仍為範例預設值，處於安全本機離線模式)',
    '',
    '2. 最後成功同步時間:',
    lastSync,
    '',
    '💡 如需連通 Google 試算表（全自動背景同步）：',
    '① 打開「26-27_P4_錯字討伐小遊戲積分記錄表」試算表。',
    '② 點擊上方選單「擴充功能」>「Apps Script」，貼上後端程式碼。',
    '③ 點擊右上角「部署」>「新增部署」> 選擇「網頁應用程式」。',
    '   - 執行身分：我 (Me)',
    '   - 誰可以存取：任何人 (Anyone)',
    '④ 複製生成的 /exec 結尾網址，貼至 js/config.js 的 CONFIG.GAS_WEBHOOK_URL 中。',
    '⑤ 將 js/config.js 更新至 GitHub 倉庫，即可完成全自動背景同步！'
  ].join(String.fromCharCode(10));
  alert(msg);
}

function getGasWebhookUrl() {
  if (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.GAS_WEBHOOK_URL && !window.CONFIG.GAS_WEBHOOK_URL.includes('YourDeploymentIdHere')) {
    return window.CONFIG.GAS_WEBHOOK_URL.trim();
  }
  if (typeof CONFIG !== 'undefined' && CONFIG.GAS_WEBHOOK_URL && !CONFIG.GAS_WEBHOOK_URL.includes('YourDeploymentIdHere')) {
    return CONFIG.GAS_WEBHOOK_URL.trim();
  }
  return '';
}

// 📦 離線待補送佇列處理函式
async function flushPendingUploads() {
  const url = getGasWebhookUrl();
  if (!url) return;
  try {
    const rawPending = SafeStorage.getItem('p4_pending_uploads');
    if (!rawPending) return;
    const queue = JSON.parse(rawPending);
    if (!Array.isArray(queue) || queue.length === 0) return;

    SafeStorage.removeItem('p4_pending_uploads');
    for (const item of queue) {
      if (item && item.payload) {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          cache: 'no-cache',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(item.payload)
        }).catch(err => console.warn('補送失敗:', err));
        await new Promise(r => setTimeout(r, 400));
      }
    }
    console.log('✅ 已完成離線紀錄補送');
  } catch (e) {
    console.warn('處理補送佇列異常:', e);
  }
}

function generateRequestId() {
  return 'p4_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

let isFetchingCloudLeaderboard = false;
let lastCloudSyncTime = null;

async function sendReliableWebhook(payload) {
  const url = getGasWebhookUrl();
  if (!url) return;

  if (!payload.requestId) {
    payload.requestId = generateRequestId();
  }

  let success = false;
  // 🚀 即時重試機制：發生異常時進行 2 次重發嘗試 (間隔 1.2 秒)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1200));
      }
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      success = true;
      break;
    } catch (err) {
      console.warn(`第 ${attempt + 1} 次雲端上傳嘗試失敗:`, err);
    }
  }

  if (success) {
    setTimeout(() => {
      if (typeof fetchCloudLeaderboard === 'function') fetchCloudLeaderboard(true);
    }, 1500);
    setTimeout(() => {
      flushPendingUploads();
    }, 2000);
  } else {
    console.warn('雲端上傳暫時失敗，已安全移入待補送清單');
    try {
      const rawPending = SafeStorage.getItem('p4_pending_uploads');
      const queue = rawPending ? JSON.parse(rawPending) : [];
      queue.push({ payload, time: Date.now() });
      SafeStorage.setItem('p4_pending_uploads', JSON.stringify(queue.slice(-30)));
    } catch(e) {}
  }
}

async function fetchCloudLeaderboard(silent = false) {
  if (isFetchingCloudLeaderboard) return;
  const url = getGasWebhookUrl();
  if (!url) {
    // 即使在尚未配置雲端 Webhook 狀態下，點擊刷新也立即重繪本地最新手速天梯榜
    if (typeof renderLeaderboardTable === 'function') renderLeaderboardTable();
    if (typeof renderSpeedLeaderboardTable === 'function') renderSpeedLeaderboardTable();
    if (!silent) {
      inspectWebhookStatus();
    }
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    isFetchingCloudLeaderboard = true;
    if (!silent) showPassToast('⏳ 正在同步 Google 雲端試算表最新榮譽榜...');

    await new Promise(r => setTimeout(r, Math.random() * 300));

    const queryUrl = url + (url.includes('?') ? '&' : '?') + 'action=get_data&t=' + Date.now();
    const res = await fetch(queryUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('伺服器 HTTP 狀態碼: ' + res.status);

    const data = await res.json();
    if (data && data.status === 'success') {
      if (Array.isArray(data.combatLeaderboard) && data.combatLeaderboard.length > 0) {
        DATA.benchmark_leaderboard = data.combatLeaderboard.map(item => {
          const pts = (typeof item.grandTotal === 'number') ? item.grandTotal : 
                      ((typeof item.score === 'number') ? item.score : (parseInt(item.totalScore, 10) || 0));
          const badge = item.badge || item.title || '🥉【新手訓練家】';
          const time = item.lastTime || item.date || '';
          return {
            ...item,
            score: pts,
            grandTotal: pts,
            total: pts,
            title: badge,
            badge: badge,
            kills: (typeof item.kills === 'number') ? item.kills : 0,
            date: time,
            lastTime: time
          };
        });
        // ⚠️ 嚴格遵循規範：全級前40名龍虎榜（Tab 1）為第 5 周功課 1-4 成績榜（來源是 26-27_四年級_每周打字積分記錄檔案）
        // 排名條件為功課1-4總分(最高400分)及交齊時間，絕不能以錯字討伐魔王積分 (combatLeaderboard) 作為排名條件！
      }
      if (data.speedLeaderboard || data.speedByWeek || data.speedRecords) {
        DATA.cloud_speed_records = data.speedLeaderboard || data.speedByWeek || data.speedRecords;
      }
      // 僅在雲端明確提供 homeworkTop40 時才更新 DATA.top40，嚴禁使用 combatLeaderboard 覆蓋
      if (Array.isArray(data.homeworkTop40) && data.homeworkTop40.length > 0) {
        DATA.top40 = data.homeworkTop40;
      }
      if (data.class_top10) DATA.class_top10 = data.class_top10;
      if (data.perfect_students) DATA.perfect_students = data.perfect_students;

      if (data.weeklyBanks && typeof data.weeklyBanks === 'object' && Object.keys(data.weeklyBanks).length > 0) {
        const builtinBanks = (typeof MODE2_WEEKLY_BANKS !== 'undefined' && MODE2_WEEKLY_BANKS) ? MODE2_WEEKLY_BANKS : (window.MODE2_WEEKLY_BANKS || {});
        const mergedCloudBanks = Object.assign({}, data.weeklyBanks, builtinBanks);
        Object.keys(builtinBanks).forEach(k => {
          if (k.startsWith('w8_') || k.startsWith('w10_')) {
            mergedCloudBanks[k] = builtinBanks[k];
          } else if (builtinBanks[k] && builtinBanks[k].title && mergedCloudBanks[k]) {
            mergedCloudBanks[k].title = builtinBanks[k].title;
          }
        });
        window.MODE2_WEEKLY_BANKS = mergedCloudBanks;
            // 🛡️ 權威校本防護：防止雲端 Webhook 快取殘留或舊部署覆蓋導致字碼偏差
            Object.values(window.MODE2_WEEKLY_BANKS).forEach(b => {
              if (b && Array.isArray(b.words)) {
                b.words.forEach(w => {
                  if (w && w.char === '機') {
                    w.codes = ['木', '戈'];
                    w.keys = ['D', 'I'];
                    w.full = '木戈 (DI)';
                    w.cj_full = '木女戈戈 (DVII)';
                    w.secret = '速成首碼【木】(D) ＋ 尾碼【戈】(I)';
                  }
                });
              }
            });
        if (typeof initSpeedWeekDropdown === 'function') {
          try { initSpeedWeekDropdown(); } catch(e) {}
        }
        Object.values(window.MODE2_WEEKLY_BANKS).forEach(b => {
          if (b && Array.isArray(b.words)) {
            b.words.forEach(w => {
              if (typeof autoDeriveWordKeys === 'function') autoDeriveWordKeys(w);
            });
          }
        });
      }

      renderLeaderboardTable();
      renderSpeedLeaderboardTable();

      if (currentStudent) {
        try { loadStudentProfile(); } catch(e) {}
        try { renderSkillsHall(); } catch(e) {}
      }
      try { renderTop40(); } catch(e){}
      try { renderClassBarCharts(); } catch(e){}
      try { renderClassCards(); } catch(e){}
      try { renderPerfectScorers(); } catch(e){}

      lastCloudSyncTime = new Date();
      if (!silent) showPassToast('⚡ 雲端試算表最新榮譽榜已即時同步！');
    } else {
      throw new Error((data && data.message) ? data.message : '後端回傳格式非 success');
    }
  } catch(err) {
    clearTimeout(timeoutId);
    console.warn('雲端載入提醒 (自動維持本機安全離線模式):', err);
    if (typeof renderLeaderboardTable === 'function') renderLeaderboardTable();
    if (typeof renderSpeedLeaderboardTable === 'function') renderSpeedLeaderboardTable();
    if (!silent) showPassToast('⚠️ 雲端連線失敗: ' + (err.message || '權限或跨域阻擋'));
  } finally {
    isFetchingCloudLeaderboard = false;
  }
}

// =========================================================================
    // 🎮 全域遊戲狀態變數集中顯式宣告 (嚴格防止 ReferenceError)
    // =========================================================================
    let activeTab = 'top40';
    let currentLeaderboardType = 'combat';
    let speedLeaderboardWeek = 'w10_hw1';
    let speedLeaderboardWordCount = 10;
    let currentSpeedWeek = 'w10_hw1';
    let currentSpeedWordCount = 10;
    let isSpeedPracticeMode = false;
    let currentClass = 'P4A';
    let kioskInterval = null;
    let isKiosk = false;
    let speedWordList = [];
    let speedWordIdx = 0;
    let speedInputCodes = [];
    let speedStartTime = null;
    let speedTimerInterval = null;
    let speedPenaltySeconds = 0.0;
    let speedMistakes = 0;
    let speedTotalKeys = 0;
    let speedCorrectKeys = 0;
    let speedHintTimer = null;
    let speedActive = false;
    let speedWordReadyForSpace = false;
    let options = [];
    let roundMistakeCount = 0;

    // Confetti Engine
    function burstConfetti() {
      const canvas = document.getElementById('confetti-canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const pieces = [];
      const colors = ['#FACC15', '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316'];
      
      for (let i = 0; i < 95; i++) {
        pieces.push({
          x: canvas.width * 0.5,
          y: canvas.height * 0.35,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.7) * 18,
          size: Math.random() * 8 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 14,
          gravity: 0.35,
          opacity: 1
        });
      }
      
      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.rotation += p.vrot;
          p.opacity -= 0.009;
          
          if (p.opacity > 0) {
            alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
            ctx.restore();
          }
        });
        if (alive) requestAnimationFrame(render);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      render();
    }

const ThunderboltSFX = (function() {
    let sfxAudioCtx = null;
    let sfxBuffer = null;
    const fallbackPool = [];
    const POOL_SIZE = 4;
    let poolIdx = 0;

    function init() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          sfxAudioCtx = new AudioContextClass();
          fetch('audio/sfx_thunderbolt.mp3')
            .then(res => res.arrayBuffer())
            .then(buf => sfxAudioCtx.decodeAudioData(buf))
            .then(decoded => {
              sfxBuffer = decoded;
              console.log('[SFX] 十萬伏特 Web Audio 緩衝區預載解碼完成 (0ms 延遲就緒)');
            })
            .catch(err => {
              console.warn('[SFX] Web Audio 解碼失敗，使用 Audio 緩衝池備用:', err);
            });
        }
      } catch (e) {
        console.warn('[SFX] AudioContext 不支援:', e);
      }

      for (let i = 0; i < POOL_SIZE; i++) {
        try {
          const a = new Audio('audio/sfx_thunderbolt.mp3');
          a.preload = 'auto';
          fallbackPool.push(a);
        } catch (e) {}
      }

      const unlock = () => {
        if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
          sfxAudioCtx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', unlock, { capture: true, once: true });
      window.addEventListener('keydown', unlock, { capture: true, once: true });
      window.addEventListener('touchstart', unlock, { capture: true, once: true });
    }

    function play() {
      if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
        sfxAudioCtx.resume().catch(() => {});
      }
      // 軌道 1：Web Audio API (0ms 延遲、無上限多重重疊發聲)
      if (sfxAudioCtx && sfxBuffer) {
        try {
          const src = sfxAudioCtx.createBufferSource();
          src.buffer = sfxBuffer;
          const gain = sfxAudioCtx.createGain();
          gain.gain.value = 0.95;
          src.connect(gain);
          gain.connect(sfxAudioCtx.destination);
          src.start(0);
          return;
        } catch (err) {
          console.warn('[SFX] Web Audio 播放例外，降級至實體緩衝池:', err);
        }
      }

      // 軌道 2：實體 Audio 實體緩衝池輪播備用
      if (fallbackPool.length > 0) {
        try {
          const a = fallbackPool[poolIdx];
          poolIdx = (poolIdx + 1) % fallbackPool.length;
          a.currentTime = 0;
          a.play().catch(() => {});
        } catch (e) {}
      }
    }

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    }

    return { play, init };
  })();

  // ==========================================
  // 🎵 背景音樂管理器 (BGM Audio Manager)
  // ==========================================
  // 專為 GitHub Pages 串流優化，防卡頓、省流量、支援瀏覽器自動播放策略與靜音持久化
  const BgmManager = (function() {
    const TRACKS = {
      lobby: 'audio/bgm_lobby.mp3',             // 遊戲大廳及榮譽榜音樂
      siege_speed: 'audio/bgm_siege_speed.mp3', // 逃出恐怖屋 & 手速遊戲音樂
      stages: 'audio/bgm_stages.mp3'            // 一般關卡音樂 (標準抓寶、寵物、生存)
    };

    const audioElements = {};
    let currentTrackKey = null;
    let isMuted = true; // 預設關閉
    let userInteracted = false;
    let pendingTrackKey = 'lobby';

    function init() {
      try {
        const saved = SafeStorage.getItem('p6_bgm_muted');
        if (saved !== null) {
          isMuted = (saved === 'true' || saved === true); } else { isMuted = true;
        }
      } catch(e) {}

      Object.keys(TRACKS).forEach(key => {
        try {
          const audio = new Audio();
          audio.src = TRACKS[key];
          audio.preload = 'auto';
          audio.loop = true;
          audio.volume = 0.45;
          audio.addEventListener('error', (e) => {
            console.warn('[BGM] 音訊載入異常 (' + key + '):', e);
          });
          audio.addEventListener('ended', function() {
            if (!isMuted && currentTrackKey === key) {
              this.currentTime = 0;
              this.play().catch(() => {});
            }
          });
          audioElements[key] = audio;
        } catch (err) {
          console.warn('[BGM] 初始化音訊元素失敗 (' + key + '):', err);
        }
      });

      updateUiButton();

      const unlockAudio = () => {
        userInteracted = true;
        window.removeEventListener('click', unlockAudio, true);
        window.removeEventListener('keydown', unlockAudio, true);
        window.removeEventListener('touchstart', unlockAudio, true);
        if (!isMuted && pendingTrackKey) {
          playTrack(pendingTrackKey);
        }
      };
      window.addEventListener('click', unlockAudio, { capture: true, once: true });
      window.addEventListener('keydown', unlockAudio, { capture: true, once: true });
      window.addEventListener('touchstart', unlockAudio, { capture: true, once: true });
    }

    function playTrack(trackKey) {
      pendingTrackKey = trackKey;
      if (isMuted || !userInteracted) return;
      if (currentTrackKey === trackKey && audioElements[trackKey] && !audioElements[trackKey].paused) {
        return;
      }

      if (currentTrackKey && audioElements[currentTrackKey] && currentTrackKey !== trackKey) {
        const oldAudio = audioElements[currentTrackKey];
        try {
          oldAudio.pause();
          oldAudio.currentTime = 0;
        } catch(e) {}
      }

      currentTrackKey = trackKey;
      const newAudio = audioElements[trackKey];
      if (newAudio) {
        newAudio.volume = 0.45;
        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log('[BGM] 自動播放等待使用者互動:', err);
          });
        }
      }
    }

    function stopAll() {
      Object.keys(audioElements).forEach(key => {
        try {
          const a = audioElements[key];
          a.pause();
          a.currentTime = 0;
        } catch(e) {}
      });
      currentTrackKey = null;
    }

    function toggleMute() {
      isMuted = !isMuted;
      try {
        SafeStorage.setItem('p6_bgm_muted', isMuted);
      } catch(e) {}

      updateUiButton();

      if (isMuted) {
        stopAll();
        if (typeof showPassToast === 'function') showPassToast('🔇 背景音樂已關閉');
      } else {
        userInteracted = true;
        if (typeof showPassToast === 'function') showPassToast('🎵 背景音樂已開啟');
        if (pendingTrackKey) {
          playTrack(pendingTrackKey);
        } else {
          playTrack('lobby');
        }
      }
    }

    function updateUiButton() {
      const btn = document.getElementById('bgm-toggle-btn');
      if (btn) {
        btn.textContent = isMuted ? '🔇 音樂: 關' : '🎵 音樂: 開';
        btn.classList.toggle('bgm-muted', isMuted);
      }
    }

    function resumeCurrentTrack() {
      if (isMuted || !userInteracted) return;
      const track = currentTrackKey || pendingTrackKey || (currentGameMode === 'siege' || currentGameMode === 'speed' ? 'siege_speed' : 'lobby');
      const audio = audioElements[track];
      if (audio) {
        if (audio.paused) {
          audio.volume = 0.45;
          const p = audio.play();
          if (p !== undefined) p.catch(() => {});
        }
      } else {
        playTrack(track);
      }
    }

    return {
      init,
      playTrack,
      stopAll,
      toggleMute,
      updateUiButton,
      resumeCurrentTrack,
      getCurrentTrack: () => currentTrackKey,
      isMuted: () => isMuted
    };
  })();

  function toggleBgmMusic() {
    BgmManager.toggleMute();
  }



    // Helper: Deterministic pseudo-random Pokemon for students
    function getStudentPokemon(strId) {
      let hash = 0;
      for (let i = 0; i < strId.length; i++) {
        hash = (hash << 5) - hash + strId.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % DATA.pokemon_pool.length;
      return DATA.pokemon_pool[idx];
    }

    // Tab Switching
    function switchTab(tabId) {
      activeTab = tabId;
      document.querySelectorAll('.tab-btn').forEach(b => {
        const onclick = b.getAttribute('onclick') || '';
        b.classList.toggle('active', onclick.includes(tabId));
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      const targetPanel = document.getElementById('panel-' + tabId);
      if (targetPanel) targetPanel.classList.add('active');
      
      if (tabId === 'top40') {
        try { renderTop40(); } catch(e){ console.error(e); }
        try { renderClassBarCharts(); } catch(e){ console.error(e); }
      } else if (tabId === 'class') {
        try { renderClassCards(); } catch(e){ console.error(e); }
      } else if (tabId === 'perfect') {
        try { renderPerfectScorers(); } catch(e){ console.error(e); }
        try { renderClassBarCharts(); } catch(e){ console.error(e); }
      } else if (tabId === 'game') {
        if (currentStudent) {
          try { startNewSession(); } catch(e){ console.error(e); }
        } else {
          try { initLoginDropdowns(); } catch(e){ console.error(e); }
        }
      } else if (tabId === 'vocab') {
        try { renderVocabTable(); } catch(e){ console.error(e); }
      }
    }

    // Render Tab 1: Top 40 with Pikachu (#1), Charmander (#2), Bulbasaur (#3)
    
    // 📊 統計棒形圖 (Bar Chart) 生成組件
    function buildBarChartHtml(title, subtitle, dataList, maxVal, barGradient, totalBadge) {
      const barsHtml = dataList.map(item => {
        const pct = Math.max(12, Math.round((item.val / Math.max(1, maxVal)) * 100));
        return `
          <div class="chart-bar-col">
            <div class="chart-bar-val">${item.val} 人</div>
            <div class="chart-bar-pillar" style="height: ${pct}%; background: ${barGradient};" title="${item.cls}：${item.val} 人"></div>
            <div class="chart-bar-label">${item.cls}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="chart-container-card">
          <div class="chart-header">
            <div>
              <div class="chart-title">${title}</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 2px;">${subtitle}</div>
            </div>
            <div class="stat-pill" style="font-size: 12px; padding: 3px 10px; background: #F8FAFC; border-color: #CBD5E1;">
              <strong>${totalBadge}</strong>
            </div>
          </div>
          <div class="chart-bars-wrap">
            ${barsHtml}
          </div>
        </div>
      `;
    }

    function renderClassBarCharts() {
      const classes = ['P4A', 'P4B', 'P4C', 'P4D', 'P4E', 'P4F'];

      // 1. 各班入選前 40 名人數分佈統計
      const top40Counts = {};
      DATA.top40.forEach(s => top40Counts[s.cls] = (top40Counts[s.cls] || 0) + 1);
      let maxTop40 = 1;
      classes.forEach(c => {
        if ((top40Counts[c] || 0) > maxTop40) maxTop40 = top40Counts[c];
      });
      const top40Data = classes.map(c => ({ cls: c, val: top40Counts[c] || 0 }));
      const chartTop40El = document.getElementById('chart-top40-container');
      if (chartTop40El) {
        chartTop40El.innerHTML = buildBarChartHtml(
          '📊 各班入選全級前 40 名人數分佈 (統計棒形圖)',
          '統計 P4A 至 P4F 各班在全級前 40 名龍虎榜中所佔之傑出訓練家人數',
          top40Data,
          maxTop40,
          'linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)',
          '全級前40名合計：40 人'
        );
      }

      // 2. 各班 400 分大滿貫人數分佈統計
      let maxPerf = 1;
      let totalPerf = 0;
      const perfData = classes.map(c => {
        const count = (DATA.perfect_students[c] || []).length;
        if (count > maxPerf) maxPerf = count;
        totalPerf += count;
        return { cls: c, val: count };
      });
      const chartPerfEl = document.getElementById('chart-perfect-container');
      if (chartPerfEl) {
        chartPerfEl.innerHTML = buildBarChartHtml(
          '📊 各班 400 分大滿貫滿分人數分佈 (統計棒形圖)',
          '統計各班達成 4 次作業 400 分全滿分榮譽之訓練家人數',
          perfData,
          maxPerf,
          'linear-gradient(180deg, #FDE047 0%, #D97706 100%)',
          `全級滿分合計：${totalPerf} 人`
        );
      }
    }

    function renderTop40() {
      if (!DATA || !DATA.top40 || DATA.top40.length === 0) {
        const podiumArea = document.getElementById('podium-area');
        if (podiumArea) podiumArea.innerHTML = '<div style="text-align:center; padding:20px; color:#64748B; font-weight:800;">⏳ 榜單同步中，請稍候...</div>';
        const listArea = document.getElementById('top40-list');
        if (listArea) listArea.innerHTML = '<div style="text-align:center; padding:20px; color:#64748B;">目前暫無排行紀錄</div>';
        return;
      }
      const top1 = DATA.top40[0] || { name: '訓練家', cls: 'P4', num: 1, total: 400, badges: 5, date: '' };
      const top2 = DATA.top40[1] || { name: '訓練家', cls: 'P4', num: 2, total: 400, badges: 5, date: '' };
      const top3_item = DATA.top40[2] || { name: '訓練家', cls: 'P4', num: 3, total: 400, badges: 5, date: '' };
      const top3 = [top1, top2, top3_item];
      const rest = DATA.top40.slice(3);
      
      // Podium with Pikachu, Charmander, Bulbasaur
      const podiumArea = document.getElementById('podium-area');
      podiumArea.innerHTML = `
        <div class="podium-step podium-2">
          <div class="crown-banner">🥈</div>
          <img class="podium-pokemon-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png" alt="小火龍" title="小火龍 (Charmander) 🔥" onerror="handlePodiumImgError(this, '🔥')">
          <div class="podium-name">${top3[1].name}</div>
          <div class="podium-class">${top3[1].cls} (${top3[1].num}號) · 小火龍之火</div>
          <div class="podium-badge-score">400分 · 5印章</div>
          <div class="podium-time">⏱️ ${top3[1].date.replace('2026-', '')}</div>
        </div>
        <div class="podium-step podium-1">
          <div class="crown-banner">👑</div>
          <img class="podium-pokemon-img" style="width:88px; height:88px;" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="皮卡丘" title="皮卡丘 (Pikachu) ⚡" onerror="handlePodiumImgError(this, '⚡')">
          <div class="podium-name">${top3[0].name}</div>
          <div class="podium-class">${top3[0].cls} (${top3[0].num}號) · 皮卡丘雷霆</div>
          <div class="podium-badge-score">400分 · 5印章</div>
          <div class="podium-time">⏱️ ${top3[0].date.replace('2026-', '')}</div>
        </div>
        <div class="podium-step podium-3">
          <div class="crown-banner">🥉</div>
          <img class="podium-pokemon-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" alt="妙蛙種子" title="妙蛙種子 (Bulbasaur) 🍃" onerror="handlePodiumImgError(this, '🍃')">
          <div class="podium-name">${top3[2].name}</div>
          <div class="podium-class">${top3[2].cls} (${top3[2].num}號) · 妙蛙飛葉</div>
          <div class="podium-badge-score">400分 · 5印章</div>
          <div class="podium-time">⏱️ ${top3[2].date.replace('2026-', '')}</div>
        </div>
      `;

      // Render rank 4-40 (其中第 4 至 10 名配有璀璨閃爍光環與 TOP 10 榮譽特效)
      const restPool = DATA.pokemon_pool.slice(3);
      const listArea = document.getElementById('top40-list');
      listArea.innerHTML = rest.map((s, idx) => {
        const pm = restPool[idx % restPool.length];
        const isElite = (s.rank >= 4 && s.rank <= 10);
        return `
          <div class="rank-card ${isElite ? 'rank-card-elite-flash' : ''}" data-student="${s.cls}-${s.num}-${s.name}">
            <div class="rank-left">
              <div class="rank-poke-avatar" style="background:${pm.color}; border-color:${pm.border};" title="${pm.name}">
                <img class="rank-poke-img" src="${pm.img}" alt="${pm.name}" onerror="handleRankImgError(this, '${pm.icon || '⚡'}')">
              </div>
              <div>
                <div class="st-name">
                  #${s.rank} ${s.name} <span class="st-poke-tag">${pm.name}</span>
                  ${isElite ? '<span class="badge-elite-top10">✨ TOP 10 菁英</span>' : ''}
                </div>
                <div class="st-class">${s.cls} · ${s.num}號 · 夥伴：${pm.name} (${pm.tag})</div>
              </div>
            </div>
            <div class="rank-right">
              <div class="st-score">${s.total} 分</div>
              <div class="st-date">交齊: ${s.date.replace('2026-', '')}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Tab 2: Class Top 10 with Random Pokemon Avatars
    function switchClass(cls) {
      currentClass = cls;
      document.querySelectorAll('.cls-chip').forEach(c => {
        c.classList.toggle('active', c.textContent.includes(cls));
      });
      renderClassCards();
    }

    function renderClassCards() {
      const container = document.getElementById('class-cards');
      if (!container) return;
      const students = (DATA && DATA.class_top10 && DATA.class_top10[currentClass]) ? DATA.class_top10[currentClass] : [];
      if (students.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#64748B; font-weight:800;">目前該班暫無排行紀錄</div>';
        return;
      }
      const classOffset = ['P4A', 'P4B', 'P4C', 'P4D', 'P4E', 'P4F'].indexOf(currentClass) * 14;
      
      container.innerHTML = students.map((s, idx) => {
        const pm = DATA.pokemon_pool[(classOffset + idx) % DATA.pokemon_pool.length];
        let medal = '';
        let cardClass = 'rank-card';
        let honorBadge = '';

        // 各班前 10 名榮譽榜：前 3 名配置冠軍、亞軍、季軍專屬流光閃爍特效
        if (idx === 0) {
          medal = '🥇 ';
          cardClass += ' rank-card-class-champion';
          honorBadge = '<span class="badge-class-honor gold">👑 班級冠軍</span>';
        } else if (idx === 1) {
          medal = '🥈 ';
          cardClass += ' rank-card-class-runnerup';
          honorBadge = '<span class="badge-class-honor silver">🥈 班級亞軍</span>';
        } else if (idx === 2) {
          medal = '🥉 ';
          cardClass += ' rank-card-class-third';
          honorBadge = '<span class="badge-class-honor bronze">🥉 班級季軍</span>';
        }

        return `
          <div class="${cardClass}" data-student="${currentClass}-${s.num}-${s.name}">
            <div class="rank-left">
              <div class="rank-poke-avatar" style="background:${pm.color}; border-color:${pm.border};" title="${pm.name}">
                <img class="rank-poke-img" src="${pm.img}" alt="${pm.name}" onerror="handleRankImgError(this, '${pm.icon || '⚡'}')">
              </div>
              <div>
                <div class="st-name">
                  ${medal}#${s.rank} ${s.name} <span class="st-poke-tag">${pm.name}</span>
                  ${honorBadge}
                </div>
                <div class="st-class">${currentClass} · ${s.num}號 · 夥伴：${pm.name} (${pm.tag})</div>
              </div>
            </div>
            <div class="rank-right">
              <div class="st-score">${s.total} 分</div>
              <div class="st-date">⏱️ ${s.date.replace('2026-', '')}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Tab 3: Perfect Scorers with Random Pokemon Avatars
        function renderPerfectScorers() {
      const container = document.getElementById('perfect-class-groups');
      if (!container) return;
      const classes = ['P4A', 'P4B', 'P4C', 'P4D', 'P4E', 'P4F'];
      let globalCounter = 0;
      
      container.innerHTML = classes.map(cls => {
        const members = (DATA && DATA.perfect_students && DATA.perfect_students[cls]) ? DATA.perfect_students[cls] : [];
        return `
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 18px; font-weight: 900; color: #1E3A8A;">● ${cls} 班</span>
              <span style="background: #DBEAFE; color: #1D4ED8; font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 12px;">共 ${members.length} 位滿分</span>
            </div>
            <div class="perfect-grid">
              ${members.map((m) => {
                const pm = DATA.pokemon_pool[(globalCounter++) % DATA.pokemon_pool.length];
                return `
                  <div class="star-card" data-student="${cls}-${m}">
                    <div class="star-avatar" title="${pm.name}">
                      <img class="star-poke-img" src="${pm.img}" alt="${pm.name}" onerror="handleRankImgError(this, '${pm.icon || '⭐'}')">
                    </div>
                    <div class="star-name">${m}</div>
                    <div class="star-cls">${pm.name} · 400分</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Tab 5: Vocab Table
    function renderVocabTable() {
      const tbody = document.getElementById('vocab-tbody');
      tbody.innerHTML = DATA.cangjie_words.map((w, idx) => `
        <tr>
          <td style="font-weight: 800; color: #1E3A8A;">第 ${idx + 1} 名</td>
          <td style="font-size: 22px; font-weight: 900; color: #DC2626;">${w.char}</td>
          <td style="font-weight: 800;">${w.count} 人次</td>
          <td style="color: #64748B;">${w.hw}</td>
          <td><span style="background: #DBEAFE; color: #1D4ED8; padding: 3px 8px; border-radius: 6px; font-weight: 800;">${w.first_code} (${w.first_key}) ＋ ${w.last_code} (${w.last_key})</span></td>
          <td style="text-align: left; font-size: 12px; color: #334155;">${w.secret}</td>
        </tr>
      `).join('');
    }

    
    // =========================================================================
    // 🎮 寶可夢隨機遊行抓寶小遊戲 · 5關挑戰、零假分、首尾同碼修復與平穩數值
    // =========================================================================

    

    var isTeacherMode = false;
    window.isTeacherMode = false;
    let currentStudent = null;       // { cls, num, name }
    let gameStage = 1;               // 5 關挑戰制：當前關卡 (1..5)
    let sessionScore = 0;            // 當前輪次累積得分
    let sessionCorrectCount = 0;     // 當前輪次答對關數
    let comboCount = 0;              // 連擊次數
    let selectedFirst = null;        // { code, key, char }
    let selectedLast = null;         // { code, key, char }
    let currentQuiz = null;
    let activeSkills = [];           // 已解鎖技能
    let roundShieldActive = false;   // 本回合聖盾
    let autoNextTimer = null;        // 模式2與模式3過關自動跳轉計時器
    let wanderingSpeedMultiplier = 1.0;

    // 浮動通關通知橫幅
    function triggerStagePassToast(modeLabel, stageNum, scoreEarned, nextStageNum) {
      const toast = document.getElementById('stage-pass-toast');
      const icon = document.getElementById('stage-pass-toast-icon');
      const text = document.getElementById('stage-pass-toast-text');
      if (!toast) return;

      icon.textContent = nextStageNum ? '🎉' : '🏆';
      if (nextStageNum) {
        text.innerHTML = `<strong>${modeLabel}</strong> 第 ${stageNum} 關 通關成功！<span style="color:#FEF08A;font-weight:900;">+${scoreEarned} 分</span> ➔ 自動進入第 ${nextStageNum} 關...`;
      } else {
        text.innerHTML = `<strong>${modeLabel}</strong> 5 關挑戰全數通關！<span style="color:#FEF08A;font-weight:900;">+${scoreEarned} 分</span> ➔ 正在進行總結算...`;
      }
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 1600);
    }
    let animationFrameId = null;
    let activeOrbs = [];             // 畫面上的遊行球物體集合
    let currentGameMode = 'typo';    // 'typo' | 'aux' | 'letter'

    // 切換三大模式
    function renderModeTabs() {
      const container = document.querySelector('.mode-tab-bar');
      if (!container || typeof P4Mode === 'undefined') return;

      const isTeacher = (typeof isTeacherMode !== 'undefined' && isTeacherMode) || (typeof window !== 'undefined' && window.isTeacherMode);
      const student = currentStudent || null;
      const cls = student ? student.cls : null;
      const num = student ? student.num : null;
      const modes = P4Mode.all();
      const dailyScore = P4Mode.getDailyEarnedScore(cls, num);

      // 🔒 檢查當前活躍模式是否合法：若非測試特權且當前選中模式處於鎖定狀態，安全退回站1 (typo)
      if (!isTeacher && currentGameMode) {
        const curUnlock = P4Mode.getUnlockStatus(currentGameMode, cls, num, isTeacher);
        if (!curUnlock.unlocked) {
          currentGameMode = 'typo';
          if (typeof setGameMode === 'function') {
            setTimeout(() => { setGameMode('typo'); }, 0);
          }
        }
      }

      let html = '';
      modes.forEach(m => {
        const unlock = P4Mode.getUnlockStatus(m.id, cls, num, isTeacher);
        const isActive = (currentGameMode === m.id);
        const isLocked = !unlock.unlocked;

        let lockClass = '';
        let badgeHtml = '';
        let circleHtml = '';

        if (m.line === 'challenge') {
          circleHtml = `<span class="mode-circle-challenge">挑戰</span>`;
          badgeHtml = `<span class="mode-badge-pill mode-badge-speed">${m.badge}</span>`;
        } else {
          circleHtml = `<span class="mode-circle-num">${m.circle || m.order}</span>`;
          if (isLocked) {
            lockClass = 'locked hard-locked';
            badgeHtml = `<span class="mode-badge-pill mode-badge-locked">🔒 差 ${unlock.neededScore} 分</span>`;
          } else {
            badgeHtml = `<span class="mode-badge-pill mode-badge-done">✓ ${m.badge}</span>`;
          }
        }

        html += `
          <button id="mode-tab-${m.id}" class="mode-tab-btn ${isActive ? 'active' : ''} ${lockClass}" 
                  onclick="setGameMode('${m.id}')" title="${m.note || m.name}">
            ${circleHtml}
            <span>${m.icon}</span> <span>${m.name}</span>
            ${badgeHtml}
          </button>
        `;
      });

      container.innerHTML = html;

      // 📖 動態更新常駐計分說明橫條 (主線全解 vs 未全解狀態即時響應)
      const bannerEl = document.getElementById('scoring-note-banner');
      if (bannerEl && typeof P4Mode !== 'undefined') {
        const isAllUnlocked = P4Mode.isMainLineFullyUnlocked(cls, num, isTeacher);
        if (isAllUnlocked) {
          bannerEl.style.background = '#ECFDF5';
          bannerEl.style.borderColor = '#A7F3D0';
          bannerEl.style.color = '#065F46';
          bannerEl.innerHTML = `🎉 <strong>主線全解鎖特權已啟動！</strong>第 4 站【逃出恐怖屋】(基礎分×1.2) 全面解除限制，按原設定正常無限獲取積分！其他前置站次維持每日防刷分規則。`;
        } else {
          bannerEl.style.background = '#FFFBEB';
          bannerEl.style.borderColor = '#FDE68A';
          bannerEl.style.color = '#B45309';
          bannerEl.innerHTML = `📖 <strong>計分規則</strong>：主線未全解時，前置關卡按防刷分規則計分（第 1 次全額，第 2 次一半，第 3 次四分之一，第 4 次起為練習不加分）；當主線全解時，第 4 站【逃出恐怖屋】解除限制並按原設定無限獲取積分！其他前置站次維持每日防刷分規則。`;
        }
      }
    }

    

function setGameMode(mode) {
      // 🔒 1. 每日階梯式解鎖鏈嚴格安全檢查（未解鎖時堅決阻斷！不可切換、不可進入、不可得分）
      const isTeacher = (typeof isTeacherMode !== 'undefined' && isTeacherMode) || (typeof window !== 'undefined' && window.isTeacherMode);
      if (typeof P4Mode !== 'undefined' && !isTeacher) {
        const student = currentStudent || null;
        const cls = student ? student.cls : null;
        const num = student ? student.num : null;
        const unlock = P4Mode.getUnlockStatus(mode, cls, num, isTeacher);
        if (!unlock.unlocked) {
          const needed = unlock.neededScore;
          const prevStation = unlock.prevStationName || '前置關卡';
          const tip = `🔒 本關尚未解鎖！今日還差 ${needed} 分（需先完成【${prevStation}】，今日累積滿 ${unlock.threshold} 分開啟）`;
          if (typeof showPassToast === 'function') {
            showPassToast(tip);
          }
          return false; // 🚫 堅決阻斷！不切換模式、不啟動戰局、不變更 UI！
        }
      }

      if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }
      if (speedTimerInterval) clearInterval(speedTimerInterval);
      if (speedHintTimer) clearTimeout(speedHintTimer);
      if (typeof siegeAnimId !== 'undefined' && siegeAnimId) { cancelAnimationFrame(siegeAnimId); siegeAnimId = null; }
      if (typeof siegeTimeInterval !== 'undefined' && siegeTimeInterval) { clearInterval(siegeTimeInterval); siegeTimeInterval = null; }

      if (typeof handleSpeedKeydown === 'function') window.removeEventListener('keydown', handleSpeedKeydown, true);
      if (typeof handleSiegeKeydown === 'function') window.removeEventListener('keydown', handleSiegeKeydown, true);

      speedActive = false;
      speedRunning = false;
      siegeActive = false;
      siegeRunning = false;
      siegeIsPaused = false;

      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }

      currentQuiz = null;
      currentGameMode = mode;

      try {
        if (typeof BgmManager !== 'undefined') {
          if (mode === 'siege' || mode === 'speed') {
            BgmManager.playTrack('siege_speed');
          } else {
            BgmManager.playTrack('stages');
          }
        }
      } catch(e) {}

      // (解鎖鏈檢查已前置至函式入口徹底防禦)

      renderModeTabs();

      const speedSection = document.getElementById('speed-arena-section');
      const siegeSection = document.getElementById('siege-arena-section');
      const wildArena = document.getElementById('capture-arena');
      const monsterIcon = document.getElementById('monster-icon');
      const targetSubHint = document.getElementById('target-sub-hint');
      const standardSlots = document.getElementById('slots-row') || document.getElementById('standard-slots-row');
      const secretBox = document.getElementById('secret-box');
      const targetChar = document.getElementById('target-char');
      const gamePrompt = document.getElementById('game-prompt');

      if (mode === 'siege') {
        if (speedSection) speedSection.style.display = 'none';
        if (wildArena) wildArena.style.display = 'none';
        if (monsterIcon) monsterIcon.style.display = 'none';
        if (targetSubHint) targetSubHint.style.display = 'none';
        if (standardSlots) standardSlots.style.display = 'none';
        if (secretBox) secretBox.style.display = 'none';
        if (targetChar) targetChar.style.display = 'none';
        if (gamePrompt) gamePrompt.style.display = 'none';
        if (siegeSection) siegeSection.style.display = 'block';

        launchSiegeMatch();
        return;
      }

      if (mode === 'speed') {
        if (siegeSection) siegeSection.style.display = 'none';
        if (speedSection) speedSection.style.display = 'block';
        if (wildArena) wildArena.style.display = 'none';
        if (monsterIcon) monsterIcon.style.display = 'none';
        if (targetSubHint) targetSubHint.style.display = 'none';
        if (standardSlots) standardSlots.style.display = 'none';
        if (secretBox) secretBox.style.display = 'none';
        if (targetChar) targetChar.style.display = 'none';
        if (gamePrompt) gamePrompt.style.display = 'none';

        initSpeedWeekDropdown();
        returnToSpeedReadyStage();

        window.addEventListener('keydown', handleSpeedKeydown, true);
        return;
      }

      // 模式 1、2、3 (typo, aux, letter)
      if (siegeSection) siegeSection.style.display = 'none';
      if (speedSection) speedSection.style.display = 'none';
      if (wildArena) wildArena.style.display = 'block';
      if (monsterIcon) monsterIcon.style.display = 'block';
      if (targetSubHint) targetSubHint.style.display = 'block';
      if (standardSlots) standardSlots.style.display = 'flex';
      if (targetChar) targetChar.style.display = 'block';
      if (gamePrompt) gamePrompt.style.display = 'block';

      startNewSession();
    }


function initLoginDropdowns() {
      const numSelect = document.getElementById('login-num-select');
      if (numSelect && (!numSelect.options || numSelect.options.length === 0)) {
        let opts = '';
        for (let i = 1; i <= 36; i++) {
          opts += `<option value="${i}">${i} 號</option>`;
        }
        numSelect.innerHTML = opts;
      }
      updateIdentityPreview();
    }

    // 2. 即時比對姓名預覽 (Zero-PII)
    function updateIdentityPreview() {
      const cls = document.getElementById('login-class-select').value;
      const num = parseInt(document.getElementById('login-num-select').value);
      let name = "訓練家";
      if (!CONFIG.GITHUB_PRIVACY_MODE && DATA.roster && DATA.roster[cls] && DATA.roster[cls][num]) {
        name = DATA.roster[cls][num];
      }
      const previewEl = document.getElementById('preview-student-name');
      if (previewEl) previewEl.textContent = `${cls} 班 ${num} 號 - ${name}`;
    }

    // 3. 彈出確認身份視窗
    function openIdentityConfirmModal() {
      const cls = document.getElementById('login-class-select').value;
      const num = parseInt(document.getElementById('login-num-select').value);
      let name = "訓練家";
      if (!CONFIG.GITHUB_PRIVACY_MODE && DATA.roster && DATA.roster[cls] && DATA.roster[cls][num]) {
        name = DATA.roster[cls][num];
      }

      document.getElementById('modal-confirm-class').textContent = `${cls} 班`;
      document.getElementById('modal-confirm-num').textContent = `${num} 號`;
      document.getElementById('modal-confirm-name').textContent = name;

      document.getElementById('modal-confirm').style.display = 'flex';
    }

    // 4. 確認並開始遊戲
    function confirmAndStartGame() {
      closeModal('modal-confirm');
      const cls = document.getElementById('login-class-select').value;
      const num = parseInt(document.getElementById('login-num-select').value);
      let name = "訓練家";
      if (!CONFIG.GITHUB_PRIVACY_MODE && DATA.roster && DATA.roster[cls] && DATA.roster[cls][num]) {
        name = DATA.roster[cls][num];
      }

      currentStudent = { cls, num, name };
      SafeStorage.setItem('p4_active_student', JSON.stringify(currentStudent));

      loadStudentProfile();

      document.getElementById('identity-section').style.display = 'none';
      document.getElementById('battle-section').style.display = 'block';

      startNewSession();
      burstConfetti();
    }

    // 5. 切換身份
    function switchIdentity() {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      currentStudent = null;
      SafeStorage.removeItem('p4_active_student');
      document.getElementById('battle-section').style.display = 'none';
      document.getElementById('identity-section').style.display = 'block';
      initLoginDropdowns();
    }

    // 6. 讀取與計算學生戰報 (三模式分項記錄)
        // 🎈 浮動扣分與罰時標籤動畫生成器
    function triggerFloatingNotice(targetEl, text) {
      if (!targetEl) return;
      const rect = targetEl.getBoundingClientRect();
      const tag = document.createElement('div');
      tag.className = 'floating-deduct-tag';
      tag.textContent = text;
      tag.style.left = (rect.left + rect.width / 2) + 'px';
      tag.style.top = rect.top + 'px';
      document.body.appendChild(tag);
      setTimeout(() => tag.remove(), 850);
    }

    function getStudentStats(cls, num) {
      const key = `p4_score_${cls}_${num}`;
      const saved = SafeStorage.getItem(key);
      let stats = {
        totalScore: 0, kills: 0,
        typoScore: 0, typoKills: 0,
        auxScore: 0, auxKills: 0,
        letterScore: 0, letterKills: 0,
        siegeScore: 0, siegeKills: 0, siegeClears: 0,
        speedScore: 0, speedKills: 0
      };
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          Object.assign(stats, parsed);
        } catch(e) {}
      }

      // 🛡️ 雙向同步：從雲端榜單/基準資料庫獲取最新試算表真實累計總分與擊破數
      if (typeof DATA !== 'undefined' && Array.isArray(DATA.benchmark_leaderboard)) {
        const padNum = parseInt(num, 10);
        const cloudMatch = DATA.benchmark_leaderboard.find(item => 
          item.cls === cls && parseInt(item.num, 10) === padNum
        );
        if (cloudMatch) {
          const cloudPts = (typeof cloudMatch.grandTotal === 'number') ? cloudMatch.grandTotal : 
                           ((typeof cloudMatch.score === 'number') ? cloudMatch.score : (parseInt(cloudMatch.totalScore, 10) || 0));
          if (cloudPts > stats.totalScore) {
            stats.totalScore = cloudPts;
          }
          if (cloudMatch.kills && cloudMatch.kills > stats.kills) {
            stats.kills = cloudMatch.kills;
          }
        }
      }
      return stats;
    }

    function saveStudentStats(cls, num, addScore, addKill, mode, bestTime = null, wordCount = 10, weekKey = null) {
      if (!weekKey) {
        const actWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        weekKey = `${actWk}_hw1`;
      }
      const isTeacherCheck = (typeof isTeacherMode !== 'undefined' && isTeacherMode) || (typeof window !== 'undefined' && window.isTeacherMode);
      if (typeof P4Mode !== 'undefined' && !isTeacherCheck && mode !== 'speed') {
        const unlock = P4Mode.getUnlockStatus(mode, cls, num, isTeacherCheck);
        if (!unlock.unlocked) {
          console.warn('Blocked score submission for locked mode:', mode);
          return;
        }
      }
      const current = getStudentStats(cls, num);
      const updated = {
        totalScore: current.totalScore + addScore,
        kills: current.kills + (addKill ? 1 : 0),
        typoScore: current.typoScore + (mode === 'typo' ? addScore : 0),
        typoKills: current.typoKills + (mode === 'typo' && addKill ? 1 : 0),
        auxScore: current.auxScore + (mode === 'aux' ? addScore : 0),
        auxKills: current.auxKills + (mode === 'aux' && addKill ? 1 : 0),
        letterScore: current.letterScore + (mode === 'letter' ? addScore : 0),
        letterKills: current.letterKills + (mode === 'letter' && addKill ? 1 : 0),
        siegeScore: (current.siegeScore || 0) + (mode === 'siege' ? addScore : 0),
        siegeKills: (current.siegeKills || 0) + (mode === 'siege' && addKill ? 1 : 0),
        siegeClears: (current.siegeClears || 0) + (mode === 'siege' && addKill ? 1 : 0),
        speedScore: (current.speedScore || 0) + (mode === 'speed' ? addScore : 0),
        speedKills: (current.speedKills || 0) + (mode === 'speed' && addKill ? 1 : 0),
        lastMode: mode,
        lastTime: new Date().toISOString()
      };
      SafeStorage.setItem(`p4_score_${cls}_${num}`, JSON.stringify(updated));

      // 同步內存基準排行榜資料，使學生切換分頁或打開技能館時立即感知最新總分與手速成績
      if (typeof DATA !== 'undefined' && Array.isArray(DATA.benchmark_leaderboard)) {
        const padNum = parseInt(num, 10);
        const match = DATA.benchmark_leaderboard.find(item => item.cls === cls && parseInt(item.num, 10) === padNum);
        if (match) {
          match.score = updated.totalScore;
          match.grandTotal = updated.totalScore;
          match.total = updated.totalScore;
          match.kills = updated.kills;
          if (mode === 'speed' && bestTime) {
            match.weekly_speed = match.weekly_speed || {};
            if (!match.weekly_speed[weekKey] || bestTime < match.weekly_speed[weekKey]) {
              match.weekly_speed[weekKey] = bestTime;
            }
            if (wordCount === 10) {
              if (!match.best10 || bestTime < match.best10) {
                match.best10 = bestTime;
              }
            }
          }
        }
      }

      // 同步記憶體雲端手速快取
      if (mode === 'speed' && bestTime && typeof DATA !== 'undefined') {
        if (!DATA.cloud_speed_records) DATA.cloud_speed_records = {};
        if (!DATA.cloud_speed_records[weekKey]) DATA.cloud_speed_records[weekKey] = [];
        const existing = DATA.cloud_speed_records[weekKey].find(x => x.cls === cls && parseInt(x.num, 10) === parseInt(num, 10));
        if (existing) {
          if (!existing.bestTime || bestTime < existing.bestTime) {
            existing.bestTime = bestTime;
            existing.best10 = bestTime;
            existing.cpm = Math.round(10 / (bestTime / 60));
            existing.tier = getSpeedTier(bestTime, 10);
          }
        } else {
          DATA.cloud_speed_records[weekKey].push({
            cls: cls,
            num: parseInt(num, 10),
            name: `${cls} ${(parseInt(num, 10) < 10 ? '0' : '') + parseInt(num, 10)}號`,
            bestTime: bestTime,
            best10: bestTime,
            cpm: Math.round(10 / (bestTime / 60)),
            accuracy: 100,
            tier: getSpeedTier(bestTime, 10),
            weekKey: weekKey
          });
        }
      }

      if (typeof P4Mode !== 'undefined' && addScore > 0) {
        P4Mode.addDailyEarnedScore(cls, num, addScore);
        P4Mode.recordStationPlay(mode, cls, num);
      }
      if (typeof loadStudentProfile === 'function') {
        try { loadStudentProfile(); } catch(e) {}
      }
      if (typeof renderModeTabs === 'function') {
        try { renderModeTabs(); } catch(e) {}
      }
      if (typeof renderSkillsHall === 'function') {
        try { renderSkillsHall(); } catch(e) {}
      }
      if (mode === 'speed' && typeof renderSpeedLeaderboardTable === 'function') {
        try { renderSpeedLeaderboardTable(); } catch(e) {}
      }

      // 背景發送可靠 Webhook 至 Google Apps Script
      sendReliableWebhook({
        grade: 4,
        cls: cls,
        num: num,
        roundScore: addScore,
        scoreDelta: addScore,
        gameMode: mode,
        mode: mode,
        bestTime: bestTime,
        wordCount: wordCount,
        weekKey: weekKey,
        totalScore: updated.totalScore,
        kills: updated.kills,
        timestamp: updated.lastTime
      });

      return updated;
    }

    function sendWebhookScoreUpdate(cls, num, roundScore, totalKills, mode) {
      if (!CONFIG.GAS_WEBHOOK_URL || CONFIG.GAS_WEBHOOK_URL.includes("YourDeploymentIdHere")) {
        return;
      }
      const payload = {
        cls: cls,
        num: num,
        roundScore: roundScore,
        kills: totalKills,
        gameMode: mode || 'typo',
        name: currentStudent ? currentStudent.name : "",
        timestamp: new Date().toISOString()
      };

      try {
        fetch(CONFIG.GAS_WEBHOOK_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(() => {}).catch(err => {});
      } catch (err) {}
    }

    function triggerSkillToast(icon, text) {
      const toast = document.getElementById('skill-toast');
      document.getElementById('skill-toast-icon').textContent = icon;
      document.getElementById('skill-toast-text').textContent = text;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }

    // 7. 開啟新一輪 5 關挑戰
    
    

// --- B. 逃出恐怖屋・野生寶可夢突圍戰 (無上限階梯 + 1-10級當周字庫/11級後全字庫真隨機 + 十萬伏特按鍵2) ---
    let siegeActive = false;
    let siegeRunning = false;
    let siegeIsPaused = false;
    let siegeHp = 100;
    let siegeMaxHp = 100;
    let siegeLevel = 1;
    let siegeWave = 1; // 嚴格等於 siegeLevel
    let siegeKills = 0;
    let siegeKillsInLevel = 0;
    let siegeExpNeeded = 3;
    let siegeMisses = 0;
    let siegeScore = 0;
    let siegePotionsCount = 0;
    let siegeSeconds = 0;
    let siegeTimeInterval = null;
    let siegeEnemies = [];
    let siegeParticles = [];
    let siegeLightnings = [];
    let siegeHealParticles = [];
    let siegeAnimId = null;
    let siegeTargetEnemy = null;
    let siegeCandidateEnemies = [];
    let siegeLastKey = null;
    // 👑 Boss 戰系統狀態變數 (Wave 5 / Wave 10 雙階霸主機制)
    let currentBoss = null;
    let siegeDodgeActive = false;
    let siegeDodgeWord = null;
    let siegeDodgeTypedIdx = 0;
    let siegeDodgeTimer = 0;
    let siegeDodgeMaxTimer = 5.0;
    let siegeDodgeInterval = null;
    let siegeUltCharge = 0;
    let siegeBarrierHitTimer = 0;
    let siegeIsSpawningSquad = false;
    let siegeDashOffset = 0;
    let siegeWordQueue = []; // 真隨機題庫抽取隊列
    let recentSiegeWordHistory = []; // 近期已抽題目防重快取 (容量 40 字)
    let siegeLastPoolWaveType = 0; // 記錄前次題庫波次模式 (<=10 或 >10)

    function drawUniqueSiegeWord() {
      const curWaveType = (siegeWave > 10) ? 2 : 1;
      // 若波次跨越第 10 波進入第 11+ 波，立即刷新題庫隊列為全週次 686 字大牌堆
      if (curWaveType !== siegeLastPoolWaveType) {
        siegeWordQueue = [];
        siegeLastPoolWaveType = curWaveType;
      }

      if (!siegeWordQueue || siegeWordQueue.length === 0) {
        const fullPool = getSiegeWordPool(siegeWave, siegeLevel);
        siegeWordQueue = secureFisherYatesShuffle(fullPool);
      }

      // 提取畫面上所有活躍怪獸已攜帶的漢字，防止同屏撞字
      const onScreenChars = new Set();
      if (Array.isArray(siegeEnemies)) {
        siegeEnemies.forEach(e => {
          if (e && e.word && e.word.char) onScreenChars.add(e.word.char);
          if (e && e.wordsQueue && Array.isArray(e.wordsQueue)) {
            e.wordsQueue.forEach(w => { if (w && w.char) onScreenChars.add(w.char); });
          }
        });
      }

      // 從洗牌隊列中尋找非同屏且不在近期重覆緩衝區的漢字
      let chosen = null;
      let searched = 0;
      while (siegeWordQueue.length > 0 && searched < siegeWordQueue.length) {
        const candidate = siegeWordQueue.pop();
        searched++;
        if (!candidate || !candidate.char) continue;

        // 若畫面上已有該字，暫時放回隊列底部
        if (onScreenChars.has(candidate.char)) {
          siegeWordQueue.unshift(candidate);
          continue;
        }

        // 若在最近 40 次抽取歷史中，且隊列尚有餘裕，亦暫緩使用
        if (recentSiegeWordHistory.includes(candidate.char) && siegeWordQueue.length > 15) {
          siegeWordQueue.unshift(candidate);
          continue;
        }

        chosen = candidate;
        break;
      }

      // 若隊列過度擁擠則強行彈出或兜底重新洗牌
      if (!chosen) {
        if (siegeWordQueue.length === 0) {
          const fullPool = getSiegeWordPool(siegeWave, siegeLevel);
          siegeWordQueue = secureFisherYatesShuffle(fullPool);
        }
        chosen = siegeWordQueue.pop() || { char: '鬼', codes: ['竹', '山'], keys: ['H', 'U'] };
      }

      // 🛡️ 權威真值覆蓋 (P4_MASTER_QUICK_OVERRIDES)：確保六大核心生字及特殊字碼絕對準確
      const ovMap = (typeof P4_MASTER_QUICK_OVERRIDES !== 'undefined') ? P4_MASTER_QUICK_OVERRIDES : (typeof window !== 'undefined' ? window.P4_MASTER_QUICK_OVERRIDES : (typeof global !== 'undefined' ? global.P4_MASTER_QUICK_OVERRIDES : null));
      if (ovMap && chosen && chosen.char && ovMap[chosen.char]) {
        const ov = ovMap[chosen.char];
        chosen.codes = ov.codes.slice();
        chosen.keys = ov.keys.slice();
        chosen.first_code = ov.first_code;
        chosen.last_code = ov.last_code;
        chosen.first_key = ov.first_key;
        chosen.last_key = ov.last_key;
        chosen.full = ov.full;
        chosen.secret = ov.secret;
        if (ov.cj_full) chosen.cj_full = ov.cj_full;
      }

      // 🛡️ 權威真值校正：以《2026每周打字字庫表》> cj3-30000.txt > cj3-special.txt 刷新字碼
      const getAuthFn = (typeof getAuthoritativeCj3 === 'function') ? getAuthoritativeCj3 : (typeof window !== 'undefined' ? window.getAuthoritativeCj3 : null);
      if (typeof getAuthFn === 'function' && chosen && chosen.char) {
        const auth = getAuthFn(chosen.char);
        if (auth) {
          if (auth.codes) chosen.codes = auth.codes.slice();
          if (auth.keys) chosen.keys = auth.keys.slice();
          if (auth.full) chosen.full = auth.full;
          if (auth.secret) chosen.secret = auth.secret;
          if (auth.quickCode) chosen.quickCode = auth.quickCode;
        }
      }

      // 記入近期歷史快取 (最長 40 筆)
            // 🛡️ 四年級速成輸入法專屬取碼規則（首碼＋尾碼）
      if (chosen) {
        if (!chosen.keys && chosen.first_key && chosen.last_key) {
          chosen.keys = (chosen.first_key === chosen.last_key && chosen.first_code === chosen.last_code && (!chosen.cj_full || chosen.cj_full.length <= 6))
            ? [chosen.first_key]
            : [chosen.first_key, chosen.last_key];
          chosen.codes = [chosen.first_code, chosen.last_code];
        } else if (chosen.keys && Array.isArray(chosen.keys) && chosen.keys.length > 2) {
          chosen.keys = [chosen.keys[0], chosen.keys[chosen.keys.length - 1]];
          if (chosen.codes && Array.isArray(chosen.codes) && chosen.codes.length > 2) {
            chosen.codes = [chosen.codes[0], chosen.codes[chosen.codes.length - 1]];
          }
        }
      }
      recentSiegeWordHistory.push(chosen.char);
      if (recentSiegeWordHistory.length > 40) recentSiegeWordHistory.shift();

      return chosen;
    }
    let siegeUltToastShown = false;

    // 招式效果
    let siegeLearnedMoves = [];
    let siegeBonusScore = 0;
    let siegeUltChargeRate = 1.0;
    let siegeLightningChains = 0;
    let siegeBarrierShieldCount = 0;
    let siegeSlowFactor = 1.0;
    let siegePotionHealBonus = 0;
    let siegeKeepProgressOnMiss = false;
    let siegeDoubleScoreChance = 0;
    let siegeKillsInWave = 0;
    let siegeWaveKillsNeeded = 2; // 波次推進門檻
    let siegeLevelKillsNeeded = 5; // 等級晉升門檻 (Lv.1->2 需 5 隻，Lv.2->3 需 10 隻...)
    let siegeSpeedPenalty = 1.0; // 招式負面效果：怪獸加速因子
    let siegeExtraEnemyCount = 0; // 招式負面效果：同時入侵額外數量
    let siegeImpactDamageExtra = 0; // 招式負面效果：額外撞擊傷害
    let siegeHasLeftovers = false; // 吃剩的東西持續回復狀態
    let siegeLeftoversHeal = 1; // 吃剩的東西回復量 (每10秒+1)

    const siegeAshImg = new Image();
    siegeAshImg.src = 'images/pokemon_ash_pikachu.png';

    const siegePotionImg = new Image();
    siegePotionImg.src = 'images/pokemon_potion.png';

    const siegeMonsterImgs = {
      gastly: new Image(),
      haunter: new Image(),
      gourgeist: new Image(),
      gengar: new Image()
    };
    siegeMonsterImgs.gastly.src = 'images/pokemon_gastly.png';
    siegeMonsterImgs.haunter.src = 'images/pokemon_haunter.png';
    siegeMonsterImgs.gourgeist.src = 'images/pokemon_gourgeist.png';
    siegeMonsterImgs.gengar.src = 'images/pokemon_gengar.png';

    // 🎲 密碼學安全真隨機生成器 (Web Crypto API，真正做到真隨機)
    function getSecureRandom() {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        return buf[0] / (0xFFFFFFFF + 1);
      }
      return Math.random();
    }

    function secureFisherYatesShuffle(array) {
      const arr = array.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(getSecureRandom() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    }

    // ★ 題庫選取：等級 1-10 級使用「當前周數」字庫，10 級以後 (Lv.11+) 使用「全部周數字庫」隨機
    function getSiegeWordPool(wave, level) {
      let pool = [];
      const weekly = (typeof window !== 'undefined' && window.MODE2_WEEKLY_BANKS) 
        ? window.MODE2_WEEKLY_BANKS 
        : (typeof MODE2_WEEKLY_BANKS !== 'undefined' ? MODE2_WEEKLY_BANKS : {});

      const cloud = (typeof window !== 'undefined' && window.CLOUD_WEEKLY_BANKS)
        ? window.CLOUD_WEEKLY_BANKS
        : (typeof CLOUD_WEEKLY_BANKS !== 'undefined' ? CLOUD_WEEKLY_BANKS : {});

      const curWave = (typeof wave === 'number') ? wave : (typeof siegeWave !== 'undefined' ? siegeWave : 1);
      const curLvl = (typeof level === 'number') ? level : (typeof siegeLevel !== 'undefined' ? siegeLevel : 1);

      // ★ 依使用者指示：波次 1-10 (Wave 1~10) 嚴格使用當前開放周次（第 8 周）字庫與答案；波次超過 10 (Wave 11+) 全周次題庫隨機
      if (curWave <= 10) {
        let qWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        if (!qWk) qWk = 'w8';
        for (let i = 1; i <= 4; i++) {
          const key = `${qWk}_hw${i}`;
          if (weekly[key] && Array.isArray(weekly[key].words) && weekly[key].words.length > 0) {
            pool = pool.concat(weekly[key].words);
          } else if (cloud[key] && Array.isArray(cloud[key].words) && cloud[key].words.length > 0) {
            pool = pool.concat(cloud[key].words);
          }
        }
        // 若當前週次題庫暫時未載入，嚴格保底從 MODE2_WEEKLY_BANKS 抽取當前開放周次 (w8)
        if (pool.length === 0 && typeof MODE2_WEEKLY_BANKS !== 'undefined') {
          for (let i = 1; i <= 4; i++) {
            const k = `${qWk}_hw${i}`;
            if (MODE2_WEEKLY_BANKS[k] && Array.isArray(MODE2_WEEKLY_BANKS[k].words)) {
              pool = pool.concat(MODE2_WEEKLY_BANKS[k].words);
            }
          }
        }
      } else {
        // ★ 波次超過 10 (Wave 11+)：全面匯整《2026每周打字字庫表》所有周次題庫！
        // 包含使用者所列全部字根：式行微川冷租戊拜牧強鬥所翻麥數斤神參物厭底生祖筷丈府車附穿窗較守划疾麵、貝熱糧炎波潔杯常采朋昊昔巴象用冥冤炙只共弟並朮術材村五韋汝求叉反丕否肉等
        Object.keys(weekly).forEach(k => {
          if (weekly[k] && Array.isArray(weekly[k].words)) {
            pool = pool.concat(weekly[k].words);
          }
        });
        Object.keys(cloud).forEach(k => {
          if (cloud[k] && Array.isArray(cloud[k].words)) {
            pool = pool.concat(cloud[k].words);
          }
        });
        if (typeof DATA !== 'undefined') {
          if (DATA.abbrev_words) pool = pool.concat(DATA.abbrev_words);
          if (DATA.feature_words) pool = pool.concat(DATA.feature_words);
          if (DATA.connected_words) pool = pool.concat(DATA.connected_words);
          if (DATA.split_words) pool = pool.concat(DATA.split_words);
          if (DATA.cangjie_words) pool = pool.concat(DATA.cangjie_words);
        if (DATA.cangjie_words && pool.length === 0) pool = pool.concat(DATA.cangjie_words);
          if (DATA.difficult_words) pool = pool.concat(DATA.difficult_words);
        }
      }

      // 去重與真值字典校驗 (自動規格化補齊 codes 與 keys)
      const seen = new Set();
      const unique = [];
      pool.forEach(item => {
        if (item && item.char) {
          if (!item.keys && item.prefix_keys && item.body_keys) {
            item.keys = item.prefix_keys.concat(item.body_keys);
          }
          if (!item.codes && item.prefix_codes && item.body_codes) {
            item.codes = item.prefix_codes.concat(item.body_codes);
          }
          if (!seen.has(item.char)) {
            seen.add(item.char);
            // ★ SSOT 原則：若題庫本身已有設定好的 codes 與 keys（來自《2026每周打字字庫表》），嚴格保留真值，絕不覆蓋！
            if ((!item.keys || item.keys.length === 0 || item.keys.includes('?')) && typeof MASTER_CJ3_DICT !== 'undefined' && MASTER_CJ3_DICT[item.char]) {
              const canon = MASTER_CJ3_DICT[item.char];
              item.codes = canon.codes.slice();
              item.keys = canon.keys.slice();
              item.full = canon.full;
            }
            unique.push(item);
          }
        }
      });
      return unique;
    }

    // ─────────────────────────────────────────────────────────────
    // 📖 52 種寶可夢招式技能庫
    // ─────────────────────────────────────────────────────────────
    const SIEGE_POKEMON_MOVES = [
      { id: 'protect', name: '守住 (Protect)', icon: '🛡️', tier: 1, desc: '立刻獲得 1 面電氣護盾，可完全抵擋 1 次怪獸衝擊！', preview: { shieldAdd: 1 }, apply: () => { siegeBarrierShieldCount += 1; } },
      { id: 'light_screen', name: '光牆 (Light Screen)', icon: '✨', tier: 1, desc: '展開光牆能量屏障，傷藥回復效果永久提升 +5 點！', preview: { potionBonus: 5 }, apply: () => { siegePotionHealBonus += 5; } },
      { id: 'substitute', name: '替身 (Substitute)', icon: '🧸', tier: 2, desc: '釋放比卡丘替身玩偶，免疫接下來 2 次怪獸衝擊！', preview: { shieldAdd: 2 }, apply: () => { siegeBarrierShieldCount += 2; } },
      { id: 'safeguard', name: '神秘守護 (Safeguard)', icon: '🔮', tier: 1, desc: '小智生命上限提升 25 點，並立刻恢復 25 點生命值。', preview: { hpMaxAdd: 25, hpAdd: 25 }, apply: () => { siegeMaxHp += 25; siegeHp = Math.min(siegeMaxHp, siegeHp + 25); } },
      { id: 'max_guard', name: '極巨防壁 (Max Guard)', icon: '🏰', tier: 3, desc: '展開極巨金光結界，立刻獲得 3 面堅韌護盾！', preview: { shieldAdd: 3 }, apply: () => { siegeBarrierShieldCount += 3; } },
      { id: 'focus_sash', name: '氣勢披帶 (Focus Sash)', icon: '🥋', tier: 2, desc: '獲得披帶庇佑，生命上限提升 15 點並獲 1 面護盾！', preview: { shieldAdd: 1, hpMaxAdd: 15 }, apply: () => { siegeBarrierShieldCount += 1; siegeMaxHp += 15; } },
      { id: 'rocky_helmet', name: '凸凸頭盔 (Rocky Helmet)', icon: '🪖', tier: 2, desc: '堅硬防護，立刻獲得 1 面電氣護盾抵擋衝擊！', preview: { shieldAdd: 1 }, apply: () => { siegeBarrierShieldCount += 1; } },
      { id: 'assault_vest', name: '突擊背心 (Assault Vest)', icon: '🦺', tier: 1, desc: '耐力倍增，小智生命上限提升 30 點並回復 30 點生命值。', preview: { hpMaxAdd: 30, hpAdd: 30 }, apply: () => { siegeMaxHp += 30; siegeHp = Math.min(siegeMaxHp, siegeHp + 30); } },
      { id: 'quick_attack', name: '電光一閃 (Quick Attack)', icon: '⚡', tier: 1, desc: '比卡丘極速出擊，閃電擊破時連鎖彈射攻擊 1 隻相鄰怪獸！', preview: { chainAdd: 1 }, apply: () => { siegeLightningChains += 1; } },
      { id: 'volt_tackle', name: '伏特狂鯊 (Volt Tackle)', icon: '🦈', tier: 2, desc: '閃電狂暴衝擊，擊破怪獸獲得的戰鬥積分永久 +12 分！', preview: { scoreAdd: 12 }, apply: () => { siegeBonusScore += 12; } },
      { id: 'discharge', name: '放電 (Discharge)', icon: '💥', tier: 2, desc: '擊破怪獸時連鎖 +1 隻相鄰怪獸，且額外獲得 +8 積分！', preview: { scoreAdd: 8, chainAdd: 1 }, apply: () => { siegeBonusScore += 8; siegeLightningChains += 1; } },
      { id: 'thunder_punch', name: '雷電拳 (Thunder Punch)', icon: '🥊', tier: 1, desc: '重拳聚能，十萬伏特充能速度提升 +25%！', preview: { chargeRateAdd: 0.25 }, apply: () => { siegeUltChargeRate += 0.25; } },
      { id: 'thunder', name: '打雷 (Thunder)', icon: '⛈️', tier: 2, desc: '暴風雷鳴，十萬伏特充能速度提升 +35%，擊破得分 +10 分。', preview: { chargeRateAdd: 0.35, scoreAdd: 10 }, apply: () => { siegeUltChargeRate += 0.35; siegeBonusScore += 10; } },
      { id: 'gigavolt', name: '百萬伏特 (Gigavolt)', icon: '🌩️', tier: 3, desc: '比卡丘究極雷霆！擊破怪獸額外獲取 +25 積分，閃電連鎖 +1 隻！', preview: { scoreAdd: 25, chainAdd: 1 }, apply: () => { siegeBonusScore += 25; siegeLightningChains += 1; } },
      { id: 'pika_10m', name: '智皮卡神雷 (10,000,000V)', icon: '👑', tier: 3, desc: '小智與戴帽比卡丘超絕神技！閃電連鎖 +2 隻，積分獲取 +30！', drawback: '⚠️ 萬雷引動雷雲狂潮，每波同時入侵怪獸數量上限 +1 隻！', preview: { chainAdd: 2, scoreAdd: 30, countAdd: 1 }, apply: () => { siegeLightningChains += 2; siegeBonusScore += 30; siegeExtraEnemyCount += 1; } },
      { id: 'electric_terrain', name: '電氣場地 (Electric Terrain)', icon: '🌐', tier: 2, desc: '展開地表電氣場，全場所有怪獸飛行逼近速度永久減緩 20%！', preview: { slowMult: 0.80 }, apply: () => { siegeSlowFactor *= 0.80; } },
      { id: 'thunder_wave', name: '電磁波 (Thunder Wave)', icon: '〰️', tier: 1, desc: '發射微弱電流麻痹怪獸，全場怪獸飛行逼近速度減緩 15%！', preview: { slowMult: 0.85 }, apply: () => { siegeSlowFactor *= 0.85; } },
      { id: 'charge', name: '充電 (Charge)', icon: '🔋', tier: 1, desc: '蓄積雷電能量，大招充能效率額外提升 +30%！', preview: { chargeRateAdd: 0.30 }, apply: () => { siegeUltChargeRate += 0.30; } },
      { id: 'magnet_rise', name: '電磁浮游 (Magnet Rise)', icon: '🧲', tier: 1, desc: '利用電磁力浮空，全場怪獸逼近速度減緩 10%！', preview: { slowMult: 0.90 }, apply: () => { siegeSlowFactor *= 0.90; } },
      { id: 'agility', name: '高速移動 (Agility)', icon: '💨', tier: 1, desc: '身手敏捷，每次擊破額外獲得 +6 積分，瞄準響應更靈敏。', preview: { scoreAdd: 6 }, apply: () => { siegeBonusScore += 6; } },
      { id: 'focus_energy', name: '聚氣 (Focus Energy)', icon: '🎯', tier: 2, desc: '注意力高度集中，擊破時有 35% 機率觸發雙倍積分！', preview: { critAdd: 0.35 }, apply: () => { siegeDoubleScoreChance += 0.35; } },
      { id: 'double_team', name: '影子分身 (Double Team)', icon: '👥', tier: 2, desc: '幻化多個分身迷惑對手，怪獸飛行逼近速度減緩 15%！', preview: { slowMult: 0.85 }, apply: () => { siegeSlowFactor *= 0.85; } },
      { id: 'rain_dance', name: '祈雨 (Rain Dance)', icon: '🌧️', tier: 1, desc: '召喚雨雲助長電氣威力，大招充能效率提升 +20%。', preview: { chargeRateAdd: 0.20 }, apply: () => { siegeUltChargeRate += 0.20; } },
      { id: 'calm_mind', name: '冥想 (Calm Mind)', icon: '🧘', tier: 2, desc: '平心靜氣，立即為小智回復 15 點生命值！', preview: { hpAdd: 15 }, apply: () => { siegeHp = Math.min(siegeMaxHp, siegeHp + 15); } },
      { id: 'recover', name: '自我再生 (Recover)', icon: '💖', tier: 1, desc: '細胞快速活化，立即為小智回復 45 點生命值！', preview: { hpAdd: 45 }, apply: () => { siegeHp = Math.min(siegeMaxHp, siegeHp + 45); } },
      { id: 'morning_sun', name: '晨光 (Morning Sun)', icon: '🌅', tier: 2, desc: '沐浴晨光，生命上限提升 20 點並立即回復 50 點生命值！', preview: { hpMaxAdd: 20, hpAdd: 50 }, apply: () => { siegeMaxHp += 20; siegeHp = Math.min(siegeMaxHp, siegeHp + 50); } },
      { id: 'dynamax', name: '極巨化 (Dynamax)', icon: '🔴', tier: 3, desc: '比卡丘極巨化覺醒！生命上限提升 50 點並直接補滿生命值！', drawback: '⚠️ 身軀龐大招引敵潮，怪獸逼近飛行速度增加 +15%！', preview: { hpMaxAdd: 50, speedMult: 1.15 }, apply: () => { siegeMaxHp += 50; siegeHp = siegeMaxHp; siegeSpeedPenalty *= 1.15; } },
      { id: 'helping_hand', name: '幫助 (Helping Hand)', icon: '🤝', tier: 1, desc: '夥伴同心協力，擊破怪獸時獲得的大招充能額外 +25%。', preview: { chargeRateAdd: 0.25 }, apply: () => { siegeUltChargeRate += 0.25; } },
      { id: 'follow_me', name: '看我嘛 (Follow Me)', icon: '👀', tier: 2, desc: '吸引怪獸注意力，中途偶爾按錯鍵時保留當前拆碼進度不重置！', preview: { keepProgress: true }, apply: () => { siegeKeepProgressOnMiss = true; } },
      { id: 'sweet_scent', name: '甜甜香氣 (Sweet Scent)', icon: '🌸', tier: 1, desc: '香氣安撫野生怪獸，怪獸前進飛行速度減緩 12%。', preview: { slowMult: 0.88 }, apply: () => { siegeSlowFactor *= 0.88; } },
      { id: 'potion_master', name: '藥劑大師 (Potion Master)', icon: '🧪', tier: 2, desc: '精研製藥技術，每次使用【傷藥】回復數值額外 +25 HP！', preview: { potionBonus: 25 }, apply: () => { siegePotionHealBonus += 25; } },
      { id: 'clever_mix', name: '巧手調配 (Clever Mix)', icon: '⚗️', tier: 1, desc: '立刻額外獲贈 2 瓶【傷藥】，並提升傷藥回復底限 +10 HP！', preview: { potionAdd: 2, potionBonus: 10 }, apply: () => { siegePotionsCount += 2; siegePotionHealBonus += 10; } },
      { id: 'revive_shard', name: '活力碎片 (Revive Shard)', icon: '💎', tier: 2, desc: '立刻獲贈 1 面電氣護盾（可完全抵擋 1 次撞擊）！', preview: { shieldAdd: 1 }, apply: () => { siegeBarrierShieldCount += 1; } },
      { id: 'leftovers', name: '吃剩的東西 (Leftovers)', icon: '🍎', tier: 2, desc: '攜帶美味樹果，每過 10 秒自動為小智回復 1 點生命值！', drawback: '⚠️ 樹果甜香吸引強敵，入侵怪獸移動速度增加 +30%！', preview: { hpRegen: 1, speedMult: 1.30 }, apply: () => { siegeHasLeftovers = true; siegeSpeedPenalty *= 1.30; } },
      { id: 'miracle_seed', name: '奇蹟之種 (Miracle Seed)', icon: '🌱', tier: 1, desc: '蘊含自然生機，小智生命上限提升 20 點並獲贈 1 瓶【傷藥】。', preview: { hpMaxAdd: 20, potionAdd: 1 }, apply: () => { siegeMaxHp += 20; siegePotionsCount += 1; } },
      { id: 'weakness_policy', name: '弱點保險 (Weakness Policy)', icon: '🛡️', tier: 2, desc: '越挫越勇！擊破怪獸積分額外加贈 +10 分！', preview: { scoreAdd: 10 }, apply: () => { siegeBonusScore += 10; } },
      { id: 'berry_juice', name: '勁爽汽水 (Berry Juice)', icon: '🥤', tier: 1, desc: '立刻回復 35 點生命值，並獲贈 1 瓶【傷藥】！', preview: { hpAdd: 35, potionAdd: 1 }, apply: () => { siegeHp = Math.min(siegeMaxHp, siegeHp + 35); siegePotionsCount += 1; } },
      { id: 'max_potion_tech', name: '全滿秘藥 (Max Potion)', icon: '💉', tier: 3, desc: '獲得高階全滿藥配方，傷藥回復額外 +40 HP，並贈 2 瓶傷藥！', preview: { potionBonus: 40, potionAdd: 2 }, apply: () => { siegePotionHealBonus += 40; siegePotionsCount += 2; } },
      { id: 'lum_berry', name: '木子果 (Lum Berry)', icon: '🍒', tier: 1, desc: '奇蹟果實除厄，立即為小智回復 20 點生命值！', preview: { hpAdd: 20 }, apply: () => { siegeHp = Math.min(siegeMaxHp, siegeHp + 20); } },
      { id: 'sacred_fire', name: '神聖之火 (Sacred Fire)', icon: '🔥', tier: 3, desc: '鳳王聖火庇護！十萬伏特大招充能速度提升 +100% (×2)！', drawback: '⚠️ 聖火烈焰刺目，怪獸逼近飛行速度增加 +20%！', preview: { chargeRateAdd: 1.0, speedMult: 1.20 }, apply: () => { siegeUltChargeRate += 1.0; siegeSpeedPenalty *= 1.20; } },
      { id: 'primal_reversion', name: '原始回歸 (Primal Power)', icon: '🌊', tier: 3, desc: '超古代神力湧動！全場所有怪獸逼近速度大幅減速 30%！', drawback: '⚠️ 原始能量過載，小智每次被怪獸撞擊額外承受 +5 點衝擊傷害！', preview: { slowMult: 0.70, extraDamage: 5 }, apply: () => { siegeSlowFactor *= 0.70; siegeImpactDamageExtra += 5; } },
      { id: 'roar_of_time', name: '時光咆哮 (Roar of Time)', icon: '⏳', tier: 3, desc: '帝牙盧卡掌控時間！全場怪獸全部擊退至地圖最外圈！', preview: { knockback: true }, apply: () => { siegeEnemies.forEach(em => { em.x *= 1.35; em.y *= 1.35; }); } },
      { id: 'spacial_rend', name: '亞空裂斬 (Spacial Rend)', icon: '🌌', tier: 3, desc: '帕路奇亞撕裂空間！比卡丘閃電連鎖擊破數永久 +2 隻！', drawback: '⚠️ 空間裂隙撕扯，怪獸移動飛行速度加快 +10%！', preview: { chainAdd: 2, speedMult: 1.10 }, apply: () => { siegeLightningChains += 2; siegeSpeedPenalty *= 1.10; } },
      { id: 'judgment', name: '創世神光 (Judgment)', icon: '🌟', tier: 3, desc: '阿爾宙斯裁決！擊破怪獸時獲取積分永久 +20 分，護盾 +1 面！', preview: { scoreAdd: 20, shieldAdd: 1 }, apply: () => { siegeBonusScore += 20; siegeBarrierShieldCount += 1; } },
      { id: 'psychic', name: '精神強念 (Psychic)', icon: '🧠', tier: 2, desc: '超夢強大超能力！全場怪獸逼近速度減緩 15%！', preview: { slowMult: 0.85 }, apply: () => { siegeSlowFactor *= 0.85; } },
      { id: 'dragon_pulse', name: '龍之波動 (Dragon Pulse)', icon: '🐉', tier: 2, desc: '烈空坐龍威激盪！擊破怪獸積分額外 +15 分！', preview: { scoreAdd: 15 }, apply: () => { siegeBonusScore += 15; } },
      { id: 'hyper_beam', name: '破壞光線 (Hyper Beam)', icon: '💥', tier: 3, desc: '狂暴光束轟擊！十萬伏特充能效率 +50%，擊破積分 +15 分！', drawback: '⚠️ 強烈能量反衝，怪獸逼近飛行速度增加 +15%！', preview: { scoreAdd: 15, chargeRateAdd: 0.5, speedMult: 1.15 }, apply: () => { siegeBonusScore += 15; siegeUltChargeRate += 0.5; siegeSpeedPenalty *= 1.15; } },
      { id: 'giga_impact', name: '終極衝擊 (Giga Impact)', icon: '☄️', tier: 3, desc: '霸道衝擊波！每次擊破怪獸雙倍積分機率提升 +40%！', drawback: '⚠️ 衝擊擾亂時空，每波同時入侵怪獸數量上限 +1 隻！', preview: { critAdd: 0.40, countAdd: 1 }, apply: () => { siegeDoubleScoreChance += 0.40; siegeExtraEnemyCount += 1; } },
      { id: 'beast_boost', name: '異獸提升 (Beast Boost)', icon: '👾', tier: 2, desc: '越戰越強！擊破怪獸基礎得分永久 +10 分！', preview: { scoreAdd: 10 }, apply: () => { siegeBonusScore += 10; } },
      { id: 'aura_break', name: '氣場破壞 (Aura Break)', icon: '🌀', tier: 2, desc: '基格爾德壓制幽靈系！怪獸飛行速度減慢 18%！', preview: { slowMult: 0.82 }, apply: () => { siegeSlowFactor *= 0.82; } },
      { id: 'magic_guard', name: '魔法防守 (Magic Guard)', icon: '🛡️', tier: 2, desc: '受神秘魔法庇護，小智生命上限提升 25 點，護盾 +1 面！', preview: { hpMaxAdd: 25, shieldAdd: 1 }, apply: () => { siegeMaxHp += 25; siegeBarrierShieldCount += 1; } },
      { id: 'mega_evolution', name: '超級進化 (Mega Evolution)', icon: '🧬', tier: 3, desc: '超級比卡丘進化！得分+15、速度減15%、護盾+1面！', preview: { scoreAdd: 15, slowMult: 0.85, shieldAdd: 1 }, apply: () => { siegeBonusScore += 15; siegeSlowFactor *= 0.85; siegeBarrierShieldCount += 1; } }
    ];

    function launchSiegeMatch() {
      const isTeacherCheck = (typeof isTeacherMode !== 'undefined' && isTeacherMode) || (typeof window !== 'undefined' && window.isTeacherMode);
      if (typeof P4Mode !== 'undefined' && !isTeacherCheck) {
        const student = currentStudent || null;
        const cls = student ? student.cls : null;
        const num = student ? student.num : null;
        const unlock = P4Mode.getUnlockStatus('siege', cls, num, isTeacherCheck);
        if (!unlock.unlocked) {
          if (typeof showPassToast === 'function') {
            showPassToast(`🔒 逃出恐怖屋尚未解鎖！今日還差 ${unlock.neededScore} 分開啟`);
          }
          setGameMode('typo');
          return;
        }
      }

      if (siegeAnimId) cancelAnimationFrame(siegeAnimId);
      if (siegeTimeInterval) clearInterval(siegeTimeInterval);
      window.removeEventListener('keydown', handleSiegeKeydown, true);

      siegeActive = true;
      siegeRunning = false;
      siegeIsPaused = false;
      siegeHp = 100;
      siegeMaxHp = 100;
      siegeLevel = 1;
      siegeWave = 1;
      siegeKills = 0;
      siegeKillsInWave = 0;
      siegeWaveKillsNeeded = 2;
      siegeKillsInLevel = 0;
      siegeLevelKillsNeeded = 5; // Lv.1 升 Lv.2 需擊破 5 隻
      siegeSpeedPenalty = 1.0;
      siegeExtraEnemyCount = 0;
      siegeImpactDamageExtra = 0;
      siegeHasLeftovers = false;
      siegeLeftoversHeal = 1;
      siegeMisses = 0;
      siegeScore = 0;
      siegePotionsCount = 0;
      siegeSeconds = 0;
      siegeEnemies = [];
      siegeParticles = [];
      siegeLightnings = [];
      siegeHealParticles = [];
      siegeTargetEnemy = null;
      siegeUltCharge = 0;
      siegeBarrierHitTimer = 0;
      siegeDashOffset = 0;
      siegeIsSpawningSquad = false;
      siegeWordQueue = [];
      siegeUltToastShown = false;
      currentBoss = null;
      hideBossHUD();
      siegeCandidateEnemies = [];
      siegeLastKey = null;
      siegeEmptyFieldTimer = 0;

      // 重置疊加招式效果
      siegeLearnedMoves = [];
      siegeBonusScore = 0;
      siegeUltChargeRate = 1.0;
      siegeLightningChains = 0;
      siegeBarrierShieldCount = 0;
      siegeSlowFactor = 1.0;
      siegePotionHealBonus = 0;
      siegeKeepProgressOnMiss = false;
      siegeDoubleScoreChance = 0;

      updateSiegeHUD();

      const readyOverlay = document.getElementById('siege-ready-overlay');
      const overOverlay = document.getElementById('siege-over-overlay');
      const upgradeOverlay = document.getElementById('siege-upgrade-overlay');
      if (readyOverlay) readyOverlay.style.display = 'flex';
      if (overOverlay) overOverlay.style.display = 'none';
      if (upgradeOverlay) upgradeOverlay.style.display = 'none';

      const canvas = document.getElementById('siege-canvas');
      const wrap = document.getElementById('siege-stage-wrap');
      if (canvas && wrap) {
        canvas.width = wrap.clientWidth || 800;
        canvas.height = wrap.clientHeight || 420;

        // ★ 畫布點擊/觸控精準選怪 (Click/Tap to Focus Target，自由切換鎖定目標)
        canvas.style.cursor = 'crosshair';
        canvas.onpointerdown = function(e) {
          if (!siegeActive || !siegeRunning || siegeIsPaused) return;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const mx = (e.clientX - rect.left) * scaleX;
          const my = (e.clientY - rect.top) * scaleY;

          let clicked = null;
          let minDist = Infinity;
          siegeEnemies.forEach(em => {
            const d = Math.hypot(mx - em.x, my - em.y);
            if (d <= em.radius + 18 && d < minDist) {
              minDist = d;
              clicked = em;
            }
          });

          if (clicked) {
            if (Array.isArray(siegeCandidateEnemies)) {
              siegeCandidateEnemies.forEach(em => { if (em !== clicked) em.typedIdx = 0; });
            }
            clicked.typedIdx = 0;
            siegeCandidateEnemies = [clicked];
            siegeTargetEnemy = clicked;
            siegeLastKey = null;
            clicked.shake = 6;
            if (typeof showPassToast === 'function') {
              const charName = (clicked.word && clicked.word.char) ? clicked.word.char : '';
              showPassToast('🎯 已鎖定【' + charName + '】！請敲擊速成字碼！');
            }
          }
        };
      }

      window.addEventListener('keydown', handleSiegeKeydown, true);
    }

    function siegeStartGame() {
      const readyOverlay = document.getElementById('siege-ready-overlay');
      if (readyOverlay) readyOverlay.style.display = 'none';

      siegeRunning = true;
      siegeIsPaused = false;
      siegeIsSpawningSquad = false;
      currentBoss = null;
      hideBossHUD();
      siegeCandidateEnemies = [];
      siegeLastKey = null;
      siegeEmptyFieldTimer = 0;
      spawnSiegeWave();

      if (siegeTimeInterval) clearInterval(siegeTimeInterval);
      siegeTimeInterval = setInterval(() => {
        if (!siegeIsPaused && siegeActive && siegeRunning) {
          siegeSeconds++;
          updateSiegeTimerDisplay();

          // 🍎 吃剩的東西 (Leftovers): 每 10 秒自動為小智回復 1 點生命值！
          if (siegeHasLeftovers && siegeSeconds % 10 === 0 && siegeHp < siegeMaxHp) {
            siegeHp = Math.min(siegeMaxHp, siegeHp + siegeLeftoversHeal);
            updateSiegeHUD();
            if (typeof showPassToast === 'function') {
              showPassToast('🍎【吃剩的東西】發動：小智自動回復了 +1 點生命值！');
            }
          }
        }
      }, 1000);

      const wrap = document.getElementById('siege-stage-wrap');
      if (wrap) wrap.focus();

      requestAnimationFrame(tickSiege);
    }

    function updateSiegeTimerDisplay() {
      const timerVal = document.getElementById('siege-time-val');
      if (timerVal) {
        const m = String(Math.floor(siegeSeconds / 60)).padStart(2, '0');
        const s = String(siegeSeconds % 60).padStart(2, '0');
        timerVal.textContent = `${m}:${s}`;
      }
    }

    function updateSiegeHUD() {
      const hpText = document.getElementById('siege-hp-text');
      const hpFill = document.getElementById('siege-hp-fill');
      const waveVal = document.getElementById('siege-wave-val');
      const levelVal = document.getElementById('siege-level-val');
      const expFill = document.getElementById('siege-exp-fill');
      const scoreVal = document.getElementById('siege-score-val');
      const ultCharge = document.getElementById('siege-ult-charge');
      const ultBtn = document.getElementById('siege-ult-btn');
      const potionBadge = document.getElementById('siege-potion-count');
      const killsFooter = document.getElementById('siege-kills-footer');
      const movesCount = document.getElementById('siege-moves-count');
      const potionsFooter = document.getElementById('siege-potions-footer');

      if (hpText) hpText.textContent = `${Math.max(0, siegeHp)} / ${siegeMaxHp}`;
      if (hpFill) {
        const pct = Math.max(0, Math.min(100, Math.round((siegeHp / siegeMaxHp) * 100)));
        hpFill.style.width = `${pct}%`;
        hpFill.style.background = pct > 50 
          ? 'linear-gradient(90deg, #10B981, #34D399)' 
          : (pct > 25 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #EF4444, #F87171)');
      }

      if (waveVal) waveVal.textContent = `Wave ${siegeWave}`;
      if (levelVal) levelVal.textContent = `Lv.${siegeLevel}`;
      if (expFill) {
        const expPct = Math.min(100, Math.round((siegeKillsInLevel / siegeLevelKillsNeeded) * 100));
        expFill.style.width = `${expPct}%`;
      }
      if (scoreVal) scoreVal.textContent = `+${siegeScore}`;
      if (ultCharge) ultCharge.textContent = `(${siegeUltCharge}%)`;
      if (ultBtn) {
        ultBtn.disabled = (siegeUltCharge < 100);
        if (siegeUltCharge >= 100) {
          // ★ 大招充能完畢：可發動提示高亮脈衝！
          ultBtn.classList.add('ult-ready-glow');
          ultBtn.title = "⚡【十萬伏特】充能完畢！按數字鍵 2 或點擊發動！";
          if (!siegeUltToastShown) {
            siegeUltToastShown = true;
            if (typeof showPassToast === 'function') {
              showPassToast('⚡【十萬伏特】充能完畢！按數字鍵 2 或點擊按鈕發動！');
            }
          }
        } else {
          ultBtn.classList.remove('ult-ready-glow');
          ultBtn.title = "十萬伏特充能中 (快捷鍵: 數字鍵 2)";
          siegeUltToastShown = false;
        }
      }
      if (potionBadge) potionBadge.textContent = String(siegePotionsCount);
      if (killsFooter) killsFooter.textContent = String(siegeKills);
      if (movesCount) movesCount.textContent = String(siegeLearnedMoves.length);
      if (potionsFooter) potionsFooter.textContent = String(siegePotionsCount);
      updateSiegeTimerDisplay();
    }

    // 🧪 使用傷藥 (快捷鍵：數字鍵 1 或點擊按鈕)
    function useSiegePotion() {
      if (!siegeActive || !siegeRunning) return;
      if (siegePotionsCount <= 0) {
        if (typeof showPassToast === 'function') {
          showPassToast('⚠️ 目前沒有傷藥！擊破怪獸提升寶可夢等級即可獲贈【傷藥】！');
        }
        return;
      }

      siegePotionsCount--;
      const baseHeal = Math.floor(getSecureRandom() * 91) + 10; // 隨機 10 ~ 100 HP
      const totalHeal = baseHeal + siegePotionHealBonus;
      const oldHp = siegeHp;
      siegeHp = Math.min(siegeMaxHp, siegeHp + totalHeal);
      const actualHeal = siegeHp - oldHp;

      const canvas = document.getElementById('siege-canvas');
      const cx = canvas ? canvas.width / 2 : 400;
      const cy = canvas ? canvas.height / 2 : 210;
      for (let i = 0; i < 20; i++) {
        const ang = getSecureRandom() * Math.PI * 2;
        const spd = 1.5 + getSecureRandom() * 3.5;
        siegeHealParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 1.2,
          life: 25,
          maxLife: 25,
          color: ['#34D399', '#6EE7B7', '#A7F3D0', '#10B981'][Math.floor(getSecureRandom() * 4)],
          size: 3 + getSecureRandom() * 3
        });
      }

      updateSiegeHUD();
      if (typeof showPassToast === 'function') {
        showPassToast(`🧪 使用【傷藥】！小智回復了 +${actualHeal} 點生命值！（剩餘 ${siegePotionsCount} 瓶）`);
      }
    }

    // ⚡ 升級彈窗
    function triggerSiegeLevelUpModal() {
      siegeIsPaused = true;
      siegePotionsCount++;
      updateSiegeHUD();

      const modal = document.getElementById('siege-upgrade-overlay');
      const titleEl = document.getElementById('siege-upgrade-title');
      const descEl = document.getElementById('siege-upgrade-desc');
      const optionsContainer = document.getElementById('siege-upgrade-options');
      if (!modal || !optionsContainer) return;

      if (titleEl) titleEl.textContent = `⚡ 寶可夢等級晉升至 Lv.${siegeLevel}！`;
      if (descEl) descEl.innerHTML = `🎁 <strong>升級獎勵</strong>：獲得【傷藥】×1（現存 ${siegePotionsCount} 瓶，按數字鍵 1 或點擊使用）！<br>請選擇一項寶可夢招式學習（滑鼠懸浮可即時預覽戰況數據變化）：`;

      const availableMoves = SIEGE_POKEMON_MOVES.filter(m => !siegeLearnedMoves.includes(m));
      const pool = availableMoves.length >= 2 ? availableMoves : SIEGE_POKEMON_MOVES;
      const shuffled = secureFisherYatesShuffle([...pool]);
      const picked = shuffled.slice(0, 2);

      optionsContainer.innerHTML = '';
      picked.forEach(move => {
        const card = document.createElement('div');
        card.className = 'siege-upgrade-card';
        const drawbackHtml = move.drawback 
          ? `<div class="siege-upgrade-drawback">${move.drawback}</div>` 
          : `<div style="font-size: 11px; color: #10B981; font-weight: 600; margin-top: 4px;">✨ 純增益奧義（無負面副作用）</div>`;
        card.innerHTML = `
          <div class="siege-upgrade-icon">${move.icon}</div>
          <div class="siege-upgrade-info" style="flex: 1;">
            <div class="siege-upgrade-name">${move.name}</div>
            <div class="siege-upgrade-desc">${move.desc}</div>
            ${drawbackHtml}
          </div>
          <div class="siege-upgrade-tier">階級 ${move.tier}</div>
        `;
        card.onclick = () => {
          selectSiegeMove(move);
        };
        card.onmouseenter = () => {
          updateSiegeStatusDashboard(move);
        };
        card.onmouseleave = () => {
          updateSiegeStatusDashboard(null);
        };
        optionsContainer.appendChild(card);
      });

      updateSiegeStatusDashboard(null);
      modal.style.display = 'flex';
    }

    function selectSiegeMove(move) {
      move.apply();
      siegeLearnedMoves.push(move);

      const modal = document.getElementById('siege-upgrade-overlay');
      if (modal) modal.style.display = 'none';

      if (typeof triggerSkillToast === 'function') {
        triggerSkillToast(move.icon, `學會奧義【${move.name}】！${move.desc}`);
      }

      updateSiegeHUD();
      siegeIsPaused = false;
      // 🎵 確保等級晉升選擇招式後，背景音樂無縫持續播放，絕不中斷
      try {
        if (typeof BgmManager !== 'undefined' && !BgmManager.isMuted()) {
          BgmManager.resumeCurrentTrack();
        }
      } catch(bgmErr) {}
      // ★ 關鍵修復：升級選擇招式後，無縫恢復當前戰場，保留場上既有怪獸與 Boss，切勿清空重刷！
      resumeSiegeLoop();
    }


    // ★ 難度階梯 1：同時出現入侵怪獸數量隨機範圍 (波次數值驅動)
    
    
    // 👑 Boss HUD 顯示與更新
    
    // ★ 耿鬼大型 Boss 畫布邊界內外圍安全漂浮座標計算器 (保證 100% 在遊戲畫面邊界內)
    function getInBoundsBossHoverPos(cw, ch, radius) {
      const r = radius || 58;
      const marginX = r + 20;
      const marginY = r + 20;
      const cx = cw / 2;
      const cy = ch / 2;
      // ★ 依使用者要求：大型 Boss Phase 2 與小智距離再遠一點 (保持外圍遠距待機，至少距離中心 190px 以上)
      const isLeft = getSecureRandom() < 0.5;
      const minX = isLeft ? marginX : Math.min(cx + 190, cw - marginX - 60);
      const maxX = isLeft ? Math.max(minX + 20, cx - 190) : (cw - marginX);
      const x = minX + getSecureRandom() * Math.max(10, maxX - minX);
      const minY = marginY;
      const maxY = ch - marginY;
      const y = minY + getSecureRandom() * Math.max(10, maxY - minY);
      return { x, y, anchorX: x, anchorY: y, ang: 0, rx: 0, ry: 0 };
    }

    let bossHudTimer = null;

    function showBossHUD(boss) {
      const bar = document.getElementById('siege-boss-hud-bar');
      if (!bar || !boss) return;
      bar.classList.add('show-boss-bar');
      updateBossHUD();

      // ★ 依使用者指示：Boss 出現時才顯示資訊欄，顯示 5 秒後自動淡出隱藏，絕不遮擋上方怪獸！
      if (bossHudTimer) clearTimeout(bossHudTimer);
      bossHudTimer = setTimeout(() => {
        hideBossHUD();
      }, 5000);
    }

    function hideBossHUD() {
      const bar = document.getElementById('siege-boss-hud-bar');
      if (bar) {
        bar.classList.remove('show-boss-bar');
      }
      if (bossHudTimer) {
        clearTimeout(bossHudTimer);
        bossHudTimer = null;
      }
    }

    function updateBossHUD() {
      if (!currentBoss) {
        hideBossHUD();
        return;
      }
      const nameEl = document.getElementById('siege-boss-name');
      const subEl = document.getElementById('siege-boss-sub');
      const fillEl = document.getElementById('siege-boss-hp-fill');
      const textEl = document.getElementById('siege-boss-hp-text');
      const badgeEl = document.getElementById('siege-boss-badge');
      const avatarBox = document.getElementById('siege-boss-avatar-box');

      if (avatarBox) {
        const mImg = siegeMonsterImgs[currentBoss.monsterType];
        if (mImg && mImg.src) {
          avatarBox.innerHTML = `<img src="${mImg.src}" alt="Boss">`;
        } else {
          avatarBox.textContent = '👑';
        }
      }

      if (currentBoss.bossType === 'mini') {
        if (nameEl) nameEl.textContent = `👑 小型月Boss · ${currentBoss.name}`;
        if (subEl) {
          subEl.textContent = currentBoss.miniFormType === 'speedy' 
            ? '型態 1：疾風突刺 · 移動與衝擊傷害 1.5 倍！' 
            : `型態 2：雙字護盾 · 剩餘 ${currentBoss.wordsQueue.length} 個字`;
        }
        if (fillEl) {
          const pct = Math.max(0, Math.min(100, Math.round((currentBoss.hp / currentBoss.maxHp) * 100)));
          fillEl.style.width = `${pct}%`;
          fillEl.style.background = 'linear-gradient(90deg, #F59E0B, #EF4444)';
        }
        if (textEl) textEl.textContent = `${Math.max(0, currentBoss.hp)} / ${currentBoss.maxHp} HP`;
        if (badgeEl) badgeEl.textContent = '⭐ 擊破獲得 3 倍巨額積分';
      } else if (currentBoss.bossType === 'major') {
        if (nameEl) nameEl.textContent = '👑 大型Boss · 耿鬼 Gengar';
        if (subEl) {
          subEl.textContent = currentBoss.form === 1 
            ? `第 1 型態：十字輪轉迫近 · 剩餘 ${currentBoss.wordsQueue.length} 個字未破！`
            : `第 2 型態：暗黑幻影閃現 · 清除怪獸扣減 Boss 血量！`;
        }
        if (fillEl) {
          const pct = Math.max(0, Math.min(100, Math.round((currentBoss.hp / currentBoss.maxHp) * 100)));
          fillEl.style.width = `${pct}%`;
          fillEl.style.background = currentBoss.form === 1
            ? 'linear-gradient(90deg, #A855F7, #EC4899)'
            : 'linear-gradient(90deg, #DC2626, #F59E0B)';
        }
        if (textEl) textEl.textContent = `${Math.max(0, currentBoss.hp)} / ${currentBoss.maxHp} HP`;
        if (badgeEl) {
          if (currentBoss.form === 1) {
            badgeEl.textContent = `⏳ 換字倒計: ${Math.max(0, Math.ceil(currentBoss.wordTimer))}s`;
          } else {
            const ok = currentBoss.minionsKilledBeforeRush >= 3;
            badgeEl.textContent = ok ? '🛡️ 閃避資格: 已達成 (≥3隻) ✅' : `🛡️ 閃避資格: ${currentBoss.minionsKilledBeforeRush} / 3 隻 ⚠️`;
            badgeEl.style.borderColor = ok ? '#10B981' : '#F59E0B';
            badgeEl.style.color = ok ? '#34D399' : '#FBBF24';
          }
        }
      }
    }

    // ⚡ 閃避 QTE 視窗邏輯
    function triggerSiegeDodgeModal() {
      if (siegeDodgeActive) return;
      siegeDodgeActive = true;
      siegeIsPaused = true;
      if (siegeAnimId) {
        cancelAnimationFrame(siegeAnimId);
        siegeAnimId = null;
      }

      const overlay = document.getElementById('siege-dodge-overlay');
      const charEl = document.getElementById('siege-dodge-char');
      const timerFill = document.getElementById('siege-dodge-timer-fill');
      const timerText = document.getElementById('siege-dodge-timer-text');
      const pipsBox = document.getElementById('siege-dodge-pips');
      if (!overlay) return;

      // ★ 牌堆真隨機抽取 1 個閃避漢字
      siegeDodgeWord = drawUniqueSiegeWord();
      siegeDodgeTypedIdx = 0;
      const majorTier = Math.max(0, Math.floor((siegeWave - 10) / 10));
      siegeDodgeMaxTimer = Math.max(3.2, (4.0 + getSecureRandom() * 4.0) - majorTier * 0.4); // 隨波次縮短QTE視窗
      siegeDodgeTimer = siegeDodgeMaxTimer;

      if (charEl) charEl.textContent = siegeDodgeWord.char;
      updateDodgePips();

      if (timerFill) timerFill.style.width = '100%';
      if (timerText) timerText.textContent = `${siegeDodgeTimer.toFixed(1)}s`;

      overlay.style.display = 'flex';

      if (siegeDodgeInterval) clearInterval(siegeDodgeInterval);
      siegeDodgeInterval = setInterval(() => {
        siegeDodgeTimer -= 0.1;
        if (timerFill) {
          const pct = Math.max(0, Math.min(100, (siegeDodgeTimer / siegeDodgeMaxTimer) * 100));
          timerFill.style.width = `${pct}%`;
        }
        if (timerText) timerText.textContent = `${Math.max(0, siegeDodgeTimer).toFixed(1)}s`;

        if (siegeDodgeTimer <= 0) {
          clearInterval(siegeDodgeInterval);
          resolveSiegeDodge(false); // 超時閃避失敗
        }
      }, 100);
    }

    function updateDodgePips() {
      const pipsBox = document.getElementById('siege-dodge-pips');
      if (!pipsBox || !siegeDodgeWord || !siegeDodgeWord.keys) return;
      pipsBox.innerHTML = '';
      siegeDodgeWord.keys.forEach((k, idx) => {
        const dot = document.createElement('div');
        dot.style.cssText = `width: 14px; height: 14px; transform: rotate(45deg); border: 1.5px solid #38BDF8; background: ${idx < siegeDodgeTypedIdx ? '#38BDF8' : 'transparent'}; box-shadow: ${idx < siegeDodgeTypedIdx ? '0 0 8px #00F0FF' : 'none'}; transition: all 0.2s;`;
        pipsBox.appendChild(dot);
      });
    }

    function resolveSiegeDodge(success) {
      if (!siegeDodgeActive) return;
      siegeDodgeActive = false;
      if (siegeDodgeInterval) clearInterval(siegeDodgeInterval);

      const overlay = document.getElementById('siege-dodge-overlay');
      if (overlay) overlay.style.display = 'none';

      siegeIsPaused = false;

      // 大型 Boss 每次突襲發動完成，不論成功與否均自損 10 HP
      if (currentBoss) {
        currentBoss.hp -= 10;
        currentBoss.isRushing = false;
        currentBoss.minionsKilledBeforeRush = 0;
        currentBoss.attackTimer = 5 + getSecureRandom() * 5; // 重置 5-10 秒突襲倒數
        currentBoss.blinkTimer = 1 + getSecureRandom() * 2;
        // 退回隨機外圍位置
        const canvas = document.getElementById('siege-canvas');
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 420;
        const cx = cw / 2;
        const cy = ch / 2;
        const rPos = getInBoundsBossHoverPos(cw, ch, currentBoss.radius);
        currentBoss.x = rPos.x;
        currentBoss.y = rPos.y;
        currentBoss.anchorX = rPos.x;
        currentBoss.anchorY = rPos.y;
        currentBoss.phase = getSecureRandom() * Math.PI * 2;
        updateBossHUD();
      }

      const majorTier = Math.max(0, Math.floor((siegeWave - 10) / 10));
      const majorDmg = 30 + Math.min(20, majorTier * 5);

      if (success) {
        if (typeof showPassToast === 'function') {
          showPassToast('✨ 閃避成功！比卡丘施展電光一閃完美避開耿鬼衝撞！耿鬼自損 10 HP！');
        }
        triggerPikachuLightning(currentBoss);
      } else {
        // 閃避失敗
        if (siegeBarrierShieldCount > 0) {
          siegeBarrierShieldCount--;
          const actualDmg = Math.round(majorDmg / 2);
          siegeHp = Math.max(0, siegeHp - actualDmg);
          if (typeof showPassToast === 'function') {
            showPassToast(`🛡️ 護盾抵擋部分衝擊！小智受到 ${actualDmg} 點傷害！耿鬼自損 10 HP！`);
          }
        } else {
          siegeHp = Math.max(0, siegeHp - majorDmg);
          if (typeof showPassToast === 'function') {
            showPassToast(`💥 閃避失敗！耿鬼猛烈撞擊！小智受到 ${majorDmg} 點傷害！耿鬼自損 10 HP！`);
          }
        }
        siegeBarrierHitTimer = 12;
        updateSiegeHUD();
        if (siegeHp <= 0) {
          onSiegeGameOver();
          return;
        }
      }

      // ★ 若耿鬼血量降為 0，徹底擊潰大型 Boss！
      if (currentBoss && currentBoss.hp <= 0) {
        defeatMajorBoss();
        resumeSiegeLoop();
        return;
      }

      // ★ 強制喚醒動畫主迴圈，確保耿鬼退回外圍並持續運轉
      resumeSiegeLoop();
    }

    function defeatMajorBoss() {
      if (!currentBoss) return;
      const boss = currentBoss;
      currentBoss = null;
      hideBossHUD();

      // 淨化全場雜怪
      siegeEnemies = [];
      siegeCandidateEnemies = [];
      siegeTargetEnemy = null;

      // 巨額得分與獎勵
      const bossBonus = (Math.round(15 * 1.2) + siegeBonusScore) * 10 + Math.floor(siegeWave * 15);
      siegeScore += bossBonus;
      siegePotionsCount += 2; // 額外贈送 2 瓶傷藥
      updateSiegeHUD();

      if (typeof burstConfetti === 'function') burstConfetti();
      if (typeof showPassToast === 'function') {
        showPassToast('🎉 成功擊潰大型霸主【耿鬼】！全場淨化！波次推進！');
      }

      // ★ 推進波次並生成新怪 (杜絕停留在空場卡頓)
      advanceToNextSiegeWave();
      // ★ 喚醒動畫主迴圈，確保下一波流暢運轉
      resumeSiegeLoop();
    }

    // ★ 矩形畫面邊緣貼合生成演算法 (敵人緊貼四邊外緣 20px 生成，進場即刻可見)
    function getRectBoundarySpawnPoint(cw, ch, index, total) {
      const margin = 20; // 僅距畫面可視邊緣 20 像素，避免離界太遠
      const w = cw + margin * 2;
      const h = ch + margin * 2;
      const perimeter = 2 * (w + h);

      // 周長均勻分佈 + 微幅隨機擾動
      const segment = perimeter / Math.max(1, total);
      let pos = (index * segment + (getSecureRandom() - 0.5) * (segment * 0.45) + perimeter) % perimeter;

      let x, y;
      if (pos < w) {
        // 頂部邊界 (Top edge)
        x = pos - margin;
        y = -margin;
      } else if (pos < w + h) {
        // 右側邊界 (Right edge)
        x = cw + margin;
        y = (pos - w) - margin;
      } else if (pos < 2 * w + h) {
        // 底部邊界 (Bottom edge)
        x = cw - (pos - (w + h)) + margin;
        y = ch + margin;
      } else {
        // 左側邊界 (Left edge)
        x = -margin;
        y = ch - (pos - (2 * w + h)) + margin;
      }

      x = Math.max(-margin, Math.min(cw + margin, x));
      y = Math.max(-margin, Math.min(ch + margin, y));
      return { x, y };
    }

    function getSiegeEnemyCountRange(wave) {
      let minCount, maxCount;
      if (wave <= 1) {
        minCount = 2; maxCount = 3; // Wave 1: 保證至少生成 2-3 隻，杜絕只出 1 隻怪獸
      } else if (wave <= 2) {
        minCount = 2; maxCount = 3; // Wave 2: 穩定生成 2-3 隻
      } else if (wave <= 4) {
        minCount = 2; maxCount = 3;
      } else if (wave <= 6) {
        minCount = 2; maxCount = 4; // Wave 5-6: 隨機 2-4 隻
      } else if (wave <= 8) {
        minCount = 3; maxCount = 4;
      } else if (wave <= 11) {
        minCount = 3; maxCount = 5;
      } else if (wave <= 15) {
        minCount = 4; maxCount = 5;
      } else {
        minCount = Math.min(6, 4 + Math.floor((wave - 15) * 0.15));
        maxCount = Math.min(7, 6 + Math.floor((wave - 15) * 0.15));
      }
      if (typeof siegeExtraEnemyCount !== 'undefined') {
        minCount += siegeExtraEnemyCount;
        maxCount += siegeExtraEnemyCount;
      }
      return { min: Math.max(1, minCount), max: Math.max(minCount, maxCount) };
    }

    // ★ 難度階梯 2：入侵怪獸移動速度隨機範圍 (波次數值驅動 + 招式調製)
    function getSiegeSpeedRange(wave) {
      let baseMin, baseMax;
      if (wave <= 1) {
        baseMin = 0.38; baseMax = 0.46;
      } else if (wave <= 2) {
        baseMin = 0.40; baseMax = 0.49;
      } else if (wave <= 4) {
        baseMin = 0.43; baseMax = 0.53;
      } else if (wave <= 6) {
        baseMin = 0.46; baseMax = 0.57;
      } else if (wave <= 8) {
        baseMin = 0.49; baseMax = 0.61;
      } else if (wave <= 11) {
        baseMin = 0.52; baseMax = 0.65;
      } else if (wave <= 15) {
        baseMin = 0.56; baseMax = 0.70;
      } else {
        baseMin = 0.56 + (wave - 15) * 0.008;
        baseMax = 0.70 + (wave - 15) * 0.010;
      }
      const effectiveFactor = (typeof siegeSlowFactor !== 'undefined' ? siegeSlowFactor : 1.0) * 
                              (typeof siegeSpeedPenalty !== 'undefined' ? siegeSpeedPenalty : 1.0);
      return {
        min: parseFloat((baseMin * effectiveFactor).toFixed(3)),
        max: parseFloat((baseMax * effectiveFactor).toFixed(3))
      };
    }

    // ★ 戰況即時狀態儀表板更新與 Hover 招式動態預覽
    function updateSiegeStatusDashboard(previewMove = null) {
      const dashboard = document.getElementById('siege-status-dashboard');
      if (!dashboard) return;

      const badge = document.getElementById('ssd-preview-badge');
      const stageInfo = document.getElementById('ssd-stage-info');
      const valEnemies = document.getElementById('ssd-val-enemies');
      const diffEnemies = document.getElementById('ssd-diff-enemies');
      const valSpeed = document.getElementById('ssd-val-speed');
      const diffSpeed = document.getElementById('ssd-diff-speed');
      const valHp = document.getElementById('ssd-val-hp');
      const diffHp = document.getElementById('ssd-diff-hp');
      const valCharge = document.getElementById('ssd-val-charge');
      const diffCharge = document.getElementById('ssd-diff-charge');
      const warningStrip = document.getElementById('ssd-warning-strip');
      const warningText = document.getElementById('ssd-warning-text');

      const cardEnemies = document.getElementById('ssd-metric-enemies');
      const cardSpeed = document.getElementById('ssd-metric-speed');
      const cardHp = document.getElementById('ssd-metric-hp');
      const cardCharge = document.getElementById('ssd-metric-charge');

      const curCount = getSiegeEnemyCountRange(siegeWave);
      const curSpeed = getSiegeSpeedRange(siegeWave);

      if (stageInfo) {
        stageInfo.textContent = `波次 Wave ${siegeWave} · 寶可夢等級 Lv.${siegeLevel}`;
      }

      if (!previewMove) {
        dashboard.classList.remove('ssd-preview-active');
        if (badge) badge.style.display = 'none';
        if (warningStrip) warningStrip.style.display = 'none';

        [cardEnemies, cardSpeed, cardHp, cardCharge].forEach(c => c && c.classList.remove('ssd-metric-highlight'));

        if (valEnemies) valEnemies.textContent = `${curCount.min} ~ ${curCount.max} 隻`;
        if (diffEnemies) diffEnemies.textContent = '';

        if (valSpeed) valSpeed.textContent = `${curSpeed.min.toFixed(2)} ~ ${curSpeed.max.toFixed(2)} px/f`;
        if (diffSpeed) diffSpeed.textContent = '';

        if (valHp) valHp.textContent = `${Math.max(0, siegeHp)} / ${siegeMaxHp}`;
        if (diffHp) diffHp.textContent = `護盾: ${siegeBarrierShieldCount} 面`;

        if (valCharge) valCharge.textContent = `×${siegeUltChargeRate.toFixed(2)} 倍率`;
        if (diffCharge) diffCharge.textContent = `擊破 +${15 + siegeBonusScore}分`;
      } else {
        dashboard.classList.add('ssd-preview-active');
        if (badge) badge.style.display = 'inline';

        const prev = previewMove.preview || {};

        // 1. 怪獸數量預覽
        const nextMinCount = curCount.min + (prev.countAdd || 0);
        const nextMaxCount = curCount.max + (prev.countAdd || 0);
        if (valEnemies) valEnemies.textContent = `${nextMinCount} ~ ${nextMaxCount} 隻`;
        if (diffEnemies) {
          if (prev.countAdd) {
            diffEnemies.innerHTML = `<span class="ssd-diff-nerf">⚠️ +${prev.countAdd} 隻狂潮</span>`;
            if (cardEnemies) cardEnemies.classList.add('ssd-metric-highlight');
          } else {
            diffEnemies.textContent = '數量持平';
            if (cardEnemies) cardEnemies.classList.remove('ssd-metric-highlight');
          }
        }

        // 2. 移動速度預覽
        let simSpeedMult = (prev.speedMult || 1.0) * (prev.slowMult || 1.0);
        const nextMinSpeed = parseFloat((curSpeed.min * simSpeedMult).toFixed(2));
        const nextMaxSpeed = parseFloat((curSpeed.max * simSpeedMult).toFixed(2));
        if (valSpeed) valSpeed.textContent = `${nextMinSpeed.toFixed(2)} ~ ${nextMaxSpeed.toFixed(2)} px/f`;
        if (diffSpeed) {
          if (simSpeedMult > 1.0) {
            const pct = Math.round((simSpeedMult - 1) * 100);
            diffSpeed.innerHTML = `<span class="ssd-diff-nerf">⚠️ 加速 +${pct}%</span>`;
            if (cardSpeed) cardSpeed.classList.add('ssd-metric-highlight');
          } else if (simSpeedMult < 1.0) {
            const pct = Math.round((1 - simSpeedMult) * 100);
            diffSpeed.innerHTML = `<span class="ssd-diff-buff">🛡️ 減緩 ${pct}%</span>`;
            if (cardSpeed) cardSpeed.classList.add('ssd-metric-highlight');
          } else {
            diffSpeed.textContent = '速度不變';
            if (cardSpeed) cardSpeed.classList.remove('ssd-metric-highlight');
          }
        }

        // 3. 生命值預覽
        const nextMaxHp = siegeMaxHp + (prev.hpMaxAdd || 0);
        const nextHp = Math.min(nextMaxHp, siegeHp + (prev.hpAdd || 0) + (prev.hpMaxAdd || 0));
        if (valHp) valHp.textContent = `${nextHp} / ${nextMaxHp}`;
        if (diffHp) {
          if (prev.hpMaxAdd || prev.hpAdd || prev.hpRegen) {
            const regenText = prev.hpRegen ? ` (每10秒+${prev.hpRegen})` : '';
            diffHp.innerHTML = `<span class="ssd-diff-buff">💚 HP提升${regenText}</span>`;
            if (cardHp) cardHp.classList.add('ssd-metric-highlight');
          } else if (prev.extraDamage) {
            diffHp.innerHTML = `<span class="ssd-diff-nerf">⚠️ 撞擊傷+${prev.extraDamage}</span>`;
            if (cardHp) cardHp.classList.add('ssd-metric-highlight');
          } else {
            diffHp.textContent = `護盾: ${siegeBarrierShieldCount} 面`;
            if (cardHp) cardHp.classList.remove('ssd-metric-highlight');
          }
        }

        // 4. 充能與攻擊預覽
        const nextChargeRate = siegeUltChargeRate + (prev.chargeRateAdd || 0);
        if (valCharge) valCharge.textContent = `×${nextChargeRate.toFixed(2)} 倍率`;
        if (diffCharge) {
          if (prev.chargeRateAdd) {
            diffCharge.innerHTML = `<span class="ssd-diff-buff">⚡ 充能加速</span>`;
            if (cardCharge) cardCharge.classList.add('ssd-metric-highlight');
          } else if (prev.scoreAdd) {
            diffCharge.innerHTML = `<span class="ssd-diff-buff">🎯 得分+${prev.scoreAdd}</span>`;
            if (cardCharge) cardCharge.classList.add('ssd-metric-highlight');
          } else {
            diffCharge.textContent = `擊破 +${15 + siegeBonusScore}分`;
            if (cardCharge) cardCharge.classList.remove('ssd-metric-highlight');
          }
        }

        // 5. 負面代價警示條
        if (previewMove.drawback && warningStrip && warningText) {
          warningText.textContent = previewMove.drawback;
          warningStrip.style.display = 'flex';
        } else if (warningStrip) {
          warningStrip.style.display = 'none';
        }
      }
    }

    // ★ 問題 1 核心升級：無上限階梯配置 + 1-10級當周字庫 / 11級後全字庫真隨機 + 零空白等待
    function spawnSiegeWave() {
      if (!siegeActive || !siegeRunning) return;

      if (!siegeWordQueue || siegeWordQueue.length === 0) {
        const fullPool = getSiegeWordPool(siegeWave, siegeLevel);
        siegeWordQueue = secureFisherYatesShuffle(fullPool);
      }
      if (!siegeWordQueue || siegeWordQueue.length === 0) return;

      const canvas = document.getElementById('siege-canvas');
      const cw = canvas ? canvas.width : 800;
      const ch = canvas ? canvas.height : 420;
      const cx = cw / 2;
      const cy = ch / 2;

      // 清理前波殘留 Boss 指標
      if (currentBoss && currentBoss.hp <= 0) {
        currentBoss = null;
        hideBossHUD();
      }

      const flightTypes = ['straight', 'sine_wobble', 'spiral', 'zigzag', 's_curve'];
      const speedRange = getSiegeSpeedRange(siegeWave);

      // =========================================================================
      // 👑 情況 1：每 10 波出現【大型Boss · 耿鬼 Gengar】(Wave 10, 20, 30...)
      // =========================================================================
      if (siegeWave % 10 === 0 && (!currentBoss || currentBoss.bossType !== 'major')) {
        const majorTier = Math.max(0, Math.floor((siegeWave - 10) / 10));
        const numBossWords = 10 + majorTier * 2; // Wave 10: 10字; Wave 20: 12字; Wave 30: 14字
        const totalMajorHp = 200 + majorTier * 40; // Wave 10: 200; Wave 20: 240; Wave 30: 280
        const bossWords = [];
        for (let w = 0; w < numBossWords; w++) {
          bossWords.push(drawUniqueSiegeWord());
        }

        const spawnPt = getRectBoundarySpawnPoint(cw, ch, 0, 4);
        currentBoss = {
          isBoss: true,
          bossType: 'major',
          name: '耿鬼 Gengar',
          monsterType: 'gengar',
          form: 1, // 第 1 型態：十字輪轉
          hp: totalMajorHp,
          maxHp: totalMajorHp,
          phase2BaseHp: totalMajorHp / 2, // 第 2 型態起點血量 (100, 120, 140...)
          wordsQueue: bossWords,
          word: bossWords[0],
          wordTimer: 4 + getSecureRandom() * 4, // 4-8 秒換字
          wordMaxTimer: 6,
          blinkTimer: 1 + getSecureRandom() * 2, // 1-3 秒閃現
          attackTimer: 6 + getSecureRandom() * 4, // 5-10 秒突襲
          isRushing: false,
          minionsKilledBeforeRush: 0,
          x: spawnPt.x,
          y: spawnPt.y,
          speed: speedRange.min * (0.85 + Math.min(0.3, majorTier * 0.1)),
          rushSpeed: 2.4 + Math.min(0.8, majorTier * 0.25),
          radius: 58, // 大尺寸
          typedIdx: 0,
          shake: 0,
          flightType: 'straight',
          phase: 0,
          timer: 0,
          dir: 1
        };

        siegeEnemies.push(currentBoss);
        showBossHUD(currentBoss);

        if (typeof showPassToast === 'function') {
          showPassToast(`👑 警報！第 Wave ${siegeWave} 波大型Boss【耿鬼 Gengar】降臨！總血量 ${totalMajorHp}！`);
        }

        // 同時召喚普通怪獸（隨波次增長：Wave 10 為 3~5 隻，Wave 20 為 5~8 隻，Wave 30 為 7~11 隻...）
        const minionMin = 3 + majorTier * 2;
        const minionMax = 5 + majorTier * 3;
        const minionCount = Math.floor(minionMin + getSecureRandom() * (minionMax - minionMin + 1));
        const monsterTypes = ['gastly', 'haunter', 'gourgeist'];
        for (let i = 0; i < minionCount; i++) {
          const randWord = drawUniqueSiegeWord();
          const pt = getRectBoundarySpawnPoint(cw, ch, i + 1, minionCount + 1);
          siegeEnemies.push({
            isBoss: false,
            word: randWord,
            x: pt.x,
            y: pt.y,
            speed: speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min),
            typedIdx: 0,
            radius: 30,
            shake: 0,
            monsterType: monsterTypes[i % monsterTypes.length],
            flightType: flightTypes[Math.floor(getSecureRandom() * flightTypes.length)],
            phase: getSecureRandom() * Math.PI * 2,
            timer: 0,
            dir: getSecureRandom() < 0.5 ? 1 : -1
          });
        }
        return;
      }

      // =========================================================================
      // 🚨 情況 1.5：每隔波次 13 出現【恐怖獸潮 HORROR SWARM】(Wave 13, 26, 39, 52...)
      // =========================================================================
      if (siegeWave % 13 === 0) {
        hideBossHUD();
        const swarmTier = Math.floor(siegeWave / 13);
        const normalCountRange = getSiegeEnemyCountRange(siegeWave);
        const baseCount = Math.floor(normalCountRange.min + getSecureRandom() * (normalCountRange.max - normalCountRange.min + 1));

        // ★ 四年級教學降載：獸潮寶可夢數目平均 8 至 12 隻 (依據四年級學生年齡適度削弱)
        const totalMinions = Math.floor(8 + getSecureRandom() * 5); // 8 ~ 12 隻 (平均 10 隻)
        const miniCount = 1; // 伴隨 1 隻小型 Boss (0.8倍速)

        const totalEntities = totalMinions + miniCount;
        const baseNormalSpeed = speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min);
        // ★ 小型 Boss 迫近速度嚴格設定為：該波次普通寶可夢速度的 0.8 倍！
        const miniBossSpeed = baseNormalSpeed * 0.8;

        const monsterTypes = ['gastly', 'haunter', 'gourgeist'];

        // 1. 生成小型 Boss（附帶 3-5 隻小型 Boss，從四方八面隨機方向進場）
        for (let b = 0; b < miniCount; b++) {
          const miniWords = [drawUniqueSiegeWord()];
          if (swarmTier >= 2 && getSecureRandom() < 0.5) {
            miniWords.push(drawUniqueSiegeWord());
          }
          const spawnPt = getRectBoundarySpawnPoint(cw, ch, b, totalEntities);
          const miniBossObj = {
            isBoss: true,
            bossType: 'mini',
            isSwarmBoss: true,
            name: b % 2 === 0 ? '鬼斯通 Haunter' : '鬼斯 Gastly',
            monsterType: b % 2 === 0 ? 'haunter' : 'gastly',
            miniFormType: 'swarm_mini',
            hp: miniWords.length,
            maxHp: miniWords.length,
            wordsQueue: miniWords,
            word: miniWords[0],
            x: spawnPt.x,
            y: spawnPt.y,
            speed: miniBossSpeed, // 0.8倍普通寶可夢速度
            radius: 40,
            typedIdx: 0,
            shake: 0,
            flightType: flightTypes[Math.floor(getSecureRandom() * flightTypes.length)],
            phase: getSecureRandom() * Math.PI * 2,
            timer: 0,
            dir: getSecureRandom() < 0.5 ? 1 : -1
          };
          siegeEnemies.push(miniBossObj);
        }

        // 2. 生成常態大群入侵寶可夢（從四方八面隨機方向進場）
        for (let m = 0; m < totalMinions; m++) {
          const randWord = drawUniqueSiegeWord();
          const spawnPt = getRectBoundarySpawnPoint(cw, ch, miniCount + m, totalEntities);
          const mSpeed = speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min);
          siegeEnemies.push({
            isBoss: false,
            word: randWord,
            x: spawnPt.x,
            y: spawnPt.y,
            speed: mSpeed,
            typedIdx: 0,
            radius: 30,
            shake: 0,
            monsterType: monsterTypes[m % monsterTypes.length],
            flightType: flightTypes[Math.floor(getSecureRandom() * flightTypes.length)],
            phase: getSecureRandom() * Math.PI * 2,
            timer: 0,
            dir: getSecureRandom() < 0.5 ? 1 : -1
          });
        }

        if (miniCount > 0) {
          currentBoss = siegeEnemies.find(e => e.isBoss);
          showBossHUD(currentBoss);
        }

        if (typeof showPassToast === 'function') {
          showPassToast(`🚨 警報！第 Wave ${siegeWave} 波【恐怖獸潮 HORROR SWARM】爆發！共 ${totalMinions} 隻怪獸湧入${miniCount > 0 ? `，伴隨 ${miniCount} 隻小型Boss（0.8倍速）！` : '！'}`);
        }
        return;
      }

      // =========================================================================
      // 👑 情況 2：每 5 波出現【小型月Boss】(Wave 5, 15, 25, 35...)
      // =========================================================================
      if (siegeWave % 5 === 0 && siegeWave % 10 !== 0 && (!currentBoss || currentBoss.bossType !== 'mini')) {
        const miniTier = Math.max(0, Math.floor((siegeWave - 5) / 10));
        const miniTypes = ['gastly', 'haunter'];
        const chosenMonster = miniTypes[Math.floor(getSecureRandom() * miniTypes.length)];
        const miniName = chosenMonster === 'gastly' ? '鬼斯 Gastly' : '鬼斯通 Haunter';
        const isSpeedy = getSecureRandom() < 0.5; // 隨機型態 1 (迅捷) 或 型態 2 (多字盾)

        // 隨波次增長小型 Boss 帶字數：迅捷型 1~2 字，盾型 2~4 字
        const numWords = isSpeedy ? (1 + Math.min(1, miniTier)) : (2 + Math.min(2, miniTier));
        const miniWords = [];
        for (let w = 0; w < numWords; w++) {
          miniWords.push(drawUniqueSiegeWord());
        }

        const baseNormalSpeed = speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min);
        // 迫近速度隨波次適度增加
        const speedScale = 1.0 + Math.min(0.4, (siegeWave - 5) * 0.015);
        const spawnPt = getRectBoundarySpawnPoint(cw, ch, 0, 5);

        currentBoss = {
          isBoss: true,
          bossType: 'mini',
          name: miniName,
          monsterType: chosenMonster,
          miniFormType: isSpeedy ? 'speedy' : 'dual_word',
          hp: numWords,
          maxHp: numWords,
          wordsQueue: miniWords,
          word: miniWords[0],
          x: spawnPt.x,
          y: spawnPt.y,
          speed: (isSpeedy ? baseNormalSpeed * 1.5 : baseNormalSpeed * 0.7) * speedScale,
          radius: 42, // 比普通寶可夢大
          typedIdx: 0,
          shake: 0,
          flightType: isSpeedy ? 'straight' : 'sine_wobble',
          phase: 0,
          timer: 0,
          dir: 1
        };

        siegeEnemies.push(currentBoss);
        showBossHUD(currentBoss);

        if (typeof showPassToast === 'function') {
          showPassToast(`👑 警報！第 Wave ${siegeWave} 波【小型月Boss · ${miniName}】突襲進犯！（血量/帶字數: ${numWords}）`);
        }

        // 同時生成當前波次常態怪獸
        const countRange = getSiegeEnemyCountRange(siegeWave);
        const count = Math.floor(countRange.min + getSecureRandom() * (countRange.max - countRange.min + 1));
        const monsterTypes = ['gastly', 'haunter', 'gourgeist'];
        for (let i = 0; i < count; i++) {
          const randWord = drawUniqueSiegeWord();
          const pt = getRectBoundarySpawnPoint(cw, ch, i + 1, count + 1);
          siegeEnemies.push({
            isBoss: false,
            word: randWord,
            x: pt.x,
            y: pt.y,
            speed: speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min),
            typedIdx: 0,
            radius: 30,
            shake: 0,
            monsterType: monsterTypes[i % monsterTypes.length],
            flightType: flightTypes[Math.floor(getSecureRandom() * flightTypes.length)],
            phase: getSecureRandom() * Math.PI * 2,
            timer: 0,
            dir: getSecureRandom() < 0.5 ? 1 : -1
          });
        }
        return;
      }

      // =========================================================================
      // 👾 情況 3：常態波次生成 (貼合四邊邊緣生成)
      // =========================================================================
      hideBossHUD();
      const countRange = getSiegeEnemyCountRange(siegeWave);
      const count = Math.floor(countRange.min + getSecureRandom() * (countRange.max - countRange.min + 1));
      const monsterTypes = ['gastly', 'haunter', 'gourgeist'];

      for (let i = 0; i < count; i++) {
        const randWord = drawUniqueSiegeWord();
        const spawnPt = getRectBoundarySpawnPoint(cw, ch, i, count);
        const speed = speedRange.min + getSecureRandom() * (speedRange.max - speedRange.min);

        siegeEnemies.push({
          isBoss: false,
          word: randWord,
          x: spawnPt.x,
          y: spawnPt.y,
          speed: speed,
          typedIdx: 0,
          radius: 30,
          shake: 0,
          monsterType: monsterTypes[i % monsterTypes.length],
          flightType: flightTypes[Math.floor(getSecureRandom() * flightTypes.length)],
          phase: getSecureRandom() * Math.PI * 2,
          timer: 0,
          dir: getSecureRandom() < 0.5 ? 1 : -1
        });
      }
    }

    // 鍵盤原生事件監聽 (數字鍵 1 傷藥、數字鍵 2 十萬伏特)
    function handleSiegeKeydown(e) {
      if (currentGameMode !== 'siege') return;
      if (!siegeActive) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const readyOverlay = document.getElementById('siege-ready-overlay');
      if (readyOverlay && readyOverlay.style.display !== 'none') {
        if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          siegeStartGame();
        }
        return;
      }

            // ⚡ 閃避 QTE 視窗專屬鍵盤監聽
      if (siegeDodgeActive && siegeDodgeWord && Array.isArray(siegeDodgeWord.keys)) {
        e.preventDefault();
        e.stopPropagation();
        let dodgeLetter = '';
        if (e.code && e.code.startsWith('Key') && e.code.length === 4) {
          dodgeLetter = e.code.slice(3).toUpperCase();
        } else if (e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
          dodgeLetter = e.key.toUpperCase();
        } else if (e.keyCode && e.keyCode >= 65 && e.keyCode <= 90) {
          dodgeLetter = String.fromCharCode(e.keyCode).toUpperCase();
        }
        if (!dodgeLetter) return;

        if (siegeDodgeWord.keys[siegeDodgeTypedIdx] === dodgeLetter) {
          siegeDodgeTypedIdx++;
          updateDodgePips();
          if (siegeDodgeTypedIdx >= siegeDodgeWord.keys.length) {
            resolveSiegeDodge(true);
          }
        } else {
          // ★ 依規則與使用者要求：按錯字碼即刻判定閃避失敗！承受 30 點攻擊傷害！
          resolveSiegeDodge(false);
        }
        return;
      }

      if (!siegeRunning || siegeIsPaused) return;

      // 數字鍵 1：使用傷藥
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
        e.preventDefault();
        e.stopPropagation();
        useSiegePotion();
        return;
      }

      // ★ 數字鍵 2：發動「十萬伏特」(玩家自行選擇時機發動，充能滿方可施放)
      if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
        e.preventDefault();
        e.stopPropagation();
        if (siegeUltCharge >= 100) {
          siegeCastUltimate();
        } else {
          if (typeof showPassToast === 'function') {
            showPassToast('⚡【十萬伏特】充能未滿！擊破怪獸即可累積充能！');
          }
        }
        return;
      }

      // ★ Backspace 或 Escape 鍵：隨時取消當前目標鎖定，零懲罰無失誤重置
      if (e.key === 'Backspace' || e.key === 'Escape' || e.code === 'Backspace' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (Array.isArray(siegeCandidateEnemies)) {
          siegeCandidateEnemies.forEach(em => { em.typedIdx = 0; });
        }
        siegeCandidateEnemies = [];
        siegeTargetEnemy = null;
        siegeLastKey = null;
        if (typeof showPassToast === 'function') {
          showPassToast('🎯 已重置目標鎖定，可隨時敲擊任一字首碼！');
        }
        return;
      }

      let letter = '';
      if (e.code && e.code.startsWith('Key') && e.code.length === 4) {
        letter = e.code.slice(3).toUpperCase();
      } else if (e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        letter = e.key.toUpperCase();
      } else if (e.keyCode && e.keyCode >= 65 && e.keyCode <= 90) {
        letter = String.fromCharCode(e.keyCode).toUpperCase();
      }

      // 空白鍵防滾動（十萬伏特改由玩家點擊按鈕或按數字鍵 2 手動發動，絕不自動觸發）
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!letter || letter < 'A' || letter > 'Z') return;
      e.preventDefault();
      e.stopPropagation();

      processSiegeKey(letter);
    }

    // 目標靈活切換機制 (全維度防止同首碼互相卡住、支援跨字無縫擊破與智慧優先權)
    function processSiegeKey(key) {
      const canvas = document.getElementById('siege-canvas');
      const cw = canvas ? canvas.width : 800;
      const ch = canvas ? canvas.height : 420;
      const cx = cw / 2;
      const cy = ch / 2;

      // 確保候選清單有效
      if (!Array.isArray(siegeCandidateEnemies)) {
        siegeCandidateEnemies = [];
      }
      siegeCandidateEnemies = siegeCandidateEnemies.filter(em => siegeEnemies.includes(em));

      // ─────────────────────────────────────────────────────────────
      // 情況 A：當前已有候選怪獸群 (支援同首碼多目標並行鎖定與分支過濾)
      // 例如：拿 (OMRQ) 與 全 (OMG) 首碼均為 O，輸入 O 時兩者均鎖定；
      // 輸入第二碼 M 時兩者繼續前進；輸入第三碼 G 時自動鎖定「全」，輸入 R 時鎖定「拿」！
      // ─────────────────────────────────────────────────────────────
      if (siegeCandidateEnemies.length > 0) {
        // 1. 篩選出當前字碼能匹配 key 的候選怪獸
        const matching = siegeCandidateEnemies.filter(em => {
          return em.word && Array.isArray(em.word.keys) && em.word.keys[em.typedIdx] === key;
        });

        if (matching.length > 0) {
          // 成功推進匹配的怪獸進度
          matching.forEach(em => {
            em.typedIdx++;
          });

          // 未匹配者排除並重置進度 (除非學會看我嘛保留進度)
          siegeCandidateEnemies.forEach(em => {
            if (!matching.includes(em) && !siegeKeepProgressOnMiss) {
              em.typedIdx = 0;
            }
          });

          siegeCandidateEnemies = matching;
          siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : null;

          // 檢查是否已有怪獸打完完整拆碼
          const completed = siegeCandidateEnemies.filter(em => em.typedIdx >= em.word.keys.length);
          if (completed.length > 0) {
            // 擊破最先完成的怪獸 (若同時完成優先擊破離中心最近者)
            completed.sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
            const victim = completed[0];
            defeatSiegeEnemy(victim);
            siegeCandidateEnemies = siegeCandidateEnemies.filter(em => em !== victim);
            siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : null;
          }
          siegeLastKey = key;
          return;
        } else {
          // 2. 當前候選群無一匹配：
          // ★ 關鍵防護 1：檢查玩家前一鍵 + 當前鍵 (例如先前敲卜 Y，現在敲一 M) 是否正好構成場上某怪獸（例如「上」YM）的完整字碼！
          if (siegeLastKey) {
            const pairMatching = siegeEnemies.filter(em => {
              return em.word && Array.isArray(em.word.keys) && em.word.keys.length === 2 &&
                     em.word.keys[0] === siegeLastKey && em.word.keys[1] === key;
            });
            if (pairMatching.length > 0) {
              pairMatching.sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
              const victim = pairMatching[0];
              if (!siegeKeepProgressOnMiss) {
                siegeCandidateEnemies.forEach(em => { em.typedIdx = 0; });
              }
              victim.typedIdx = victim.word.keys.length;
              defeatSiegeEnemy(victim);
              siegeCandidateEnemies = [];
              siegeTargetEnemy = null;
              siegeLastKey = null;
              return;
            }
          }

          // ★ 關鍵防護 2：檢查玩家是否切換擊打場上「以 key 為首碼」的新怪獸
          const newCands = siegeEnemies.filter(em => em.word && Array.isArray(em.word.keys) && em.word.keys[0] === key);
          if (newCands.length > 0) {
            if (!siegeKeepProgressOnMiss) {
              siegeCandidateEnemies.forEach(em => { em.typedIdx = 0; });
            }
            newCands.forEach(em => { em.typedIdx = 1; });
            siegeCandidateEnemies = newCands;
            siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : null;

            const completed = newCands.filter(em => em.typedIdx >= em.word.keys.length);
            if (completed.length > 0) {
              completed.sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
              const victim = completed[0];
              defeatSiegeEnemy(victim);
              siegeCandidateEnemies = siegeCandidateEnemies.filter(em => em !== victim);
              siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : null;
            }
            siegeLastKey = key;
            return;
          } else {
            // 真正按錯：震動並重置
            if (!siegeKeepProgressOnMiss) {
              siegeCandidateEnemies.forEach(em => { em.typedIdx = 0; em.shake = 10; });
            }
            siegeCandidateEnemies = [];
            siegeTargetEnemy = null;
            siegeLastKey = null;
            siegeMisses++;
            updateSiegeHUD();
            return;
          }
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 情況 B：當前未鎖定怪獸 (搜尋場上所有首碼符合 key 的怪獸，全部納入候選)
      // ─────────────────────────────────────────────────────────────
      // ★ 優先檢查：若有前置字碼，前置 + 當前鍵是否構成任何 2 碼字
      if (siegeLastKey) {
        const pairMatching = siegeEnemies.filter(em => {
          return em.word && Array.isArray(em.word.keys) && em.word.keys.length === 2 &&
                 em.word.keys[0] === siegeLastKey && em.word.keys[1] === key;
        });
        if (pairMatching.length > 0) {
          pairMatching.sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
          const victim = pairMatching[0];
          victim.typedIdx = victim.word.keys.length;
          defeatSiegeEnemy(victim);
          siegeCandidateEnemies = [];
          siegeTargetEnemy = null;
          siegeLastKey = null;
          return;
        }
      }

      const cands = siegeEnemies.filter(em => em.word && Array.isArray(em.word.keys) && em.word.keys[0] === key);

      if (cands.length > 0) {
        cands.forEach(em => { em.typedIdx = 1; });
        siegeCandidateEnemies = cands;
        // 若有多隻怪獸同首碼，瞄準線優先指向離中心最近的一隻
        if (cands.length === 1) {
          siegeTargetEnemy = cands[0];
        } else {
          const sortedCands = [...cands].sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
          siegeTargetEnemy = sortedCands[0];
        }

        const completed = cands.filter(em => em.typedIdx >= em.word.keys.length);
        if (completed.length > 0) {
          completed.sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
          const victim = completed[0];
          defeatSiegeEnemy(victim);
          siegeCandidateEnemies = siegeCandidateEnemies.filter(em => em !== victim);
          siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : (siegeCandidateEnemies.length > 1 ? siegeCandidateEnemies[0] : null);
        }
        siegeLastKey = key;
      } else {
        siegeLastKey = null;
        siegeMisses++;
        updateSiegeHUD();
      }
    }

    function triggerPikachuLightning(target) {
      const canvas = document.getElementById('siege-canvas');
      const cw = canvas ? canvas.width : 800;
      const ch = canvas ? canvas.height : 420;
      const cx = cw / 2;
      const cy = ch / 2;

      const steps = 14;
      const points = [{ x: cx, y: cy }];
      const dx = target.x - cx;
      const dy = target.y - cy;
      const dist = Math.hypot(dx, dy) || 1;

      for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const nx = cx + dx * ratio;
        const ny = cy + dy * ratio;
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const jitter = (getSecureRandom() - 0.5) * 26 * Math.sin(ratio * Math.PI);
        points.push({ x: nx + perpX * jitter, y: ny + perpY * jitter });
      }
      points.push({ x: target.x, y: target.y });

      siegeLightnings.push({
        points: points,
        life: 14,
        maxLife: 14,
        targetX: target.x,
        targetY: target.y
      });
    }

    
    function defeatSiegeEnemy(em) {
      // 👑 小型 Boss 處理 (支援多字隊列擊退與波次血量)
      if (em.isBoss && em.bossType === 'mini') {
        if (em.wordsQueue && em.wordsQueue.length > 1) {
          triggerPikachuLightning(em);
          em.wordsQueue.shift();
          em.word = em.wordsQueue[0];
          em.typedIdx = 0;
          em.hp = em.wordsQueue.length;
          // 受到強烈擊退向外後退 75px
          const canvas = document.getElementById('siege-canvas');
          const cx = canvas ? canvas.width / 2 : 400;
          const cy = canvas ? canvas.height / 2 : 210;
          const angle = Math.atan2(em.y - cy, em.x - cx);
          em.x += Math.cos(angle) * 75;
          em.y += Math.sin(angle) * 75;
          em.shake = 15;
          updateBossHUD();
          if (typeof showPassToast === 'function') {
            showPassToast(`👑【小型月Boss】字靈擊破！受到強烈擊退，剩餘 ${em.wordsQueue.length} 個字！`);
          }
          return;
        } else {
          // 小型 Boss 徹底擊破：獲得 3 倍巨額積分並順暢推進波次！
          let bonusScore = (Math.round(15 * 1.2) + siegeBonusScore) * 3;
          bonusScore += Math.floor(siegeWave * 5); // 隨波次調高
          siegeScore += bonusScore;
          updateSiegeHUD();
          if (typeof burstConfetti === 'function') burstConfetti();
          if (typeof showPassToast === 'function') {
            showPassToast(`👑 擊潰小型Boss【${em.name}】！獲得 +${bonusScore} 巨額積分！`);
          }

          // ★ 若場上尚有其他小型 Boss，切換 HUD 目標；若全滅則隱藏
          const otherBosses = siegeEnemies.filter(item => item.isBoss && item !== em);
          if (otherBosses.length > 0) {
            currentBoss = otherBosses[0];
            updateBossHUD();
          } else {
            currentBoss = null;
            hideBossHUD();
          }
        }
      }

      // 👑 大型 Boss (耿鬼) 第 1 型態處理
      if (em.isBoss && em.bossType === 'major' && em.form === 1) {
        triggerPikachuLightning(em);
        em.wordsQueue = em.wordsQueue.filter(w => w !== em.word);
        const p2Hp = em.phase2BaseHp || 100;
        em.hp = Math.max(p2Hp, em.hp - 10);
        em.typedIdx = 0;
        em.shake = 12;
        // 擊退 35px
        const canvas = document.getElementById('siege-canvas');
        const cx = canvas ? canvas.width / 2 : 400;
        const cy = canvas ? canvas.height / 2 : 210;
        const angle = Math.atan2(em.y - cy, em.x - cx);
        em.x += Math.cos(angle) * 35;
        em.y += Math.sin(angle) * 35;

        if (em.wordsQueue.length > 0 && em.hp > p2Hp) {
          em.word = em.wordsQueue[Math.floor(getSecureRandom() * em.wordsQueue.length)];
          em.wordTimer = 4 + getSecureRandom() * 4;
          updateBossHUD();
          if (typeof showPassToast === 'function') {
            showPassToast(`⚡ 擊破耿鬼 1 字！耿鬼受到 10 點傷害！剩餘 ${em.wordsQueue.length} 個字！`);
          }
          return;
        } else {
          // 第 1 型態破除，轉入第 2 型態！
          em.form = 2;
          em.hp = p2Hp;
          em.wordsQueue = [];
          em.word = null; // 身上不再顯示字
          em.isRushing = false;
          em.minionsKilledBeforeRush = 0;
          em.blinkTimer = 1 + getSecureRandom() * 2;
          em.attackTimer = 6 + getSecureRandom() * 4;
          // ★ 確保轉入 Phase 2 瞬間安全置於遊戲畫面邊界內！
          const cw2 = canvas ? canvas.width : 800;
          const ch2 = canvas ? canvas.height : 420;
          const inBounds = getInBoundsBossHoverPos(cw2, ch2, em.radius);
          em.x = inBounds.x;
          em.y = inBounds.y;
          em.anchorX = inBounds.x;
          em.anchorY = inBounds.y;
          em.phase = getSecureRandom() * Math.PI * 2;
          showBossHUD(em); // 短暫展示 5 秒第 2 型態警報
          updateBossHUD();
          if (typeof showPassToast === 'function') {
            showPassToast('💥 耿鬼第 1 型態破除！進入第 2 型態【暗黑幻影閃現】！清除小怪削弱耿鬼！');
          }
          return;
        }
      }

      // 👑 大型 Boss 第 2 型態下：玩家清除普通怪獸，連鎖對耿鬼造成 10 點傷害！
      if (!em.isBoss && currentBoss && currentBoss.bossType === 'major' && currentBoss.form === 2) {
        currentBoss.hp = Math.max(0, currentBoss.hp - 10);
        currentBoss.minionsKilledBeforeRush++;
        updateBossHUD();
        triggerPikachuLightning(currentBoss);
        if (typeof showPassToast === 'function') {
          showPassToast(`⚡ 清除護衛怪獸！對耿鬼造成 10 點傷害！(已累積清除 ${currentBoss.minionsKilledBeforeRush}/3 隻)`);
        }
        if (currentBoss.hp <= 0) {
          defeatMajorBoss();
          return;
        }
      }

      triggerPikachuLightning(em);

      if (siegeLightningChains > 0 && siegeEnemies.length > 1) {
        const others = siegeEnemies.filter(item => item !== em);
        for (let c = 0; c < Math.min(siegeLightningChains, others.length); c++) {
          triggerPikachuLightning(others[c]);
        }
      }

      for (let i = 0; i < 22; i++) {
        const angle = getSecureRandom() * Math.PI * 2;
        const spd = 2.5 + getSecureRandom() * 5.5;
        siegeParticles.push({
          x: em.x,
          y: em.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: ['#FACC15', '#FEF08A', '#38BDF8', '#67E8F9', '#FFFFFF'][Math.floor(getSecureRandom() * 5)],
          life: 25,
          maxLife: 25,
          size: 3 + getSecureRandom() * 3.5
        });
      }

      siegeKills++;
      siegeKillsInWave++;
      siegeKillsInLevel++;

      let pts = Math.round(15 * 1.2) + siegeBonusScore;
      if (siegeDoubleScoreChance > 0 && getSecureRandom() < siegeDoubleScoreChance) {
        pts *= 2;
        if (typeof showPassToast === 'function') showPassToast('🎯 觸發【聚氣暴擊】！獲得雙倍得分！');
      }
      siegeScore += pts;

      // ★ 充能規則：上限 100%，滿 100% 後不作累計，發動後才重新累積！
      if (siegeUltCharge < 100) {
        siegeUltCharge = Math.min(100, siegeUltCharge + Math.round(15 * siegeUltChargeRate));
      }

      siegeEnemies = siegeEnemies.filter(item => item !== em);
      if (siegeTargetEnemy === em) siegeTargetEnemy = null;
      if (Array.isArray(siegeCandidateEnemies)) siegeCandidateEnemies = siegeCandidateEnemies.filter(item => item !== em);
      // ★ 波次推進統一由整波怪物清空時之 advanceToNextSiegeWave 判定 (杜絕擊殺計數與清屏重複自增)

      updateSiegeHUD();

      // ★ 等級晉升檢查 (擊破數驅動，增長比波次慢)
      // Lv.1->2: 5 隻; Lv.2->3: 10 隻; Lv.3->4: 15 隻...
      if (siegeKillsInLevel >= siegeLevelKillsNeeded) {
        siegeLevel++;
        siegeKillsInLevel = 0;
        siegeLevelKillsNeeded = siegeLevel * 5;
        triggerSiegeLevelUpModal();
        return;
      }
    }

    // ★ 十萬伏特大招釋放 (由玩家自行選擇時機發動，閃電特效延遲 2.2 秒配合原音效)
    let siegeIsCastingUlt = false;
    let siegeUltChargingTimer = 0;

    function siegeCastUltimate() {
      if (siegeUltCharge < 100 || !siegeActive || !siegeRunning || siegeIsPaused || siegeIsCastingUlt) return;
      siegeIsCastingUlt = true;
      siegeUltCharge = 0; // 發動後立即歸零，重新累積，防止連擊重複施放
      siegeUltToastShown = false;
      siegeUltChargingTimer = 2.2; // 啟動 2.2 秒蓄力電弧動畫計時
      updateSiegeHUD();

      // 1. 原音效設定完全保留，立即播放 (音效持續約 3 秒，前段為蓄力呼喊，約 2.2 秒迎來雷鳴重音爆發)
      if (typeof ThunderboltSFX !== 'undefined' && ThunderboltSFX.play) {
        ThunderboltSFX.play();
      }

      // 2. 蓄力前置提示
      if (typeof showPassToast === 'function') {
        showPassToast('⚡【十萬伏特】啟動！皮卡丘正在聚集雷霆神力（2.2秒後雷霆轟頂）...');
      }

      // 3. 閃電特效延遲 2.2 秒精準爆發，完美對齊音效重音爆發點！
      setTimeout(() => {
        siegeIsCastingUlt = false;
        siegeUltChargingTimer = 0;

        if (!siegeActive || !siegeRunning || siegeHp <= 0) return;

        const canvas = document.getElementById('siege-canvas');
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 420;
        const cx = cw / 2;
        const cy = ch / 2;

        // ★ 核心分離：普通怪獸被淨化，小、大型 Boss 具備霸體完全免疫十萬伏特！
        const normalEnemies = siegeEnemies.filter(em => !em.isBoss);
        const bossEnemies = siegeEnemies.filter(em => em.isBoss);

        let killedNormal = [];
        let sparedNormal = [];

        const isSwarmWave = (siegeWave % 13 === 0);
        if (isSwarmWave) {
          // ★ 恐怖獸潮波次：每次只能消除場上 1/4 的入侵普通寶可夢！
          // 優先消除離小智中心最近的 1/4 隻，精準解圍
          const countToKill = Math.max(1, Math.ceil(normalEnemies.length / 4));
          const sorted = [...normalEnemies].sort((a, b) => Math.hypot(cx - a.x, cy - a.y) - Math.hypot(cx - b.x, cy - b.y));
          killedNormal = sorted.slice(0, countToKill);
          sparedNormal = sorted.slice(countToKill);
        } else {
          // ★ 恆常波次：消除全場普通怪獸
          killedNormal = normalEnemies;
          sparedNormal = [];
        }

        // 觸發比卡丘閃電電弧連鎖動畫
        killedNormal.forEach(em => triggerPikachuLightning(em));

        // 畫面金黃電光粒子四濺
        for (let i = 0; i < 45; i++) {
          siegeParticles.push({
            x: getSecureRandom() * cw,
            y: getSecureRandom() * ch,
            vx: (getSecureRandom() - 0.5) * 8,
            vy: (getSecureRandom() - 0.5) * 8,
            color: '#FACC15',
            life: 30,
            maxLife: 30,
            size: 4
          });
        }

        // 畫面微震
        siegeDashOffset = 12;

        // ★ 存活實體 = 所有 Boss + 未被消除的普通怪獸 (獸潮時為剩下的 3/4)
        siegeEnemies = bossEnemies.concat(sparedNormal);
        if (Array.isArray(siegeCandidateEnemies)) {
          siegeCandidateEnemies = siegeCandidateEnemies.filter(em => siegeEnemies.includes(em));
          siegeTargetEnemy = (siegeCandidateEnemies.length === 1) ? siegeCandidateEnemies[0] : null;
        } else {
          siegeTargetEnemy = null;
        }

        updateSiegeHUD();

        if (isSwarmWave) {
          if (typeof showPassToast === 'function') {
            showPassToast(`⚡【十萬伏特】雷霆轟頂！消滅了場上 1/4 的普通怪獸（${killedNormal.length} 隻）！剩餘 ${sparedNormal.length} 隻繼續進犯！`);
          }
        } else if (bossEnemies.length > 0) {
          if (typeof showPassToast === 'function') {
            showPassToast('⚡【十萬伏特】雷霆轟頂！全場普通怪獸淨化！（Boss具備霸體，完全免疫十萬伏特！）');
          }
        } else {
          if (typeof triggerSkillToast === 'function') {
            triggerSkillToast('⚡', '觸發【十萬伏特】！比卡丘釋放神雷，淨化全場字靈！');
          }
        }
      }, 2200);
    }

    // ★ 動畫主迴圈安全喚醒器 (杜絕 QTE 或暫停後的主線程休克)
    function resumeSiegeLoop() {
      if (siegeAnimId) {
        cancelAnimationFrame(siegeAnimId);
        siegeAnimId = null;
      }
      if (siegeActive && siegeRunning && !siegeIsPaused) {
        siegeAnimId = requestAnimationFrame(tickSiege);
      }
    }

    // ★ 統一波次推進引擎 (Single Source of Truth，杜絕多處自增導致跳波)
    function advanceToNextSiegeWave() {
      if (!siegeActive || !siegeRunning || siegeIsPaused || siegeHp <= 0) return;
      if (siegeIsSpawningSquad) return;
      siegeIsSpawningSquad = true;

      siegeWave++;
      siegeKillsInWave = 0;
      siegeWaveKillsNeeded = Math.min(10, 2 + Math.floor(siegeWave * 0.35));
      updateSiegeHUD();

      if (siegeWave % 13 === 0) {
        // ★ 四年級教學降載：通關所需擊破數嚴格對齊本波怪獸總數 (8~12 + 1)
        siegeWaveKillsNeeded = Math.floor(8 + getSecureRandom() * 5) + 1;
      }

      if (typeof showPassToast === 'function') {
        if (siegeWave % 13 === 0) {
          showPassToast('🚨 警報！突破至第 Wave ' + siegeWave + ' 波！【恐怖獸潮】全面爆發！大量寶可夢從四方八面湧入！');
        } else if (siegeWave % 10 === 0) {
          showPassToast('👑 突破至第 Wave ' + siegeWave + ' 波！大型霸主【耿鬼】即將降臨！');
        } else if (siegeWave % 5 === 0) {
          showPassToast('👑 突破至第 Wave ' + siegeWave + ' 波！小型月Boss 即將突襲！');
        } else {
          showPassToast('🌊 突破至第 Wave ' + siegeWave + ' 波！入侵精靈攻勢增強！');
        }
      }

      const delay = (siegeWave % 13 === 0) ? 1000 : (siegeWave % 5 === 0 || siegeWave % 10 === 0) ? 800 : 500;
      setTimeout(() => {
        if (siegeActive && siegeRunning && !siegeIsPaused && siegeHp > 0) {
          spawnSiegeWave();
          resumeSiegeLoop();
        }
        siegeIsSpawningSquad = false;
      }, delay);
    }

    function tickSiege() {
      siegeAnimId = null; // 當前幀已進入執行，清空標記
      if (!siegeActive || !siegeRunning) return;
      if (siegeIsPaused) return;

      const canvas = document.getElementById('siege-canvas');
      const wrap = document.getElementById('siege-stage-wrap');
      if (!canvas) return;

      if (wrap && wrap.clientWidth && canvas.width !== wrap.clientWidth) {
        canvas.width = wrap.clientWidth;
        canvas.height = wrap.clientHeight || 420;
      }

      const ctx = canvas.getContext('2d');
      const cw = canvas.width;
      const ch = canvas.height;
      const cx = cw / 2;
      const cy = ch / 2;

      ctx.clearRect(0, 0, cw, ch);

      // 1. 戰術雷達網格背景
      ctx.save();
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.22)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < cw; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
      }
      for (let y = 0; y < ch; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
      }
      ctx.restore();

      // 2. 雙層防守圈 (實線結界＋旋轉虛線雷達)
      ctx.save();

      siegeDashOffset = (siegeDashOffset + 0.35) % 16;
      ctx.beginPath();
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -siegeDashOffset;
      ctx.arc(cx, cy, 88, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      if (siegeBarrierHitTimer > 0) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      } else if (siegeBarrierShieldCount > 0) {
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3.5;
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      } else {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
      }
      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();

      if (siegeBarrierHitTimer > 0) siegeBarrierHitTimer--;

      // 3. 瞄準指示線
      if (siegeTargetEnemy && siegeEnemies.includes(siegeTargetEnemy)) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(siegeTargetEnemy.x, siegeTargetEnemy.y);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }

      // ⚡ 十萬伏特 2.2 秒蓄力電弧光環
      if (typeof siegeUltChargingTimer !== 'undefined' && siegeUltChargingTimer > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 26 + 8 + Math.sin(Date.now() / 40) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#FACC15';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      }

      // 4. 中央小智與比卡丘圖示
      ctx.save();
      const avatarR = 26;
      ctx.beginPath();
      ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
      ctx.clip();
      if (siegeAshImg.complete && siegeAshImg.naturalWidth > 0) {
        ctx.drawImage(siegeAshImg, cx - avatarR, cy - avatarR, avatarR * 2, avatarR * 2);
      } else {
        ctx.fillStyle = '#1E3A8A';
        ctx.fill();
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', cx, cy);
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, avatarR, 0, Math.PI * 2);
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#FACC15';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // 5. 比卡丘十萬伏特閃電光束
      for (let l = siegeLightnings.length - 1; l >= 0; l--) {
        const lt = siegeLightnings[l];
        ctx.save();
        ctx.globalAlpha = Math.max(0, lt.life / lt.maxLife);
        ctx.strokeStyle = (lt.life % 2 === 0) ? '#FFFFFF' : '#FACC15';
        ctx.shadowColor = '#FEF08A';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        if (lt.points && lt.points.length > 0) {
          ctx.moveTo(lt.points[0].x, lt.points[0].y);
          for (let p = 1; p < lt.points.length; p++) {
            ctx.lineTo(lt.points[p].x, lt.points[p].y);
          }
        }
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
        lt.life--;
        if (lt.life <= 0) siegeLightnings.splice(l, 1);
      }

      // 6. 治癒綠色能量粒子
      for (let h = siegeHealParticles.length - 1; h >= 0; h--) {
        const hp = siegeHealParticles[h];
        hp.x += hp.vx;
        hp.y += hp.vy;
        hp.life--;
        ctx.save();
        ctx.globalAlpha = Math.max(0, hp.life / hp.maxLife);
        ctx.fillStyle = hp.color;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, hp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (hp.life <= 0) siegeHealParticles.splice(h, 1);
      }

      // 7. 擊破雷電火花粒子
      for (let p = siegeParticles.length - 1; p >= 0; p--) {
        const pt = siegeParticles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (pt.life <= 0) siegeParticles.splice(p, 1);
      }

      // 8. 5 種隨機飛行路徑 (直線、正弦波浪、螺旋、鋸齒、S形)
      for (let i = siegeEnemies.length - 1; i >= 0; i--) {
        const em = siegeEnemies[i];

        const edx = cx - em.x;
        const edy = cy - em.y;
        const dist = Math.hypot(edx, edy);

        if (dist > 1) {
          const ux = edx / dist;
          const uy = edy / dist;
          const perpX = -uy;
          const perpY = ux;

          em.timer = (em.timer || 0) + 1;

          // 👑 大型 Boss 第 2 型態特殊移動：未發動突襲時在外圍邊界內漂浮待機，絕不逼近小智！
          if (em.isBoss && em.bossType === 'major' && em.form === 2) {
            if (!em.isRushing) {
              // ★ 在畫面邊界外圍優雅漂浮：錨點小幅懸浮微動 (距離小智甚遠，絕不逼近小智)
              em.phase = (em.phase || 0) + 0.02;
              const marginX = em.radius + 18;
              const marginY = em.radius + 18;
              const anchorX = (typeof em.anchorX === 'number') ? em.anchorX : em.x;
              const anchorY = (typeof em.anchorY === 'number') ? em.anchorY : em.y;
              em.x = Math.max(marginX, Math.min(cw - marginX, anchorX + Math.cos(em.phase) * 16));
              em.y = Math.max(marginY, Math.min(ch - marginY, anchorY + Math.sin(em.phase * 1.2) * 12));
            } else {
              // 急速突襲！以 2.8 px/f 朝小智疾速猛衝
              em.x += ux * 2.8;
              em.y += uy * 2.8;
            }
          } else if (em.flightType === 'sine_wobble') {
            em.phase = (em.phase || 0) + 0.038;
            const wobble = Math.sin(em.phase) * 1.25;
            em.x += ux * em.speed + perpX * wobble;
            em.y += uy * em.speed + perpY * wobble;
          } else if (em.flightType === 'spiral') {
            const spiralTangent = (em.dir || 1) * (em.speed * 0.75);
            em.x += ux * em.speed + perpX * spiralTangent;
            em.y += uy * em.speed + perpY * spiralTangent;
          } else if (em.flightType === 'zigzag') {
            if (em.timer % 42 === 0) em.dir = -(em.dir || 1);
            const zigOffset = (em.dir || 1) * 1.35;
            em.x += ux * em.speed + perpX * zigOffset;
            em.y += uy * em.speed + perpY * zigOffset;
          } else if (em.flightType === 's_curve') {
            em.phase = (em.phase || 0) + 0.02;
            const sWobble = Math.cos(em.phase) * 1.8;
            em.x += ux * em.speed + perpX * sWobble;
            em.y += uy * em.speed + perpY * sWobble;
          } else {
            em.x += ux * em.speed;
            em.y += uy * em.speed;
          }
        }

        let drawX = em.x;
        let drawY = em.y;
        if (em.shake > 0) {
          drawX += (getSecureRandom() - 0.5) * 8;
          drawY += (getSecureRandom() - 0.5) * 8;
          em.shake--;
        }

        ctx.save();
        const isTarget = (em === siegeTargetEnemy);
        const isCandidate = (Array.isArray(siegeCandidateEnemies) && siegeCandidateEnemies.includes(em));
        const activeAura = isTarget || isCandidate;

        // 外層光環
        ctx.beginPath();
        ctx.arc(drawX, drawY, em.radius + (isTarget ? 5 : 2), 0, Math.PI * 2);
        ctx.fillStyle = isTarget ? 'rgba(250, 204, 21, 0.55)' : (isCandidate ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.3)');
        ctx.fill();

        // 怪獸圓形圖示
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, drawY, em.radius, 0, Math.PI * 2);
        ctx.clip();
        const mImg = siegeMonsterImgs[em.monsterType];
        if (mImg && mImg.complete && mImg.naturalWidth > 0) {
          ctx.drawImage(mImg, drawX - em.radius, drawY - em.radius, em.radius * 2, em.radius * 2);
        } else {
          ctx.fillStyle = isTarget ? '#7C3AED' : '#312E81';
          ctx.fill();
        }
        ctx.restore();

        // 圓形邊框
        ctx.beginPath();
        ctx.arc(drawX, drawY, em.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isTarget ? '#FACC15' : (isCandidate ? '#38BDF8' : '#818CF8');
        ctx.lineWidth = isTarget ? 3.5 : (isCandidate ? 2.8 : 2);
        ctx.stroke();

        // 👑 Boss 專屬頭頂標記與實時 HP 數值膠囊 (隨 Boss 移動實時增減)
        if (em.isBoss) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (em.bossType === 'major') {
            const hpVal = Math.max(0, Math.round(em.hp));
            const hpText = `HP：${hpVal}`;

            // 繪製深色圓角膠囊底框
            ctx.font = '900 13px "Microsoft JhengHei", "PingFang SC", sans-serif';
            const pillW = ctx.measureText(hpText).width + 16;
            const pillH = 22;
            const pillX = drawX - pillW / 2;
            const pillY = drawY - em.radius - 22;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
            ctx.strokeStyle = em.form === 1 ? '#A855F7' : '#EF4444';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(pillX, pillY, pillW, pillH, 11);
            } else {
              ctx.rect(pillX, pillY, pillW, pillH);
            }
            ctx.fill();
            ctx.stroke();

            // 實時 HP 文字 (Phase 1 金黃 / Phase 2 警示紅)
            ctx.fillStyle = em.form === 1 ? '#FACC15' : '#F87171';
            ctx.shadowColor = em.form === 1 ? 'rgba(250, 204, 21, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            ctx.shadowBlur = 6;
            ctx.fillText(hpText, drawX, pillY + pillH / 2);

            // 稱號副標 (突襲或型態)
            ctx.font = '700 11px sans-serif';
            ctx.fillStyle = '#DDD6FE';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 4;
            const subTitle = em.form === 1
              ? `👑 耿鬼 (${em.wordsQueue ? em.wordsQueue.length : 1}字)`
              : (em.isRushing ? '⚡ 耿鬼極速猛衝！' : '👑 耿鬼 (外圍待機)');
            ctx.fillText(subTitle, drawX, pillY - 8);
          } else if (em.bossType === 'mini') {
            const miniHpText = `HP：${Math.max(0, Math.round(em.hp * 50))}`;
            ctx.font = '900 12px "Microsoft JhengHei", sans-serif';
            ctx.fillStyle = '#FACC15';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(`👑 小型Boss (${miniHpText})`, drawX, drawY - em.radius - 12);
          }
          ctx.restore();
        }

        // 漢字 (安全判斷：當前怪獸附帶漢字時渲染)
        if (em.word && em.word.char) {
          ctx.fillStyle = '#FFFFFF';
          const fontSize = em.isBoss ? (em.bossType === 'major' ? 32 : 28) : 24;
          ctx.font = '900 ' + fontSize + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.95)';
          ctx.shadowBlur = 6;
          ctx.fillText(em.word.char, drawX, drawY);

          // 菱形進度格
          const numCodes = em.word.keys ? em.word.keys.length : 2;
          const pipSize = em.isBoss ? 7 : 6;
          const pipGap = em.isBoss ? 15 : 13;
          const totalW = (numCodes - 1) * pipGap;
          const startPipX = drawX - totalW / 2;
          const pipY = drawY + em.radius + (em.isBoss ? 12 : 9);

          for (let p = 0; p < numCodes; p++) {
            const px = startPipX + p * pipGap;
            ctx.save();
            ctx.translate(px, pipY);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.rect(-pipSize / 2, -pipSize / 2, pipSize, pipSize);
            if (p < em.typedIdx) {
              ctx.fillStyle = '#38BDF8';
              ctx.shadowColor = '#00F0FF';
              ctx.shadowBlur = 8;
              ctx.fill();
            } else {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.lineWidth = 1.3;
              ctx.stroke();
            }
            ctx.restore();
          }
        }

        ctx.restore();

        
        // 撞擊防守圈 (dist <= 42)
        const hitDist = em.isBoss ? (38 + em.radius * 0.65) : 42;
        if (dist <= hitDist) {
          // 👑 情況 1：大型 Boss (耿鬼) 撞擊防守圈
          if (em.isBoss && em.bossType === 'major') {
            if (em.form === 1) {
              // 第 1 型態：傷害 = 未正確輸入的字數 * 5
              const uncompletedCount = em.wordsQueue ? em.wordsQueue.length : 1;
              const dmg = Math.max(5, uncompletedCount * 5);
              if (siegeBarrierShieldCount > 0) {
                siegeBarrierShieldCount--;
                siegeHp = Math.max(0, siegeHp - Math.max(0, dmg - 15));
                if (typeof showPassToast === 'function') {
                  showPassToast(`🛡️ 護盾抵擋衝擊！小智承受 ${Math.max(0, dmg - 15)} 點傷害 (未完成 ${uncompletedCount} 字×5)！`);
                }
              } else {
                siegeHp = Math.max(0, siegeHp - dmg);
                if (typeof showPassToast === 'function') {
                  showPassToast(`💥 耿鬼猛烈撞擊！造成 ${dmg} 點重創 (未完成 ${uncompletedCount} 字×5)！`);
                }
              }
              // 退回外圍隨機位置，身上未擊破的字保留不重置！
              const ang = getSecureRandom() * Math.PI * 2;
              em.x = cx + Math.cos(ang) * 280;
              em.y = cy + Math.sin(ang) * 280;
              em.flightType = ['straight', 'zigzag', 's_curve'][Math.floor(getSecureRandom() * 3)];
              em.typedIdx = 0;
              em.shake = 15;
              updateSiegeHUD();
              updateBossHUD();
              if (siegeHp <= 0) { onSiegeGameOver(); return; }
              continue;
            } else if (em.form === 2) {
              // 第 2 型態：突襲撞擊小智
              if (em.isRushing) {
                if (em.minionsKilledBeforeRush >= 3) {
                  // 達成消除 ≥ 3 隻小怪：解鎖極限閃避 QTE 判定！
                  triggerSiegeDodgeModal();
                  return;
                } else {
                  // 未能達成 ≥ 3 隻小怪：直接對小智造成 30 點傷害！
                  em.hp -= 10;
                  em.isRushing = false;
                  em.minionsKilledBeforeRush = 0;
                  em.attackTimer = 6 + getSecureRandom() * 4;
                  // 退回外圍
                  const rPos = getInBoundsBossHoverPos(cw, ch, em.radius);
                  em.x = rPos.x;
                  em.y = rPos.y;
                  em.anchorX = rPos.x;
                  em.anchorY = rPos.y;
                  em.phase = getSecureRandom() * Math.PI * 2;

                  const majorTier = Math.max(0, Math.floor((siegeWave - 10) / 10));
                  const majorDmg = 30 + Math.min(20, majorTier * 5);
                  if (siegeBarrierShieldCount > 0) {
                    siegeBarrierShieldCount--;
                    const actualDmg = Math.round(majorDmg / 2);
                    siegeHp = Math.max(0, siegeHp - actualDmg);
                  } else {
                    siegeHp = Math.max(0, siegeHp - majorDmg);
                  }
                  if (typeof showPassToast === 'function') {
                    showPassToast(`⚠️ 護衛怪獸未及時清除（需 ≥ 3 隻），無法啟動閃避！受到 ${majorDmg} 點重創！耿鬼自損 10 HP！`);
                  }
                  updateSiegeHUD();
                  updateBossHUD();
                  if (em.hp <= 0) { defeatMajorBoss(); resumeSiegeLoop(); return; }
                  if (siegeHp <= 0) { onSiegeGameOver(); return; }
                  continue;
                }
              }
            }
          }

          // 👑 情況 2：小型 Boss 撞擊防守圈
          if (em.isBoss && em.bossType === 'mini') {
            const miniTier = Math.max(0, Math.floor((siegeWave - 5) / 10));
            const baseDmg = em.miniFormType === 'speedy' ? 23 : 20;
            const dmg = baseDmg + Math.min(15, miniTier * 3);
            if (siegeBarrierShieldCount > 0) {
              siegeBarrierShieldCount--;
              if (typeof showPassToast === 'function') {
                showPassToast('🛡️ 護盾完全抵擋了小型Boss衝擊！');
              }
            } else {
              siegeHp = Math.max(0, siegeHp - dmg);
              siegeBarrierHitTimer = 10;
              if (typeof showPassToast === 'function') {
                showPassToast(`💥 小型Boss【${em.name}】撞擊！小智受到 ${dmg} 點傷害！`);
              }
            }
            const remainingBosses = siegeEnemies.filter(item => item.isBoss && item !== em);
            if (remainingBosses.length > 0) {
              currentBoss = remainingBosses[0];
              updateBossHUD();
            } else {
              currentBoss = null;
              hideBossHUD();
            }
            updateSiegeHUD();
            siegeEnemies.splice(i, 1);
            if (em === siegeTargetEnemy) siegeTargetEnemy = null;
            if (siegeCandidateEnemies) siegeCandidateEnemies = siegeCandidateEnemies.filter(item => item !== em);
            if (siegeHp <= 0) { onSiegeGameOver(); return; }
            continue;
          }

          // 情況 3：普通怪獸撞擊防守圈

          if (siegeBarrierShieldCount > 0) {
            siegeBarrierShieldCount--;
            if (typeof showPassToast === 'function') {
              showPassToast('🛡️【電氣護盾】觸發！完全抵擋了一次野生怪獸撞擊！');
            }
          } else {
            const damage = 15 + (typeof siegeImpactDamageExtra !== 'undefined' ? siegeImpactDamageExtra : 0);
            siegeHp = Math.max(0, siegeHp - damage);
            siegeBarrierHitTimer = 10;
          }

          updateSiegeHUD();
          siegeEnemies.splice(i, 1);
          if (em === siegeTargetEnemy) siegeTargetEnemy = null;
          if (Array.isArray(siegeCandidateEnemies)) siegeCandidateEnemies = siegeCandidateEnemies.filter(item => item !== em);

          if (siegeHp <= 0) {
            onSiegeGameOver();
            return;
          }
        }
      }


      // ★ 幽靈 Boss 自動回收機制 (防止歷史殘留 Boss 引用卡死波次推進)
      if (currentBoss && (!Array.isArray(siegeEnemies) || !siegeEnemies.includes(currentBoss))) {
        currentBoss = null;
        hideBossHUD();
      }

      // ★ 緊湊刷怪 (當前波次怪獸全滅時，推進至下一波並刷怪，消除空白等待)
      if (siegeActive && siegeRunning && !siegeIsPaused && siegeEnemies.length === 0 && !currentBoss && !siegeIsSpawningSquad && siegeHp > 0) {
        advanceToNextSiegeWave();
      }

      // ★ 空場看門狗超時保護 (防任何意外卡死)：若場上怪獸為空超過 1.5 秒 (90幀) 且小智存活，強制喚醒推進波次
      if (siegeActive && siegeRunning && !siegeIsPaused && siegeEnemies.length === 0 && siegeHp > 0) {
        if (typeof siegeEmptyFieldTimer === 'undefined') siegeEmptyFieldTimer = 0;
        siegeEmptyFieldTimer++;
        if (siegeEmptyFieldTimer > 90) {
          siegeEmptyFieldTimer = 0;
          currentBoss = null;
          hideBossHUD();
          siegeIsSpawningSquad = false;
          advanceToNextSiegeWave();
        }
      } else {
        siegeEmptyFieldTimer = 0;
      }

      if (siegeActive && siegeRunning && !siegeIsPaused) {

      // 👑 Boss 特殊 AI 狀態機與計時器更新
      if (currentBoss && siegeEnemies.includes(currentBoss)) {
        // A. 大型 Boss 第 1 型態：4-8 秒動態換字
        if (currentBoss.bossType === 'major' && currentBoss.form === 1) {
          currentBoss.wordTimer -= 1/60;
          if (currentBoss.wordTimer <= 0 && currentBoss.wordsQueue.length > 0) {
            currentBoss.word = currentBoss.wordsQueue[Math.floor(getSecureRandom() * currentBoss.wordsQueue.length)];
            currentBoss.wordTimer = 4 + getSecureRandom() * 4;
            currentBoss.typedIdx = 0;
            currentBoss.shake = 10;
            updateBossHUD();
          }
        }

        // B. 大型 Boss 第 2 型態：閃現與急速突襲
        if (currentBoss.bossType === 'major' && currentBoss.form === 2) {
          if (!currentBoss.isRushing) {
            // 隨機 1-3 秒閃現位移
            currentBoss.blinkTimer -= 1/60;
            if (currentBoss.blinkTimer <= 0) {
              // ★ 隨機閃現：保證 100% 在遊戲畫面邊界內且遠離小智！
              const bPos = getInBoundsBossHoverPos(cw, ch, currentBoss.radius);
              currentBoss.x = bPos.x;
              currentBoss.y = bPos.y;
              currentBoss.anchorX = bPos.x;
              currentBoss.anchorY = bPos.y;
              currentBoss.phase = getSecureRandom() * Math.PI * 2;
              currentBoss.blinkTimer = 1 + getSecureRandom() * 2;
            }

            // 5-10 秒突襲倒數
            currentBoss.attackTimer -= 1/60;
            if (currentBoss.attackTimer <= 0) {
              currentBoss.isRushing = true;
              currentBoss.speed = currentBoss.rushSpeed || 2.4; // 急速突襲(隨波次增長)
              if (typeof showPassToast === 'function') {
                showPassToast('⚠️ 耿鬼發動急速突襲！急速撞向小智！');
              }
            }
          }

        }

        // 👑 大型 Boss 在場期間（第 1 型態與第 2 型態），保持場上附帶普通寶可夢持續進場（數量隨波次增長）！
        if (currentBoss && currentBoss.bossType === 'major') {
          const majorTier = Math.max(0, Math.floor((siegeWave - 10) / 10));
          // 場上常駐普通怪獸底限：Wave 10 至少 3 隻，Wave 20 至少 5 隻，Wave 30 至少 7 隻，Wave 40+ 至少 9 隻
          const minActiveMinions = Math.min(10, 3 + majorTier * 2);
          const activeMinions = siegeEnemies.filter(m => !m.isBoss);
          if (activeMinions.length < minActiveMinions && !siegeIsSpawningSquad) {
            const spawnPt = getRectBoundarySpawnPoint(cw, ch, activeMinions.length, 4);
            const randWord = drawUniqueSiegeWord();
            const mTypes = ['gastly', 'haunter', 'gourgeist'];
            siegeEnemies.push({
              isBoss: false,
              word: randWord,
              x: spawnPt.x,
              y: spawnPt.y,
              speed: 0.28 + getSecureRandom() * 0.12,
              typedIdx: 0,
              radius: 30,
              shake: 0,
              monsterType: mTypes[Math.floor(getSecureRandom() * mTypes.length)],
              flightType: ['straight', 'sine_wobble', 'spiral', 'zigzag', 's_curve'][Math.floor(getSecureRandom() * 5)],
              phase: getSecureRandom() * Math.PI * 2,
              timer: 0,
              dir: getSecureRandom() < 0.5 ? 1 : -1
            });
          }
        }
      }

        siegeAnimId = requestAnimationFrame(tickSiege);
      }
    }

    function onSiegeGameOver() {
      siegeRunning = false;
      if (siegeAnimId) cancelAnimationFrame(siegeAnimId);
      if (siegeTimeInterval) clearInterval(siegeTimeInterval);

      let decayMult = 1.0;
      const isTeacherCheck = (typeof isTeacherMode !== 'undefined' && isTeacherMode);
      if (typeof P4Mode !== 'undefined' && currentStudent) {
        decayMult = P4Mode.getScoreDecayMultiplier('siege', currentStudent.cls, currentStudent.num, isTeacherCheck);
      }
      const earned = Math.round(siegeScore * decayMult);

      if (currentStudent && earned > 0) {
        saveStudentStats(currentStudent.cls, currentStudent.num, earned, siegeKills > 0, 'siege');
        sendReliableWebhook({
          grade: 4,
          cls: currentStudent.cls,
          num: currentStudent.num,
          scoreDelta: earned,
          roundScore: earned,
          gameMode: 'siege',
          mode: 'siege',
          kills: siegeKills,
          level: siegeLevel,
          survSeconds: siegeSeconds,
          timestamp: new Date().toISOString()
        });
      }

      const overOverlay = document.getElementById('siege-over-overlay');
      if (overOverlay) {
        const totalAttempts = siegeKills + siegeMisses;
        const accuracy = totalAttempts > 0 ? Math.round((siegeKills / totalAttempts) * 100) : 100;
        const m = String(Math.floor(siegeSeconds / 60)).padStart(2, '0');
        const s = String(siegeSeconds % 60).padStart(2, '0');

        const waveEl = document.getElementById('siege-final-wave');
        const timeEl = document.getElementById('siege-final-time');
        const levelEl = document.getElementById('siege-final-level');
        const killsEl = document.getElementById('siege-final-kills');
        const movesEl = document.getElementById('siege-final-moves');
        const earnedEl = document.getElementById('siege-final-earned');
        const accEl = document.getElementById('siege-final-accuracy');

        if (waveEl) waveEl.textContent = `Wave ${siegeLevel}`;
        if (timeEl) timeEl.textContent = `${m}:${s}`;
        if (levelEl) levelEl.textContent = `Lv.${siegeLevel}`;
        if (killsEl) killsEl.textContent = `${siegeKills} 隻`;
        if (movesEl) movesEl.textContent = `${siegeLearnedMoves.length} 個`;
        if (earnedEl) earnedEl.textContent = `+${earned} 分`;
        if (accEl) accEl.textContent = `${accuracy}%`;

        overOverlay.style.display = 'flex';
      }
    }

    function restartSiegeMatch() {
      launchSiegeMatch();
      siegeStartGame();
    }

    function abortSiegeMatch() {
      if (siegeActive && siegeRunning) {
        onSiegeGameOver();
      }
      setGameMode('typo');
    }


// =========================================================================
    // 🛠️ 輔助工具函式與設定變更監聽
    // =========================================================================
    function loadStudentProfile() {
      if (!currentStudent) return;
      try {
        const stats = getStudentStats(currentStudent.cls, currentStudent.num);
        const { currentTier, unlockedSkills } = evalTierAndSkills(stats.totalScore);
        activeSkills = unlockedSkills;

        const badgeEl = document.getElementById("trainer-current-badge");
        const nameEl = document.getElementById("trainer-display-name");
        const titleEl = document.getElementById("trainer-display-title");
        const scoreEl = document.getElementById("trainer-display-score");
        const killsEl = document.getElementById("trainer-display-kills");

        if (badgeEl) badgeEl.textContent = currentTier.badge;
        if (nameEl) nameEl.textContent = currentStudent.cls + " " + currentStudent.num + "號 " + currentStudent.name;
        if (titleEl) titleEl.textContent = currentTier.title;
        if (scoreEl) scoreEl.textContent = stats.totalScore.toLocaleString();
        if (killsEl) killsEl.textContent = stats.kills;
      } catch(e) {
        console.warn("loadStudentProfile error:", e);
      }
    }

    function calculateEffectiveSpeedTime(rawTime, mistakes, accuracy, wordCount) {
      const keyPenalty = mistakes * 0.3;
      const baseFactor = (wordCount === 20) ? 30.0 : 15.0;
      const accRatio = Math.max(0, Math.min(100, accuracy)) / 100;
      const accPenalty = Math.round(baseFactor * (1 - Math.pow(accRatio, 2)) * 100) / 100;
      const bonus = (accuracy >= 100) ? ((wordCount === 20) ? 2.0 : 1.0) : 0.0;
      const effectiveTime = parseFloat((rawTime + keyPenalty + accPenalty - bonus).toFixed(2));
      return {
        keyPenalty: parseFloat(keyPenalty.toFixed(2)),
        accPenalty: parseFloat(accPenalty.toFixed(2)),
        bonus: parseFloat(bonus.toFixed(2)),
        effectiveTime: Math.max(1.0, effectiveTime)
      };
    }

    function handlePodiumImgError(el, icon) {
      if (el) el.outerHTML = "<div class=\"podium-pokemon-icon\">" + icon + "</div>";
    }

    function handleRankImgError(el, icon) {
      if (el) el.outerHTML = icon || "⚡";
    }

    function onSpeedSettingChange() {
      const wcSelect = document.getElementById("speed-word-count-select");
      const wkSelect = document.getElementById("speed-ready-week-select");
      if (wcSelect) currentSpeedWordCount = parseInt(wcSelect.value, 10) || 10;
      if (wkSelect) {
        const actWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        currentSpeedWeek = wkSelect.value || `${actWk}_hw1`;
      }
    }

    function toggleSpeedPracticeMode() {
      isSpeedPracticeMode = !isSpeedPracticeMode;
      const btn = document.getElementById("speed-mode-toggle-btn");
      if (btn) {
        if (isSpeedPracticeMode) {
          btn.innerHTML = "💡 練習模式 (全程字根可見)";
          btn.style.color = "#34D399";
          btn.style.borderColor = "#10B981";
          btn.style.background = "#0F172A";
        } else {
          btn.innerHTML = "⚔️ 競技排位賽 (停頓3秒提燈)";
          btn.style.color = "#FDE047";
          btn.style.borderColor = "#FACC15";
          btn.style.background = "#0F172A";
        }
      }
      if (speedActive && typeof renderSpeedTargetWord === "function") {
        renderSpeedTargetWord();
      }
    }

    function triggerSkillToast(icon, text) {
      const toast = document.getElementById("skill-toast");
      const iconEl = document.getElementById("skill-toast-icon");
      const textEl = document.getElementById("skill-toast-text");
      if (iconEl) iconEl.textContent = icon;
      if (textEl) textEl.textContent = text;
      if (toast) {
        toast.classList.add("show");
        setTimeout(() => {
          toast.classList.remove("show");
        }, 2600);
      }
    }

    function startNewSession() {
      if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }
      gameStage = 1;
      sessionScore = 0;
      sessionCorrectCount = 0;
      comboCount = 0;
      document.getElementById('session-summary-box').style.display = 'none';
      document.getElementById('active-play-area').style.display = 'block';
      loadStudentProfile();
      loadRound();
    }

    function cancelFirstCode() {
      if (selectedFirst && !selectedLast && currentGameMode === 'typo') {
        selectedFirst = null;
        document.getElementById('slot-first').className = 'code-slot';
        document.getElementById('val-first').textContent = '？';
        document.getElementById('game-prompt').textContent = '已取消首碼，請捕捉【首碼】精靈球！';
        document.getElementById('game-prompt').style.color = '#2563EB';
        activeOrbs.forEach(o => o.el.classList.remove('caught'));
      }
    }

    function setArenaSpeed(speed, activeBtnId) {
      wanderingSpeedMultiplier = speed;
      document.querySelectorAll('.arena-speed-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(activeBtnId);
      if (activeBtn) activeBtn.classList.add('active');

      let tip = '';
      if (speed > 1.2) {
        tip = '⚡ 切換為【敏捷速度】：精靈球高速遊行，答對享有 1.4x (+40%) 速度積分加成！';
      } else if (speed === 0.0) {
        tip = '⏸️ 切換為【定點輔助】：精靈球靜止不動，簡易模式得分為 0.6x 折減。';
      } else {
        tip = '🟢 切換為【悠閒模式】：標準遊行速度，答對獲取 1.0x 標準分數。';
      }
      showPassToast(tip);
    }

    // 8. 載入當前關卡 (支援三大模式動態切換，模式2支援隨機1-3個答案)
    function loadRound() {
      options = [];
      if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }

      selectedFirst = null;
      selectedLast = null;
      roundShieldActive = false;
      
      document.getElementById('secret-box').style.display = 'none';
      document.getElementById('btn-next-round').style.display = 'none';
      document.getElementById('game-stage-tag').textContent = `關卡 ${gameStage} / 5`;
      document.getElementById('game-combo-tag').textContent = `連擊：${comboCount} Hit 🔥`;
      document.getElementById('game-score-tag').textContent = `本輪得分：${sessionScore} 分`;

      const slotFirst = document.getElementById('slot-first');
      const slotLast = document.getElementById('slot-last');
      const slotThird = document.getElementById('slot-third');
      const labelFirst = document.getElementById('label-slot-first');
      const labelLast = document.getElementById('label-slot-last');
      const labelThird = document.getElementById('label-slot-third');
      const valFirst = document.getElementById('val-first');
      const valLast = document.getElementById('val-last');
      const valThird = document.getElementById('val-third');

      if (currentGameMode === 'typo') {
        // 模式 1：錯字魔王討伐 (速成首尾碼雙碼)
        document.getElementById('monster-icon').textContent = '👾';
        slotFirst.style.display = 'flex';
        slotFirst.className = 'code-slot';
        valFirst.textContent = '？';
        if (labelFirst) labelFirst.textContent = '① 首碼 (First)';

        slotLast.style.display = 'flex';
        slotLast.className = 'code-slot';
        valLast.textContent = '？';
        if (labelLast) labelLast.textContent = '② 尾碼 (Last)';

        if (slotThird) slotThird.style.display = 'none';

        document.getElementById('game-prompt').textContent = '在下方野生原野區，捕捉正確的【首碼】與【尾碼】能量球！';
        document.getElementById('game-prompt').style.color = '#64748B';

        const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        const activeWords = getActiveWeekWords();
        const randIdx = Math.floor(Math.random() * activeWords.length);
        currentQuiz = activeWords[randIdx];
        document.getElementById('target-char').textContent = currentQuiz.char;
        const wkNumStr = activeWk.replace('w', '');
        document.getElementById('target-sub-hint').textContent = `【第 ${wkNumStr} 周速成字根拆碼】 難度：★★★`;

        function getLetterInfo(code) {
          return DATA.cangjie_clean_letters.find(l => l.code === code) || { code, key: '', aux: '' };
        }
        const firstInfo = getLetterInfo(currentQuiz.first_code);
        const lastInfo = getLetterInfo(currentQuiz.last_code);
        options = [];

        // 核心支援首尾碼相同雙球生成
        options.push({ code: firstInfo.code, key: firstInfo.key, aux: firstInfo.aux, isCorrect: true, orbId: 'code-first' });
        options.push({ code: lastInfo.code, key: lastInfo.key, aux: lastInfo.aux, isCorrect: true, orbId: 'code-last' });

        const distractors = fisherYatesShuffle(
          DATA.cangjie_clean_letters.filter(l => l.code !== currentQuiz.first_code && l.code !== currentQuiz.last_code)
        );

        let distCount = 0;
        while (options.length < 8 && distractors.length > 0) {
          const item = distractors.pop();
          distCount++;
          options.push({ code: item.code, key: item.key, aux: item.aux, isCorrect: false, orbId: 'dist-' + distCount });
        }
        setupWanderingOrbs(fisherYatesShuffle(options));

      } else if (currentGameMode === 'aux') {
        // 模式 2：輔助字型大抓寶 (速成主字母 -> 找出對應輔助字型，隨機 1-3 個選項答案)
        document.getElementById('monster-icon').textContent = '🔮';

        const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        const activeWords = getActiveWeekWords();
        const activeRadicals = new Set();
        activeWords.forEach(w => {
          if (w.first_code) activeRadicals.add(w.first_code);
          if (w.last_code) activeRadicals.add(w.last_code);
        });
        let candidateDataset = DATA.aux_dataset.filter(a => activeRadicals.has(a.code));
        if (candidateDataset.length === 0) candidateDataset = DATA.aux_dataset;

        const randIdx = Math.floor(Math.random() * candidateDataset.length);
        currentQuiz = candidateDataset[randIdx];
        document.getElementById('target-char').textContent = currentQuiz.code;
        const wkNumStr = activeWk.replace('w', '');
        document.getElementById('target-sub-hint').textContent = `【第 ${wkNumStr} 周字根】類別：${currentQuiz.category} ｜ 鍵盤鍵位：${currentQuiz.key}`;

        // 答案個數：隨機 1-3 個 (不超過該字擁有的輔助字型總數)
        const maxAvailable = (currentQuiz.aux_list && currentQuiz.aux_list.length > 0) ? currentQuiz.aux_list.length : 1;
        const targetCount = Math.min(Math.floor(Math.random() * 3) + 1, maxAvailable);

        const shuffledAux = fisherYatesShuffle([...currentQuiz.aux_list]);
        const targetAuxList = shuffledAux.slice(0, targetCount);
        currentQuiz.targetAuxList = targetAuxList;
        currentQuiz.caughtAuxList = [];

        slotFirst.style.display = 'flex';
        slotFirst.className = 'code-slot';
        valFirst.textContent = '？';

        if (targetCount === 1) {
          if (labelFirst) labelFirst.textContent = '🎯 捕捉目標輔助字型';
          slotLast.style.display = 'none';
          if (slotThird) slotThird.style.display = 'none';
          document.getElementById('game-prompt').textContent = `請在原野中找出屬於速成主字母【 ${currentQuiz.code} 】(${currentQuiz.key}鍵) 的輔助字型精靈球！`;
        } else if (targetCount === 2) {
          if (labelFirst) labelFirst.textContent = '🎯 目標輔助字型 ①';
          slotLast.style.display = 'flex';
          slotLast.className = 'code-slot';
          valLast.textContent = '？';
          if (labelLast) labelLast.textContent = '🎯 目標輔助字型 ②';
          if (slotThird) slotThird.style.display = 'none';
          document.getElementById('game-prompt').textContent = `【 ${currentQuiz.code} 】有多個輔助字型！請在原野中找出 2 個對應的精靈球！(已捕獲 0/2)`;
        } else if (targetCount === 3) {
          if (labelFirst) labelFirst.textContent = '🎯 目標輔助字型 ①';
          slotLast.style.display = 'flex';
          slotLast.className = 'code-slot';
          valLast.textContent = '？';
          if (labelLast) labelLast.textContent = '🎯 目標輔助字型 ②';
          if (slotThird) {
            slotThird.style.display = 'flex';
            slotThird.className = 'code-slot';
            valThird.textContent = '？';
            if (labelThird) labelThird.textContent = '🎯 目標輔助字型 ③';
          }
          document.getElementById('game-prompt').textContent = `【 ${currentQuiz.code} 】有多個輔助字型！請在原野中找出 3 個對應的精靈球！(已捕獲 0/3)`;
        }
        document.getElementById('game-prompt').style.color = '#7C3AED';

        options = [];
        targetAuxList.forEach((auxChar, i) => {
          options.push({
            char: auxChar,
            code: auxChar,
            aux: auxChar,
            parentCode: currentQuiz.code,
            parentKey: currentQuiz.key,
            key: currentQuiz.key,
            isCorrect: true,
            orbId: 'aux-correct-' + i
          });
        });

        let allOtherAux = [];
        DATA.aux_dataset.forEach(item => {
          if (item.code !== currentQuiz.code && item.aux_list) {
            item.aux_list.forEach(ac => {
              allOtherAux.push({
                char: ac,
                code: ac,
                aux: ac,
                parentCode: item.code,
                parentKey: item.key,
                key: item.key
              });
            });
          }
        });
        allOtherAux = fisherYatesShuffle(allOtherAux);

        let distCount = 0;
        while (options.length < 8 && allOtherAux.length > 0) {
          const dist = allOtherAux.pop();
          distCount++;
          options.push({
            char: dist.char,
            code: dist.code,
            aux: dist.aux,
            parentCode: dist.parentCode,
            parentKey: dist.parentKey,
            key: dist.key,
            isCorrect: false,
            orbId: 'aux-dist-' + distCount
          });
        }
        setupWanderingOrbs(fisherYatesShuffle(options));

      } else if (currentGameMode === 'letter') {
        // 模式 3：倉頡字母配對 (英文字母鍵位 -> 找出對應倉頡字母)
        document.getElementById('monster-icon').textContent = '🔤';
        slotFirst.style.display = 'flex';
        slotFirst.className = 'code-slot';
        valFirst.textContent = '？';
        if (labelFirst) labelFirst.textContent = '🎯 捕捉目標倉頡字母';

        slotLast.style.display = 'none';
        if (slotThird) slotThird.style.display = 'none';

        const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
        const activeWords = getActiveWeekWords();
        const activeKeys = new Set();
        activeWords.forEach(w => {
          if (w.first_key) activeKeys.add(w.first_key);
          if (w.last_key) activeKeys.add(w.last_key);
        });
        let candidateDataset = DATA.aux_dataset.filter(a => activeKeys.has(a.key));
        if (candidateDataset.length === 0) candidateDataset = DATA.aux_dataset;

        const randIdx = Math.floor(Math.random() * candidateDataset.length);
        currentQuiz = candidateDataset[randIdx];
        document.getElementById('target-char').textContent = currentQuiz.key;
        const wkNumStr = activeWk.replace('w', '');
        document.getElementById('target-sub-hint').textContent = `【第 ${wkNumStr} 周鍵位】鍵盤英文字母：${currentQuiz.key} ｜ 請問對應哪一個速成主字母字根？`;

        document.getElementById('game-prompt').textContent = `鍵位【 ${currentQuiz.key} 】對應哪一個速成主字母字根？快去捕捉！`;
        document.getElementById('game-prompt').style.color = '#059669';

        options = [];
        options = [];
        options.push({
          code: currentQuiz.code,
          key: currentQuiz.key,
          aux: currentQuiz.aux,
          isCorrect: true,
          orbId: 'letter-corr'
        });

        const otherLetters = fisherYatesShuffle(
          DATA.cangjie_clean_letters.filter(item => item.key !== currentQuiz.key)
        );

        let distCount = 0;
        while (options.length < 8 && otherLetters.length > 0) {
          const item = otherLetters.pop();
          distCount++;
          options.push({
            code: item.code,
            key: item.key,
            aux: item.aux,
            isCorrect: false,
            orbId: 'letter-dist-' + distCount
          });
        }
        setupWanderingOrbs(fisherYatesShuffle(options));
      
      }

      // 隨機技能觸發：移除自動將球變灰的干擾邏輯，確保所有精靈球入場時均為正常、鮮明、可點擊的狀態
      const insightSkill = activeSkills.find(s => s.name.includes('雷霆看破'));
      if (insightSkill && Math.random() < insightSkill.rate) {
        // 雷霆看破觸發時，以清晰光環標註輔助提示，絕不將球變灰
        let assisted = 0;
        activeOrbs.forEach(orb => {
          if (orb.isCorrect && assisted < 1) {
            orb.el.classList.add('highlight-focus');
            assisted++;
          }
        });
        triggerSkillToast('🔍', '觸發【雷霆看破】！正確字型球散發微光指引！');
      }

      const focusSkill = activeSkills.find(s => s.name.includes('精準直覺'));
      if (focusSkill && Math.random() < focusSkill.rate) {
        activeOrbs.forEach(orb => {
          if (orb.isCorrect) {
            orb.el.classList.add('highlight-focus');
          }
        });
        triggerSkillToast('⚡', '觸發【精準直覺】！感應到正確精靈球發出強烈能量光暈！');
      }
    }

    // 9. 精靈球遊行物理引擎 (嚴格邊界約束，100% 維持經典精靈球模樣)
    function setupWanderingOrbs(options) {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      const arena = document.getElementById('capture-arena');
      const orbsContainer = document.getElementById('orbs-container');
      orbsContainer.innerHTML = '';
      
      const arenaW = arena.clientWidth || 600;
      const arenaH = arena.clientHeight || 280;
      const orbSize = 82;

      // 嚴格安全活動邊界 (預留圓角與邊框緩衝，上方預留控制橫條高度)
      const padX = 18;
      const padTop = 48;     // 確保不會與上方速度按鈕重疊
      const padBottom = 16;  // 確保不會貼住或超出底線
      const minX = padX;
      const maxX = Math.max(minX + 10, arenaW - orbSize - padX);
      const minY = padTop;
      const maxY = Math.max(minY + 10, arenaH - orbSize - padBottom);

      activeOrbs = [];

      options.forEach((opt, idx) => {
        const el = document.createElement('div');
        el.className = 'poke-orb';
        el.id = `orb-${idx}`;

        let charHtml = opt.char || opt.code || '';
        if (currentGameMode === 'aux') {
          // 模式 2：輔助字型 (球內僅顯示輔助字型本身，絕不洩漏所屬字母或鍵位)
          charHtml = opt.char || opt.code || '';
        } else if (currentGameMode === 'letter') {
          // 模式 3：主字母 (球內僅顯示主字母本身，絕不洩漏對應英文字母鍵位)
          charHtml = opt.code || opt.char || '';
        }

        // ★ 純粹精靈球：絕無任何答案提示文字，100% 維持經典紅白雙色精靈球與中心發光按鈕
        el.innerHTML = `
          <div class="poke-orb-center-ring"></div>
          <div class="poke-orb-content">
            <div class="poke-orb-char">${charHtml}</div>
          </div>
        `;

        // 在安全矩形內均勻分散初始位置
        const cols = 4;
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cellW = (maxX - minX) / cols;
        const cellH = (maxY - minY) / 2;
        const initX = minX + col * cellW + Math.random() * (cellW * 0.4);
        const initY = minY + row * cellH + Math.random() * (cellH * 0.4);

        const angle = Math.random() * Math.PI * 2;
        const baseSpeed = 0.85 + Math.random() * 0.5;
        const vx = Math.cos(angle) * baseSpeed;
        const vy = Math.sin(angle) * baseSpeed;

        const orbObj = {
          el: el,
          ...opt,
          x: Math.max(minX, Math.min(maxX, initX)),
          y: Math.max(minY, Math.min(maxY, initY)),
          vx: vx,
          vy: vy,
          isHovered: false
        };

        el.addEventListener('mouseenter', () => { orbObj.isHovered = true; });
        el.addEventListener('mouseleave', () => { orbObj.isHovered = false; });
        el.addEventListener('click', () => { catchOrb(orbObj); });

        orbsContainer.appendChild(el);
        activeOrbs.push(orbObj);
      });

      runWanderingPhysics();
    }

    function runWanderingPhysics() {
      const arena = document.getElementById('capture-arena');
      const arenaW = arena.clientWidth || 600;
      const arenaH = arena.clientHeight || 280;
      const orbSize = 82;

      const padX = 16;
      const padTop = 46;
      const padBottom = 16;
      const minX = padX;
      const maxX = Math.max(minX + 10, arenaW - orbSize - padX);
      const minY = padTop;
      const maxY = Math.max(minY + 10, arenaH - orbSize - padBottom);

      activeOrbs.forEach(o => {
        if (!o.isHovered && wanderingSpeedMultiplier > 0) {
          o.x += o.vx * wanderingSpeedMultiplier;
          o.y += o.vy * wanderingSpeedMultiplier;

          // 嚴密邊界反彈，完全不超出原野藍色邊界
          if (o.x <= minX) {
            o.x = minX;
            o.vx = Math.abs(o.vx);
          } else if (o.x >= maxX) {
            o.x = maxX;
            o.vx = -Math.abs(o.vx);
          }

          if (o.y <= minY) {
            o.y = minY;
            o.vy = Math.abs(o.vy);
          } else if (o.y >= maxY) {
            o.y = maxY;
            o.vy = -Math.abs(o.vy);
          }
        }

        o.el.style.transform = `translate3d(${o.x}px, ${o.y}px, 0)`;
      });

      animationFrameId = requestAnimationFrame(runWanderingPhysics);
    }

    // 10. 點選/捕捉精靈球判定 (支援模式2隨機1-3個目標捕捉與答錯引導)
    function catchOrb(orbObj) {
      if (orbObj.el.classList.contains('eliminated')) return;

      if (currentGameMode === 'typo') {
        // 模式 1：兩碼抓寶 (支援首尾同碼容錯)
        if (orbObj.el.classList.contains('caught')) {
          if (selectedFirst && !selectedLast && currentQuiz && currentQuiz.first_code === currentQuiz.last_code && orbObj.code === currentQuiz.last_code) {
            selectedLast = { code: orbObj.code, key: orbObj.key };
            document.getElementById('slot-last').className = 'code-slot filled';
            document.getElementById('val-last').textContent = `${orbObj.code} (${orbObj.key})`;
            checkAnswer();
          }
          return;
        }

        orbObj.el.classList.add('caught');

        if (!selectedFirst) {
          selectedFirst = { code: orbObj.code, key: orbObj.key };
          document.getElementById('slot-first').className = 'code-slot filled';
          document.getElementById('val-first').textContent = `${orbObj.code} (${orbObj.key})`;
          document.getElementById('game-prompt').textContent = '成功捕捉首碼！接著捕捉【尾碼】精靈球發動進攻！';
          document.getElementById('game-prompt').style.color = '#1D4ED8';
        } else if (!selectedLast) {
          selectedLast = { code: orbObj.code, key: orbObj.key };
          document.getElementById('slot-last').className = 'code-slot filled';
          document.getElementById('val-last').textContent = `${orbObj.code} (${orbObj.key})`;
          checkAnswer();
        }

      } else if (currentGameMode === 'aux') {
        // 模式 2：輔助字型大抓寶 (支援隨機 1-3 個答案)
        if (orbObj.el.classList.contains('caught')) return;
        const auxChar = orbObj.char || orbObj.code;

        if (orbObj.isCorrect) {
          orbObj.el.classList.add('caught');
          if (!currentQuiz.caughtAuxList) currentQuiz.caughtAuxList = [];
          if (!currentQuiz.targetAuxList) currentQuiz.targetAuxList = [auxChar];

          if (!currentQuiz.caughtAuxList.includes(auxChar)) {
            currentQuiz.caughtAuxList.push(auxChar);
            const count = currentQuiz.caughtAuxList.length;
            const targetTotal = currentQuiz.targetAuxList.length;

            if (count === 1) {
              document.getElementById('slot-first').className = 'code-slot filled';
              document.getElementById('val-first').textContent = auxChar;
            } else if (count === 2) {
              document.getElementById('slot-last').className = 'code-slot filled';
              document.getElementById('val-last').textContent = auxChar;
            } else if (count === 3) {
              const slotThird = document.getElementById('slot-third');
              if (slotThird) {
                slotThird.className = 'code-slot filled';
                document.getElementById('val-third').textContent = auxChar;
              }
            }

            if (count < targetTotal) {
              document.getElementById('game-prompt').innerHTML = `🎯 <span style="color:#2563EB;font-weight:900;">成功捕獲【${auxChar}】(${count}/${targetTotal})！快在原野中找出下一個！</span>`;
            } else {
              // 目標全部捕獲完成！
              checkAnswer();
            }
          }
        } else {
          // 點選到干擾球
          orbObj.el.classList.add('eliminated');
          const shieldSkill = activeSkills.find(s => s.name.includes('聖盾防護'));
          const timewardSkill = activeSkills.find(s => s.name.includes('時空結界'));
          if (!roundShieldActive && ((shieldSkill && Math.random() < shieldSkill.rate) || (timewardSkill && Math.random() < timewardSkill.rate))) {
            roundShieldActive = true;
            triggerSkillToast('🛡️', '觸發【聖盾防護】！成功格擋失誤，保留連擊！');
            document.getElementById('game-prompt').innerHTML = `🛡️ <span style="color:#2563EB;font-weight:900;">聖盾格擋成功！【${auxChar}】是【${orbObj.parentCode || '其他'}】部，連擊保留，請再試！</span>`;
          } else {
            comboCount = 0;
            document.getElementById('game-combo-tag').textContent = `連擊：0 Hit`;
            document.getElementById('game-prompt').innerHTML = `⚠️ <span style="color:#DC2626;font-weight:900;">捕捉錯誤！【${auxChar}】屬於【${orbObj.parentCode || '其他'}】部！請繼續找出屬於【${currentQuiz.code}】的輔助字型！</span>`;
          }
        }

      } else if (currentGameMode === 'letter') {
        // 模式 3：單碼捕捉倉頡字母
        if (orbObj.el.classList.contains('caught')) return;

        if (orbObj.isCorrect) {
          orbObj.el.classList.add('caught');
          selectedFirst = { code: orbObj.code, key: orbObj.key, isCorrect: true };
          document.getElementById('slot-first').className = 'code-slot filled';
          document.getElementById('val-first').textContent = `${orbObj.code} (${orbObj.key})`;
          checkAnswer();
        } else {
          // 點選到干擾字母球
          orbObj.el.classList.add('eliminated');
          const shieldSkill = activeSkills.find(s => s.name.includes('聖盾防護'));
          const timewardSkill = activeSkills.find(s => s.name.includes('時空結界'));
          if (!roundShieldActive && ((shieldSkill && Math.random() < shieldSkill.rate) || (timewardSkill && Math.random() < timewardSkill.rate))) {
            roundShieldActive = true;
            triggerSkillToast('🛡️', '觸發【聖盾防護】！成功格擋失誤，保留連擊！');
            document.getElementById('game-prompt').innerHTML = `🛡️ <span style="color:#2563EB;font-weight:900;">聖盾格擋成功！【${orbObj.code}】對應鍵位【${orbObj.key}】，連擊保留，請再試！</span>`;
          } else {
            comboCount = 0;
            document.getElementById('game-combo-tag').textContent = `連擊：0 Hit`;
            document.getElementById('game-prompt').innerHTML = `⚠️ <span style="color:#DC2626;font-weight:900;">捕捉錯誤！【${orbObj.code}】對應鍵位【${orbObj.key}】，請找出鍵位【${currentQuiz.key}】對應的倉頡主字母！</span>`;
          }
        }
      }
    }

    // 11. 答案核對與精確分數結算 (比分層級：錯字魔王 > 輔助字型 > 倉頡字母)
    function checkAnswer() {
      if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }

      let isCorrect = false;
      const secretBox = document.getElementById('secret-box');
      secretBox.style.display = 'block';

      let baseScore = 10;

      // 🎯 依使用者需求：調整遊戲模式 1-3 獲得分數比例
      // 輔助字型能獲得分數最高 (基礎 20 分)，倉頡字母與英文字鍵次之 (基礎 12 分)，模式 1 錯字魔王相對獲得分數最少 (基礎 6 分)
      if (currentGameMode === 'typo') {
        isCorrect = (selectedFirst.code === currentQuiz.first_code) && (selectedLast.code === currentQuiz.last_code);
        baseScore = 6;  // 模式 1：相對獲得分數最少 (基礎 6 分)
        document.getElementById('secret-char-badge').textContent = `標準速成碼：${currentQuiz.first_code}(${currentQuiz.first_key}) ＋ ${currentQuiz.last_code}(${currentQuiz.last_key})`;
        document.getElementById('secret-desc').textContent = currentQuiz.secret;
      } else if (currentGameMode === 'aux') {
        isCorrect = true; // 模式 2 必須全部捕獲完成才會進入 checkAnswer
        baseScore = 20; // 模式 2：輔助字型獲得分數最高 (基礎 20 分，鼓勵熟練輔助字型)
        document.getElementById('secret-char-badge').textContent = `倉頡主字母【${currentQuiz.code}】(鍵位 ${currentQuiz.key})`;
        document.getElementById('secret-desc').textContent = `正確輔助字型包含：${currentQuiz.aux_list.join('、')} (例字：${currentQuiz.examples})`;
      } else if (currentGameMode === 'letter') {
        isCorrect = true; // 模式 3 命中正確才會進入 checkAnswer
        baseScore = 12; // 模式 3：倉頡字母與英文字鍵次之 (基礎 12 分)
        document.getElementById('secret-char-badge').textContent = `鍵位【${currentQuiz.key}】對應速成/倉頡主字母【${currentQuiz.code}】`;
        document.getElementById('secret-desc').textContent = `類別：${currentQuiz.category} ｜ 輔助字型：${currentQuiz.aux_list.join('、')} ｜ 範例字：${currentQuiz.examples}`;
      }

      if (isCorrect) {
        comboCount++;
        sessionCorrectCount++;

        // 🎯 游行速度不同選擇對得分的影響 (定點最容易得分最低，敏捷最高)
        let speedMultiplier = 1.0;
        let speedNotice = '';
        if (wanderingSpeedMultiplier > 1.2) {
          speedMultiplier = 1.4; // 敏捷模式獎勵 +40%
          speedNotice = '⚡敏捷1.4x';
        } else if (wanderingSpeedMultiplier === 0.0) {
          speedMultiplier = 0.6; // 定點簡易模式扣減至 60%
          speedNotice = '⏸️定點0.6x';
        } else {
          speedMultiplier = 1.0; // 悠閒標準模式 100%
          speedNotice = '🟢悠閒1.0x';
        }

        let roundEarned = Math.max(1, Math.round(baseScore * speedMultiplier));

        let comboBonus = 0;
        if (comboCount === 2) comboBonus = 2;
        else if (comboCount === 3) comboBonus = 4;
        else if (comboCount === 4) comboBonus = 6;
        else if (comboCount >= 5) comboBonus = 10;

        roundEarned += comboBonus;

        let skillBonus = 0;
        const critSkill = activeSkills.find(s => s.name.includes('烈焰爆擊'));
        if (critSkill && Math.random() < critSkill.rate) {
          skillBonus += 5;
          triggerSkillToast('💥', '觸發【烈焰爆擊】！傷害提升，額外獲得 +5 分！');
        }

        const divineSkill = activeSkills.find(s => s.name.includes('神域天罰'));
        if (divineSkill && Math.random() < divineSkill.rate) {
          skillBonus += 6;
          triggerSkillToast('🌌', '觸發【神域天罰】！天雷降臨，額外獲得 +6 分！');
        }

        const chainSkill = activeSkills.find(s => s.name.includes('極限連擊'));
        if (chainSkill && comboCount >= 2 && Math.random() < chainSkill.rate) {
          skillBonus += 3;
          triggerSkillToast('🌊', '觸發【極限連擊】！連擊增益額外獲得 +3 分！');
        }

        const auraSkill = activeSkills.find(s => s.name.includes('波導感知'));
        if (auraSkill && comboCount >= 3 && Math.random() < auraSkill.rate) {
          skillBonus += 2;
          triggerSkillToast('🌀', '觸發【波導感知】！波導同頻，額外獲得 +2 分！');
        }

        const dynamaxSkill = activeSkills.find(s => s.name.includes('極巨衝能'));
        if (dynamaxSkill && Math.random() < dynamaxSkill.rate) {
          skillBonus += 4;
          triggerSkillToast('🌠', '觸發【極巨衝能】！極巨能量爆發，額外獲得 +4 分！');
        }

        const swiftSkill = activeSkills.find(s => s.name.includes('疾風迅雷'));
        if (swiftSkill && Math.random() < swiftSkill.rate) {
          skillBonus += 3;
          triggerSkillToast('⚡', '觸發【疾風迅雷】！疾風神速，額外獲得 +3 分！');
        }

        const starlightSkill = activeSkills.find(s => s.name.includes('星輝庇佑'));
        if (starlightSkill && comboCount >= 4 && Math.random() < starlightSkill.rate) {
          skillBonus += 4;
          triggerSkillToast('💫', '觸發【星輝庇佑】！星輝守護，額外獲得 +4 分！');
        }

        const genesisSkill = activeSkills.find(s => s.name.includes('創世審判'));
        if (genesisSkill && Math.random() < genesisSkill.rate) {
          skillBonus += 6;
          triggerSkillToast('🔱', '觸發【創世審判】！創世神光降臨，額外獲得 +6 分！');
        }

        roundEarned += skillBonus;
        sessionScore += roundEarned;

        document.getElementById('game-score-tag').textContent = `本輪得分：${sessionScore} 分 (+${roundEarned})`;
        document.getElementById('game-combo-tag').textContent = `連擊：${comboCount} Hit 🔥`;

        if (currentStudent) {
          saveStudentStats(currentStudent.cls, currentStudent.num, roundEarned, true, currentGameMode);
          loadStudentProfile();
        }

        burstConfetti();

        if (currentGameMode === 'typo') {
          // 模式 1 (錯字魔王)：依使用者需求，答對時直接自動進入下一題 (隱藏下一關手動按鈕)
          document.getElementById('monster-icon').textContent = '💥';
          document.getElementById('btn-next-round').style.display = 'none';

          const typoClearMsg = `🎉 <span style="color:#15803D;font-weight:900;">完美命中！擊破魔王！獲得 ${roundEarned} 分 (連擊加成 +${comboBonus}分)！</span>`;
          if (gameStage < 5) {
            document.getElementById('game-prompt').innerHTML = `${typoClearMsg} <span style="color:#2563EB;font-weight:800;margin-left:8px;">➔ 即將自動進入第 ${gameStage + 1} 關...</span>`;
            triggerStagePassToast('👾 錯字魔王', gameStage, roundEarned, gameStage + 1);
            autoNextTimer = setTimeout(() => {
              nextRound();
            }, 750);
          } else {
            document.getElementById('game-prompt').innerHTML = `🏆 <span style="color:#D97706;font-weight:900;">太強了！5 關挑戰全數通關！(+${roundEarned}分) ➔ 正在進行總結算...</span>`;
            triggerStagePassToast('👾 錯字魔王', 5, roundEarned, null);
            autoNextTimer = setTimeout(() => {
              nextRound();
            }, 750);
          }
        } else {
          // 模式 2 & 模式 3：通關後不需要按進入下一關，畫面提示並直接自動進入下一關
          document.getElementById('monster-icon').textContent = '✨';
          document.getElementById('btn-next-round').style.display = 'none';

          let clearMsg = '';
          if (currentGameMode === 'aux') {
            clearMsg = `🎉 <span style="color:#15803D;font-weight:900;">完美通關！成功捕獲【${currentQuiz.code}】的輔助字型【${currentQuiz.targetAuxList.join('、')}】！(+${roundEarned}分)</span>`;
          } else {
            clearMsg = `🎉 <span style="color:#15803D;font-weight:900;">完美命中！鍵位【${currentQuiz.key}】對應倉頡字母【${currentQuiz.code}】！(+${roundEarned}分)</span>`;
          }

          if (gameStage < 5) {
            document.getElementById('game-prompt').innerHTML = `${clearMsg} <span style="color:#2563EB;font-weight:800;margin-left:8px;">➔ 即將自動進入第 ${gameStage + 1} 關...</span>`;
            triggerStagePassToast(currentGameMode === 'aux' ? '🔮 輔助字型' : '🔤 速成主字母', gameStage, roundEarned, gameStage + 1);
            autoNextTimer = setTimeout(() => {
              nextRound();
            }, 1350);
          } else {
            document.getElementById('game-prompt').innerHTML = `🏆 <span style="color:#D97706;font-weight:900;">太強了！5 關挑戰全數通關！(+${roundEarned}分) ➔ 正在進行總結算...</span>`;
            triggerStagePassToast(currentGameMode === 'aux' ? '🔮 輔助字型' : '🔤 速成主字母', 5, roundEarned, null);
            autoNextTimer = setTimeout(() => {
              nextRound();
            }, 1350);
          }
        }

      } else {
        // 模式 1 錯字魔王失誤處理
        const shieldSkill = activeSkills.find(s => s.name.includes('聖盾防護'));
        if (!roundShieldActive && shieldSkill && Math.random() < shieldSkill.rate) {
          roundShieldActive = true;
          triggerSkillToast('🛡️', '觸發【聖盾防護】！成功格擋失誤，保留連擊！');
          document.getElementById('game-prompt').innerHTML = `🛡️ <span style="color:#2563EB;font-weight:900;">聖盾格擋成功！失誤已免除，連擊繼續保留！</span>`;
        } else {
          comboCount = 0;
          document.getElementById('game-combo-tag').textContent = `連擊：0 Hit`;
          document.getElementById('game-prompt').innerHTML = `⚠️ <span style="color:#DC2626;font-weight:900;">捕捉錯誤！正確答案如上方秘笈，請牢記字根！</span>`;
        }

        document.getElementById('btn-next-round').style.display = 'inline-block';
        if (gameStage >= 5) {
          document.getElementById('btn-next-round').textContent = '🏁 查看 5 關挑戰總結算';
        } else {
          document.getElementById('btn-next-round').textContent = `➡️ 進入第 ${gameStage + 1} 關`;
        }
      }
    }

    // 12. 下一關或 5 關挑戰結算
    function nextRound() {
      if (autoNextTimer) { clearTimeout(autoNextTimer); autoNextTimer = null; }

      if (gameStage >= 5) {
        document.getElementById('active-play-area').style.display = 'none';
        const summaryBox = document.getElementById('session-summary-box');
        summaryBox.style.display = 'block';

        let clearBonus = 0;
        if (sessionCorrectCount === 5) {
          if (currentGameMode === 'aux') clearBonus = 30;     // 模式 2 輔助字型大滿貫獎勵最高 (+30分)
          else if (currentGameMode === 'letter') clearBonus = 18; // 模式 3 字母次之 (+18分)
          else clearBonus = 10;                                // 模式 1 相對最少 (+10分)

          sessionScore += clearBonus;
          if (currentStudent) {
            saveStudentStats(currentStudent.cls, currentStudent.num, clearBonus, false, currentGameMode);
            loadStudentProfile();
          }
          document.getElementById('summary-congrats-text').innerHTML = `🌟 <strong>大滿貫！5 關全中！</strong> 額外獎勵 <strong>+${clearBonus}</strong> 點通關積分！`;
        } else {
          document.getElementById('summary-congrats-text').textContent = `本輪挑戰完成！答對 ${sessionCorrectCount} 關，繼續挑戰突破極限！`;
        }

        const stats = currentStudent ? getStudentStats(currentStudent.cls, currentStudent.num) : { totalScore: sessionScore };
        const { currentTier } = evalTierAndSkills(stats.totalScore);

        document.getElementById('summary-correct-stat').textContent = `${sessionCorrectCount} / 5 關`;
        document.getElementById('summary-earned-stat').textContent = `+${sessionScore} 分`;
        document.getElementById('summary-total-stat').textContent = `${stats.totalScore.toLocaleString()} 分`;
        document.getElementById('summary-title-stat').textContent = currentTier.title;

        burstConfetti();
      } else {
        gameStage++;
        loadRound();
      }
    }

        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
    function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    // 快捷鍵：按下 Escape 鍵隨時關閉所有彈窗
    window.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeModal('modal-skills');
        closeModal('modal-leaderboard');
        closeModal('modal-webhook-settings');
        const confirmModal = document.getElementById('modal-confirm');
        if (confirmModal) confirmModal.style.display = 'none';
      }
    });


    let currentLeaderboardFilter = 'ALL';
    function openLeaderboardModal(defaultType) {
      if (defaultType === 'speed') {
        switchLeaderboardType('speed');
      } else {
        switchLeaderboardType('score');
      }
      openModal('modal-leaderboard');
      if (typeof fetchCloudLeaderboard === 'function') {
        fetchCloudLeaderboard(true);
      }
    }

    function filterLeaderboard(cls) {
      currentLeaderboardFilter = cls;
      document.querySelectorAll('.lb-filter-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.includes(cls) || (cls === 'ALL' && b.textContent === '全級總榜'));
      });
      renderLeaderboardTable();
    }

    
    // 🛡️ 格式化勳章稱號 (防範數字代碼或異常格式，保證 100% 呈現標準圖文勳章)
    function getFormattedBadgeTitle(item) {
      if (!item) return '🥉【新手訓練家】';
      let titleStr = item.badge || item.title;
      // 若為純數字 (例如被誤寫為 5) 或缺少【】括號，依分數動態重新評定
      if (!titleStr || !isNaN(titleStr) || titleStr === '5' || !String(titleStr).includes('【')) {
        const score = (typeof item.score === 'number') ? item.score : (parseInt(item.grandTotal, 10) || 0);
        if (typeof evalTierAndSkills === 'function') {
          const { currentTier } = evalTierAndSkills(score);
          return `${currentTier.badge}【${currentTier.title}】`;
        }
        return '🥉【新手訓練家】';
      }
      return String(titleStr);
    }

    function renderLeaderboardTable() {
      if (currentLeaderboardType === 'speed') {
        renderSpeedLeaderboardTable();
        return;
      }

      // 恢復總分榜表頭
      const thead = document.querySelector('#modal-leaderboard thead tr');
      if (thead) {
        thead.innerHTML = `
          <th style="padding: 10px;">排名</th>
          <th>班別</th>
          <th>學號</th>
          <th>訓練家代號</th>
          <th>勳章稱號</th>
          <th>討伐總分</th>
          <th>擊倒魔王</th>
        `;
      }

      const rankLabel = document.getElementById('lb-my-rank-label');
      const scoreLabel = document.getElementById('lb-my-score-label');
      if (rankLabel) rankLabel.textContent = '全級討伐排名';
      if (scoreLabel) scoreLabel.textContent = '累計討伐總分';

      // 1. 雙軌智能合併：整合 Google 試算表最新真實數據與本地 localStorage
      const allMap = {};

      // 載入 26-27_P4_錯字討伐小遊戲積分記錄表 全級 208 名學生最新動態數據
      if (DATA.benchmark_leaderboard && Array.isArray(DATA.benchmark_leaderboard)) {
        DATA.benchmark_leaderboard.forEach(item => {
          const rawScore = (typeof item.grandTotal === 'number') ? item.grandTotal : 
                           ((typeof item.score === 'number') ? item.score : (parseInt(item.totalScore, 10) || 0));
          const rawTitle = item.badge || item.title || '🥉【新手訓練家】';
          const rawKills = (typeof item.kills === 'number') ? item.kills : 0;
          allMap[`${item.cls}_${item.num}`] = {
            cls: item.cls,
            num: item.num,
            name: `${item.cls} ${(item.num < 10 ? '0' : '') + item.num}號`,
            score: rawScore,
            grandTotal: rawScore,
            kills: rawKills,
            title: rawTitle,
            badge: rawTitle
          };
        });
      }

      // 合併本機 localStorage 產生的最新成績
      const allStorageKeys = SafeStorage.getAllKeys();
      for (let i = 0; i < allStorageKeys.length; i++) {
        const key = allStorageKeys[i];
        if (key.startsWith('p4_score_')) {
          const parts = key.replace('p4_score_', '').split('_');
          const cls = parts[0];
          const num = parseInt(parts[1], 10);
          try {
            const parsed = JSON.parse(SafeStorage.getItem(key));
            if (parsed && typeof parsed.totalScore === 'number') {
              const mapKey = `${cls}_${num}`;
              const cur = allMap[mapKey];
              const localScore = parsed.totalScore;
              const localKills = parsed.kills || 0;
              const { currentTier } = evalTierAndSkills(localScore);
              if (!cur || localScore > cur.score) {
                allMap[mapKey] = {
                  cls, num,
                  name: `${cls} ${(num < 10 ? '0' : '') + num}號`,
                  score: localScore,
                  kills: Math.max(localKills, cur ? cur.kills : 0),
                  title: `${currentTier.badge}【${currentTier.title}】`, badge: `${currentTier.badge}【${currentTier.title}】`
                };
              }
            }
          } catch(e) {}
        }
      }

      // 2. 生成全級總榜排序並計算「全級名次」
      const fullList = Object.values(allMap);
      fullList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.kills !== a.kills) return b.kills - a.kills;
        if (a.cls !== b.cls) return a.cls.localeCompare(b.cls);
        return a.num - b.num;
      });
      fullList.forEach((item, idx) => {
        item.overallRank = idx + 1;
      });

      // 3. 生成各班專屬榜單並精確計算「班內名次」
      const classGroups = {};
      ['P4A', 'P4B', 'P4C', 'P4D', 'P4E', 'P4F'].forEach(c => {
        classGroups[c] = fullList.filter(s => s.cls === c);
        classGroups[c].forEach((item, idx) => {
          item.classRank = idx + 1;
        });
      });

      // 4. 更新頂部「我的個人戰報」
      if (currentStudent) {
        const myKey = `${currentStudent.cls}_${currentStudent.num}`;
        const myEntry = allMap[myKey] || {
          cls: currentStudent.cls,
          num: currentStudent.num,
          name: `${currentStudent.cls} ${(currentStudent.num < 10 ? '0' : '') + currentStudent.num}號`,
          score: 0,
          kills: 0,
          overallRank: fullList.length,
          classRank: (classGroups[currentStudent.cls] || []).length
        };
        const { currentTier } = evalTierAndSkills(myEntry.score);

        document.getElementById('lb-my-name').textContent = myEntry.name;
        document.getElementById('lb-my-title').textContent = `當前境界：${currentTier.title}`;
        document.getElementById('lb-my-score').textContent = `${myEntry.score.toLocaleString()} 分`;
        document.getElementById('lb-my-badge').textContent = currentTier.badge;

        if (currentLeaderboardFilter === 'ALL') {
          document.getElementById('lb-my-rank').innerHTML = `<span style="color:#B45309; font-weight:900;">全級第 ${myEntry.overallRank} 名</span> <span style="font-size:12px;color:#64748B;">(全級共 ${fullList.length} 人)</span>`;
        } else {
          const clsList = classGroups[currentLeaderboardFilter] || [];
          if (currentStudent.cls === currentLeaderboardFilter) {
            document.getElementById('lb-my-rank').innerHTML = `<span style="color:#2563EB; font-weight:900;">${currentLeaderboardFilter} 班內第 ${myEntry.classRank} 名</span> <span style="font-size:12px;color:#64748B;">(班共 ${clsList.length} 人)</span>`;
          } else {
            document.getElementById('lb-my-rank').innerHTML = `<span style="color:#64748B;">原班 (${currentStudent.cls}) 第 ${myEntry.classRank} 名</span> <span style="font-size:11px;color:#94A3B8;">(正在瀏覽 ${currentLeaderboardFilter})</span>`;
          }
        }
      }

      // 5. 渲染表格列表 (全級前 20 名 / 各班前 15 名)
      const tbody = document.getElementById('leaderboard-tbody');
      const isClassFilter = currentLeaderboardFilter !== 'ALL';
      const limit = isClassFilter ? 15 : 20; // 班內前 15 名，全級前 20 名
      const sourceList = isClassFilter ? (classGroups[currentLeaderboardFilter] || []) : fullList;
      const displayList = sourceList.slice(0, limit);

      // 檢查當前同學是否已經在前 N 名中
      let myInDisplay = false;
      if (currentStudent) {
        if (!isClassFilter || currentStudent.cls === currentLeaderboardFilter) {
          myInDisplay = displayList.some(s => s.cls === currentStudent.cls && s.num === currentStudent.num);
        }
      }

      let rowsHtml = displayList.map(s => {
        const rankNum = isClassFilter ? s.classRank : s.overallRank;
        const medal = rankNum === 1 ? '🥇 1' : rankNum === 2 ? '🥈 2' : rankNum === 3 ? '🥉 3' : `${rankNum}`;
        const isMe = currentStudent && s.cls === currentStudent.cls && s.num === currentStudent.num;
        return `
          <tr style="${isMe ? 'background: #FEF3C7; font-weight: bold; border-left: 4px solid #D97706;' : ''}">
            <td style="padding: 7px; text-align: center; font-weight: 800; color: #1E3A8A;">${medal}</td>
            <td style="padding: 7px; text-align: center;">${s.cls}</td>
            <td style="padding: 7px; text-align: center;">${(s.num < 10 ? '0' : '') + s.num}號</td>
            <td style="padding: 7px; text-align: center; font-weight: 800;">${s.name} ${isMe ? '⭐(我)' : ''}</td>
            <td style="padding: 7px; text-align: center; font-size: 11px;">${getFormattedBadgeTitle(s)}</td>
            <td style="padding: 7px; text-align: center; font-weight: 900; color: #D97706;">${s.score.toLocaleString()}</td>
            <td style="padding: 7px; text-align: center;">${s.kills} 隻</td>
          </tr>
        `;
      }).join('');

      // 若當前同學未進入榜單（未進入全級前20或班級前15），在底端追加專屬激勵行
      if (currentStudent && !myInDisplay) {
        const myKey = `${currentStudent.cls}_${currentStudent.num}`;
        const myEntry = allMap[myKey];
        if (myEntry && (!isClassFilter || currentStudent.cls === currentLeaderboardFilter)) {
          const myRank = isClassFilter ? myEntry.classRank : myEntry.overallRank;
          const cutoffRank = isClassFilter ? 15 : 20;
          const targetStudent = sourceList[cutoffRank - 1];
          const gap = targetStudent ? Math.max(0, targetStudent.score - myEntry.score + 10) : 0;
          rowsHtml += `
            <tr style="background: #FFFBEB; border-top: 2px dashed #D97706; font-weight: bold;">
              <td style="padding: 9px; text-align: center; font-weight: 900; color: #B45309;">第 ${myRank} 名</td>
              <td style="padding: 9px; text-align: center;">${myEntry.cls}</td>
              <td style="padding: 9px; text-align: center;">${(myEntry.num < 10 ? '0' : '') + myEntry.num}號</td>
              <td style="padding: 9px; text-align: center; color: #B45309; font-weight: 900;">
                ${myEntry.name} ⭐ (我的目前排名)
                <div style="font-size: 11px; font-weight: 600; color: #D97706; margin-top: 2px;">
                  ⚡ 距離進榜 (第${cutoffRank}名) 還差 ${gap.toLocaleString()} 分，立即開戰追趕！
                </div>
              </td>
              <td style="padding: 9px; text-align: center; font-size: 11px;">${myEntry.title}</td>
              <td style="padding: 9px; text-align: center; font-weight: 900; color: #D97706;">${myEntry.score.toLocaleString()}</td>
              <td style="padding: 9px; text-align: center;">${myEntry.kills} 隻</td>
            </tr>
          `;
        }
      }

      tbody.innerHTML = rowsHtml;
    }

    function exportLeaderboardCSV() {
      const allMap = {};
      const allStorageKeys = SafeStorage.getAllKeys();
      for (let i = 0; i < allStorageKeys.length; i++) {
        const key = allStorageKeys[i];
        if (key.startsWith('p4_score_')) {
          const parts = key.replace('p4_score_', '').split('_');
          const cls = parts[0];
          const num = parseInt(parts[1]);
          try {
            const parsed = JSON.parse(SafeStorage.getItem(key));
            if (parsed && parsed.totalScore > 0) {
              let name = `${cls} ${num}號`;
              if (!CONFIG.GITHUB_PRIVACY_MODE && DATA.roster && DATA.roster[cls] && DATA.roster[cls][num]) {
                name = DATA.roster[cls][num];
              }
              const { currentTier } = evalTierAndSkills(parsed.totalScore);
              allMap[`${cls}_${num}`] = {
                cls, num, name,
                score: parsed.totalScore,
                kills: parsed.kills,
                title: `${currentTier.badge}【${currentTier.title}】`, badge: `${currentTier.badge}【${currentTier.title}】`
              };
            }
          } catch(e) {}
        }
      }
      let list = Object.values(allMap);
      list.sort((a, b) => b.score - a.score);

      let csv = "\uFEFF全級排名,班別,學號,姓名,勳章稱號,累積討伐總積分,擊破魔王數\n";
      list.forEach((s, idx) => {
        csv += `${idx + 1},"${s.cls}",${s.num},"${s.name}","${s.title}",${s.score},${s.kills}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `26-27_P4_錯字討伐全級真實成績_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    }

    function renderSkillsHall() {
      let score = 0;
      let studentName = '未登入訓練家';
      if (currentStudent) {
        const stats = getStudentStats(currentStudent.cls, currentStudent.num);
        score = stats.totalScore || 0;
        studentName = currentStudent.name;
      } else {
        const lastLogin = SafeStorage.getItem('p4_active_student');
        if (lastLogin) {
          try {
            const st = JSON.parse(lastLogin);
            if (st && st.cls && st.num) {
              const stats = getStudentStats(st.cls, st.num);
              score = stats.totalScore || 0;
              studentName = st.name;
            }
          } catch(e) {}
        }
      }

      const { currentTier, nextTier, unlockedSkills } = evalTierAndSkills(score);

      // 1. 動態更新頂部當前境界標題與勳章
      const titleEl = document.getElementById('hall-current-title');
      if (titleEl) {
        titleEl.innerHTML = `當前境界：<span style="color: ${currentTier.color}; font-size: 16px; font-weight: 900;">${currentTier.badge}【${currentTier.title}】</span>`;
      }

      // 2. 動態計算晉升下一階進度與文字說明
      let pct = 100;
      const ptsEl = document.getElementById('hall-current-pts');
      const fillEl = document.getElementById('hall-progress-fill');
      if (nextTier) {
        const span = nextTier.min - currentTier.min;
        const currentProgress = score - currentTier.min;
        pct = Math.min(100, Math.max(0, Math.round((currentProgress / Math.max(1, span)) * 100)));
        const needPts = nextTier.min - score;
        if (ptsEl) {
          ptsEl.innerHTML = `累積積分：<strong>${score.toLocaleString()}</strong> / 晉升【${nextTier.title}】需 ${nextTier.min.toLocaleString()} 分 (<span style="color: #2563EB; font-weight: 800;">還差 ${needPts.toLocaleString()} 分 · ${pct}%</span>)`;
        }
      } else {
        if (ptsEl) {
          ptsEl.innerHTML = `累積積分：<strong>${score.toLocaleString()}</strong> 分 (🏆 已榮登最高創世神皇殿堂！)`;
        }
      }
      if (fillEl) {
        fillEl.style.width = `${pct}%`;
      }

      // 3. 渲染 14 大境界卡片 (動態標註已達成、當前段位與未解鎖)
      const tiersContainer = document.getElementById('tiers-grid-container');
      if (tiersContainer) {
        tiersContainer.innerHTML = TIERS.map(t => {
          const isReached = score >= t.min;
          const isCurrent = (t.title === currentTier.title);
          let borderStyle = isCurrent 
            ? `border: 2.5px solid ${t.color}; box-shadow: 0 0 14px ${t.color}55; transform: scale(1.03);` 
            : (isReached ? `border: 2px solid ${t.color}80;` : `border: 2px solid #E2E8F0; opacity: 0.55;`);
          let bgStyle = isReached ? t.bg : '#F8FAFC';
          let statusBadge = isCurrent 
            ? `<span style="font-size:10px; font-weight:900; background:${t.color}; color:#fff; padding:2px 8px; border-radius:10px; display:inline-block; margin-top:4px;">🌟 當前段位</span>`
            : (isReached 
                ? `<span style="font-size:10px; font-weight:800; color:#16A34A; background:#DCFCE7; padding:1px 6px; border-radius:6px; display:inline-block; margin-top:4px;">✓ 已達成</span>`
                : `<span style="font-size:10px; font-weight:700; color:#94A3B8; display:inline-block; margin-top:4px;">🔒 差 ${(t.min - score).toLocaleString()} 分</span>`);
          
          return `
            <div class="tier-card ${isReached ? 'unlocked' : 'locked'}" style="${borderStyle} background: ${bgStyle};">
              <div class="tier-card-badge">${isReached ? t.badge : '🔒'}</div>
              <div class="tier-card-title" style="color: ${isReached ? t.color : '#64748B'}; font-weight: 900; font-size: 14px;">${t.title}</div>
              <div class="tier-card-score" style="color: ${isReached ? '#B45309' : '#94A3B8'}; font-size: 11px;">${t.min.toLocaleString()} 分解鎖</div>
              ${statusBadge}
            </div>
          `;
        }).join('');
      }

      // 4. 渲染 11 大技能殿堂 (動態高亮已解鎖技能)
      const skillsContainer = document.getElementById('skills-grid-container');
      if (skillsContainer) {
        const closeBtnHtml = `
          <div style="margin-top: 24px; text-align: center; grid-column: 1 / -1;">
            <button class="btn-primary-action" onclick="closeModal('modal-skills')" style="padding: 10px 36px; font-size: 15px; font-weight: 900; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); border-radius: 30px; box-shadow: 0 4px 14px rgba(37,99,235,0.35); cursor: pointer;">
              關閉技能館
            </button>
          </div>
        `;
        const cardsHtml = SKILLS.map(s => {
          const isUnlocked = score >= s.reqPts;
          return `
            <div class="skill-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="skill-name-row">
                <span class="skill-name">${isUnlocked ? ('⚡ ' + s.name) : ('🔒 ' + s.name)}</span>
                <span class="skill-rate">${isUnlocked ? `發動率 ${Math.round(s.rate * 100)}%` : `需 ${s.reqPts.toLocaleString()} 分`}</span>
              </div>
              <div class="skill-desc">${s.desc}</div>
              <div style="font-size: 10px; color: ${isUnlocked ? '#16A34A' : '#94A3B8'}; margin-top: 4px; font-weight: 700;">
                ${isUnlocked ? '✅ 戰鬥已實裝發動' : `🔒 還差 ${(s.reqPts - score).toLocaleString()} 分自動解鎖`}
              </div>
            </div>
          `;
        }).join('');
        skillsContainer.innerHTML = cardsHtml + closeBtnHtml;
      }
    }

    function openSkillsModal() {
      renderSkillsHall();
      openModal('modal-skills');
    }

    // Search function
    function handleSearch(keyword) {
      const q = keyword.trim().toLowerCase();
      document.querySelectorAll('.rank-card, .star-card').forEach(card => {
        const info = card.getAttribute('data-student') || '';
        if (!q) {
          card.classList.remove('highlight');
          card.style.display = '';
        } else if (info.toLowerCase().includes(q)) {
          card.classList.add('highlight');
          card.style.display = '';
        } else {
          card.classList.remove('highlight');
        }
      });
    }

    // Kiosk Auto-play Mode
    function toggleKioskMode() {
      const btn = document.getElementById('kiosk-btn');
      if (isKiosk) {
        clearInterval(kioskInterval);
        isKiosk = false;
        btn.textContent = '🖥️ 投影輪播';
        btn.style.background = 'white';
        btn.style.color = '#2563EB';
      } else {
        isKiosk = true;
        btn.textContent = '⏸️ 停止輪播';
        btn.style.background = '#2563EB';
        btn.style.color = 'white';
        
        const tabs = ['top40', 'class', 'perfect', 'vocab'];
        let tabIdx = 0;
        kioskInterval = setInterval(() => {
          tabIdx = (tabIdx + 1) % tabs.length;
          switchTab(tabs[tabIdx]);
        }, 8000);
      }
    }

    // Immediate Confetti and Render on Load
    window.addEventListener('DOMContentLoaded', () => {
      try { initLoginDropdowns(); } catch(e){ console.error('initLoginDropdowns error:', e); }
      try { BgmManager.init(); } catch(e) { console.error('BgmManager.init error:', e); }
      try { ThunderboltSFX.init(); } catch(e) { console.error('ThunderboltSFX.init error:', e); }
      try { renderModeTabs(); } catch(e) { console.error('renderModeTabs error:', e); }

      const savedStudent = SafeStorage.getItem('p4_active_student');
      if (savedStudent) {
        try {
          currentStudent = JSON.parse(savedStudent);
          const idSec = document.getElementById('identity-section');
          const batSec = document.getElementById('battle-section');
          if (idSec) idSec.style.display = 'none';
          if (batSec) batSec.style.display = 'block';
          loadStudentProfile();
        } catch(e) {}
      }

      try { renderTop40(); } catch(e){ console.error('renderTop40 error:', e); }
      try { renderClassBarCharts(); } catch(e){ console.error('renderClassBarCharts error:', e); }
      try { renderClassCards(); } catch(e){ console.error('renderClassCards error:', e); }
      try { renderPerfectScorers(); } catch(e){ console.error('renderPerfectScorers error:', e); }
      try { renderVocabTable(); } catch(e){ console.error('renderVocabTable error:', e); }
      try { setTimeout(burstConfetti, 350); } catch(e){}

      // 背景靜默連線 Google Apps Script 雲端天梯 (不阻塞畫面)
      try {
        if (typeof fetchCloudLeaderboard === 'function') {
          fetchCloudLeaderboard(true);
        }
      } catch(e) {}
    });
  
    // =========================================================================
    // ⚡ 模式 4：倉頡/速成 10字/20字 極速鍵盤手速賽核心引擎 (嚴格同步六年級規格)
    // =========================================================================

    ;

    

    
    // 🌐 根據當前日期時間動態抽取當周字庫 (第 8 周) 與生字首尾碼
    function getActiveWeekWords() {
      const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
      let pool = [];

      const weekly = (typeof window !== 'undefined' && window.MODE2_WEEKLY_BANKS) 
        ? window.MODE2_WEEKLY_BANKS 
        : (typeof MODE2_WEEKLY_BANKS !== 'undefined' ? MODE2_WEEKLY_BANKS : {});

      const cloud = (typeof window !== 'undefined' && window.CLOUD_WEEKLY_BANKS)
        ? window.CLOUD_WEEKLY_BANKS
        : (typeof CLOUD_WEEKLY_BANKS !== 'undefined' ? CLOUD_WEEKLY_BANKS : {});

      // 1. 從當前週次（例如第8周 w8_hw1..4）抽取題目
      for (let h = 1; h <= 4; h++) {
        const k = `${activeWk}_hw${h}`;
        if (weekly[k] && Array.isArray(weekly[k].words) && weekly[k].words.length > 0) {
          pool = pool.concat(weekly[k].words);
        } else if (cloud[k] && Array.isArray(cloud[k].words) && cloud[k].words.length > 0) {
          pool = pool.concat(cloud[k].words);
        } else if (typeof DATA !== 'undefined' && DATA[k] && Array.isArray(DATA[k].words)) {
          pool = pool.concat(DATA[k].words);
        }
      }

      // 2. 保底容錯：若當前週次題庫暫未載入，往前一個週次或全局題庫保底
      if (pool.length === 0 && typeof DATA !== 'undefined') {
        ['w8_hw1', 'w8_hw2', 'w8_hw3', 'w8_hw4', 'w7_hw1', 'w7_hw2', 'w7_hw3', 'w7_hw4', 'w6_hw1', 'w6_hw2', 'w6_hw3', 'w6_hw4'].forEach(k => {
          if (DATA[k] && Array.isArray(DATA[k].words)) pool = pool.concat(DATA[k].words);
        });
        if (pool.length === 0 && Array.isArray(DATA.cangjie_words)) {
          pool = DATA.cangjie_words;
        }
      }

      // 3. 確保每個生字物件皆齊備速成首尾碼與字根屬性
      return pool.map(w => {
        const item = Object.assign({}, w);
        const ovMap = (typeof P4_MASTER_QUICK_OVERRIDES !== 'undefined') ? P4_MASTER_QUICK_OVERRIDES : (typeof window !== 'undefined' ? window.P4_MASTER_QUICK_OVERRIDES : (typeof global !== 'undefined' ? global.P4_MASTER_QUICK_OVERRIDES : null));
        if (ovMap && item.char && ovMap[item.char]) {
          const ov = ovMap[item.char];
          item.codes = ov.codes.slice();
          item.keys = ov.keys.slice();
          item.first_code = ov.first_code;
          item.last_code = ov.last_code;
          item.first_key = ov.first_key;
          item.last_key = ov.last_key;
          item.full = ov.full;
          item.secret = ov.secret;
          if (ov.cj_full) item.cj_full = ov.cj_full;
          return item;
        }
        if (!item.first_code && item.codes && item.codes.length > 0) {
          item.first_code = item.codes[0];
          item.last_code = item.codes[item.codes.length - 1];
        }
        if (!item.first_key && item.keys && item.keys.length > 0) {
          item.first_key = item.keys[0];
          item.last_key = item.keys[item.keys.length - 1];
        }
        if (!item.keys && item.first_key && item.last_key) {
          item.keys = (item.first_key === item.last_key && item.first_code === item.last_code)
            ? [item.first_key] : [item.first_key, item.last_key];
        }
        if (!item.codes && item.first_code && item.last_code) {
          item.codes = [item.first_code, item.last_code];
        }
        return item;
      });
    }

    function getActiveSpeedWeek() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qWk = urlParams.get('week');
        if (qWk) {
          const cleanWk = qWk.toLowerCase().trim();
          if (/^w\d+$/.test(cleanWk)) return cleanWk;
        }
      } catch (e) {}

      const now = new Date();
      const schedules = (typeof SPEED_WEEK_SCHEDULES !== 'undefined' && Array.isArray(SPEED_WEEK_SCHEDULES)) 
        ? SPEED_WEEK_SCHEDULES 
        : (typeof CONFIG !== 'undefined' && CONFIG.SPEED_WEEK_SCHEDULES ? CONFIG.SPEED_WEEK_SCHEDULES : []);

      for (const s of schedules) {
        const sStart = s.start ? new Date(s.start) : null;
        const sEnd = s.end ? new Date(s.end) : null;
        if (sStart && sEnd && now >= sStart && now <= sEnd) {
          return s.week;
        }
      }
      if (schedules.length > 0) {
        for (let i = schedules.length - 1; i >= 0; i--) {
          const sStart = schedules[i].start ? new Date(schedules[i].start) : null;
          if (sStart && now >= sStart) {
            return schedules[i].week;
          }
        }
      }
      return 'w10'; // 預設當前為第8周
    }

    function initSpeedWeekDropdown() {
      const select = document.getElementById('speed-ready-week-select');
      const lbSelect = document.getElementById('speed-lb-week-select');
      const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
      const allBanks = (typeof MODE2_WEEKLY_BANKS === 'object' && MODE2_WEEKLY_BANKS) 
        ? MODE2_WEEKLY_BANKS 
        : ((typeof window !== 'undefined' && window.MODE2_WEEKLY_BANKS) ? window.MODE2_WEEKLY_BANKS : {});

      // 1. 取得排程表與判定當前開放之週次
      const now = new Date();
      const schedules = (typeof SPEED_WEEK_SCHEDULES !== 'undefined' && Array.isArray(SPEED_WEEK_SCHEDULES)) 
        ? SPEED_WEEK_SCHEDULES 
        : (typeof CONFIG !== 'undefined' && CONFIG.SPEED_WEEK_SCHEDULES ? CONFIG.SPEED_WEEK_SCHEDULES : []);
      
      const scheduleMap = {};
      schedules.forEach(s => { if (s && s.week) scheduleMap[s.week] = s; });

      // 收集所有在 allBanks 中存在的 week 標識 (例如 w2, w3, w4, w6, w7, w8, w10)
      const weekSet = new Set();
      Object.keys(allBanks).forEach(k => {
        const m = k.match(/^(w\d+)_hw\d+$/);
        if (m) weekSet.add(m[1]);
      });
      // 確保至少包含 activeWk
      weekSet.add(activeWk);

      // 依數字大小降序排列 (例如 w10, w8, w7, w6, w4, w3, w2)
      let sortedWeeks = Array.from(weekSet).sort((a, b) => {
        const na = parseInt(a.replace('w', ''), 10) || 0;
        const nb = parseInt(b.replace('w', ''), 10) || 0;
        return nb - na;
      });

      // 嚴格過濾：若未開啟測試特權 (isTeacherMode / DEV_TEST_ALL_UNLOCKED)，只開放當前或過往週次 (now >= start)
      const isTestUnlocked = (typeof isTeacherMode !== 'undefined' && isTeacherMode) || (typeof window !== 'undefined' && (window.isTeacherMode || window.DEV_TEST_ALL_UNLOCKED));
      if (!isTestUnlocked) {
        sortedWeeks = sortedWeeks.filter(wk => {
          const nw = parseInt(wk.replace('w', ''), 10) || 0;
          if (nw <= 10 && nw !== 9) return true;
          if (wk === activeWk) return true;
          const s = scheduleMap[wk];
          if (!s || !s.start) {
            const actNw = parseInt(activeWk.replace('w', ''), 10) || 10;
            return nw <= actNw;
          }
          const sStart = new Date(s.start);
          return !isNaN(sStart.getTime()) ? (now >= sStart) : (nw <= 10);
        });
      }

      // 2. 動態建構手速大廳選單 #speed-ready-week-select
      if (select) {
        const prevVal = select.value || currentSpeedWeek;
        select.innerHTML = '';

        sortedWeeks.forEach(wk => {
          const isCur = (wk === activeWk);
          const wkNum = wk.replace('w', '');
          const grp = document.createElement('optgroup');
          grp.label = isCur 
            ? `🔥 第 ${wkNum} 周 速成手速字庫 (當前進行中)` 
            : `📅 第 ${wkNum} 周 速成手速字庫 (溫故知新)`;

          for (let idx = 1; idx <= 4; idx++) {
            const k = `${wk}_hw${idx}`;
            const bank = allBanks[k];
            if (bank || isCur) {
              const opt = document.createElement('option');
              opt.value = k;
              const titleText = (bank && bank.title) ? bank.title.replace(/【.*?】/, '') : `第${wkNum}周功課${idx}`;
              opt.textContent = titleText;
              grp.appendChild(opt);
            }
          }
          if (grp.children.length > 0) select.appendChild(grp);
        });

        // 決定選中項：若 prevVal 依然在可用選項中則保留，否則預設為當前進行中週次功課1
        let matched = false;
        if (prevVal) {
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === prevVal) {
              select.selectedIndex = i;
              currentSpeedWeek = prevVal;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          const targetDefault = `${activeWk}_hw1`;
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === targetDefault) {
              select.selectedIndex = i;
              currentSpeedWeek = targetDefault;
              matched = true;
              break;
            }
          }
        }
        if (!matched && select.options.length > 0) {
          currentSpeedWeek = select.value;
        }
      }

      // 3. 動態建構手速排行榜篩選選單 #speed-lb-week-select
      if (lbSelect) {
        const prevLbVal = lbSelect.value || speedLeaderboardWeek || 'ALL';
        lbSelect.innerHTML = '';

        // 生涯總覽
        const allGrp = document.createElement('optgroup');
        allGrp.label = '🏆 全期生涯總覽';
        const allOpt = document.createElement('option');
        allOpt.value = 'ALL';
        allOpt.textContent = '🌟 全期個人最佳極速總榜 (生涯最佳)';
        allGrp.appendChild(allOpt);
        lbSelect.appendChild(allGrp);

        sortedWeeks.forEach(wk => {
          const isCur = (wk === activeWk);
          const wkNum = wk.replace('w', '');
          const grp = document.createElement('optgroup');
          grp.label = isCur 
            ? `🔥 第 ${wkNum} 周 速成手速賽 (當前進行中)` 
            : `📅 第 ${wkNum} 周 速成手速賽 (過往記錄)`;

          for (let idx = 1; idx <= 4; idx++) {
            const k = `${wk}_hw${idx}`;
            const bank = allBanks[k];
            if (bank || isCur) {
              const opt = document.createElement('option');
              opt.value = k;
              const titleText = (bank && bank.title) ? bank.title.replace(/【.*?】/, '') : `第${wkNum}周功課${idx}`;
              opt.textContent = titleText;
              grp.appendChild(opt);
            }
          }
          if (grp.children.length > 0) lbSelect.appendChild(grp);
        });

        // 決定排行榜選中項
        let lbMatched = false;
        if (prevLbVal) {
          for (let i = 0; i < lbSelect.options.length; i++) {
            if (lbSelect.options[i].value === prevLbVal) {
              lbSelect.selectedIndex = i;
              speedLeaderboardWeek = prevLbVal;
              lbMatched = true;
              break;
            }
          }
        }
        if (!lbMatched) {
          const targetLb = `${activeWk}_hw1`;
          for (let i = 0; i < lbSelect.options.length; i++) {
            if (lbSelect.options[i].value === targetLb) {
              lbSelect.selectedIndex = i;
              speedLeaderboardWeek = targetLb;
              lbMatched = true;
              break;
            }
          }
        }
        if (!lbMatched && lbSelect.options.length > 0) {
          speedLeaderboardWeek = lbSelect.value;
        }
      }
    }

    function updateSpeedLeaderboardButtons(activeWk) {
      const lbSelect = document.getElementById('speed-lb-week-select');
      if (lbSelect) {
        if (!speedLeaderboardWeek) speedLeaderboardWeek = `${activeWk}_hw1`;
        lbSelect.value = speedLeaderboardWeek;
      }
    }

    function returnToSpeedReadyStage() {
      const mainStage = document.getElementById('speed-main-stage');
      const finishBox = document.getElementById('speed-finish-box');
      const readyStage = document.getElementById('speed-ready-stage');
      if (mainStage) mainStage.style.display = 'none';
      if (finishBox) finishBox.style.display = 'none';
      if (readyStage) readyStage.style.display = 'block';
    }

    function launchSpeedMatch() {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }

      onSpeedSettingChange();

      if (speedTimerInterval) clearInterval(speedTimerInterval);
      if (speedHintTimer) clearTimeout(speedHintTimer);

      const allBanks = (typeof MODE2_WEEKLY_BANKS === "object" && MODE2_WEEKLY_BANKS) 
        ? MODE2_WEEKLY_BANKS 
        : ((typeof window !== 'undefined' && window.MODE2_WEEKLY_BANKS) ? window.MODE2_WEEKLY_BANKS : {});
      const activeWk = (typeof getActiveSpeedWeek === 'function') ? getActiveSpeedWeek() : 'w8';
      const defaultKey = `${activeWk}_hw1`;
      const bank = allBanks[currentSpeedWeek] || allBanks[defaultKey] || allBanks["w8_hw1"] || allBanks["w7_hw1"] || Object.values(allBanks)[0] || { words: [] };
      const rawWords = (bank && Array.isArray(bank.words) && bank.words.length > 0) ? bank.words.map(w => {
        const item = Object.assign({}, w);
        const ovMap = (typeof P4_MASTER_QUICK_OVERRIDES !== 'undefined') ? P4_MASTER_QUICK_OVERRIDES : (typeof window !== 'undefined' ? window.P4_MASTER_QUICK_OVERRIDES : (typeof global !== 'undefined' ? global.P4_MASTER_QUICK_OVERRIDES : null));
        if (ovMap && item.char && ovMap[item.char]) {
          const ov = ovMap[item.char];
          item.codes = ov.codes.slice();
          item.keys = ov.keys.slice();
          item.first_code = ov.first_code;
          item.last_code = ov.last_code;
          item.first_key = ov.first_key;
          item.last_key = ov.last_key;
          item.full = ov.full;
          item.secret = ov.secret;
          if (ov.cj_full) item.cj_full = ov.cj_full;
        }
        return item;
      }) : [
        { char: "明", codes: ["日", "月"], keys: ["A", "B"], full: "日月 (AB)", secret: "速成首碼【日】(A) ＋ 尾碼【月】(B)" }
      ];
      const shuffled = (typeof fisherYatesShuffle === 'function') ? fisherYatesShuffle([...rawWords]) : [...rawWords].sort(() => Math.random() - 0.5);
      speedWordList = shuffled.slice(0, currentSpeedWordCount);

      speedWordIdx = 0;
      speedInputCodes = [];
      speedMistakes = 0;
      speedPenaltySeconds = 0.0;
      speedTotalKeys = 0;
      speedCorrectKeys = 0;
      speedActive = true;
      speedWordReadyForSpace = false;

      document.getElementById('speed-ready-stage').style.display = 'none';
      document.getElementById('speed-finish-box').style.display = 'none';
      document.getElementById('speed-main-stage').style.display = 'block';

      document.getElementById('speed-total-count-text').textContent = speedWordList.length;
      document.getElementById('speed-timer-val').textContent = '00.00s';
      document.getElementById('speed-penalty-display').innerHTML = `⚠️ 失誤 0 次 (+0.0s 罰時)`;
      
      const badgeTag = document.getElementById('speed-active-badge-tag');
      if (badgeTag) {
        const bankObj = MODE2_WEEKLY_BANKS[currentSpeedWeek] || Object.values(MODE2_WEEKLY_BANKS)[0];
        badgeTag.textContent = `⚡ ${currentSpeedWordCount} 字賽 · ${bankObj.title}`;
      }

      const spacePrompt = document.getElementById('speed-space-prompt');
      if (spacePrompt) spacePrompt.style.display = 'none';

      renderSpeedProgressDots();
      renderSpeedTargetWord();

      speedStartTime = performance.now();
      speedTimerInterval = setInterval(updateSpeedClock, 30);

      window.removeEventListener('keydown', handleSpeedKeydown, true);
      window.addEventListener('keydown', handleSpeedKeydown, true);
    }

    function abortSpeedMatchToReady() {
      if (speedTimerInterval) clearInterval(speedTimerInterval);
      if (speedHintTimer) clearTimeout(speedHintTimer);
      speedActive = false;
      speedWordReadyForSpace = false;
      window.removeEventListener('keydown', handleSpeedKeydown, true);

      initSpeedWeekDropdown();
        returnToSpeedReadyStage();
    }

    function updateSpeedClock() {
      if (!speedStartTime || !speedActive) return;
      const now = performance.now();
      const elapsed = ((now - speedStartTime) / 1000) + speedPenaltySeconds;
      document.getElementById('speed-timer-val').textContent = elapsed.toFixed(2) + 's';
    }

    function renderSpeedProgressDots() {
      const container = document.getElementById('speed-progress-dots');
      if (!container) return;
      container.innerHTML = '';
      const total = speedWordList.length;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'speed-dot' + (i === speedWordIdx ? ' active' : (i < speedWordIdx ? ' done' : ''));
        container.appendChild(dot);
      }
    }

    function renderSpeedTargetWord() {
      if (speedWordIdx >= speedWordList.length) return;
      const currentWord = speedWordList[speedWordIdx];

      speedWordReadyForSpace = false;
      const spacePrompt = document.getElementById('speed-space-prompt');
      if (spacePrompt) spacePrompt.style.display = 'none';

      document.getElementById('speed-target-char').textContent = currentWord.char;
      document.getElementById('speed-current-idx-text').textContent = speedWordIdx + 1;
      
      const isSingleCode = currentWord.codes.length === 1;
      const ruleText = isSingleCode 
        ? `單碼字根：<strong>【${currentWord.codes[0]}】(${currentWord.keys[0]})</strong>`
        : `速成首尾取碼：首碼【<strong>${currentWord.codes[0]}</strong>】(${currentWord.keys[0]}) ＋ 尾碼【<strong>${currentWord.codes[1]}</strong>】(${currentWord.keys[1]})`;

      document.getElementById('speed-bottom-tip').innerHTML = `💡 規則：${ruleText} · 按錯鍵每次加計 <strong>+0.3 秒罰時</strong> · <strong>敲完字碼請按【空白鍵 Space】送出</strong>`;

      renderSpeedProgressDots();

      const slotsContainer = document.getElementById('speed-slots-row');
      slotsContainer.innerHTML = '';

      const neededIdx = speedInputCodes.length;

      currentWord.codes.forEach((code, idx) => {
        const slot = document.createElement('div');
        slot.id = `speed-slot-${idx}`;
        slot.className = 'speed-key-slot';

        const slotLabel = isSingleCode ? '【單碼】' : (idx === 0 ? '【首碼】' : '【尾碼】');

        if (idx < speedInputCodes.length) {
          slot.classList.add('filled');
          slot.innerHTML = `
            <div class="speed-slot-code" style="color: #34D399;">${speedInputCodes[idx].code}</div>
            <div class="speed-slot-sub" style="color: #A7F3D0; font-weight: 800;">${speedInputCodes[idx].key} · ${slotLabel}</div>
          `;
        } else if (idx === neededIdx) {
          slot.classList.add('current');
          if (isSpeedPracticeMode) {
            slot.innerHTML = `
              <div class="speed-slot-hint-text">${code}</div>
              <div class="speed-slot-sub" style="color: #FACC15; font-weight: 900;">${currentWord.keys[idx]} · ${slotLabel}</div>
            `;
          } else {
            slot.innerHTML = `
              <div class="speed-slot-code" style="color: #94A3B8;">？</div>
              <div class="speed-slot-sub">${slotLabel}</div>
            `;
          }
        } else {
          slot.innerHTML = `
            <div class="speed-slot-code" style="color: #475569;">·</div>
            <div class="speed-slot-sub">${slotLabel}</div>
          `;
        }
        slotsContainer.appendChild(slot);
      });

      startSpeedHintTimer();
    }

    function startSpeedHintTimer() {
      if (speedHintTimer) clearTimeout(speedHintTimer);
      if (isSpeedPracticeMode || !speedActive || speedWordReadyForSpace) return;

      const currentWord = speedWordList[speedWordIdx];
      const neededIdx = speedInputCodes.length;
      if (!currentWord || neededIdx >= currentWord.codes.length) return;

      speedHintTimer = setTimeout(() => {
        const targetSlot = document.getElementById(`speed-slot-${neededIdx}`);
        if (targetSlot) {
          targetSlot.classList.add('hint-glow');
          targetSlot.innerHTML = `
            <div class="speed-slot-hint-text">${currentWord.codes[neededIdx]}</div>
            <div class="speed-slot-sub" style="color: #FACC15; font-weight: 900;">${currentWord.keys[neededIdx]}</div>
          `;
          document.getElementById('speed-bottom-tip').innerHTML = `💡 <span style="color:#FACC15;font-weight:900;">【提燈指引啟動】：目標字根為【${currentWord.codes[neededIdx]}】(按鍵 ${currentWord.keys[neededIdx]})！</span>`;
        }
      }, 3000);
    }

    function handleSpeedKeydown(e) {
      if (currentGameMode !== 'speed') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const readyStage = document.getElementById('speed-ready-stage');
      if (readyStage && readyStage.style.display !== 'none') {
        if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          launchSpeedMatch();
        }
        return;
      }

      if (!speedActive) return;

      if (e.key === ' ' || e.code === 'Space' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();

        if (speedWordReadyForSpace) {
          confirmSpeedWordSpace();
        } else {
          const stage = document.getElementById('speed-main-stage');
          triggerFloatingNotice(stage, '請先敲完速成字碼（首碼與尾碼）再按空白鍵！⚠️');
          const currentWord = speedWordList[speedWordIdx];
          if (currentWord) {
            const neededIdx = speedInputCodes.length;
            const targetSlot = document.getElementById(`speed-slot-${neededIdx}`);
            if (targetSlot) {
              targetSlot.classList.add('shake-error');
              setTimeout(() => targetSlot.classList.remove('shake-error'), 400);
            }
          }
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        if (speedWordReadyForSpace) {
          speedWordReadyForSpace = false;
          speedInputCodes.pop();
          renderSpeedTargetWord();
        } else if (speedInputCodes.length > 0) {
          speedInputCodes.pop();
          renderSpeedTargetWord();
        }
        return;
      }

      if (speedWordReadyForSpace) {
        e.preventDefault();
        e.stopPropagation();
        const spacePrompt = document.getElementById('speed-space-prompt');
        if (spacePrompt) {
          spacePrompt.classList.add('shake-error');
          setTimeout(() => spacePrompt.classList.remove('shake-error'), 400);
        }
        return;
      }

      const keyUpper = e.key.toUpperCase();
      if (keyUpper.length === 1 && keyUpper >= 'A' && keyUpper <= 'Z') {
        e.preventDefault();
        e.stopPropagation();
        processSpeedKeyInput(keyUpper);
      }
    }

    function processSpeedKeyInput(pressedKey) {
      if (speedWordReadyForSpace) return;
      const currentWord = speedWordList[speedWordIdx];
      if (!currentWord) return;

      const neededIdx = speedInputCodes.length;
      const targetKey = currentWord.keys[neededIdx];
      const targetCode = currentWord.codes[neededIdx];

      speedTotalKeys++;

      if (pressedKey === targetKey) {
        speedCorrectKeys++;
        speedInputCodes.push({ key: pressedKey, code: targetCode });

        if (speedInputCodes.length === currentWord.keys.length) {
          speedWordReadyForSpace = true;
          if (speedHintTimer) clearTimeout(speedHintTimer);

          const slotsContainer = document.getElementById('speed-slots-row');
          if (slotsContainer) {
            slotsContainer.innerHTML = '';
            currentWord.codes.forEach((code, idx) => {
              const slot = document.createElement('div');
              slot.className = 'speed-key-slot filled';
              slot.style.borderColor = '#10B981';
              slot.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.5)';
              slot.innerHTML = `
                <div class="speed-slot-code" style="color: #34D399;">${code}</div>
                <div class="speed-slot-sub" style="color: #A7F3D0;">${currentWord.keys[idx]} ✓</div>
              `;
              slotsContainer.appendChild(slot);
            });
          }

          const spacePrompt = document.getElementById('speed-space-prompt');
          if (spacePrompt) {
            spacePrompt.style.display = 'flex';
          }
          document.getElementById('speed-bottom-tip').innerHTML = `✨ <strong style="color:#34D399;">【${currentWord.char}】字碼全對！</strong>請按下鍵盤<strong>【Space 空白鍵】</strong>送出並進入下一題 ➔`;
        } else {
          renderSpeedTargetWord();
        }
      } else {
        speedMistakes++;
        speedPenaltySeconds += 0.3;

        const targetSlot = document.getElementById(`speed-slot-${neededIdx}`);
        if (targetSlot) {
          targetSlot.classList.add('shake-error');
          setTimeout(() => targetSlot.classList.remove('shake-error'), 400);
        }

        const stage = document.getElementById('speed-main-stage');
        triggerFloatingNotice(stage, '+0.3s 罰時 ⚠️');

        document.getElementById('speed-penalty-display').innerHTML = `⚠️ 失誤 <strong style="color:#EF4444;">${speedMistakes}</strong> 次 (+<strong style="color:#EF4444;">${speedPenaltySeconds.toFixed(1)}s</strong> 罰時)`;
      }
    }

    function confirmSpeedWordSpace() {
      if (!speedWordReadyForSpace || !speedActive) return;
      speedWordReadyForSpace = false;

      const spacePrompt = document.getElementById('speed-space-prompt');
      if (spacePrompt) spacePrompt.style.display = 'none';

      burstConfetti();
      speedWordIdx++;
      speedInputCodes = [];

      if (speedWordIdx < speedWordList.length) {
        renderSpeedTargetWord();
      } else {
        onSpeedMatchComplete();
      }
    }

    function onSpeedMatchComplete() {
      speedActive = false;
      speedWordReadyForSpace = false;
      if (speedTimerInterval) clearInterval(speedTimerInterval);
      if (speedHintTimer) clearTimeout(speedHintTimer);
      window.removeEventListener('keydown', handleSpeedKeydown, true);

      const endTime = performance.now();
      const rawElapsed = parseFloat(((endTime - speedStartTime) / 1000).toFixed(2));
      const accuracy = Math.max(10, Math.round((speedCorrectKeys / Math.max(1, speedTotalKeys)) * 100));

      const penaltyObj = calculateEffectiveSpeedTime(rawElapsed, speedMistakes, accuracy, currentSpeedWordCount);
      const effectiveFinalTime = penaltyObj.effectiveTime;

      const cpm = Math.round(currentSpeedWordCount / (effectiveFinalTime / 60));
      const speedTier = getSpeedTier(effectiveFinalTime, currentSpeedWordCount);

      document.getElementById('speed-main-stage').style.display = 'none';
      document.getElementById('speed-finish-box').style.display = 'block';

      document.getElementById('speed-finish-title').textContent = `${currentSpeedWordCount} 字極速鍵盤手速賽完成！`;
      document.getElementById('speed-stat-final-time').textContent = effectiveFinalTime.toFixed(2) + 's';
      document.getElementById('speed-stat-raw-time').textContent = rawElapsed.toFixed(2) + 's';
      document.getElementById('speed-stat-acc').textContent = accuracy + '%';
      document.getElementById('speed-stat-acc-penalty').textContent = (penaltyObj.accPenalty >= 0 ? '+' : '') + penaltyObj.accPenalty.toFixed(2) + 's';
      document.getElementById('speed-stat-cpm').textContent = cpm + ' 字/分';
      document.getElementById('speed-stat-tier').textContent = speedTier;

      if (currentStudent) {
        const speedKey = `p4_speed_${currentStudent.cls}_${currentStudent.num}_${currentSpeedWordCount}_${currentSpeedWeek}`;
        const prev = SafeStorage.getItem(speedKey);
        let bestRecord = {
          cls: currentStudent.cls,
          num: currentStudent.num,
          wordCount: currentSpeedWordCount,
          weekKey: currentSpeedWeek,
          bestTime: effectiveFinalTime,
          rawTime: rawElapsed,
          accuracy: accuracy,
          cpm: cpm,
          accPenalty: penaltyObj.accPenalty,
          tier: speedTier,
          date: new Date().toISOString()
        };

        if (prev) {
          try {
            const parsed = JSON.parse(prev);
            if (parsed && typeof parsed.bestTime === 'number' && parsed.bestTime < effectiveFinalTime) {
              bestRecord = parsed;
            }
          } catch(e) {}
        }
        SafeStorage.setItem(speedKey, JSON.stringify(bestRecord));

        if (currentSpeedWordCount === 10) {
          const prevOverall = SafeStorage.getItem(`p4_speed_${currentStudent.cls}_${currentStudent.num}`);
          let shouldUpdateOverall = true;
          if (prevOverall) {
            try {
              const parsedPrev = JSON.parse(prevOverall);
              if (parsedPrev && parsedPrev.bestTime <= effectiveFinalTime) {
                shouldUpdateOverall = false;
              }
            } catch (e) {}
          }
          if (shouldUpdateOverall) {
            SafeStorage.setItem(`p4_speed_${currentStudent.cls}_${currentStudent.num}`, JSON.stringify(bestRecord));
          }
        }

        // ⚡ 依照六年級標準規範：手速賽純秒數制 (非積分制，不累加至討伐總分)，將秒數精準同步至雲端與各周次功課
        saveStudentStats(
          currentStudent.cls,
          currentStudent.num,
          0,
          true,
          'speed',
          effectiveFinalTime,
          currentSpeedWordCount,
          currentSpeedWeek
        );
        loadStudentProfile();
      }

              // 同步手速榜篩選器與按鈕狀態至當前挑戰項目
        speedLeaderboardWordCount = currentSpeedWordCount;
        speedLeaderboardWeek = currentSpeedWeek;
        document.querySelectorAll('#speed-lb-sub-filters .lb-sub-pill[id^="lb-wc-"]').forEach(p => {
          p.classList.toggle('active', p.id === `lb-wc-${speedLeaderboardWordCount}`);
        });
        const select = document.getElementById('speed-lb-week-select');
        if (select) select.value = speedLeaderboardWeek;

      // ⚡ 立即重繪手速天梯榜，使天梯成績與排名即時更新生效！
      if (typeof renderSpeedLeaderboardTable === 'function') {
        renderSpeedLeaderboardTable();
      }

      // 在結算畫面即時展示名次回饋
      const rankEl = document.getElementById('lb-my-rank');
      const descEl = document.getElementById('speed-stat-time-desc');
      if (descEl && rankEl && rankEl.textContent) {
        descEl.innerHTML = `🌟 <strong>${rankEl.textContent.trim()}</strong>`;
      }

      burstConfetti();
    }

    function restartSpeedMatch() {
      launchSpeedMatch();
    }

    // =========================================================================
    // 🏆 排行榜雙軌切換：討伐累積總分榜 vs 獨立手速天梯榜 (題量/周次/秒數升序)
    // =========================================================================
    function switchLeaderboardType(type) {
      currentLeaderboardType = type;
      document.querySelectorAll('.lb-sub-nav-btn').forEach(b => {
        b.classList.toggle('active', (type === 'score' && b.id === 'lb-type-score') || (type === 'speed' && b.id === 'lb-type-speed'));
      });
      
      const subFilters = document.getElementById('speed-lb-sub-filters');
      if (subFilters) {
        subFilters.style.display = (type === 'speed') ? 'block' : 'none';
        const select = document.getElementById('speed-lb-week-select');
        if (select && speedLeaderboardWeek) {
          select.value = speedLeaderboardWeek;
        }
      }

      const modalTitle = document.getElementById('lb-modal-main-title');
      if (modalTitle) {
        modalTitle.textContent = (type === 'speed') ? '⚡ 四年級寶可夢速成手速天梯榜 (10字秒數制)' : '🏆 四年級寶可夢速成討伐龍虎榜';
      }

      renderLeaderboardTable();
    }

    function filterSpeedLeaderboardWeek(weekKey) {
      speedLeaderboardWeek = weekKey;
      const select = document.getElementById('speed-lb-week-select');
      if (select && select.value !== weekKey) {
        select.value = weekKey;
      }
      renderSpeedLeaderboardTable();
    }

    function renderSpeedLeaderboardTable() {
      // 1. 替換表頭為純 10 字秒數制各項指標 (11欄，完全對齊試算表與六年級規格)
      const thead = document.querySelector('#modal-leaderboard thead tr');
      if (thead) {
        thead.innerHTML = `
          <th>排名</th>
          <th>班別</th>
          <th>學號</th>
          <th>訓練家代號</th>
          <th>周次功課</th>
          <th style="color:#0284C7;">⏱️ 10字等效耗時 (秒)</th>
          <th>原始碼表耗時</th>
          <th>擊鍵準確率</th>
          <th>準確率加權罰時</th>
          <th>等效中文字速</th>
          <th>榮譽段位</th>
        `;
      }

      const scoreLabel = document.getElementById('lb-my-score-label');
      const rankLabel = document.getElementById('lb-my-rank-label');
      if (scoreLabel) scoreLabel.textContent = '10字等效總耗時';
      if (rankLabel) rankLabel.textContent = (currentLeaderboardFilter === 'ALL') ? '全級手速名次' : '班內手速名次';

      const bankObj = (typeof MODE2_WEEKLY_BANKS === 'object' && MODE2_WEEKLY_BANKS) ? MODE2_WEEKLY_BANKS[speedLeaderboardWeek] : null;
      const wkTitle = bankObj ? bankObj.title : (speedLeaderboardWeek === 'ALL' ? '全部周次 (生涯最佳)' : speedLeaderboardWeek);

      const allSpeedMap = {};

      // 1. 初始化全級名冊 (預設全部未參賽，不入榜)
      if (DATA.benchmark_leaderboard && Array.isArray(DATA.benchmark_leaderboard)) {
        DATA.benchmark_leaderboard.forEach(item => {
          let hasRec = false;
          let timeVal = 9999.0;

          if (item.weekly_speed && typeof item.weekly_speed[speedLeaderboardWeek] === 'number' && item.weekly_speed[speedLeaderboardWeek] > 0) {
            timeVal = Number(item.weekly_speed[speedLeaderboardWeek]);
            hasRec = true;
          } else if (speedLeaderboardWeek === 'ALL') {
            let best = 9999.0;
            if (typeof item.best10 === 'number' && item.best10 > 0 && item.best10 < 900) {
              best = item.best10;
            }
            if (item.weekly_speed && typeof item.weekly_speed === 'object') {
              Object.values(item.weekly_speed).forEach(v => {
                const numV = Number(v);
                if (!isNaN(numV) && numV > 0 && numV < best) {
                  best = numV;
                }
              });
            }
            if (best < 900) {
              timeVal = best;
              hasRec = true;
            }
          }

          const cpmVal = (hasRec && timeVal > 0) ? Math.round(10 / (timeVal / 60)) : 0;
          const tierVal = hasRec ? getSpeedTier(timeVal, 10) : '--';

          allSpeedMap[`${item.cls}_${item.num}`] = {
            cls: item.cls,
            num: item.num,
            name: item.name || `${item.cls} ${(item.num < 10 ? '0' : '') + item.num}號`,
            bestTime: timeVal,
            rawTime: timeVal,
            cpm: cpmVal,
            accuracy: 100,
            accPenalty: 0,
            tier: tierVal,
            weekKey: speedLeaderboardWeek,
            hasRecord: hasRec
          };
        });
      }

      // 2. 從本地 SafeStorage 讀取該周次功課之真實手速紀錄 (優先採用本機最新最佳)
      const allKeys = SafeStorage.getAllKeys ? SafeStorage.getAllKeys() : [];
      allKeys.forEach(key => {
        if (key.startsWith('p4_speed_')) {
          const parts = key.replace('p4_speed_', '').split('_');
          const cls = String(parts[0] || '').trim().toUpperCase();
          const num = parseInt(parts[1], 10);
          if (!cls || isNaN(num) || num < 1 || num > 36) return;

          let recWc = 10;
          let recWk = 'ALL';
          if (parts.length >= 5) {
            recWc = parseInt(parts[2], 10) || 10;
            recWk = parts.slice(3).join('_');
          } else if (parts.length === 2) {
            recWc = 10;
            recWk = 'ALL';
          } else {
            return;
          }

          if (recWc !== 10) return; // 四年級週次功課鎖定純 10 字
          if (speedLeaderboardWeek !== 'ALL' && recWk !== speedLeaderboardWeek) return;

          try {
            const parsed = JSON.parse(SafeStorage.getItem(key));
            if (parsed && typeof parsed.bestTime === 'number' && parsed.bestTime > 0 && parsed.bestTime < 900) {
              const mapKey = `${cls}_${num}`;
              const time = parsed.bestTime;
              const raw = (typeof parsed.rawTime === 'number') ? parsed.rawTime : time;
              const acc = (typeof parsed.accuracy === 'number') ? parsed.accuracy : 100;
              const cpm = parsed.cpm || Math.round(10 / (time / 60));
              const penalty = parsed.accPenalty || 0;
              const tier = parsed.tier || getSpeedTier(time, 10);

              if (!allSpeedMap[mapKey] || !allSpeedMap[mapKey].hasRecord || allSpeedMap[mapKey].bestTime > time) {
                allSpeedMap[mapKey] = {
                  cls, num,
                  name: `${cls} ${(num < 10 ? '0' : '') + num}號`,
                  bestTime: time,
                  rawTime: raw,
                  cpm: cpm,
                  accuracy: acc,
                  accPenalty: penalty,
                  tier: tier,
                  weekKey: recWk,
                  hasRecord: true
                };
              }
            }
          } catch(e) {}
        }
      });

      // 3. 從雲端即時手速榜合併跨電腦成績 (純 10 字天梯)
      if (DATA.cloud_speed_records) {
        let cloudList = [];
        if (Array.isArray(DATA.cloud_speed_records)) {
          cloudList = DATA.cloud_speed_records;
        } else if (DATA.cloud_speed_records[speedLeaderboardWeek]) {
          cloudList = DATA.cloud_speed_records[speedLeaderboardWeek];
        } else if (speedLeaderboardWeek === 'ALL' && DATA.cloud_speed_records['overall']) {
          cloudList = DATA.cloud_speed_records['overall'];
        }

        cloudList.forEach(cs => {
          const mapKey = `${cs.cls}_${cs.num}`;
          const time = parseFloat(cs.bestTime !== undefined ? cs.bestTime : cs.best10);
          if (!isNaN(time) && time > 0 && time < 900) {
            const curEntry = allSpeedMap[mapKey];
            if (!curEntry || !curEntry.hasRecord || curEntry.bestTime > time) {
              const cpm = cs.cpm || Math.round(10 / (time / 60));
              allSpeedMap[mapKey] = {
                cls: cs.cls,
                num: cs.num,
                name: cs.name || `${cs.cls} ${(cs.num < 10 ? '0' : '') + cs.num}號`,
                bestTime: time,
                rawTime: (typeof cs.rawTime === 'number') ? cs.rawTime : time,
                cpm: cpm,
                accuracy: (typeof cs.accuracy === 'number') ? cs.accuracy : 100,
                accPenalty: (typeof cs.accPenalty === 'number') ? cs.accPenalty : 0,
                tier: cs.tier || getSpeedTier(time, 10),
                weekKey: cs.weekKey || speedLeaderboardWeek,
                hasRecord: true
              };
            }
          }
        });
      }

      // 4. 嚴格過濾：未參與本項手速遊戲者直接不入榜
      const speedList = Object.values(allSpeedMap).filter(s => s.hasRecord && typeof s.bestTime === 'number' && s.bestTime < 900);
      speedList.sort((a, b) => {
        if (a.bestTime !== b.bestTime) return a.bestTime - b.bestTime;
        return b.accuracy - a.accuracy;
      });
      speedList.forEach((item, idx) => item.overallRank = idx + 1);

      // 分班計算班內名次 (僅限有成績者)
      const classGroups = {};
      ['P4A', 'P4B', 'P4C', 'P4D', 'P4E', 'P4F'].forEach(c => {
        classGroups[c] = speedList.filter(s => s.cls === c);
        classGroups[c].forEach((item, idx) => item.classRank = idx + 1);
      });

      // 5. 更新頂部我的個人戰報
      if (currentStudent) {
        const myKey = `${currentStudent.cls}_${currentStudent.num}`;
        const myEntry = allSpeedMap[myKey];
        const myNameEl = document.getElementById('lb-my-name');
        if (myNameEl) myNameEl.textContent = `${currentStudent.cls} ${(currentStudent.num < 10 ? '0' : '') + currentStudent.num}號`;

        if (myEntry && myEntry.hasRecord) {
          document.getElementById('lb-my-title').textContent = `分類：10字賽 · ${wkTitle} ｜ 速成字速：${myEntry.cpm} 字/分`;
          document.getElementById('lb-my-score').textContent = `${myEntry.bestTime.toFixed(2)} 秒 (準確率 ${myEntry.accuracy}%)`;
          document.getElementById('lb-my-badge').textContent = '⚡';
          if (currentLeaderboardFilter === 'ALL') {
            document.getElementById('lb-my-rank').innerHTML = `<span style="color:#B45309;font-weight:900;">全級手速第 ${myEntry.overallRank} 名</span>`;
          } else {
            document.getElementById('lb-my-rank').innerHTML = `<span style="color:#2563EB;font-weight:900;">${currentLeaderboardFilter} 班內手速第 ${myEntry.classRank} 名</span>`;
          }
        } else {
          document.getElementById('lb-my-title').textContent = `分類：10字賽 · ${wkTitle}`;
          document.getElementById('lb-my-score').textContent = '-- 秒';
          document.getElementById('lb-my-badge').textContent = '⏱️';
          document.getElementById('lb-my-rank').textContent = '尚無本組手速紀錄';
        }
      }

      const isClassFilter = currentLeaderboardFilter !== 'ALL';
      const sourceList = isClassFilter ? (classGroups[currentLeaderboardFilter] || []) : speedList;
      const displayList = sourceList.slice(0, isClassFilter ? 15 : 20);

      const tbody = document.getElementById('leaderboard-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (displayList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:24px;color:#94A3B8;">⚡ 尚無符合條件的手速紀錄，歡迎搶先挑戰！</td></tr>`;
        return;
      }

      displayList.forEach(item => {
        const tr = document.createElement('tr');
        const rank = isClassFilter ? item.classRank : item.overallRank;

        let rankBadge = `${rank}`;
        if (rank === 1) rankBadge = `<span style="font-size:18px;">🥇 1</span>`;
        else if (rank === 2) rankBadge = `<span style="font-size:18px;">🥈 2</span>`;
        else if (rank === 3) rankBadge = `<span style="font-size:18px;">🥉 3</span>`;

        const isMe = currentStudent && (currentStudent.cls === item.cls && currentStudent.num === item.num);
        if (isMe) {
          tr.style.background = '#EFF6FF';
          tr.style.fontWeight = 'bold';
        }

        const bankObj = (typeof MODE2_WEEKLY_BANKS === 'object' && MODE2_WEEKLY_BANKS) ? MODE2_WEEKLY_BANKS[item.weekKey || speedLeaderboardWeek] : null;
        const wkName = bankObj ? bankObj.title : (item.weekKey || speedLeaderboardWeek);

        tr.innerHTML = `
          <td style="font-weight:900;color:${rank <= 3 ? '#B45309' : '#1E293B'};">${rankBadge}</td>
          <td><span class="st-poke-tag" style="background:#DBEAFE;color:#1E40AF;font-weight:800;">${item.cls}</span></td>
          <td style="font-weight:700;">${item.num}</td>
          <td style="font-weight:800;color:#1E293B;">${item.name}</td>
          <td style="font-size:12px;color:#475569;font-weight:700;">${wkName}</td>
          <td style="font-weight:900;color:#0284C7;font-size:15px;">⏱️ ${item.bestTime.toFixed(2)}s</td>
          <td style="color:#64748B;font-size:13px;">${item.rawTime.toFixed(2)}s</td>
          <td style="font-weight:800;color:${item.accuracy >= 95 ? '#10B981' : '#F59E0B'};">${item.accuracy}%</td>
          <td style="color:${item.accPenalty > 0 ? '#EF4444' : '#10B981'};font-size:12px;">+${item.accPenalty.toFixed(2)}s</td>
          <td style="font-weight:800;color:#D97706;">${item.cpm} 字/分</td>
          <td style="font-size:11px;font-weight:800;color:#7C3AED;">${item.tier}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // 頁面載入時依日期自動初始化手速字庫下拉選單與排行榜篩選器
    window.addEventListener('DOMContentLoaded', () => {
      initSpeedWeekDropdown();
    });
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      try { initSpeedWeekDropdown(); } catch(e) {}
    }
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (getGasWebhookUrl() && typeof fetchCloudLeaderboard === 'function') {
        fetchCloudLeaderboard(true);
      }
    }, 400);
  });
}

// Expose core functions to window/global for cross-module & testing access
if (typeof window !== 'undefined') {
  window.drawUniqueSiegeWord = drawUniqueSiegeWord;
  window.launchSiegeMatch = launchSiegeMatch;
  window.setGameMode = setGameMode;
  window.saveStudentStats = saveStudentStats;
  window.getStudentStats = getStudentStats;
  window.sendReliableWebhook = sendReliableWebhook;
  window.getActiveSpeedWeek = getActiveSpeedWeek;
  window.getActiveWeekWords = getActiveWeekWords;
  window.getSiegeWordPool = getSiegeWordPool;
  window.initSpeedWeekDropdown = initSpeedWeekDropdown;
  window.launchSpeedMatch = launchSpeedMatch;
  window.getSpeedWordList = () => speedWordList;
}
if (typeof global !== 'undefined') {
  global.drawUniqueSiegeWord = drawUniqueSiegeWord;
  global.launchSiegeMatch = launchSiegeMatch;
  global.setGameMode = setGameMode;
  global.saveStudentStats = saveStudentStats;
  global.getStudentStats = getStudentStats;
  global.sendReliableWebhook = sendReliableWebhook;
  global.getActiveSpeedWeek = getActiveSpeedWeek;
  global.getActiveWeekWords = getActiveWeekWords;
  global.getSiegeWordPool = getSiegeWordPool;
  global.initSpeedWeekDropdown = initSpeedWeekDropdown;
  global.launchSpeedMatch = launchSpeedMatch;
  global.getSpeedWordList = () => speedWordList;
}

// ⚡ 測試專屬快捷鍵：Control + Shift + P (同時支援 Mac Command + Shift + P) 解鎖全部遊戲鏈條
window.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'T' || e.key === 't' || e.code === 'KeyT' || e.key === 'P' || e.key === 'p' || e.code === 'KeyP')) {
    if (typeof initSpeedWeekDropdown === 'function') {
      setTimeout(() => { try { initSpeedWeekDropdown(); } catch(err) {} }, 50);
    }
    e.preventDefault();
    e.stopPropagation();
    isTeacherMode = !isTeacherMode;
    window.isTeacherMode = isTeacherMode;
    if (typeof global !== 'undefined') global.isTeacherMode = isTeacherMode;
    if (typeof renderModeTabs === 'function') {
      renderModeTabs();
    }
    const tip = isTeacherMode 
      ? '🔓【測試特權已啟動】全部遊戲鏈條已全數解鎖！可自由進入站 1~4 及手速賽' 
      : '🔒【測試特權已關閉】已恢復學生正常每日階梯解鎖鏈條';
    if (typeof showPassToast === 'function') {
      showPassToast(tip);
    }
  }
}, true);
