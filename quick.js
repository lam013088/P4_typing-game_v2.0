/**
 * =========================================================================
 * ⚡ QUICK.JS - 四年級速成打字核心引擎與演算法工具庫
 * 🤖 AI 迭代維護指南：
 *    - 四年級速成輸入法為「取首碼與尾碼（2 碼）」
 *    - 本模組提供字根對照字典、Fisher-Yates 洗牌、段位評定與 Toast 提示
 * =========================================================================
 */

// 倉頡/速成 24 字母與特殊鍵碼對照字典
const CANGJIE_RADICAL_MAP = {
  '日': 'A', '月': 'B', '金': 'C', '木': 'D', '水': 'E', '火': 'F', '土': 'G',
  '竹': 'H', '戈': 'I', '十': 'J', '大': 'K', '中': 'L', '一': 'M', '弓': 'N',
  '人': 'O', '心': 'P', '手': 'Q', '口': 'R', '尸': 'S', '廿': 'T', '山': 'U',
  '女': 'V', '田': 'W', '卜': 'Y', '難': 'X', '重': 'X'
};

// 🛡️ 權威校本速成真值字碼對照表 (SSOT Overrides - 杜絕字庫錯位、首尾碼偏差與按鍵無反應)
const P4_MASTER_QUICK_OVERRIDES = {
  '庭': { char: '庭', codes: ['戈', '土'], keys: ['I', 'G'], first_code: '戈', last_code: '土', first_key: 'I', last_key: 'G', full: '戈土 (IG)', cj_full: '戈女弓土 (IVNG)', secret: '【庭】速成取碼：首碼【戈】(I) ＋ 尾碼【土】(G)' },
  '每': { char: '每', codes: ['人', '戈'], keys: ['O', 'I'], first_code: '人', last_code: '戈', first_key: 'O', last_key: 'I', full: '人戈 (OI)', cj_full: '人田卜戈 (OWYI)', secret: '【每】速成取碼：首碼【人】(O) ＋ 尾碼【戈】(I)' },
  '隨': { char: '隨', codes: ['弓', '月'], keys: ['N', 'B'], first_code: '弓', last_code: '月', first_key: 'N', last_key: 'B', full: '弓月 (NB)', cj_full: '弓難弓月 (NLNKB)', secret: '【隨】速成取碼：首碼【弓】(N) ＋ 尾碼【月】(B)' },
  '素': { char: '素', codes: ['手', '火'], keys: ['Q', 'F'], first_code: '手', last_code: '火', first_key: 'Q', last_key: 'F', full: '手火 (QF)', cj_full: '手一女戈火 (QMVIF)', secret: '【素】速成取碼：首碼【手】(Q) ＋ 尾碼【火】(F)' },
  '志': { char: '志', codes: ['土', '心'], keys: ['G', 'P'], first_code: '土', last_code: '心', first_key: 'G', last_key: 'P', full: '土心 (GP)', cj_full: '土心 (GP)', secret: '【志】速成取碼：首碼【土】(G) ＋ 尾碼【心】(P)' },
  '迷': { char: '迷', codes: ['卜', '木'], keys: ['Y', 'D'], first_code: '卜', last_code: '木', first_key: 'Y', last_key: 'D', full: '卜木 (YD)', cj_full: '卜火木 (YFD)', secret: '【迷】速成取碼：首碼【卜】(Y) ＋ 尾碼【木】(D)' },
  '雞': { char: '雞', codes: ['月', '土'], keys: ['B', 'G'], first_code: '月', last_code: '土', first_key: 'B', last_key: 'G', full: '月土 (BG)', cj_full: '月女人土 (BVIE)', secret: '【雞】速成取碼：首碼【月】(B) ＋ 尾碼【土】(G)' },
  '垂': { char: '垂', codes: ['竹', '一'], keys: ['H', 'M'], first_code: '竹', last_code: '一', first_key: 'H', last_key: 'M', full: '竹一 (HM)', cj_full: '竹十廿一 (HJTM)', secret: '【垂】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)' },
  '搜': { char: '搜', codes: ['手', '水'], keys: ['Q', 'E'], first_code: '手', last_code: '水', first_key: 'Q', last_key: 'E', full: '手水 (QE)', cj_full: '手竹難水 (QHXE)', secret: '【搜】速成取碼：首碼【手】(Q) ＋ 尾碼【水】(E)' },
  '卑': { char: '卑', codes: ['竹', '十'], keys: ['H', 'J'], first_code: '竹', last_code: '十', first_key: 'H', last_key: 'J', full: '竹十 (HJ)', cj_full: '竹十竹十 (HJHJ)', secret: '【卑】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)' },
  '機': { char: '機', codes: ['木', '戈'], keys: ['D', 'I'], first_code: '木', last_code: '戈', first_key: 'D', last_key: 'I', full: '木戈 (DI)', cj_full: '木女戈戈 (DVII)', secret: '【機】速成取碼：首碼【木】(D) ＋ 尾碼【戈】(I)' },
  '萬': { char: '萬', codes: ['廿', '月'], keys: ['T', 'B'], first_code: '廿', last_code: '月', first_key: 'T', last_key: 'B', full: '廿月 (TB)', cj_full: '廿田中月 (TWLB)', secret: '【萬】速成取碼：首碼【廿】(T) ＋ 尾碼【月】(B)' },
  '丈': { char: '丈', codes: ['十', '大'], keys: ['J', 'K'], first_code: '十', last_code: '大', first_key: 'J', last_key: 'K', full: '十大 (JK)', cj_full: '十日水 (JAE)', secret: '【丈】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)' },
  '插': { char: '插', codes: ['手', '難'], keys: ['Q', 'X'], first_code: '手', last_code: '難', first_key: 'Q', last_key: 'X', full: '手難 (QX)', cj_full: '手竹十難 (QHJX)', secret: '【插】速成取碼：首碼【手】(Q) ＋ 尾碼【難】(X)' },
  '鹿': { char: '鹿', codes: ['戈', '心'], keys: ['I', 'P'], first_code: '戈', last_code: '心', first_key: 'I', last_key: 'P', full: '戈心 (IP)', cj_full: '戈難難心 (IXXP)', secret: '【鹿】速成取碼：首碼【戈】(I) ＋ 尾碼【心】(P)' },
  '跳': { char: '跳', codes: ['口', '人'], keys: ['R', 'O'], first_code: '口', last_code: '人', first_key: 'R', last_key: 'O', full: '口人 (RO)', cj_full: '口一卜人 (RMYMO)', secret: '【跳】速成取碼：首碼【口】(R) ＋ 尾碼【人】(O)' },
  '條': { char: '條', codes: ['人', '木'], keys: ['O', 'D'], first_code: '人', last_code: '木', first_key: 'O', last_key: 'D', full: '人木 (OD)', cj_full: '人中人木 (OLOD)', secret: '【條】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)' },
  '互': { char: '互', codes: ['一', '一'], keys: ['M', 'M'], first_code: '一', last_code: '一', first_key: 'M', last_key: 'M', full: '一一 (MM)', cj_full: '一女一 (MVM)', secret: '【互】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)' },
  '總': { char: '總', codes: ['女', '心'], keys: ['V', 'P'], first_code: '女', last_code: '心', first_key: 'V', last_key: 'P', full: '女心 (VP)', cj_full: '女火竹田心 (VFHWP)', secret: '【總】速成取碼：首碼【女】(V) ＋ 尾碼【心】(P)' },
  '決': { char: '決', codes: ['水', '大'], keys: ['E', 'K'], first_code: '水', last_code: '大', first_key: 'E', last_key: 'K', full: '水大 (EK)', cj_full: '水木大 (EDK)', secret: '【決】速成取碼：首碼【水】(E) ＋ 尾碼【大】(K)' }
};


