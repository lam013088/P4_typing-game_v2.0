/**
 * =========================================================================
 * ⚙️ CONFIG.JS - 四年級速成打字系統全域設定、雙後端端點與段位常數
 * 🤖 雙微服務端點已直接配置 (免手動填寫)：
 *    - GAS_WEBHOOK_URL：四年級速成打字成績後端 Webhook
 *    - WORD_BANK_URL：四年級字庫微服務唯讀端點
 * =========================================================================
 */

window.CONFIG = window.CONFIG || {};

// 🌐 官方正式 Google Apps Script 雲端 Webhook 後端部署網址 (已直接填寫生效)
window.CONFIG.GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzUl9bQUhe7qmeKB6AjBiGxEIJfyOZg6kqHe7uC2xQ7QXH0SH_8P9-HpsMYSPkuzrNFmQ/exec';

// 🌐 雙後端微服務：字庫微服務專屬端點 (對應《2026_四年級每周打字字庫表》Apps Script 部署網址)
window.CONFIG.WORD_BANK_URL = 'https://script.google.com/macros/s/AKfycbzwzqjmrXsKl-jzZnWDPeK-81XWwfYZ-hBd2nd3j0m3Hqpfw7SNd5Mchj-LTXSt7ppB/exec';

// 🔒 個人私隱安全模式 (GitHub 公開版預設開啟)
window.CONFIG.GITHUB_PRIVACY_MODE = true;

// 🏷️ 系統版本號
window.CONFIG.VERSION = '2026.10.26-p4-v3.0';

var CONFIG = window.CONFIG;

// 🌟 段位稱號門檻對照表 (0 ~ 100,000分以上，共 14 大段位)
window.TIERS = window.TIERS || [
  { min: 0,      title: "新手訓練家", badge: "🥉", color: "#B45309", bg: "#FEF3C7" },
  { min: 50,     title: "見習訓練家", badge: "🥈", color: "#475569", bg: "#F1F5F9" },
  { min: 150,    title: "原野遊俠",   badge: "🥇", color: "#1D4ED8", bg: "#EFF6FF" },
  { min: 300,    title: "道館館主",   badge: "⚡", color: "#7C3AED", bg: "#F5F3FF" },
  { min: 600,    title: "四大天王",   badge: "🔥", color: "#C2410C", bg: "#FFF7ED" },
  { min: 1200,   title: "聯盟冠軍",   badge: "🏆", color: "#B91C1C", bg: "#FEF2F2" },
  { min: 2500,   title: "傳奇大師",   badge: "👑", color: "#047857", bg: "#ECFDF5" },
  { min: 5000,   title: "神域至尊",   badge: "🌌", color: "#4C1D95", bg: "#F3E8FF" },
  { min: 10000,  title: "極巨霸主",   badge: "🌠", color: "#9333EA", bg: "#FAF5FF" },
  { min: 20000,  title: "幻境領主",   badge: "🔮", color: "#BE185D", bg: "#FDF2F8" },
  { min: 35000,  title: "時空天尊",   badge: "🌀", color: "#0E7490", bg: "#ECFEFF" },
  { min: 50000,  title: "原始尊者",   badge: "💫", color: "#D97706", bg: "#FFFBEB" },
  { min: 75000,  title: "星穹聖皇",   badge: "🪐", color: "#4338CA", bg: "#EEF2FF" },
  { min: 100000, title: "創世神皇",   badge: "🔱", color: "#E11D48", bg: "#FFF1F2" }
];
var TIERS = window.TIERS;