/**
 * 🎲 Fisher-Yates (Knuth) 標準隨機洗牌演算法 (均勻無偏差)
 */
function fisherYatesShuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

/**
 * 自動由字根推導速成按鍵
 */
function autoDeriveWordKeys(item) {
  if (!item) return item;
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
  if (item.codes && Array.isArray(item.codes)) {
    item.keys = item.codes.map(c => CANGJIE_RADICAL_MAP[c] || 'X');
    item.full = item.codes.join('') + ' (' + item.keys.join('') + ')';
    if (!item.secret || item.secret.startsWith(item.char + '：')) {
      item.secret = item.char + '：' + item.full;
    }
  }
  return item;
}

/**
 * 評定目前總分所對應的訓練家境界與解鎖技能清單
 */
function evalTierAndSkills(score) {
  let currentTier = TIERS[0];
  let nextTier = TIERS[1];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].min) {
      currentTier = TIERS[i];
      nextTier = TIERS[i + 1] || null;
      break;
    }
  }
  const unlockedSkills = SKILLS.filter(s => score >= s.reqPts);
  return { currentTier, nextTier, unlockedSkills };
}

/**
 * 手速賽秒數段位評定
 */
function getSpeedTier(sec, wordCount) {
  const multiplier = (wordCount === 20) ? 2.0 : 1.0;
  if (sec <= 12.0 * multiplier) return '⚡ 神速天王';
  if (sec <= 16.0 * multiplier) return '👑 鍵盤宗師';
  if (sec <= 22.0 * multiplier) return '🔥 疾風射手';
  if (sec <= 30.0 * multiplier) return '💎 靈動遊俠';
  if (sec <= 42.0 * multiplier) return '🥇 穩健獵人';
  if (sec <= 60.0 * multiplier) return '🥈 見習學徒';
  return '🥉 新手訓練家';
}