// ⚔️ 11大解鎖技能樹 (覆蓋 0 ~ 100,000 分，適量增益兼顧平衡)
window.SKILLS = window.SKILLS || [
  { id: "focus",    name: "精準直覺", desc: "戰鬥開局 25% 概率感應正確精靈球，令其發出神聖光暈！", reqPts: 200,    rate: 0.25 },
  { id: "shield",   name: "聖盾防護", desc: "捕捉錯誤時 35% 概率格擋失誤，保留當前連擊！", reqPts: 450,    rate: 0.35 },
  { id: "crit",     name: "烈焰爆擊", desc: "成功通關時 30% 概率觸發爆擊，額外獲得 +5 點傷害分！", reqPts: 800,    rate: 0.30 },
  { id: "chain",    name: "極限連擊", desc: "連擊達 2 Hit 以上時，每次命中額外獎勵 +3 點連擊分！", reqPts: 1500,   rate: 0.45 },
  { id: "divine",   name: "神域天罰", desc: "擊破魔王時 20% 概率降下九天神雷，額外獎勵 +6 點天罰分！", reqPts: 3000,   rate: 0.20 },
  { id: "aura",     name: "波導感知", desc: "連擊達 3 Hit 以上時，25% 概率觸發波導同頻，額外獎勵 +2 分！", reqPts: 6000,   rate: 0.25 },
  { id: "dynamax",  name: "極巨衝能", desc: "擊破魔王時 20% 概率發動極巨衝能，額外獲得 +4 點極巨分！", reqPts: 12000,  rate: 0.20 },
  { id: "timeward", name: "時空結界", desc: "捕捉失誤時 30% 概率展開時空結界，化解失誤並守住連擊！", reqPts: 25000,  rate: 0.30 },
  { id: "swift",    name: "疾風迅雷", desc: "極速答題通關時，25% 概率觸發神速疾風，額外獎勵 +3 點迅捷分！", reqPts: 45000,  rate: 0.25 },
  { id: "starlight",name: "星輝庇佑", desc: "連擊達 4 Hit 以上時，25% 概率降下星輝庇護，額外獲得 +4 分！", reqPts: 70000,  rate: 0.25 },
  { id: "genesis",  name: "創世審判", desc: "十萬神皇終極神技！通關時 15% 概率降下創世神光，額外榮獲 +6 分！", reqPts: 100000, rate: 0.15 }
];
var SKILLS = window.SKILLS;

// 📅 每周排程時間表 (2026/2027學年全學年第2至40周；第9周為校運會免功課，直接跳過並啟用第10周字庫)
window.SPEED_WEEK_SCHEDULES = [
  { week: 'w2',  name: '第 2 周', weekName: '第2周', title: '【第 2 周】速成首尾與字根特訓 (9/7 - 9/13)', start: new Date('2026-09-07T00:00:00+08:00'), end: new Date('2026-09-13T23:59:59+08:00') },
  { week: 'w3',  name: '第 3 周', weekName: '第3周', title: '【第 3 周】高頻易錯字速成攻防 (9/14 - 9/20)', start: new Date('2026-09-14T00:00:00+08:00'), end: new Date('2026-09-20T23:59:59+08:00') },
  { week: 'w4',  name: '第 4 周', weekName: '第4周', title: '【第 4 周】期初實力排位激戰 (9/21 - 10/04，第4/5周合拼)', start: new Date('2026-09-21T00:00:00+08:00'), end: new Date('2026-10-04T23:59:59+08:00') },
  { week: 'w6',  name: '第 6 周', weekName: '第6周', title: '【第 6 周】手速極限突破爭霸 (10/5 - 10/11)', start: new Date('2026-10-05T00:00:00+08:00'), end: new Date('2026-10-11T23:59:59+08:00') },
  { week: 'w7',  name: '第 7 周', weekName: '第7周', title: '【第 7 周】速成全級競速爭霸 (10/12 - 10/19)', start: new Date('2026-10-12T00:00:00+08:00'), end: new Date('2026-10-19T23:59:59+08:00') },
  { week: 'w8',  name: '第 8 周', weekName: '第8周', title: '【第 8 周】速成核心字根強化 (10/20 - 10/25)', start: new Date('2026-10-20T08:00:00+08:00'), end: new Date('2026-10-25T23:30:00+08:00') },
  // 🏃‍♂️ 第 9 周適逢校運會不佈置打字功課，直接忽略第 9 周並提前啟用第 10 周字庫 (10/26 - 11/08)
  { week: 'w10', name: '第 10 周', weekName: '第10周', title: '🔥【第 10 周】速成手速挑戰賽 (10/26 - 11/08 校運會跨周開放)', dateRange: '26/10/2026 8:00 AM - 08/11/2026 11:30 PM', start: new Date('2026-10-20T08:00:00+08:00'), end: new Date('2026-11-08T23:59:59+08:00') }
];
var SPEED_WEEK_SCHEDULES = window.SPEED_WEEK_SCHEDULES;