/**
 * 懸浮提示框 (Toast)
 */
function showPassToast(msg) {
  try {
    let t = document.getElementById('pass-toast-banner');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pass-toast-banner';
      t.style.cssText = 'position:fixed; bottom:28px; left:50%; transform:translateX(-50%); background:#0F172A; color:#F8FAFC; border:1.5px solid #38BDF8; padding:10px 22px; border-radius:30px; font-weight:800; font-size:13.5px; z-index:999999; box-shadow:0 6px 18px rgba(0,0,0,0.3); transition:all 0.25s ease; opacity:0; pointer-events:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    if (window._passToastTimer) clearTimeout(window._passToastTimer);
    window._passToastTimer = setTimeout(() => {
      if (t) {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(10px)';
      }
    }, 2200);
  } catch(e) {
    console.log('[Toast]', msg);
  }
}
if (typeof window !== 'undefined') {
  window.evalTierAndSkills = evalTierAndSkills;
  window.fisherYatesShuffle = fisherYatesShuffle;
  window.autoDeriveWordKeys = autoDeriveWordKeys;
  window.getSpeedTier = getSpeedTier;
  window.showPassToast = showPassToast;
  window.CANGJIE_RADICAL_MAP = CANGJIE_RADICAL_MAP;
  window.P4_MASTER_QUICK_OVERRIDES = P4_MASTER_QUICK_OVERRIDES;
}
if (typeof global !== 'undefined') {
  global.evalTierAndSkills = evalTierAndSkills;
  global.fisherYatesShuffle = fisherYatesShuffle;
  global.autoDeriveWordKeys = autoDeriveWordKeys;
  global.getSpeedTier = getSpeedTier;
  global.showPassToast = showPassToast;
  global.CANGJIE_RADICAL_MAP = CANGJIE_RADICAL_MAP;
  global.P4_MASTER_QUICK_OVERRIDES = P4_MASTER_QUICK_OVERRIDES;
}
