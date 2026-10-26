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
  "枝": {
    "char": "枝",
    "codes": [
      "木",
      "水"
    ],
    "keys": [
      "D",
      "E"
    ],
    "first_code": "木",
    "last_code": "水",
    "first_key": "D",
    "last_key": "E",
    "full": "木水 (DE)",
    "cj_full": "木十水 (DJE)",
    "secret": "【枝】速成取碼：首碼【木】(D) ＋ 尾碼【水】(E)",
    "quickCode": "DE"
  },
  "晶": {
    "char": "晶",
    "codes": [
      "日",
      "日"
    ],
    "keys": [
      "A",
      "A"
    ],
    "first_code": "日",
    "last_code": "日",
    "first_key": "A",
    "last_key": "A",
    "full": "日日 (AA)",
    "cj_full": "日日日 (AAA)",
    "secret": "【晶】速成取碼：首碼【日】(A) ＋ 尾碼【日】(A)",
    "quickCode": "AA"
  },
  "暗": {
    "char": "暗",
    "codes": [
      "日",
      "日"
    ],
    "keys": [
      "A",
      "A"
    ],
    "first_code": "日",
    "last_code": "日",
    "first_key": "A",
    "last_key": "A",
    "full": "日日 (AA)",
    "cj_full": "日卜廿日 (AYTA)",
    "secret": "【暗】速成取碼：首碼【日】(A) ＋ 尾碼【日】(A)",
    "quickCode": "AA"
  },
  "最": {
    "char": "最",
    "codes": [
      "日",
      "水"
    ],
    "keys": [
      "A",
      "E"
    ],
    "first_code": "日",
    "last_code": "水",
    "first_key": "A",
    "last_key": "E",
    "full": "日水 (AE)",
    "cj_full": "日尸十水 (ASJE)",
    "secret": "【最】速成取碼：首碼【日】(A) ＋ 尾碼【水】(E)",
    "quickCode": "AE"
  },
  "深": {
    "char": "深",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水月金木 (EBCD)",
    "secret": "【深】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "殼": {
    "char": "殼",
    "codes": [
      "土",
      "水"
    ],
    "keys": [
      "G",
      "E"
    ],
    "first_code": "土",
    "last_code": "水",
    "first_key": "G",
    "last_key": "E",
    "full": "土水 (GE)",
    "cj_full": "土弓竹弓水 (GNHNE)",
    "secret": "【殼】速成取碼：首碼【土】(G) ＋ 尾碼【水】(E)",
    "quickCode": "GE"
  },
  "間": {
    "char": "間",
    "codes": [
      "日",
      "日"
    ],
    "keys": [
      "A",
      "A"
    ],
    "first_code": "日",
    "last_code": "日",
    "first_key": "A",
    "last_key": "A",
    "full": "日日 (AA)",
    "cj_full": "日弓日 (ANA)",
    "secret": "【間】速成取碼：首碼【日】(A) ＋ 尾碼【日】(A)",
    "quickCode": "AA"
  },
  "榮": {
    "char": "榮",
    "codes": [
      "火",
      "木"
    ],
    "keys": [
      "F",
      "D"
    ],
    "first_code": "火",
    "last_code": "木",
    "first_key": "F",
    "last_key": "D",
    "full": "火木 (FD)",
    "cj_full": "火火月木 (FFBD)",
    "secret": "【榮】速成取碼：首碼【火】(F) ＋ 尾碼【木】(D)",
    "quickCode": "FD"
  },
  "赤": {
    "char": "赤",
    "codes": [
      "土",
      "金"
    ],
    "keys": [
      "G",
      "C"
    ],
    "first_code": "土",
    "last_code": "金",
    "first_key": "G",
    "last_key": "C",
    "full": "土金 (GC)",
    "cj_full": "土竹弓金 (GHNC)",
    "secret": "【赤】速成取碼：首碼【土】(G) ＋ 尾碼【金】(C)",
    "quickCode": "GC"
  },
  "景": {
    "char": "景",
    "codes": [
      "日",
      "火"
    ],
    "keys": [
      "A",
      "F"
    ],
    "first_code": "日",
    "last_code": "火",
    "first_key": "A",
    "last_key": "F",
    "full": "日火 (AF)",
    "cj_full": "日卜口火 (AYRF)",
    "secret": "【景】速成取碼：首碼【日】(A) ＋ 尾碼【火】(F)",
    "quickCode": "AF"
  },
  "照": {
    "char": "照",
    "codes": [
      "日",
      "火"
    ],
    "keys": [
      "A",
      "F"
    ],
    "first_code": "日",
    "last_code": "火",
    "first_key": "A",
    "last_key": "F",
    "full": "日火 (AF)",
    "cj_full": "日口火 (ARF)",
    "secret": "【照】速成取碼：首碼【日】(A) ＋ 尾碼【火】(F)",
    "quickCode": "AF"
  },
  "然": {
    "char": "然",
    "codes": [
      "月",
      "火"
    ],
    "keys": [
      "B",
      "F"
    ],
    "first_code": "月",
    "last_code": "火",
    "first_key": "B",
    "last_key": "F",
    "full": "月火 (BF)",
    "cj_full": "月大火 (BKF)",
    "secret": "【然】速成取碼：首碼【月】(B) ＋ 尾碼【火】(F)",
    "quickCode": "BF"
  },
  "增": {
    "char": "增",
    "codes": [
      "土",
      "日"
    ],
    "keys": [
      "G",
      "A"
    ],
    "first_code": "土",
    "last_code": "日",
    "first_key": "G",
    "last_key": "A",
    "full": "土日 (GA)",
    "cj_full": "土金田日 (GCWA)",
    "secret": "【增】速成取碼：首碼【土】(G) ＋ 尾碼【日】(A)",
    "quickCode": "GA"
  },
  "沒": {
    "char": "沒",
    "codes": [
      "水",
      "水"
    ],
    "keys": [
      "E",
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水水 (EE)",
    "cj_full": "水弓水 (ENE)",
    "secret": "【沒】速成取碼：首碼【水】(E) ＋ 尾碼【水】(E)",
    "quickCode": "EE"
  },
  "受": {
    "char": "受",
    "codes": [
      "月",
      "水"
    ],
    "keys": [
      "B",
      "E"
    ],
    "first_code": "月",
    "last_code": "水",
    "first_key": "B",
    "last_key": "E",
    "full": "月水 (BE)",
    "cj_full": "月月水 (BBE)",
    "secret": "【受】速成取碼：首碼【月】(B) ＋ 尾碼【水】(E)",
    "quickCode": "BE"
  },
  "愛": {
    "char": "愛",
    "codes": [
      "月",
      "水"
    ],
    "keys": [
      "B",
      "E"
    ],
    "first_code": "月",
    "last_code": "水",
    "first_key": "B",
    "last_key": "E",
    "full": "月水 (BE)",
    "cj_full": "月月心水 (BBPE)",
    "secret": "【愛】速成取碼：首碼【月】(B) ＋ 尾碼【水】(E)",
    "quickCode": "BE"
  },
  "坡": {
    "char": "坡",
    "codes": [
      "土",
      "水"
    ],
    "keys": [
      "G",
      "E"
    ],
    "first_code": "土",
    "last_code": "水",
    "first_key": "G",
    "last_key": "E",
    "full": "土水 (GE)",
    "cj_full": "土木竹水 (GDHE)",
    "secret": "【坡】速成取碼：首碼【土】(G) ＋ 尾碼【水】(E)",
    "quickCode": "GE"
  },
  "肚": {
    "char": "肚",
    "codes": [
      "月",
      "土"
    ],
    "keys": [
      "B",
      "G"
    ],
    "first_code": "月",
    "last_code": "土",
    "first_key": "B",
    "last_key": "G",
    "full": "月土 (BG)",
    "cj_full": "月土 (BG)",
    "secret": "【肚】速成取碼：首碼【月】(B) ＋ 尾碼【土】(G)",
    "quickCode": "BG"
  },
  "晴": {
    "char": "晴",
    "codes": [
      "日",
      "月"
    ],
    "keys": [
      "A",
      "B"
    ],
    "first_code": "日",
    "last_code": "月",
    "first_key": "A",
    "last_key": "B",
    "full": "日月 (AB)",
    "cj_full": "日手一月 (AQMB)",
    "secret": "【晴】速成取碼：首碼【日】(A) ＋ 尾碼【月】(B)",
    "quickCode": "AB"
  },
  "汪": {
    "char": "汪",
    "codes": [
      "水",
      "土"
    ],
    "keys": [
      "E",
      "G"
    ],
    "first_code": "水",
    "last_code": "土",
    "first_key": "E",
    "last_key": "G",
    "full": "水土 (EG)",
    "cj_full": "水一土 (EMG)",
    "secret": "【汪】速成取碼：首碼【水】(E) ＋ 尾碼【土】(G)",
    "quickCode": "EG"
  },
  "漂": {
    "char": "漂",
    "codes": [
      "水",
      "火"
    ],
    "keys": [
      "E",
      "F"
    ],
    "first_code": "水",
    "last_code": "火",
    "first_key": "E",
    "last_key": "F",
    "full": "水火 (EF)",
    "cj_full": "水一田火 (EMWF)",
    "secret": "【漂】速成取碼：首碼【水】(E) ＋ 尾碼【火】(F)",
    "quickCode": "EF"
  },
  "橫": {
    "char": "橫",
    "codes": [
      "木",
      "金"
    ],
    "keys": [
      "D",
      "C"
    ],
    "first_code": "木",
    "last_code": "金",
    "first_key": "D",
    "last_key": "C",
    "full": "木金 (DC)",
    "cj_full": "木廿一金 (DTMC)",
    "secret": "【橫】速成取碼：首碼【木】(D) ＋ 尾碼【金】(C)",
    "quickCode": "DC"
  },
  "淨": {
    "char": "淨",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水月尸木 (EBSD)",
    "secret": "【淨】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "具": {
    "char": "具",
    "codes": [
      "月",
      "金"
    ],
    "keys": [
      "B",
      "C"
    ],
    "first_code": "月",
    "last_code": "金",
    "first_key": "B",
    "last_key": "C",
    "full": "月金 (BC)",
    "cj_full": "月一一金 (BMMC)",
    "secret": "【具】速成取碼：首碼【月】(B) ＋ 尾碼【金】(C)",
    "quickCode": "BC"
  },
  "消": {
    "char": "消",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水火月 (EFB)",
    "secret": "【消】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "精": {
    "char": "精",
    "codes": [
      "火",
      "月"
    ],
    "keys": [
      "F",
      "B"
    ],
    "first_code": "火",
    "last_code": "月",
    "first_key": "F",
    "last_key": "B",
    "full": "火月 (FB)",
    "cj_full": "火木手一月 (FDQMB)",
    "secret": "【精】速成取碼：首碼【火】(F) ＋ 尾碼【月】(B)",
    "quickCode": "FB"
  },
  "鯊": {
    "char": "鯊",
    "codes": [
      "水",
      "火"
    ],
    "keys": [
      "E",
      "F"
    ],
    "first_code": "水",
    "last_code": "火",
    "first_key": "E",
    "last_key": "F",
    "full": "水火 (EF)",
    "cj_full": "水竹弓田火 (EHNWF)",
    "secret": "【鯊】速成取碼：首碼【水】(E) ＋ 尾碼【火】(F)",
    "quickCode": "EF"
  },
  "渡": {
    "char": "渡",
    "codes": [
      "水",
      "水"
    ],
    "keys": [
      "E",
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水水 (EE)",
    "cj_full": "水戈廿水 (EITE)",
    "secret": "【渡】速成取碼：首碼【水】(E) ＋ 尾碼【水】(E)",
    "quickCode": "EE"
  },
  "演": {
    "char": "演",
    "codes": [
      "水",
      "金"
    ],
    "keys": [
      "E",
      "C"
    ],
    "first_code": "水",
    "last_code": "金",
    "first_key": "E",
    "last_key": "C",
    "full": "水金 (EC)",
    "cj_full": "水十一金 (EJMC)",
    "secret": "【演】速成取碼：首碼【水】(E) ＋ 尾碼【金】(C)",
    "quickCode": "EC"
  },
  "湖": {
    "char": "湖",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水十口月 (EJRB)",
    "secret": "【湖】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "雞": {
    "char": "雞",
    "codes": [
      "月",
      "土"
    ],
    "keys": [
      "B",
      "G"
    ],
    "first_code": "月",
    "last_code": "土",
    "first_key": "B",
    "last_key": "G",
    "full": "月土 (BG)",
    "cj_full": "月大人土 (BKOG)",
    "secret": "【雞】速成取碼：首碼【月】(B) ＋ 尾碼【土】(G)",
    "quickCode": "BG"
  },
  "滑": {
    "char": "滑",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水月月月 (EBBB)",
    "secret": "【滑】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "骨": {
    "char": "骨",
    "codes": [
      "月",
      "月"
    ],
    "keys": [
      "B",
      "B"
    ],
    "first_code": "月",
    "last_code": "月",
    "first_key": "B",
    "last_key": "B",
    "full": "月月 (BB)",
    "cj_full": "月月月 (BBB)",
    "secret": "【骨】速成取碼：首碼【月】(B) ＋ 尾碼【月】(B)",
    "quickCode": "BB"
  },
  "柱": {
    "char": "柱",
    "codes": [
      "木",
      "土"
    ],
    "keys": [
      "D",
      "G"
    ],
    "first_code": "木",
    "last_code": "土",
    "first_key": "D",
    "last_key": "G",
    "full": "木土 (DG)",
    "cj_full": "木卜土 (DYG)",
    "secret": "【柱】速成取碼：首碼【木】(D) ＋ 尾碼【土】(G)",
    "quickCode": "DG"
  },
  "漁": {
    "char": "漁",
    "codes": [
      "水",
      "火"
    ],
    "keys": [
      "E",
      "F"
    ],
    "first_code": "水",
    "last_code": "火",
    "first_key": "E",
    "last_key": "F",
    "full": "水火 (EF)",
    "cj_full": "水弓田火 (ENWF)",
    "secret": "【漁】速成取碼：首碼【水】(E) ＋ 尾碼【火】(F)",
    "quickCode": "EF"
  },
  "池": {
    "char": "池",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水心木 (EPD)",
    "secret": "【池】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "淡": {
    "char": "淡",
    "codes": [
      "水",
      "火"
    ],
    "keys": [
      "E",
      "F"
    ],
    "first_code": "水",
    "last_code": "火",
    "first_key": "E",
    "last_key": "F",
    "full": "水火 (EF)",
    "cj_full": "水火火 (EFF)",
    "secret": "【淡】速成取碼：首碼【水】(E) ＋ 尾碼【火】(F)",
    "quickCode": "EF"
  },
  "潑": {
    "char": "潑",
    "codes": [
      "水",
      "水"
    ],
    "keys": [
      "E",
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水水 (EE)",
    "cj_full": "水弓人水 (ENOE)",
    "secret": "【潑】速成取碼：首碼【水】(E) ＋ 尾碼【水】(E)",
    "quickCode": "EE"
  },
  "澡": {
    "char": "澡",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水口口木 (ERRD)",
    "secret": "【澡】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "肖": {
    "char": "肖",
    "codes": [
      "火",
      "月"
    ],
    "keys": [
      "F",
      "B"
    ],
    "first_code": "火",
    "last_code": "月",
    "first_key": "F",
    "last_key": "B",
    "full": "火月 (FB)",
    "cj_full": "火月 (FB)",
    "secret": "【肖】速成取碼：首碼【火】(F) ＋ 尾碼【月】(B)",
    "quickCode": "FB"
  },
  "明": {
    "char": "明",
    "codes": [
      "日",
      "月"
    ],
    "keys": [
      "A",
      "B"
    ],
    "first_code": "日",
    "last_code": "月",
    "first_key": "A",
    "last_key": "B",
    "full": "日月 (AB)",
    "cj_full": "日月 (AB)",
    "secret": "【明】速成取碼：首碼【日】(A) ＋ 尾碼【月】(B)",
    "quickCode": "AB"
  },
  "祭": {
    "char": "祭",
    "codes": [
      "月",
      "火"
    ],
    "keys": [
      "B",
      "F"
    ],
    "first_code": "月",
    "last_code": "火",
    "first_key": "B",
    "last_key": "F",
    "full": "月火 (BF)",
    "cj_full": "月人一一火 (BOMMF)",
    "secret": "【祭】速成取碼：首碼【月】(B) ＋ 尾碼【火】(F)",
    "quickCode": "BF"
  },
  "林": {
    "char": "林",
    "codes": [
      "木",
      "木"
    ],
    "keys": [
      "D",
      "D"
    ],
    "first_code": "木",
    "last_code": "木",
    "first_key": "D",
    "last_key": "D",
    "full": "木木 (DD)",
    "cj_full": "木木 (DD)",
    "secret": "【林】速成取碼：首碼【木】(D) ＋ 尾碼【木】(D)",
    "quickCode": "DD"
  },
  "服": {
    "char": "服",
    "codes": [
      "月",
      "水"
    ],
    "keys": [
      "B",
      "E"
    ],
    "first_code": "月",
    "last_code": "水",
    "first_key": "B",
    "last_key": "E",
    "full": "月水 (BE)",
    "cj_full": "月尸中水 (BSLE)",
    "secret": "【服】速成取碼：首碼【月】(B) ＋ 尾碼【水】(E)",
    "quickCode": "BE"
  },
  "煙": {
    "char": "煙",
    "codes": [
      "火",
      "土"
    ],
    "keys": [
      "F",
      "G"
    ],
    "first_code": "火",
    "last_code": "土",
    "first_key": "F",
    "last_key": "G",
    "full": "火土 (FG)",
    "cj_full": "火一田土 (FMWG)",
    "secret": "【煙】速成取碼：首碼【火】(F) ＋ 尾碼【土】(G)",
    "quickCode": "FG"
  },
  "橋": {
    "char": "橋",
    "codes": [
      "木",
      "月"
    ],
    "keys": [
      "D",
      "B"
    ],
    "first_code": "木",
    "last_code": "月",
    "first_key": "D",
    "last_key": "B",
    "full": "木月 (DB)",
    "cj_full": "木竹大月 (DHKB)",
    "secret": "【橋】速成取碼：首碼【木】(D) ＋ 尾碼【月】(B)",
    "quickCode": "DB"
  },
  "曾": {
    "char": "曾",
    "codes": [
      "金",
      "日"
    ],
    "keys": [
      "C",
      "A"
    ],
    "first_code": "金",
    "last_code": "日",
    "first_key": "C",
    "last_key": "A",
    "full": "金日 (CA)",
    "cj_full": "金田日 (CWA)",
    "secret": "【曾】速成取碼：首碼【金】(C) ＋ 尾碼【日】(A)",
    "quickCode": "CA"
  },
  "鐘": {
    "char": "鐘",
    "codes": [
      "金",
      "土"
    ],
    "keys": [
      "C",
      "G"
    ],
    "first_code": "金",
    "last_code": "土",
    "first_key": "C",
    "last_key": "G",
    "full": "金土 (CG)",
    "cj_full": "金卜廿土 (CYTG)",
    "secret": "【鐘】速成取碼：首碼【金】(C) ＋ 尾碼【土】(G)",
    "quickCode": "CG"
  },
  "糕": {
    "char": "糕",
    "codes": [
      "火",
      "火"
    ],
    "keys": [
      "F",
      "F"
    ],
    "first_code": "火",
    "last_code": "火",
    "first_key": "F",
    "last_key": "F",
    "full": "火火 (FF)",
    "cj_full": "火木廿土火 (FDTGF)",
    "secret": "【糕】速成取碼：首碼【火】(F) ＋ 尾碼【火】(F)",
    "quickCode": "FF"
  },
  "杜": {
    "char": "杜",
    "codes": [
      "木",
      "土"
    ],
    "keys": [
      "D",
      "G"
    ],
    "first_code": "木",
    "last_code": "土",
    "first_key": "D",
    "last_key": "G",
    "full": "木土 (DG)",
    "cj_full": "木土 (DG)",
    "secret": "【杜】速成取碼：首碼【木】(D) ＋ 尾碼【土】(G)",
    "quickCode": "DG"
  },
  "清": {
    "char": "清",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水手一月 (EQMB)",
    "secret": "【清】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "量": {
    "char": "量",
    "codes": [
      "日",
      "土"
    ],
    "keys": [
      "A",
      "G"
    ],
    "first_code": "日",
    "last_code": "土",
    "first_key": "A",
    "last_key": "G",
    "full": "日土 (AG)",
    "cj_full": "日一田土 (AMWG)",
    "secret": "【量】速成取碼：首碼【日】(A) ＋ 尾碼【土】(G)",
    "quickCode": "AG"
  },
  "棉": {
    "char": "棉",
    "codes": [
      "木",
      "月"
    ],
    "keys": [
      "D",
      "B"
    ],
    "first_code": "木",
    "last_code": "月",
    "first_key": "D",
    "last_key": "B",
    "full": "木月 (DB)",
    "cj_full": "木竹日月 (DHAB)",
    "secret": "【棉】速成取碼：首碼【木】(D) ＋ 尾碼【月】(B)",
    "quickCode": "DB"
  },
  "樣": {
    "char": "樣",
    "codes": [
      "木",
      "人"
    ],
    "keys": [
      "D",
      "O"
    ],
    "first_code": "木",
    "last_code": "人",
    "first_key": "D",
    "last_key": "O",
    "full": "木人 (DO)",
    "cj_full": "木廿土人 (DTGO)",
    "secret": "【樣】速成取碼：首碼【木】(D) ＋ 尾碼【人】(O)",
    "quickCode": "DO"
  },
  "標": {
    "char": "標",
    "codes": [
      "木",
      "火"
    ],
    "keys": [
      "D",
      "F"
    ],
    "first_code": "木",
    "last_code": "火",
    "first_key": "D",
    "last_key": "F",
    "full": "木火 (DF)",
    "cj_full": "木一田火 (DMWF)",
    "secret": "【標】速成取碼：首碼【木】(D) ＋ 尾碼【火】(F)",
    "quickCode": "DF"
  },
  "爭": {
    "char": "爭",
    "codes": [
      "月",
      "木"
    ],
    "keys": [
      "B",
      "D"
    ],
    "first_code": "月",
    "last_code": "木",
    "first_key": "B",
    "last_key": "D",
    "full": "月木 (BD)",
    "cj_full": "月尸木 (BSD)",
    "secret": "【爭】速成取碼：首碼【月】(B) ＋ 尾碼【木】(D)",
    "quickCode": "BD"
  },
  "錄": {
    "char": "錄",
    "codes": [
      "金",
      "水"
    ],
    "keys": [
      "C",
      "E"
    ],
    "first_code": "金",
    "last_code": "水",
    "first_key": "C",
    "last_key": "E",
    "full": "金水 (CE)",
    "cj_full": "金女弓水 (CVNE)",
    "secret": "【錄】速成取碼：首碼【金】(C) ＋ 尾碼【水】(E)",
    "quickCode": "CE"
  },
  "森": {
    "char": "森",
    "codes": [
      "木",
      "木"
    ],
    "keys": [
      "D",
      "D"
    ],
    "first_code": "木",
    "last_code": "木",
    "first_key": "D",
    "last_key": "D",
    "full": "木木 (DD)",
    "cj_full": "木木木 (DDD)",
    "secret": "【森】速成取碼：首碼【木】(D) ＋ 尾碼【木】(D)",
    "quickCode": "DD"
  },
  "皮": {
    "char": "皮",
    "codes": [
      "木",
      "水"
    ],
    "keys": [
      "D",
      "E"
    ],
    "first_code": "木",
    "last_code": "水",
    "first_key": "D",
    "last_key": "E",
    "full": "木水 (DE)",
    "cj_full": "木竹水 (DHE)",
    "secret": "【皮】速成取碼：首碼【木】(D) ＋ 尾碼【水】(E)",
    "quickCode": "DE"
  },
  "李": {
    "char": "李",
    "codes": [
      "木",
      "木"
    ],
    "keys": [
      "D",
      "D"
    ],
    "first_code": "木",
    "last_code": "木",
    "first_key": "D",
    "last_key": "D",
    "full": "木木 (DD)",
    "cj_full": "木弓木 (DND)",
    "secret": "【李】速成取碼：首碼【木】(D) ＋ 尾碼【木】(D)",
    "quickCode": "DD"
  },
  "棵": {
    "char": "棵",
    "codes": [
      "木",
      "木"
    ],
    "keys": [
      "D",
      "D"
    ],
    "first_code": "木",
    "last_code": "木",
    "first_key": "D",
    "last_key": "D",
    "full": "木木 (DD)",
    "cj_full": "木田木 (DWD)",
    "secret": "【棵】速成取碼：首碼【木】(D) ＋ 尾碼【木】(D)",
    "quickCode": "DD"
  },
  "棋": {
    "char": "棋",
    "codes": [
      "木",
      "金"
    ],
    "keys": [
      "D",
      "C"
    ],
    "first_code": "木",
    "last_code": "金",
    "first_key": "D",
    "last_key": "C",
    "full": "木金 (DC)",
    "cj_full": "木廿一金 (DTMC)",
    "secret": "【棋】速成取碼：首碼【木】(D) ＋ 尾碼【金】(C)",
    "quickCode": "DC"
  },
  "柏": {
    "char": "柏",
    "codes": [
      "木",
      "日"
    ],
    "keys": [
      "D",
      "A"
    ],
    "first_code": "木",
    "last_code": "日",
    "first_key": "D",
    "last_key": "A",
    "full": "木日 (DA)",
    "cj_full": "木竹日 (DHA)",
    "secret": "【柏】速成取碼：首碼【木】(D) ＋ 尾碼【日】(A)",
    "quickCode": "DA"
  },
  "板": {
    "char": "板",
    "codes": [
      "木",
      "水"
    ],
    "keys": [
      "D",
      "E"
    ],
    "first_code": "木",
    "last_code": "水",
    "first_key": "D",
    "last_key": "E",
    "full": "木水 (DE)",
    "cj_full": "木竹水 (DHE)",
    "secret": "【板】速成取碼：首碼【木】(D) ＋ 尾碼【水】(E)",
    "quickCode": "DE"
  },
  "昌": {
    "char": "昌",
    "codes": [
      "日",
      "日"
    ],
    "keys": [
      "A",
      "A"
    ],
    "first_code": "日",
    "last_code": "日",
    "first_key": "A",
    "last_key": "A",
    "full": "日日 (AA)",
    "cj_full": "日日 (AA)",
    "secret": "【昌】速成取碼：首碼【日】(A) ＋ 尾碼【日】(A)",
    "quickCode": "AA"
  },
  "注": {
    "char": "注",
    "codes": [
      "水",
      "土"
    ],
    "keys": [
      "E",
      "G"
    ],
    "first_code": "水",
    "last_code": "土",
    "first_key": "E",
    "last_key": "G",
    "full": "水土 (EG)",
    "cj_full": "水卜土 (EYG)",
    "secret": "【注】速成取碼：首碼【水】(E) ＋ 尾碼【土】(G)",
    "quickCode": "EG"
  },
  "米": {
    "char": "米",
    "codes": [
      "火",
      "木"
    ],
    "keys": [
      "F",
      "D"
    ],
    "first_code": "火",
    "last_code": "木",
    "first_key": "F",
    "last_key": "D",
    "full": "火木 (FD)",
    "cj_full": "火木 (FD)",
    "secret": "【米】速成取碼：首碼【火】(F) ＋ 尾碼【木】(D)",
    "quickCode": "FD"
  },
  "埋": {
    "char": "埋",
    "codes": [
      "土",
      "土"
    ],
    "keys": [
      "G",
      "G"
    ],
    "first_code": "土",
    "last_code": "土",
    "first_key": "G",
    "last_key": "G",
    "full": "土土 (GG)",
    "cj_full": "土田土 (GWG)",
    "secret": "【埋】速成取碼：首碼【土】(G) ＋ 尾碼【土】(G)",
    "quickCode": "GG"
  },
  "堆": {
    "char": "堆",
    "codes": [
      "土",
      "土"
    ],
    "keys": [
      "G",
      "G"
    ],
    "first_code": "土",
    "last_code": "土",
    "first_key": "G",
    "last_key": "G",
    "full": "土土 (GG)",
    "cj_full": "土人土 (GOG)",
    "secret": "【堆】速成取碼：首碼【土】(G) ＋ 尾碼【土】(G)",
    "quickCode": "GG"
  },
  "鼓": {
    "char": "鼓",
    "codes": [
      "土",
      "水"
    ],
    "keys": [
      "G",
      "E"
    ],
    "first_code": "土",
    "last_code": "水",
    "first_key": "G",
    "last_key": "E",
    "full": "土水 (GE)",
    "cj_full": "土廿十水 (GTJE)",
    "secret": "【鼓】速成取碼：首碼【土】(G) ＋ 尾碼【水】(E)",
    "quickCode": "GE"
  },
  "蛋": {
    "char": "蛋",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓人中一戈 (NOLMI)",
    "secret": "【蛋】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "的": {
    "char": "的",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹日心戈 (HAPI)",
    "secret": "【的】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "更": {
    "char": "更",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一中田大 (MLWK)",
    "secret": "【更】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "正": {
    "char": "正",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一卜中一 (MYLM)",
    "secret": "【正】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "弱": {
    "char": "弱",
    "codes": [
      "弓",
      "一"
    ],
    "keys": [
      "N",
      "M"
    ],
    "first_code": "弓",
    "last_code": "一",
    "first_key": "N",
    "last_key": "M",
    "full": "弓一 (NM)",
    "cj_full": "弓一弓戈一 (NMNIM)",
    "secret": "【弱】速成取碼：首碼【弓】(N) ＋ 尾碼【一】(M)",
    "quickCode": "NM"
  },
  "利": {
    "char": "利",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹木中弓 (HDLN)",
    "secret": "【利】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "射": {
    "char": "射",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹竹木戈 (HHDI)",
    "secret": "【射】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "梨": {
    "char": "梨",
    "codes": [
      "竹",
      "木"
    ],
    "keys": [
      "H",
      "D"
    ],
    "first_code": "竹",
    "last_code": "木",
    "first_key": "H",
    "last_key": "D",
    "full": "竹木 (HD)",
    "cj_full": "竹弓木 (HND)",
    "secret": "【梨】速成取碼：首碼【竹】(H) ＋ 尾碼【木】(D)",
    "quickCode": "HD"
  },
  "予": {
    "char": "予",
    "codes": [
      "弓",
      "弓"
    ],
    "keys": [
      "N",
      "N"
    ],
    "first_code": "弓",
    "last_code": "弓",
    "first_key": "N",
    "last_key": "N",
    "full": "弓弓 (NN)",
    "cj_full": "弓戈弓弓 (NINN)",
    "secret": "【予】速成取碼：首碼【弓】(N) ＋ 尾碼【弓】(N)",
    "quickCode": "NN"
  },
  "多": {
    "char": "多",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓戈弓戈 (NINI)",
    "secret": "【多】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "卵": {
    "char": "卵",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹竹尸中戈 (HHSLI)",
    "secret": "【卵】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "卑": {
    "char": "卑",
    "codes": [
      "竹",
      "十"
    ],
    "keys": [
      "H",
      "J"
    ],
    "first_code": "竹",
    "last_code": "十",
    "first_key": "H",
    "last_key": "J",
    "full": "竹十 (HJ)",
    "cj_full": "竹竹十 (HHJ)",
    "secret": "【卑】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)",
    "quickCode": "HJ"
  },
  "天": {
    "char": "天",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一大 (MK)",
    "secret": "【天】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "丟": {
    "char": "丟",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一土戈 (MGI)",
    "secret": "【丟】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "鬼": {
    "char": "鬼",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹戈 (HI)",
    "secret": "【鬼】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "几": {
    "char": "几",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹弓 (HN)",
    "secret": "【几】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "事": {
    "char": "事",
    "codes": [
      "十",
      "弓"
    ],
    "keys": [
      "J",
      "N"
    ],
    "first_code": "十",
    "last_code": "弓",
    "first_key": "J",
    "last_key": "N",
    "full": "十弓 (JN)",
    "cj_full": "十中中弓 (JLLN)",
    "secret": "【事】速成取碼：首碼【十】(J) ＋ 尾碼【弓】(N)",
    "quickCode": "JN"
  },
  "陣": {
    "char": "陣",
    "codes": [
      "弓",
      "十"
    ],
    "keys": [
      "N",
      "J"
    ],
    "first_code": "弓",
    "last_code": "十",
    "first_key": "N",
    "last_key": "J",
    "full": "弓十 (NJ)",
    "cj_full": "弓中十田十 (NLJWJ)",
    "secret": "【陣】速成取碼：首碼【弓】(N) ＋ 尾碼【十】(J)",
    "quickCode": "NJ"
  },
  "箭": {
    "char": "箭",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹廿月弓 (HTBN)",
    "secret": "【箭】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "廠": {
    "char": "廠",
    "codes": [
      "戈",
      "大"
    ],
    "keys": [
      "I",
      "K"
    ],
    "first_code": "戈",
    "last_code": "大",
    "first_key": "I",
    "last_key": "K",
    "full": "戈大 (IK)",
    "cj_full": "戈火月大 (IFBK)",
    "secret": "【廠】速成取碼：首碼【戈】(I) ＋ 尾碼【大】(K)",
    "quickCode": "IK"
  },
  "郎": {
    "char": "郎",
    "codes": [
      "戈",
      "中"
    ],
    "keys": [
      "I",
      "L"
    ],
    "first_code": "戈",
    "last_code": "中",
    "first_key": "I",
    "last_key": "L",
    "full": "戈中 (IL)",
    "cj_full": "戈戈弓中 (IINL)",
    "secret": "【郎】速成取碼：首碼【戈】(I) ＋ 尾碼【中】(L)",
    "quickCode": "IL"
  },
  "等": {
    "char": "等",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹土木戈 (HGDI)",
    "secret": "【等】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "甜": {
    "char": "甜",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹口廿一 (HRTM)",
    "secret": "【甜】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "五": {
    "char": "五",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一木一 (MDM)",
    "secret": "【五】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "琴": {
    "char": "琴",
    "codes": [
      "一",
      "弓"
    ],
    "keys": [
      "M",
      "N"
    ],
    "first_code": "一",
    "last_code": "弓",
    "first_key": "M",
    "last_key": "N",
    "full": "一弓 (MN)",
    "cj_full": "一土人一弓 (MGOMN)",
    "secret": "【琴】速成取碼：首碼【一】(M) ＋ 尾碼【弓】(N)",
    "quickCode": "MN"
  },
  "序": {
    "char": "序",
    "codes": [
      "戈",
      "弓"
    ],
    "keys": [
      "I",
      "N"
    ],
    "first_code": "戈",
    "last_code": "弓",
    "first_key": "I",
    "last_key": "N",
    "full": "戈弓 (IN)",
    "cj_full": "戈弓戈弓 (ININ)",
    "secret": "【序】速成取碼：首碼【戈】(I) ＋ 尾碼【弓】(N)",
    "quickCode": "IN"
  },
  "斬": {
    "char": "斬",
    "codes": [
      "十",
      "中"
    ],
    "keys": [
      "J",
      "L"
    ],
    "first_code": "十",
    "last_code": "中",
    "first_key": "J",
    "last_key": "L",
    "full": "十中 (JL)",
    "cj_full": "十十竹一中 (JJHML)",
    "secret": "【斬】速成取碼：首碼【十】(J) ＋ 尾碼【中】(L)",
    "quickCode": "JL"
  },
  "幹": {
    "char": "幹",
    "codes": [
      "十",
      "十"
    ],
    "keys": [
      "J",
      "J"
    ],
    "first_code": "十",
    "last_code": "十",
    "first_key": "J",
    "last_key": "J",
    "full": "十十 (JJ)",
    "cj_full": "十十人一十 (JJOMJ)",
    "secret": "【幹】速成取碼：首碼【十】(J) ＋ 尾碼【十】(J)",
    "quickCode": "JJ"
  },
  "教": {
    "char": "教",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十木人大 (JDOK)",
    "secret": "【教】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "乾": {
    "char": "乾",
    "codes": [
      "十",
      "弓"
    ],
    "keys": [
      "J",
      "N"
    ],
    "first_code": "十",
    "last_code": "弓",
    "first_key": "J",
    "last_key": "N",
    "full": "十弓 (JN)",
    "cj_full": "十十人弓 (JJON)",
    "secret": "【乾】速成取碼：首碼【十】(J) ＋ 尾碼【弓】(N)",
    "quickCode": "JN"
  },
  "宜": {
    "char": "宜",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十月一 (JBM)",
    "secret": "【宜】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "兔": {
    "char": "兔",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓山戈 (NUI)",
    "secret": "【兔】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "都": {
    "char": "都",
    "codes": [
      "十",
      "中"
    ],
    "keys": [
      "J",
      "L"
    ],
    "first_code": "十",
    "last_code": "中",
    "first_key": "J",
    "last_key": "L",
    "full": "十中 (JL)",
    "cj_full": "十日弓中 (JANL)",
    "secret": "【都】速成取碼：首碼【十】(J) ＋ 尾碼【中】(L)",
    "quickCode": "JL"
  },
  "了": {
    "char": "了",
    "codes": [
      "弓",
      "弓"
    ],
    "keys": [
      "N",
      "N"
    ],
    "first_code": "弓",
    "last_code": "弓",
    "first_key": "N",
    "last_key": "N",
    "full": "弓弓 (NN)",
    "cj_full": "弓弓 (NN)",
    "secret": "【了】速成取碼：首碼【弓】(N) ＋ 尾碼【弓】(N)",
    "quickCode": "NN"
  },
  "究": {
    "char": "究",
    "codes": [
      "十",
      "弓"
    ],
    "keys": [
      "J",
      "N"
    ],
    "first_code": "十",
    "last_code": "弓",
    "first_key": "J",
    "last_key": "N",
    "full": "十弓 (JN)",
    "cj_full": "十金大弓 (JCKN)",
    "secret": "【究】速成取碼：首碼【十】(J) ＋ 尾碼【弓】(N)",
    "quickCode": "JN"
  },
  "夕": {
    "char": "夕",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓戈 (NI)",
    "secret": "【夕】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "空": {
    "char": "空",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十金一 (JCM)",
    "secret": "【空】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "專": {
    "char": "專",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十戈木戈 (JIDI)",
    "secret": "【專】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "硬": {
    "char": "硬",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一口一中大 (MRMLK)",
    "secret": "【硬】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "鼻": {
    "char": "鼻",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹山田一中 (HUWML)",
    "secret": "【鼻】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "九": {
    "char": "九",
    "codes": [
      "大",
      "弓"
    ],
    "keys": [
      "K",
      "N"
    ],
    "first_code": "大",
    "last_code": "弓",
    "first_key": "K",
    "last_key": "N",
    "full": "大弓 (KN)",
    "cj_full": "大弓 (KN)",
    "secret": "【九】速成取碼：首碼【大】(K) ＋ 尾碼【弓】(N)",
    "quickCode": "KN"
  },
  "左": {
    "char": "左",
    "codes": [
      "大",
      "一"
    ],
    "keys": [
      "K",
      "M"
    ],
    "first_code": "大",
    "last_code": "一",
    "first_key": "K",
    "last_key": "M",
    "full": "大一 (KM)",
    "cj_full": "大一 (KM)",
    "secret": "【左】速成取碼：首碼【大】(K) ＋ 尾碼【一】(M)",
    "quickCode": "KM"
  },
  "南": {
    "char": "南",
    "codes": [
      "十",
      "十"
    ],
    "keys": [
      "J",
      "J"
    ],
    "first_code": "十",
    "last_code": "十",
    "first_key": "J",
    "last_key": "J",
    "full": "十十 (JJ)",
    "cj_full": "十月廿十 (JBTJ)",
    "secret": "【南】速成取碼：首碼【十】(J) ＋ 尾碼【十】(J)",
    "quickCode": "JJ"
  },
  "雪": {
    "char": "雪",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一月尸一 (MBSM)",
    "secret": "【雪】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "我": {
    "char": "我",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹手戈 (HQI)",
    "secret": "【我】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "歷": {
    "char": "歷",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一竹木一 (MHDM)",
    "secret": "【歷】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "雲": {
    "char": "雲",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一月一一戈 (MBMMI)",
    "secret": "【雲】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "到": {
    "char": "到",
    "codes": [
      "一",
      "弓"
    ],
    "keys": [
      "M",
      "N"
    ],
    "first_code": "一",
    "last_code": "弓",
    "first_key": "M",
    "last_key": "N",
    "full": "一弓 (MN)",
    "cj_full": "一土中弓 (MGLN)",
    "secret": "【到】速成取碼：首碼【一】(M) ＋ 尾碼【弓】(N)",
    "quickCode": "MN"
  },
  "玉": {
    "char": "玉",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一土戈 (MGI)",
    "secret": "【玉】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "平": {
    "char": "平",
    "codes": [
      "一",
      "十"
    ],
    "keys": [
      "M",
      "J"
    ],
    "first_code": "一",
    "last_code": "十",
    "first_key": "M",
    "last_key": "J",
    "full": "一十 (MJ)",
    "cj_full": "一火十 (MFJ)",
    "secret": "【平】速成取碼：首碼【一】(M) ＋ 尾碼【十】(J)",
    "quickCode": "MJ"
  },
  "臭": {
    "char": "臭",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹山戈大 (HUIK)",
    "secret": "【臭】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "特": {
    "char": "特",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹手土木戈 (HQGDI)",
    "secret": "【特】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "舟": {
    "char": "舟",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹月卜戈 (HBYI)",
    "secret": "【舟】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "街": {
    "char": "街",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹人土土弓 (HOGGN)",
    "secret": "【街】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "陰": {
    "char": "陰",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓中人戈戈 (NLOII)",
    "secret": "【陰】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "符": {
    "char": "符",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹人木戈 (HODI)",
    "secret": "【符】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "得": {
    "char": "得",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹人日一戈 (HOAMI)",
    "secret": "【得】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "二": {
    "char": "二",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一一 (MM)",
    "secret": "【二】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "工": {
    "char": "工",
    "codes": [
      "一"
    ],
    "keys": [
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一 (M)",
    "cj_full": "一 (M)",
    "secret": "【工】單碼字：直取【一】(M)",
    "quickCode": "M"
  },
  "畫": {
    "char": "畫",
    "codes": [
      "中",
      "一"
    ],
    "keys": [
      "L",
      "M"
    ],
    "first_code": "中",
    "last_code": "一",
    "first_key": "L",
    "last_key": "M",
    "full": "中一 (LM)",
    "cj_full": "中土田一 (LGWM)",
    "secret": "【畫】速成取碼：首碼【中】(L) ＋ 尾碼【一】(M)",
    "quickCode": "LM"
  },
  "寬": {
    "char": "寬",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十廿月戈 (JTBI)",
    "secret": "【寬】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "郵": {
    "char": "郵",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹一弓中 (HMNL)",
    "secret": "【郵】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "干": {
    "char": "干",
    "codes": [
      "一",
      "十"
    ],
    "keys": [
      "M",
      "J"
    ],
    "first_code": "一",
    "last_code": "十",
    "first_key": "M",
    "last_key": "J",
    "full": "一十 (MJ)",
    "cj_full": "一十 (MJ)",
    "secret": "【干】速成取碼：首碼【一】(M) ＋ 尾碼【十】(J)",
    "quickCode": "MJ"
  },
  "風": {
    "char": "風",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹弓中戈 (HNLI)",
    "secret": "【風】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "術": {
    "char": "術",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹人戈金弓 (HOICN)",
    "secret": "【術】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "第": {
    "char": "第",
    "codes": [
      "竹",
      "竹"
    ],
    "keys": [
      "H",
      "H"
    ],
    "first_code": "竹",
    "last_code": "竹",
    "first_key": "H",
    "last_key": "H",
    "full": "竹竹 (HH)",
    "cj_full": "竹弓中竹 (HNLH)",
    "secret": "【第】速成取碼：首碼【竹】(H) ＋ 尾碼【竹】(H)",
    "quickCode": "HH"
  },
  "亞": {
    "char": "亞",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一中中一 (MLLM)",
    "secret": "【亞】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "凡": {
    "char": "凡",
    "codes": [
      "竹",
      "戈"
    ],
    "keys": [
      "H",
      "I"
    ],
    "first_code": "竹",
    "last_code": "戈",
    "first_key": "H",
    "last_key": "I",
    "full": "竹戈 (HI)",
    "cj_full": "竹弓戈 (HNI)",
    "secret": "【凡】速成取碼：首碼【竹】(H) ＋ 尾碼【戈】(I)",
    "quickCode": "HI"
  },
  "竿": {
    "char": "竿",
    "codes": [
      "竹",
      "十"
    ],
    "keys": [
      "H",
      "J"
    ],
    "first_code": "竹",
    "last_code": "十",
    "first_key": "H",
    "last_key": "J",
    "full": "竹十 (HJ)",
    "cj_full": "竹一十 (HMJ)",
    "secret": "【竿】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)",
    "quickCode": "HJ"
  },
  "衝": {
    "char": "衝",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹人竹土弓 (HOHGN)",
    "secret": "【衝】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "貝": {
    "char": "貝",
    "codes": [
      "月",
      "金"
    ],
    "keys": [
      "B",
      "C"
    ],
    "first_code": "月",
    "last_code": "金",
    "first_key": "B",
    "last_key": "C",
    "full": "月金 (BC)",
    "cj_full": "月山金 (BUC)",
    "secret": "【貝】速成取碼：首碼【月】(B) ＋ 尾碼【金】(C)",
    "quickCode": "BC"
  },
  "熱": {
    "char": "熱",
    "codes": [
      "土",
      "火"
    ],
    "keys": [
      "G",
      "F"
    ],
    "first_code": "土",
    "last_code": "火",
    "first_key": "G",
    "last_key": "F",
    "full": "土火 (GF)",
    "cj_full": "土戈火 (GIF)",
    "secret": "【熱】速成取碼：首碼【土】(G) ＋ 尾碼【火】(F)",
    "quickCode": "GF"
  },
  "糧": {
    "char": "糧",
    "codes": [
      "火",
      "土"
    ],
    "keys": [
      "F",
      "G"
    ],
    "first_code": "火",
    "last_code": "土",
    "first_key": "F",
    "last_key": "G",
    "full": "火土 (FG)",
    "cj_full": "火木日一土 (FDAMG)",
    "secret": "【糧】速成取碼：首碼【火】(F) ＋ 尾碼【土】(G)",
    "quickCode": "FG"
  },
  "炎": {
    "char": "炎",
    "codes": [
      "火",
      "火"
    ],
    "keys": [
      "F",
      "F"
    ],
    "first_code": "火",
    "last_code": "火",
    "first_key": "F",
    "last_key": "F",
    "full": "火火 (FF)",
    "cj_full": "火火 (FF)",
    "secret": "【炎】速成取碼：首碼【火】(F) ＋ 尾碼【火】(F)",
    "quickCode": "FF"
  },
  "波": {
    "char": "波",
    "codes": [
      "水",
      "水"
    ],
    "keys": [
      "E",
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水水 (EE)",
    "cj_full": "水木竹水 (EDHE)",
    "secret": "【波】速成取碼：首碼【水】(E) ＋ 尾碼【水】(E)",
    "quickCode": "EE"
  },
  "潔": {
    "char": "潔",
    "codes": [
      "水",
      "火"
    ],
    "keys": [
      "E",
      "F"
    ],
    "first_code": "水",
    "last_code": "火",
    "first_key": "E",
    "last_key": "F",
    "full": "水火 (EF)",
    "cj_full": "水手竹火 (EQHF)",
    "secret": "【潔】速成取碼：首碼【水】(E) ＋ 尾碼【火】(F)",
    "quickCode": "EF"
  },
  "杯": {
    "char": "杯",
    "codes": [
      "木",
      "火"
    ],
    "keys": [
      "D",
      "F"
    ],
    "first_code": "木",
    "last_code": "火",
    "first_key": "D",
    "last_key": "F",
    "full": "木火 (DF)",
    "cj_full": "木一火 (DMF)",
    "secret": "【杯】速成取碼：首碼【木】(D) ＋ 尾碼【火】(F)",
    "quickCode": "DF"
  },
  "常": {
    "char": "常",
    "codes": [
      "火",
      "月"
    ],
    "keys": [
      "F",
      "B"
    ],
    "first_code": "火",
    "last_code": "月",
    "first_key": "F",
    "last_key": "B",
    "full": "火月 (FB)",
    "cj_full": "火月口中月 (FBRLB)",
    "secret": "【常】速成取碼：首碼【火】(F) ＋ 尾碼【月】(B)",
    "quickCode": "FB"
  },
  "采": {
    "char": "采",
    "codes": [
      "月",
      "木"
    ],
    "keys": [
      "B",
      "D"
    ],
    "first_code": "月",
    "last_code": "木",
    "first_key": "B",
    "last_key": "D",
    "full": "月木 (BD)",
    "cj_full": "月木 (BD)",
    "secret": "【采】速成取碼：首碼【月】(B) ＋ 尾碼【木】(D)",
    "quickCode": "BD"
  },
  "朋": {
    "char": "朋",
    "codes": [
      "月",
      "月"
    ],
    "keys": [
      "B",
      "B"
    ],
    "first_code": "月",
    "last_code": "月",
    "first_key": "B",
    "last_key": "B",
    "full": "月月 (BB)",
    "cj_full": "月月 (BB)",
    "secret": "【朋】速成取碼：首碼【月】(B) ＋ 尾碼【月】(B)",
    "quickCode": "BB"
  },
  "昊": {
    "char": "昊",
    "codes": [
      "日",
      "大"
    ],
    "keys": [
      "A",
      "K"
    ],
    "first_code": "日",
    "last_code": "大",
    "first_key": "A",
    "last_key": "K",
    "full": "日大 (AK)",
    "cj_full": "日一大 (AMK)",
    "secret": "【昊】速成取碼：首碼【日】(A) ＋ 尾碼【大】(K)",
    "quickCode": "AK"
  },
  "昔": {
    "char": "昔",
    "codes": [
      "廿",
      "日"
    ],
    "keys": [
      "T",
      "A"
    ],
    "first_code": "廿",
    "last_code": "日",
    "first_key": "T",
    "last_key": "A",
    "full": "廿日 (TA)",
    "cj_full": "廿日 (TA)",
    "secret": "【昔】速成取碼：首碼【廿】(T) ＋ 尾碼【日】(A)",
    "quickCode": "TA"
  },
  "巴": {
    "char": "巴",
    "codes": [
      "日",
      "山"
    ],
    "keys": [
      "A",
      "U"
    ],
    "first_code": "日",
    "last_code": "山",
    "first_key": "A",
    "last_key": "U",
    "full": "日山 (AU)",
    "cj_full": "日山 (AU)",
    "secret": "【巴】速成取碼：首碼【日】(A) ＋ 尾碼【山】(U)",
    "quickCode": "AU"
  },
  "象": {
    "char": "象",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓日心人 (NAPO)",
    "secret": "【象】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "用": {
    "char": "用",
    "codes": [
      "月",
      "手"
    ],
    "keys": [
      "B",
      "Q"
    ],
    "first_code": "月",
    "last_code": "手",
    "first_key": "B",
    "last_key": "Q",
    "full": "月手 (BQ)",
    "cj_full": "月手 (BQ)",
    "secret": "【用】速成取碼：首碼【月】(B) ＋ 尾碼【手】(Q)",
    "quickCode": "BQ"
  },
  "冥": {
    "char": "冥",
    "codes": [
      "月",
      "金"
    ],
    "keys": [
      "B",
      "C"
    ],
    "first_code": "月",
    "last_code": "金",
    "first_key": "B",
    "last_key": "C",
    "full": "月金 (BC)",
    "cj_full": "月日卜金 (BAYC)",
    "secret": "【冥】速成取碼：首碼【月】(B) ＋ 尾碼【金】(C)",
    "quickCode": "BC"
  },
  "冤": {
    "char": "冤",
    "codes": [
      "月",
      "戈"
    ],
    "keys": [
      "B",
      "I"
    ],
    "first_code": "月",
    "last_code": "戈",
    "first_key": "B",
    "last_key": "I",
    "full": "月戈 (BI)",
    "cj_full": "月弓日戈 (BNAI)",
    "secret": "【冤】速成取碼：首碼【月】(B) ＋ 尾碼【戈】(I)",
    "quickCode": "BI"
  },
  "炙": {
    "char": "炙",
    "codes": [
      "月",
      "火"
    ],
    "keys": [
      "B",
      "F"
    ],
    "first_code": "月",
    "last_code": "火",
    "first_key": "B",
    "last_key": "F",
    "full": "月火 (BF)",
    "cj_full": "月火 (BF)",
    "secret": "【炙】速成取碼：首碼【月】(B) ＋ 尾碼【火】(F)",
    "quickCode": "BF"
  },
  "只": {
    "char": "只",
    "codes": [
      "口",
      "金"
    ],
    "keys": [
      "R",
      "C"
    ],
    "first_code": "口",
    "last_code": "金",
    "first_key": "R",
    "last_key": "C",
    "full": "口金 (RC)",
    "cj_full": "口金 (RC)",
    "secret": "【只】速成取碼：首碼【口】(R) ＋ 尾碼【金】(C)",
    "quickCode": "RC"
  },
  "共": {
    "char": "共",
    "codes": [
      "廿",
      "金"
    ],
    "keys": [
      "T",
      "C"
    ],
    "first_code": "廿",
    "last_code": "金",
    "first_key": "T",
    "last_key": "C",
    "full": "廿金 (TC)",
    "cj_full": "廿金 (TC)",
    "secret": "【共】速成取碼：首碼【廿】(T) ＋ 尾碼【金】(C)",
    "quickCode": "TC"
  },
  "弟": {
    "char": "弟",
    "codes": [
      "金",
      "竹"
    ],
    "keys": [
      "C",
      "H"
    ],
    "first_code": "金",
    "last_code": "竹",
    "first_key": "C",
    "last_key": "H",
    "full": "金竹 (CH)",
    "cj_full": "金弓中竹 (CNLH)",
    "secret": "【弟】速成取碼：首碼【金】(C) ＋ 尾碼【竹】(H)",
    "quickCode": "CH"
  },
  "並": {
    "char": "並",
    "codes": [
      "廿",
      "金"
    ],
    "keys": [
      "T",
      "C"
    ],
    "first_code": "廿",
    "last_code": "金",
    "first_key": "T",
    "last_key": "C",
    "full": "廿金 (TC)",
    "cj_full": "廿廿金 (TTC)",
    "secret": "【並】速成取碼：首碼【廿】(T) ＋ 尾碼【金】(C)",
    "quickCode": "TC"
  },
  "朮": {
    "char": "朮",
    "codes": [
      "戈",
      "木"
    ],
    "keys": [
      "I",
      "D"
    ],
    "first_code": "戈",
    "last_code": "木",
    "first_key": "I",
    "last_key": "D",
    "full": "戈木 (ID)",
    "cj_full": "戈木 (ID)",
    "secret": "【朮】速成取碼：首碼【戈】(I) ＋ 尾碼【木】(D)",
    "quickCode": "ID"
  },
  "材": {
    "char": "材",
    "codes": [
      "木",
      "竹"
    ],
    "keys": [
      "D",
      "H"
    ],
    "first_code": "木",
    "last_code": "竹",
    "first_key": "D",
    "last_key": "H",
    "full": "木竹 (DH)",
    "cj_full": "木木竹 (DDH)",
    "secret": "【材】速成取碼：首碼【木】(D) ＋ 尾碼【竹】(H)",
    "quickCode": "DH"
  },
  "村": {
    "char": "村",
    "codes": [
      "木",
      "戈"
    ],
    "keys": [
      "D",
      "I"
    ],
    "first_code": "木",
    "last_code": "戈",
    "first_key": "D",
    "last_key": "I",
    "full": "木戈 (DI)",
    "cj_full": "木木戈 (DDI)",
    "secret": "【村】速成取碼：首碼【木】(D) ＋ 尾碼【戈】(I)",
    "quickCode": "DI"
  },
  "韋": {
    "char": "韋",
    "codes": [
      "木",
      "手"
    ],
    "keys": [
      "D",
      "Q"
    ],
    "first_code": "木",
    "last_code": "手",
    "first_key": "D",
    "last_key": "Q",
    "full": "木手 (DQ)",
    "cj_full": "木一口手 (DMRQ)",
    "secret": "【韋】速成取碼：首碼【木】(D) ＋ 尾碼【手】(Q)",
    "quickCode": "DQ"
  },
  "汝": {
    "char": "汝",
    "codes": [
      "水",
      "女"
    ],
    "keys": [
      "E",
      "V"
    ],
    "first_code": "水",
    "last_code": "女",
    "first_key": "E",
    "last_key": "V",
    "full": "水女 (EV)",
    "cj_full": "水女 (EV)",
    "secret": "【汝】速成取碼：首碼【水】(E) ＋ 尾碼【女】(V)",
    "quickCode": "EV"
  },
  "求": {
    "char": "求",
    "codes": [
      "戈",
      "水"
    ],
    "keys": [
      "I",
      "E"
    ],
    "first_code": "戈",
    "last_code": "水",
    "first_key": "I",
    "last_key": "E",
    "full": "戈水 (IE)",
    "cj_full": "戈十水 (IJE)",
    "secret": "【求】速成取碼：首碼【戈】(I) ＋ 尾碼【水】(E)",
    "quickCode": "IE"
  },
  "叉": {
    "char": "叉",
    "codes": [
      "水",
      "戈"
    ],
    "keys": [
      "E",
      "I"
    ],
    "first_code": "水",
    "last_code": "戈",
    "first_key": "E",
    "last_key": "I",
    "full": "水戈 (EI)",
    "cj_full": "水戈 (EI)",
    "secret": "【叉】速成取碼：首碼【水】(E) ＋ 尾碼【戈】(I)",
    "quickCode": "EI"
  },
  "反": {
    "char": "反",
    "codes": [
      "竹",
      "水"
    ],
    "keys": [
      "H",
      "E"
    ],
    "first_code": "竹",
    "last_code": "水",
    "first_key": "H",
    "last_key": "E",
    "full": "竹水 (HE)",
    "cj_full": "竹水 (HE)",
    "secret": "【反】速成取碼：首碼【竹】(H) ＋ 尾碼【水】(E)",
    "quickCode": "HE"
  },
  "丕": {
    "char": "丕",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一火一 (MFM)",
    "secret": "【丕】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "否": {
    "char": "否",
    "codes": [
      "一",
      "口"
    ],
    "keys": [
      "M",
      "R"
    ],
    "first_code": "一",
    "last_code": "口",
    "first_key": "M",
    "last_key": "R",
    "full": "一口 (MR)",
    "cj_full": "一火口 (MFR)",
    "secret": "【否】速成取碼：首碼【一】(M) ＋ 尾碼【口】(R)",
    "quickCode": "MR"
  },
  "肉": {
    "char": "肉",
    "codes": [
      "人",
      "人"
    ],
    "keys": [
      "O",
      "O"
    ],
    "first_code": "人",
    "last_code": "人",
    "first_key": "O",
    "last_key": "O",
    "full": "人人 (OO)",
    "cj_full": "人月人 (OBO)",
    "secret": "【肉】速成取碼：首碼【人】(O) ＋ 尾碼【人】(O)",
    "quickCode": "OO"
  },
  "鳥": {
    "char": "鳥",
    "codes": [
      "竹",
      "火"
    ],
    "keys": [
      "H",
      "F"
    ],
    "first_code": "竹",
    "last_code": "火",
    "first_key": "H",
    "last_key": "F",
    "full": "竹火 (HF)",
    "cj_full": "竹日卜火 (HAYF)",
    "secret": "【鳥】速成取碼：首碼【竹】(H) ＋ 尾碼【火】(F)",
    "quickCode": "HF"
  },
  "烈": {
    "char": "烈",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一弓火 (MNF)",
    "secret": "【烈】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "當": {
    "char": "當",
    "codes": [
      "火",
      "田"
    ],
    "keys": [
      "F",
      "W"
    ],
    "first_code": "火",
    "last_code": "田",
    "first_key": "F",
    "last_key": "W",
    "full": "火田 (FW)",
    "cj_full": "火月口田 (FBRW)",
    "secret": "【當】速成取碼：首碼【火】(F) ＋ 尾碼【田】(W)",
    "quickCode": "FW"
  },
  "嘗": {
    "char": "嘗",
    "codes": [
      "火",
      "日"
    ],
    "keys": [
      "F",
      "A"
    ],
    "first_code": "火",
    "last_code": "日",
    "first_key": "F",
    "last_key": "A",
    "full": "火日 (FA)",
    "cj_full": "火月口心日 (FBRPA)",
    "secret": "【嘗】速成取碼：首碼【火】(F) ＋ 尾碼【日】(A)",
    "quickCode": "FA"
  },
  "尖": {
    "char": "尖",
    "codes": [
      "火",
      "大"
    ],
    "keys": [
      "F",
      "K"
    ],
    "first_code": "火",
    "last_code": "大",
    "first_key": "F",
    "last_key": "K",
    "full": "火大 (FK)",
    "cj_full": "火大 (FK)",
    "secret": "【尖】速成取碼：首碼【火】(F) ＋ 尾碼【大】(K)",
    "quickCode": "FK"
  },
  "少": {
    "char": "少",
    "codes": [
      "火",
      "竹"
    ],
    "keys": [
      "F",
      "H"
    ],
    "first_code": "火",
    "last_code": "竹",
    "first_key": "F",
    "last_key": "H",
    "full": "火竹 (FH)",
    "cj_full": "火竹 (FH)",
    "secret": "【少】速成取碼：首碼【火】(F) ＋ 尾碼【竹】(H)",
    "quickCode": "FH"
  },
  "戀": {
    "char": "戀",
    "codes": [
      "女",
      "心"
    ],
    "keys": [
      "V",
      "P"
    ],
    "first_code": "女",
    "last_code": "心",
    "first_key": "V",
    "last_key": "P",
    "full": "女心 (VP)",
    "cj_full": "女火心 (VFP)",
    "secret": "【戀】速成取碼：首碼【女】(V) ＋ 尾碼【心】(P)",
    "quickCode": "VP"
  },
  "絲": {
    "char": "絲",
    "codes": [
      "女",
      "火"
    ],
    "keys": [
      "V",
      "F"
    ],
    "first_code": "女",
    "last_code": "火",
    "first_key": "V",
    "last_key": "F",
    "full": "女火 (VF)",
    "cj_full": "女火女戈火 (VFVIF)",
    "secret": "【絲】速成取碼：首碼【女】(V) ＋ 尾碼【火】(F)",
    "quickCode": "VF"
  },
  "壞": {
    "char": "壞",
    "codes": [
      "土",
      "女"
    ],
    "keys": [
      "G",
      "V"
    ],
    "first_code": "土",
    "last_code": "女",
    "first_key": "G",
    "last_key": "V",
    "full": "土女 (GV)",
    "cj_full": "土卜田女 (GYWV)",
    "secret": "【壞】速成取碼：首碼【土】(G) ＋ 尾碼【女】(V)",
    "quickCode": "GV"
  },
  "壯": {
    "char": "壯",
    "codes": [
      "女",
      "土"
    ],
    "keys": [
      "V",
      "G"
    ],
    "first_code": "女",
    "last_code": "土",
    "first_key": "V",
    "last_key": "G",
    "full": "女土 (VG)",
    "cj_full": "女一土 (VMG)",
    "secret": "【壯】速成取碼：首碼【女】(V) ＋ 尾碼【土】(G)",
    "quickCode": "VG"
  },
  "壬": {
    "char": "壬",
    "codes": [
      "竹",
      "土"
    ],
    "keys": [
      "H",
      "G"
    ],
    "first_code": "竹",
    "last_code": "土",
    "first_key": "H",
    "last_key": "G",
    "full": "竹土 (HG)",
    "cj_full": "竹土 (HG)",
    "secret": "【壬】速成取碼：首碼【竹】(H) ＋ 尾碼【土】(G)",
    "quickCode": "HG"
  },
  "淦": {
    "char": "淦",
    "codes": [
      "水",
      "金"
    ],
    "keys": [
      "E",
      "C"
    ],
    "first_code": "水",
    "last_code": "金",
    "first_key": "E",
    "last_key": "C",
    "full": "水金 (EC)",
    "cj_full": "水金 (EC)",
    "secret": "【淦】速成取碼：首碼【水】(E) ＋ 尾碼【金】(C)",
    "quickCode": "EC"
  },
  "周": {
    "char": "周",
    "codes": [
      "月",
      "口"
    ],
    "keys": [
      "B",
      "R"
    ],
    "first_code": "月",
    "last_code": "口",
    "first_key": "B",
    "last_key": "R",
    "full": "月口 (BR)",
    "cj_full": "月土口 (BGR)",
    "secret": "【周】速成取碼：首碼【月】(B) ＋ 尾碼【口】(R)",
    "quickCode": "BR"
  },
  "汨": {
    "char": "汨",
    "codes": [
      "水",
      "日"
    ],
    "keys": [
      "E",
      "A"
    ],
    "first_code": "水",
    "last_code": "日",
    "first_key": "E",
    "last_key": "A",
    "full": "水日 (EA)",
    "cj_full": "水日 (EA)",
    "secret": "【汨】速成取碼：首碼【水】(E) ＋ 尾碼【日】(A)",
    "quickCode": "EA"
  },
  "胴": {
    "char": "胴",
    "codes": [
      "月",
      "口"
    ],
    "keys": [
      "B",
      "R"
    ],
    "first_code": "月",
    "last_code": "口",
    "first_key": "B",
    "last_key": "R",
    "full": "月口 (BR)",
    "cj_full": "月月一口 (BBMR)",
    "secret": "【胴】速成取碼：首碼【月】(B) ＋ 尾碼【口】(R)",
    "quickCode": "BR"
  },
  "圣": {
    "char": "圣",
    "codes": [
      "水",
      "土"
    ],
    "keys": [
      "E",
      "G"
    ],
    "first_code": "水",
    "last_code": "土",
    "first_key": "E",
    "last_key": "G",
    "full": "水土 (EG)",
    "cj_full": "水土 (EG)",
    "secret": "【圣】速成取碼：首碼【水】(E) ＋ 尾碼【土】(G)",
    "quickCode": "EG"
  },
  "杰": {
    "char": "杰",
    "codes": [
      "木",
      "火"
    ],
    "keys": [
      "D",
      "F"
    ],
    "first_code": "木",
    "last_code": "火",
    "first_key": "D",
    "last_key": "F",
    "full": "木火 (DF)",
    "cj_full": "木火 (DF)",
    "secret": "【杰】速成取碼：首碼【木】(D) ＋ 尾碼【火】(F)",
    "quickCode": "DF"
  },
  "唱": {
    "char": "唱",
    "codes": [
      "口",
      "日"
    ],
    "keys": [
      "R",
      "A"
    ],
    "first_code": "口",
    "last_code": "日",
    "first_key": "R",
    "last_key": "A",
    "full": "口日 (RA)",
    "cj_full": "口日日 (RAA)",
    "secret": "【唱】速成取碼：首碼【口】(R) ＋ 尾碼【日】(A)",
    "quickCode": "RA"
  },
  "淌": {
    "char": "淌",
    "codes": [
      "水",
      "口"
    ],
    "keys": [
      "E",
      "R"
    ],
    "first_code": "水",
    "last_code": "口",
    "first_key": "E",
    "last_key": "R",
    "full": "水口 (ER)",
    "cj_full": "水火月口 (EFBR)",
    "secret": "【淌】速成取碼：首碼【水】(E) ＋ 尾碼【口】(R)",
    "quickCode": "ER"
  },
  "沖": {
    "char": "沖",
    "codes": [
      "水",
      "中"
    ],
    "keys": [
      "E",
      "L"
    ],
    "first_code": "水",
    "last_code": "中",
    "first_key": "E",
    "last_key": "L",
    "full": "水中 (EL)",
    "cj_full": "水中 (EL)",
    "secret": "【沖】速成取碼：首碼【水】(E) ＋ 尾碼【中】(L)",
    "quickCode": "EL"
  },
  "熒": {
    "char": "熒",
    "codes": [
      "火",
      "火"
    ],
    "keys": [
      "F",
      "F"
    ],
    "first_code": "火",
    "last_code": "火",
    "first_key": "F",
    "last_key": "F",
    "full": "火火 (FF)",
    "cj_full": "火火月火 (FFBF)",
    "secret": "【熒】速成取碼：首碼【火】(F) ＋ 尾碼【火】(F)",
    "quickCode": "FF"
  },
  "軍": {
    "char": "軍",
    "codes": [
      "月",
      "十"
    ],
    "keys": [
      "B",
      "J"
    ],
    "first_code": "月",
    "last_code": "十",
    "first_key": "B",
    "last_key": "J",
    "full": "月十 (BJ)",
    "cj_full": "月十田十 (BJWJ)",
    "secret": "【軍】速成取碼：首碼【月】(B) ＋ 尾碼【十】(J)",
    "quickCode": "BJ"
  },
  "同": {
    "char": "同",
    "codes": [
      "月",
      "口"
    ],
    "keys": [
      "B",
      "R"
    ],
    "first_code": "月",
    "last_code": "口",
    "first_key": "B",
    "last_key": "R",
    "full": "月口 (BR)",
    "cj_full": "月一口 (BMR)",
    "secret": "【同】速成取碼：首碼【月】(B) ＋ 尾碼【口】(R)",
    "quickCode": "BR"
  },
  "示": {
    "char": "示",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一一火 (MMF)",
    "secret": "【示】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "汙": {
    "char": "汙",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水一木 (EMD)",
    "secret": "【汙】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "桑": {
    "char": "桑",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水水水木 (EEED)",
    "secret": "【桑】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "冉": {
    "char": "冉",
    "codes": [
      "土",
      "月"
    ],
    "keys": [
      "G",
      "B"
    ],
    "first_code": "土",
    "last_code": "月",
    "first_key": "G",
    "last_key": "B",
    "full": "土月 (GB)",
    "cj_full": "土月 (GB)",
    "secret": "【冉】速成取碼：首碼【土】(G) ＋ 尾碼【月】(B)",
    "quickCode": "GB"
  },
  "沿": {
    "char": "沿",
    "codes": [
      "水",
      "口"
    ],
    "keys": [
      "E",
      "R"
    ],
    "first_code": "水",
    "last_code": "口",
    "first_key": "E",
    "last_key": "R",
    "full": "水口 (ER)",
    "cj_full": "水金口 (ECR)",
    "secret": "【沿】速成取碼：首碼【水】(E) ＋ 尾碼【口】(R)",
    "quickCode": "ER"
  },
  "不": {
    "char": "不",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一火 (MF)",
    "secret": "【不】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "鉛": {
    "char": "鉛",
    "codes": [
      "金",
      "口"
    ],
    "keys": [
      "C",
      "R"
    ],
    "first_code": "金",
    "last_code": "口",
    "first_key": "C",
    "last_key": "R",
    "full": "金口 (CR)",
    "cj_full": "金竹弓口 (CHNR)",
    "secret": "【鉛】速成取碼：首碼【金】(C) ＋ 尾碼【口】(R)",
    "quickCode": "CR"
  },
  "罕": {
    "char": "罕",
    "codes": [
      "月",
      "十"
    ],
    "keys": [
      "B",
      "J"
    ],
    "first_code": "月",
    "last_code": "十",
    "first_key": "B",
    "last_key": "J",
    "full": "月十 (BJ)",
    "cj_full": "月金一十 (BCMJ)",
    "secret": "【罕】速成取碼：首碼【月】(B) ＋ 尾碼【十】(J)",
    "quickCode": "BJ"
  },
  "沁": {
    "char": "沁",
    "codes": [
      "水",
      "心"
    ],
    "keys": [
      "E",
      "P"
    ],
    "first_code": "水",
    "last_code": "心",
    "first_key": "E",
    "last_key": "P",
    "full": "水心 (EP)",
    "cj_full": "水心 (EP)",
    "secret": "【沁】速成取碼：首碼【水】(E) ＋ 尾碼【心】(P)",
    "quickCode": "EP"
  },
  "妥": {
    "char": "妥",
    "codes": [
      "月",
      "女"
    ],
    "keys": [
      "B",
      "V"
    ],
    "first_code": "月",
    "last_code": "女",
    "first_key": "B",
    "last_key": "V",
    "full": "月女 (BV)",
    "cj_full": "月女 (BV)",
    "secret": "【妥】速成取碼：首碼【月】(B) ＋ 尾碼【女】(V)",
    "quickCode": "BV"
  },
  "沐": {
    "char": "沐",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水木 (ED)",
    "secret": "【沐】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "胚": {
    "char": "胚",
    "codes": [
      "月",
      "一"
    ],
    "keys": [
      "B",
      "M"
    ],
    "first_code": "月",
    "last_code": "一",
    "first_key": "B",
    "last_key": "M",
    "full": "月一 (BM)",
    "cj_full": "月一火一 (BMFM)",
    "secret": "【胚】速成取碼：首碼【月】(B) ＋ 尾碼【一】(M)",
    "quickCode": "BM"
  },
  "式": {
    "char": "式",
    "codes": [
      "戈",
      "一"
    ],
    "keys": [
      "I",
      "M"
    ],
    "first_code": "戈",
    "last_code": "一",
    "first_key": "I",
    "last_key": "M",
    "full": "戈一 (IM)",
    "cj_full": "戈心一 (IPM)",
    "secret": "【式】速成取碼：首碼【戈】(I) ＋ 尾碼【一】(M)",
    "quickCode": "IM"
  },
  "行": {
    "char": "行",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹人一一弓 (HOMMN)",
    "secret": "【行】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "微": {
    "char": "微",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹人山弓大 (HOUNK)",
    "secret": "【微】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "川": {
    "char": "川",
    "codes": [
      "中",
      "中"
    ],
    "keys": [
      "L",
      "L"
    ],
    "first_code": "中",
    "last_code": "中",
    "first_key": "L",
    "last_key": "L",
    "full": "中中 (LL)",
    "cj_full": "中中中 (LLL)",
    "secret": "【川】速成取碼：首碼【中】(L) ＋ 尾碼【中】(L)",
    "quickCode": "LL"
  },
  "冷": {
    "char": "冷",
    "codes": [
      "戈",
      "戈"
    ],
    "keys": [
      "I",
      "I"
    ],
    "first_code": "戈",
    "last_code": "戈",
    "first_key": "I",
    "last_key": "I",
    "full": "戈戈 (II)",
    "cj_full": "戈一人戈戈 (IMOII)",
    "secret": "【冷】速成取碼：首碼【戈】(I) ＋ 尾碼【戈】(I)",
    "quickCode": "II"
  },
  "租": {
    "char": "租",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹木月一 (HDBM)",
    "secret": "【租】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "戊": {
    "char": "戊",
    "codes": [
      "戈",
      "竹"
    ],
    "keys": [
      "I",
      "H"
    ],
    "first_code": "戈",
    "last_code": "竹",
    "first_key": "I",
    "last_key": "H",
    "full": "戈竹 (IH)",
    "cj_full": "戈竹 (IH)",
    "secret": "【戊】速成取碼：首碼【戈】(I) ＋ 尾碼【竹】(H)",
    "quickCode": "IH"
  },
  "拜": {
    "char": "拜",
    "codes": [
      "竹",
      "十"
    ],
    "keys": [
      "H",
      "J"
    ],
    "first_code": "竹",
    "last_code": "十",
    "first_key": "H",
    "last_key": "J",
    "full": "竹十 (HJ)",
    "cj_full": "竹手一手十 (HQMQJ)",
    "secret": "【拜】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)",
    "quickCode": "HJ"
  },
  "牧": {
    "char": "牧",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹手人大 (HQOK)",
    "secret": "【牧】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "強": {
    "char": "強",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓口戈戈 (NRII)",
    "secret": "【強】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "鬥": {
    "char": "鬥",
    "codes": [
      "中",
      "弓"
    ],
    "keys": [
      "L",
      "N"
    ],
    "first_code": "中",
    "last_code": "弓",
    "first_key": "L",
    "last_key": "N",
    "full": "中弓 (LN)",
    "cj_full": "中弓 (LN)",
    "secret": "【鬥】速成取碼：首碼【中】(L) ＋ 尾碼【弓】(N)",
    "quickCode": "LN"
  },
  "所": {
    "char": "所",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹尸竹一中 (HSHML)",
    "secret": "【所】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "翻": {
    "char": "翻",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹田尸一一 (HWSMM)",
    "secret": "【翻】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "麥": {
    "char": "麥",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十人弓戈 (JONI)",
    "secret": "【麥】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "數": {
    "char": "數",
    "codes": [
      "中",
      "大"
    ],
    "keys": [
      "L",
      "K"
    ],
    "first_code": "中",
    "last_code": "大",
    "first_key": "L",
    "last_key": "K",
    "full": "中大 (LK)",
    "cj_full": "中女人大 (LVOK)",
    "secret": "【數】速成取碼：首碼【中】(L) ＋ 尾碼【大】(K)",
    "quickCode": "LK"
  },
  "斤": {
    "char": "斤",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹一中 (HML)",
    "secret": "【斤】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "神": {
    "char": "神",
    "codes": [
      "戈",
      "中"
    ],
    "keys": [
      "I",
      "L"
    ],
    "first_code": "戈",
    "last_code": "中",
    "first_key": "I",
    "last_key": "L",
    "full": "戈中 (IL)",
    "cj_full": "戈火中田中 (IFLWL)",
    "secret": "【神】速成取碼：首碼【戈】(I) ＋ 尾碼【中】(L)",
    "quickCode": "IL"
  },
  "參": {
    "char": "參",
    "codes": [
      "戈",
      "竹"
    ],
    "keys": [
      "I",
      "H"
    ],
    "first_code": "戈",
    "last_code": "竹",
    "first_key": "I",
    "last_key": "H",
    "full": "戈竹 (IH)",
    "cj_full": "戈戈戈竹 (IIIH)",
    "secret": "【參】速成取碼：首碼【戈】(I) ＋ 尾碼【竹】(H)",
    "quickCode": "IH"
  },
  "物": {
    "char": "物",
    "codes": [
      "竹",
      "竹"
    ],
    "keys": [
      "H",
      "H"
    ],
    "first_code": "竹",
    "last_code": "竹",
    "first_key": "H",
    "last_key": "H",
    "full": "竹竹 (HH)",
    "cj_full": "竹手心竹竹 (HQPHH)",
    "secret": "【物】速成取碼：首碼【竹】(H) ＋ 尾碼【竹】(H)",
    "quickCode": "HH"
  },
  "厭": {
    "char": "厭",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一日月大 (MABK)",
    "secret": "【厭】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "底": {
    "char": "底",
    "codes": [
      "戈",
      "一"
    ],
    "keys": [
      "I",
      "M"
    ],
    "first_code": "戈",
    "last_code": "一",
    "first_key": "I",
    "last_key": "M",
    "full": "戈一 (IM)",
    "cj_full": "戈竹心一 (IHPM)",
    "secret": "【底】速成取碼：首碼【戈】(I) ＋ 尾碼【一】(M)",
    "quickCode": "IM"
  },
  "生": {
    "char": "生",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹手一 (HQM)",
    "secret": "【生】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "祖": {
    "char": "祖",
    "codes": [
      "戈",
      "一"
    ],
    "keys": [
      "I",
      "M"
    ],
    "first_code": "戈",
    "last_code": "一",
    "first_key": "I",
    "last_key": "M",
    "full": "戈一 (IM)",
    "cj_full": "戈火月一 (IFBM)",
    "secret": "【祖】速成取碼：首碼【戈】(I) ＋ 尾碼【一】(M)",
    "quickCode": "IM"
  },
  "筷": {
    "char": "筷",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹心木大 (HPDK)",
    "secret": "【筷】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "丈": {
    "char": "丈",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十大 (JK)",
    "secret": "【丈】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "府": {
    "char": "府",
    "codes": [
      "戈",
      "戈"
    ],
    "keys": [
      "I",
      "I"
    ],
    "first_code": "戈",
    "last_code": "戈",
    "first_key": "I",
    "last_key": "I",
    "full": "戈戈 (II)",
    "cj_full": "戈人木戈 (IODI)",
    "secret": "【府】速成取碼：首碼【戈】(I) ＋ 尾碼【戈】(I)",
    "quickCode": "II"
  },
  "車": {
    "char": "車",
    "codes": [
      "十",
      "十"
    ],
    "keys": [
      "J",
      "J"
    ],
    "first_code": "十",
    "last_code": "十",
    "first_key": "J",
    "last_key": "J",
    "full": "十十 (JJ)",
    "cj_full": "十田十 (JWJ)",
    "secret": "【車】速成取碼：首碼【十】(J) ＋ 尾碼【十】(J)",
    "quickCode": "JJ"
  },
  "附": {
    "char": "附",
    "codes": [
      "弓",
      "戈"
    ],
    "keys": [
      "N",
      "I"
    ],
    "first_code": "弓",
    "last_code": "戈",
    "first_key": "N",
    "last_key": "I",
    "full": "弓戈 (NI)",
    "cj_full": "弓中人木戈 (NLODI)",
    "secret": "【附】速成取碼：首碼【弓】(N) ＋ 尾碼【戈】(I)",
    "quickCode": "NI"
  },
  "穿": {
    "char": "穿",
    "codes": [
      "十",
      "竹"
    ],
    "keys": [
      "J",
      "H"
    ],
    "first_code": "十",
    "last_code": "竹",
    "first_key": "J",
    "last_key": "H",
    "full": "十竹 (JH)",
    "cj_full": "十金一女竹 (JCMVH)",
    "secret": "【穿】速成取碼：首碼【十】(J) ＋ 尾碼【竹】(H)",
    "quickCode": "JH"
  },
  "窗": {
    "char": "窗",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十金竹田大 (JCHWK)",
    "secret": "【窗】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "較": {
    "char": "較",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十十卜金大 (JJYCK)",
    "secret": "【較】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "守": {
    "char": "守",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十木戈 (JDI)",
    "secret": "【守】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "划": {
    "char": "划",
    "codes": [
      "戈",
      "弓"
    ],
    "keys": [
      "I",
      "N"
    ],
    "first_code": "戈",
    "last_code": "弓",
    "first_key": "I",
    "last_key": "N",
    "full": "戈弓 (IN)",
    "cj_full": "戈中弓 (ILN)",
    "secret": "【划】速成取碼：首碼【戈】(I) ＋ 尾碼【弓】(N)",
    "quickCode": "IN"
  },
  "疾": {
    "char": "疾",
    "codes": [
      "大",
      "大"
    ],
    "keys": [
      "K",
      "K"
    ],
    "first_code": "大",
    "last_code": "大",
    "first_key": "K",
    "last_key": "K",
    "full": "大大 (KK)",
    "cj_full": "大人大 (KOK)",
    "secret": "【疾】速成取碼：首碼【大】(K) ＋ 尾碼【大】(K)",
    "quickCode": "KK"
  },
  "麵": {
    "char": "麵",
    "codes": [
      "十",
      "中"
    ],
    "keys": [
      "J",
      "L"
    ],
    "first_code": "十",
    "last_code": "中",
    "first_key": "J",
    "last_key": "L",
    "full": "十中 (JL)",
    "cj_full": "十水一田中 (JEMWL)",
    "secret": "【麵】速成取碼：首碼【十】(J) ＋ 尾碼【中】(L)",
    "quickCode": "JL"
  },
  "州": {
    "char": "州",
    "codes": [
      "戈",
      "中"
    ],
    "keys": [
      "I",
      "L"
    ],
    "first_code": "戈",
    "last_code": "中",
    "first_key": "I",
    "last_key": "L",
    "full": "戈中 (IL)",
    "cj_full": "戈中戈中 (ILIL)",
    "secret": "【州】速成取碼：首碼【戈】(I) ＋ 尾碼【中】(L)",
    "quickCode": "IL"
  },
  "蜜": {
    "char": "蜜",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十心竹戈 (JPHI)",
    "secret": "【蜜】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "故": {
    "char": "故",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十口人大 (JROK)",
    "secret": "【故】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "飄": {
    "char": "飄",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一火竹弓戈 (MFHNI)",
    "secret": "【飄】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "犬": {
    "char": "犬",
    "codes": [
      "戈",
      "大"
    ],
    "keys": [
      "I",
      "K"
    ],
    "first_code": "戈",
    "last_code": "大",
    "first_key": "I",
    "last_key": "K",
    "full": "戈大 (IK)",
    "cj_full": "戈大 (IK)",
    "secret": "【犬】速成取碼：首碼【戈】(I) ＋ 尾碼【大】(K)",
    "quickCode": "IK"
  },
  "猴": {
    "char": "猴",
    "codes": [
      "大",
      "大"
    ],
    "keys": [
      "K",
      "K"
    ],
    "first_code": "大",
    "last_code": "大",
    "first_key": "K",
    "last_key": "K",
    "full": "大大 (KK)",
    "cj_full": "大竹人弓大 (KHONK)",
    "secret": "【猴】速成取碼：首碼【大】(K) ＋ 尾碼【大】(K)",
    "quickCode": "KK"
  },
  "需": {
    "char": "需",
    "codes": [
      "一",
      "中"
    ],
    "keys": [
      "M",
      "L"
    ],
    "first_code": "一",
    "last_code": "中",
    "first_key": "M",
    "last_key": "L",
    "full": "一中 (ML)",
    "cj_full": "一月一月中 (MBMBL)",
    "secret": "【需】速成取碼：首碼【一】(M) ＋ 尾碼【中】(L)",
    "quickCode": "ML"
  },
  "而": {
    "char": "而",
    "codes": [
      "一",
      "中"
    ],
    "keys": [
      "M",
      "L"
    ],
    "first_code": "一",
    "last_code": "中",
    "first_key": "M",
    "last_key": "L",
    "full": "一中 (ML)",
    "cj_full": "一月中中 (MBLL)",
    "secret": "【而】速成取碼：首碼【一】(M) ＋ 尾碼【中】(L)",
    "quickCode": "ML"
  },
  "央": {
    "char": "央",
    "codes": [
      "中",
      "大"
    ],
    "keys": [
      "L",
      "K"
    ],
    "first_code": "中",
    "last_code": "大",
    "first_key": "L",
    "last_key": "K",
    "full": "中大 (LK)",
    "cj_full": "中月大 (LBK)",
    "secret": "【央】速成取碼：首碼【中】(L) ＋ 尾碼【大】(K)",
    "quickCode": "LK"
  },
  "麼": {
    "char": "麼",
    "codes": [
      "戈",
      "戈"
    ],
    "keys": [
      "I",
      "I"
    ],
    "first_code": "戈",
    "last_code": "戈",
    "first_key": "I",
    "last_key": "I",
    "full": "戈戈 (II)",
    "cj_full": "戈木女戈 (IDVI)",
    "secret": "【麼】速成取碼：首碼【戈】(I) ＋ 尾碼【戈】(I)",
    "quickCode": "II"
  },
  "蜂": {
    "char": "蜂",
    "codes": [
      "中",
      "十"
    ],
    "keys": [
      "L",
      "J"
    ],
    "first_code": "中",
    "last_code": "十",
    "first_key": "L",
    "last_key": "J",
    "full": "中十 (LJ)",
    "cj_full": "中戈竹水十 (LIHEJ)",
    "secret": "【蜂】速成取碼：首碼【中】(L) ＋ 尾碼【十】(J)",
    "quickCode": "LJ"
  },
  "秤": {
    "char": "秤",
    "codes": [
      "竹",
      "十"
    ],
    "keys": [
      "H",
      "J"
    ],
    "first_code": "竹",
    "last_code": "十",
    "first_key": "H",
    "last_key": "J",
    "full": "竹十 (HJ)",
    "cj_full": "竹木一火十 (HDMFJ)",
    "secret": "【秤】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)",
    "quickCode": "HJ"
  },
  "轉": {
    "char": "轉",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十十十戈戈 (JJJII)",
    "secret": "【轉】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "初": {
    "char": "初",
    "codes": [
      "中",
      "竹"
    ],
    "keys": [
      "L",
      "H"
    ],
    "first_code": "中",
    "last_code": "竹",
    "first_key": "L",
    "last_key": "H",
    "full": "中竹 (LH)",
    "cj_full": "中尸竹 (LSH)",
    "secret": "【初】速成取碼：首碼【中】(L) ＋ 尾碼【竹】(H)",
    "quickCode": "LH"
  },
  "節": {
    "char": "節",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹日戈中 (HAIL)",
    "secret": "【節】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "陽": {
    "char": "陽",
    "codes": [
      "弓",
      "竹"
    ],
    "keys": [
      "N",
      "H"
    ],
    "first_code": "弓",
    "last_code": "竹",
    "first_key": "N",
    "last_key": "H",
    "full": "弓竹 (NH)",
    "cj_full": "弓中日一竹 (NLAMH)",
    "secret": "【陽】速成取碼：首碼【弓】(N) ＋ 尾碼【竹】(H)",
    "quickCode": "NH"
  },
  "士": {
    "char": "士",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十一 (JM)",
    "secret": "【士】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "太": {
    "char": "太",
    "codes": [
      "大",
      "戈"
    ],
    "keys": [
      "K",
      "I"
    ],
    "first_code": "大",
    "last_code": "戈",
    "first_key": "K",
    "last_key": "I",
    "full": "大戈 (KI)",
    "cj_full": "大戈 (KI)",
    "secret": "【太】速成取碼：首碼【大】(K) ＋ 尾碼【戈】(I)",
    "quickCode": "KI"
  },
  "歹": {
    "char": "歹",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一弓戈 (MNI)",
    "secret": "【歹】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "片": {
    "char": "片",
    "codes": [
      "中",
      "中"
    ],
    "keys": [
      "L",
      "L"
    ],
    "first_code": "中",
    "last_code": "中",
    "first_key": "L",
    "last_key": "L",
    "full": "中中 (LL)",
    "cj_full": "中中一中 (LLML)",
    "secret": "【片】速成取碼：首碼【中】(L) ＋ 尾碼【中】(L)",
    "quickCode": "LL"
  },
  "翅": {
    "char": "翅",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十水尸一一 (JESMM)",
    "secret": "【翅】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "申": {
    "char": "申",
    "codes": [
      "中",
      "中"
    ],
    "keys": [
      "L",
      "L"
    ],
    "first_code": "中",
    "last_code": "中",
    "first_key": "L",
    "last_key": "L",
    "full": "中中 (LL)",
    "cj_full": "中田中 (LWL)",
    "secret": "【申】速成取碼：首碼【中】(L) ＋ 尾碼【中】(L)",
    "quickCode": "LL"
  },
  "珍": {
    "char": "珍",
    "codes": [
      "一",
      "竹"
    ],
    "keys": [
      "M",
      "H"
    ],
    "first_code": "一",
    "last_code": "竹",
    "first_key": "M",
    "last_key": "H",
    "full": "一竹 (MH)",
    "cj_full": "一土人竹竹 (MGOHH)",
    "secret": "【珍】速成取碼：首碼【一】(M) ＋ 尾碼【竹】(H)",
    "quickCode": "MH"
  },
  "形": {
    "char": "形",
    "codes": [
      "一",
      "竹"
    ],
    "keys": [
      "M",
      "H"
    ],
    "first_code": "一",
    "last_code": "竹",
    "first_key": "M",
    "last_key": "H",
    "full": "一竹 (MH)",
    "cj_full": "一廿竹竹竹 (MTHHH)",
    "secret": "【形】速成取碼：首碼【一】(M) ＋ 尾碼【竹】(H)",
    "quickCode": "MH"
  },
  "身": {
    "char": "身",
    "codes": [
      "竹",
      "竹"
    ],
    "keys": [
      "H",
      "H"
    ],
    "first_code": "竹",
    "last_code": "竹",
    "first_key": "H",
    "last_key": "H",
    "full": "竹竹 (HH)",
    "cj_full": "竹難竹 (HXH)",
    "secret": "【身】速成取碼：首碼【竹】(H) ＋ 尾碼【竹】(H)",
    "quickCode": "HH"
  },
  "史": {
    "char": "史",
    "codes": [
      "中",
      "大"
    ],
    "keys": [
      "L",
      "K"
    ],
    "first_code": "中",
    "last_code": "大",
    "first_key": "L",
    "last_key": "K",
    "full": "中大 (LK)",
    "cj_full": "中大 (LK)",
    "secret": "【史】速成取碼：首碼【中】(L) ＋ 尾碼【大】(K)",
    "quickCode": "LK"
  },
  "列": {
    "char": "列",
    "codes": [
      "一",
      "弓"
    ],
    "keys": [
      "M",
      "N"
    ],
    "first_code": "一",
    "last_code": "弓",
    "first_key": "M",
    "last_key": "N",
    "full": "一弓 (MN)",
    "cj_full": "一弓中弓 (MNLN)",
    "secret": "【列】速成取碼：首碼【一】(M) ＋ 尾碼【弓】(N)",
    "quickCode": "MN"
  },
  "瓦": {
    "char": "瓦",
    "codes": [
      "一",
      "戈"
    ],
    "keys": [
      "M",
      "I"
    ],
    "first_code": "一",
    "last_code": "戈",
    "first_key": "M",
    "last_key": "I",
    "full": "一戈 (MI)",
    "cj_full": "一女弓戈 (MVNI)",
    "secret": "【瓦】速成取碼：首碼【一】(M) ＋ 尾碼【戈】(I)",
    "quickCode": "MI"
  },
  "丁": {
    "char": "丁",
    "codes": [
      "一",
      "弓"
    ],
    "keys": [
      "M",
      "N"
    ],
    "first_code": "一",
    "last_code": "弓",
    "first_key": "M",
    "last_key": "N",
    "full": "一弓 (MN)",
    "cj_full": "一弓 (MN)",
    "secret": "【丁】速成取碼：首碼【一】(M) ＋ 尾碼【弓】(N)",
    "quickCode": "MN"
  },
  "三": {
    "char": "三",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一一一 (MMM)",
    "secret": "【三】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "垂": {
    "char": "垂",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹十廿一 (HJTM)",
    "secret": "【垂】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "武": {
    "char": "武",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一心卜中一 (MPYLM)",
    "secret": "【武】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "蚊": {
    "char": "蚊",
    "codes": [
      "中",
      "大"
    ],
    "keys": [
      "L",
      "K"
    ],
    "first_code": "中",
    "last_code": "大",
    "first_key": "L",
    "last_key": "K",
    "full": "中大 (LK)",
    "cj_full": "中戈卜大 (LIYK)",
    "secret": "【蚊】速成取碼：首碼【中】(L) ＋ 尾碼【大】(K)",
    "quickCode": "LK"
  },
  "致": {
    "char": "致",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一土人大 (MGOK)",
    "secret": "【致】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "千": {
    "char": "千",
    "codes": [
      "竹",
      "十"
    ],
    "keys": [
      "H",
      "J"
    ],
    "first_code": "竹",
    "last_code": "十",
    "first_key": "H",
    "last_key": "J",
    "full": "竹十 (HJ)",
    "cj_full": "竹十 (HJ)",
    "secret": "【千】速成取碼：首碼【竹】(H) ＋ 尾碼【十】(J)",
    "quickCode": "HJ"
  },
  "免": {
    "char": "免",
    "codes": [
      "弓",
      "山"
    ],
    "keys": [
      "N",
      "U"
    ],
    "first_code": "弓",
    "last_code": "山",
    "first_key": "N",
    "last_key": "U",
    "full": "弓山 (NU)",
    "cj_full": "弓日竹山 (NAHU)",
    "secret": "【免】速成取碼：首碼【弓】(N) ＋ 尾碼【山】(U)",
    "quickCode": "NU"
  },
  "雨": {
    "char": "雨",
    "codes": [
      "一",
      "卜"
    ],
    "keys": [
      "M",
      "Y"
    ],
    "first_code": "一",
    "last_code": "卜",
    "first_key": "M",
    "last_key": "Y",
    "full": "一卜 (MY)",
    "cj_full": "一中月卜 (MLBY)",
    "secret": "【雨】速成取碼：首碼【一】(M) ＋ 尾碼【卜】(Y)",
    "quickCode": "MY"
  },
  "直": {
    "char": "直",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十月一一 (JBMM)",
    "secret": "【直】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "兩": {
    "char": "兩",
    "codes": [
      "一",
      "人"
    ],
    "keys": [
      "M",
      "O"
    ],
    "first_code": "一",
    "last_code": "人",
    "first_key": "M",
    "last_key": "O",
    "full": "一人 (MO)",
    "cj_full": "一中月人 (MLBO)",
    "secret": "【兩】速成取碼：首碼【一】(M) ＋ 尾碼【人】(O)",
    "quickCode": "MO"
  },
  "重": {
    "char": "重",
    "codes": [
      "竹",
      "土"
    ],
    "keys": [
      "H",
      "G"
    ],
    "first_code": "竹",
    "last_code": "土",
    "first_key": "H",
    "last_key": "G",
    "full": "竹土 (HG)",
    "cj_full": "竹十田土 (HJWG)",
    "secret": "【重】速成取碼：首碼【竹】(H) ＋ 尾碼【土】(G)",
    "quickCode": "HG"
  },
  "面": {
    "char": "面",
    "codes": [
      "一",
      "中"
    ],
    "keys": [
      "M",
      "L"
    ],
    "first_code": "一",
    "last_code": "中",
    "first_key": "M",
    "last_key": "L",
    "full": "一中 (ML)",
    "cj_full": "一田卜中 (MWYL)",
    "secret": "【面】速成取碼：首碼【一】(M) ＋ 尾碼【中】(L)",
    "quickCode": "ML"
  },
  "馬": {
    "char": "馬",
    "codes": [
      "尸",
      "火"
    ],
    "keys": [
      "S",
      "F"
    ],
    "first_code": "尸",
    "last_code": "火",
    "first_key": "S",
    "last_key": "F",
    "full": "尸火 (SF)",
    "cj_full": "尸手尸火 (SQSF)",
    "secret": "【馬】速成取碼：首碼【尸】(S) ＋ 尾碼【火】(F)",
    "quickCode": "SF"
  },
  "兌": {
    "char": "兌",
    "codes": [
      "金",
      "山"
    ],
    "keys": [
      "C",
      "U"
    ],
    "first_code": "金",
    "last_code": "山",
    "first_key": "C",
    "last_key": "U",
    "full": "金山 (CU)",
    "cj_full": "金口竹山 (CRHU)",
    "secret": "【兌】速成取碼：首碼【金】(C) ＋ 尾碼【山】(U)",
    "quickCode": "CU"
  },
  "頁": {
    "char": "頁",
    "codes": [
      "一",
      "金"
    ],
    "keys": [
      "M",
      "C"
    ],
    "first_code": "一",
    "last_code": "金",
    "first_key": "M",
    "last_key": "C",
    "full": "一金 (MC)",
    "cj_full": "一月山金 (MBUC)",
    "secret": "【頁】速成取碼：首碼【一】(M) ＋ 尾碼【金】(C)",
    "quickCode": "MC"
  },
  "先": {
    "char": "先",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹土竹山 (HGHU)",
    "secret": "【先】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "臣": {
    "char": "臣",
    "codes": [
      "尸",
      "中"
    ],
    "keys": [
      "S",
      "L"
    ],
    "first_code": "尸",
    "last_code": "中",
    "first_key": "S",
    "last_key": "L",
    "full": "尸中 (SL)",
    "cj_full": "尸中尸中 (SLSL)",
    "secret": "【臣】速成取碼：首碼【尸】(S) ＋ 尾碼【中】(L)",
    "quickCode": "SL"
  },
  "辰": {
    "char": "辰",
    "codes": [
      "一",
      "女"
    ],
    "keys": [
      "M",
      "V"
    ],
    "first_code": "一",
    "last_code": "女",
    "first_key": "M",
    "last_key": "V",
    "full": "一女 (MV)",
    "cj_full": "一一一女 (MMMV)",
    "secret": "【辰】速成取碼：首碼【一】(M) ＋ 尾碼【女】(V)",
    "quickCode": "MV"
  },
  "其": {
    "char": "其",
    "codes": [
      "廿",
      "金"
    ],
    "keys": [
      "T",
      "C"
    ],
    "first_code": "廿",
    "last_code": "金",
    "first_key": "T",
    "last_key": "C",
    "full": "廿金 (TC)",
    "cj_full": "廿一一金 (TMMC)",
    "secret": "【其】速成取碼：首碼【廿】(T) ＋ 尾碼【金】(C)",
    "quickCode": "TC"
  },
  "乘": {
    "char": "乘",
    "codes": [
      "竹",
      "心"
    ],
    "keys": [
      "H",
      "P"
    ],
    "first_code": "竹",
    "last_code": "心",
    "first_key": "H",
    "last_key": "P",
    "full": "竹心 (HP)",
    "cj_full": "竹木中心 (HDLP)",
    "secret": "【乘】速成取碼：首碼【竹】(H) ＋ 尾碼【心】(P)",
    "quickCode": "HP"
  },
  "島": {
    "char": "島",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹日卜山 (HAYU)",
    "secret": "【島】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "互": {
    "char": "互",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一女弓一 (MVNM)",
    "secret": "【互】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "充": {
    "char": "充",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜戈竹山 (YIHU)",
    "secret": "【充】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "與": {
    "char": "與",
    "codes": [
      "竹",
      "金"
    ],
    "keys": [
      "H",
      "C"
    ],
    "first_code": "竹",
    "last_code": "金",
    "first_key": "H",
    "last_key": "C",
    "full": "竹金 (HC)",
    "cj_full": "竹難月金 (HXBC)",
    "secret": "【與】速成取碼：首碼【竹】(H) ＋ 尾碼【金】(C)",
    "quickCode": "HC"
  },
  "商": {
    "char": "商",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜金月口 (YCBR)",
    "secret": "【商】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "為": {
    "char": "為",
    "codes": [
      "戈",
      "火"
    ],
    "keys": [
      "I",
      "F"
    ],
    "first_code": "戈",
    "last_code": "火",
    "first_key": "I",
    "last_key": "F",
    "full": "戈火 (IF)",
    "cj_full": "戈大弓火 (IKNF)",
    "secret": "【為】速成取碼：首碼【戈】(I) ＋ 尾碼【火】(F)",
    "quickCode": "IF"
  },
  "真": {
    "char": "真",
    "codes": [
      "十",
      "金"
    ],
    "keys": [
      "J",
      "C"
    ],
    "first_code": "十",
    "last_code": "金",
    "first_key": "J",
    "last_key": "C",
    "full": "十金 (JC)",
    "cj_full": "十月一金 (JBMC)",
    "secret": "【真】速成取碼：首碼【十】(J) ＋ 尾碼【金】(C)",
    "quickCode": "JC"
  },
  "業": {
    "char": "業",
    "codes": [
      "廿",
      "木"
    ],
    "keys": [
      "T",
      "D"
    ],
    "first_code": "廿",
    "last_code": "木",
    "first_key": "T",
    "last_key": "D",
    "full": "廿木 (TD)",
    "cj_full": "廿金廿木 (TCTD)",
    "secret": "【業】速成取碼：首碼【廿】(T) ＋ 尾碼【木】(D)",
    "quickCode": "TD"
  },
  "矛": {
    "char": "矛",
    "codes": [
      "弓",
      "竹"
    ],
    "keys": [
      "N",
      "H"
    ],
    "first_code": "弓",
    "last_code": "竹",
    "first_key": "N",
    "last_key": "H",
    "full": "弓竹 (NH)",
    "cj_full": "弓戈弓竹 (NINH)",
    "secret": "【矛】速成取碼：首碼【弓】(N) ＋ 尾碼【竹】(H)",
    "quickCode": "NH"
  },
  "色": {
    "char": "色",
    "codes": [
      "弓",
      "山"
    ],
    "keys": [
      "N",
      "U"
    ],
    "first_code": "弓",
    "last_code": "山",
    "first_key": "N",
    "last_key": "U",
    "full": "弓山 (NU)",
    "cj_full": "弓日山 (NAU)",
    "secret": "【色】速成取碼：首碼【弓】(N) ＋ 尾碼【山】(U)",
    "quickCode": "NU"
  },
  "角": {
    "char": "角",
    "codes": [
      "弓",
      "土"
    ],
    "keys": [
      "N",
      "G"
    ],
    "first_code": "弓",
    "last_code": "土",
    "first_key": "N",
    "last_key": "G",
    "full": "弓土 (NG)",
    "cj_full": "弓月土 (NBG)",
    "secret": "【角】速成取碼：首碼【弓】(N) ＋ 尾碼【土】(G)",
    "quickCode": "NG"
  },
  "夫": {
    "char": "夫",
    "codes": [
      "手",
      "人"
    ],
    "keys": [
      "Q",
      "O"
    ],
    "first_code": "手",
    "last_code": "人",
    "first_key": "Q",
    "last_key": "O",
    "full": "手人 (QO)",
    "cj_full": "手人 (QO)",
    "secret": "【夫】速成取碼：首碼【手】(Q) ＋ 尾碼【人】(O)",
    "quickCode": "QO"
  },
  "井": {
    "char": "井",
    "codes": [
      "廿",
      "廿"
    ],
    "keys": [
      "T",
      "T"
    ],
    "first_code": "廿",
    "last_code": "廿",
    "first_key": "T",
    "last_key": "T",
    "full": "廿廿 (TT)",
    "cj_full": "廿廿 (TT)",
    "secret": "【井】速成取碼：首碼【廿】(T) ＋ 尾碼【廿】(T)",
    "quickCode": "TT"
  },
  "及": {
    "char": "及",
    "codes": [
      "弓",
      "水"
    ],
    "keys": [
      "N",
      "E"
    ],
    "first_code": "弓",
    "last_code": "水",
    "first_key": "N",
    "last_key": "E",
    "full": "弓水 (NE)",
    "cj_full": "弓竹水 (NHE)",
    "secret": "【及】速成取碼：首碼【弓】(N) ＋ 尾碼【水】(E)",
    "quickCode": "NE"
  },
  "氏": {
    "char": "氏",
    "codes": [
      "竹",
      "心"
    ],
    "keys": [
      "H",
      "P"
    ],
    "first_code": "竹",
    "last_code": "心",
    "first_key": "H",
    "last_key": "P",
    "full": "竹心 (HP)",
    "cj_full": "竹女心 (HVP)",
    "secret": "【氏】速成取碼：首碼【竹】(H) ＋ 尾碼【心】(P)",
    "quickCode": "HP"
  },
  "之": {
    "char": "之",
    "codes": [
      "戈",
      "人"
    ],
    "keys": [
      "I",
      "O"
    ],
    "first_code": "戈",
    "last_code": "人",
    "first_key": "I",
    "last_key": "O",
    "full": "戈人 (IO)",
    "cj_full": "戈弓人 (INO)",
    "secret": "【之】速成取碼：首碼【戈】(I) ＋ 尾碼【人】(O)",
    "quickCode": "IO"
  },
  "巨": {
    "char": "巨",
    "codes": [
      "尸",
      "尸"
    ],
    "keys": [
      "S",
      "S"
    ],
    "first_code": "尸",
    "last_code": "尸",
    "first_key": "S",
    "last_key": "S",
    "full": "尸尸 (SS)",
    "cj_full": "尸尸 (SS)",
    "secret": "【巨】速成取碼：首碼【尸】(S) ＋ 尾碼【尸】(S)",
    "quickCode": "SS"
  },
  "市": {
    "char": "市",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜中月 (YLB)",
    "secret": "【市】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "萬": {
    "char": "萬",
    "codes": [
      "廿",
      "月"
    ],
    "keys": [
      "T",
      "B"
    ],
    "first_code": "廿",
    "last_code": "月",
    "first_key": "T",
    "last_key": "B",
    "full": "廿月 (TB)",
    "cj_full": "廿田中月 (TWLB)",
    "secret": "【萬】速成取碼：首碼【廿】(T) ＋ 尾碼【月】(B)",
    "quickCode": "TB"
  },
  "力": {
    "char": "力",
    "codes": [
      "大",
      "尸"
    ],
    "keys": [
      "K",
      "S"
    ],
    "first_code": "大",
    "last_code": "尸",
    "first_key": "K",
    "last_key": "S",
    "full": "大尸 (KS)",
    "cj_full": "大尸 (KS)",
    "secret": "【力】速成取碼：首碼【大】(K) ＋ 尾碼【尸】(S)",
    "quickCode": "KS"
  },
  "孝": {
    "char": "孝",
    "codes": [
      "十",
      "木"
    ],
    "keys": [
      "J",
      "D"
    ],
    "first_code": "十",
    "last_code": "木",
    "first_key": "J",
    "last_key": "D",
    "full": "十木 (JD)",
    "cj_full": "十大弓木 (JKND)",
    "secret": "【孝】速成取碼：首碼【十】(J) ＋ 尾碼【木】(D)",
    "quickCode": "JD"
  },
  "功": {
    "char": "功",
    "codes": [
      "一",
      "尸"
    ],
    "keys": [
      "M",
      "S"
    ],
    "first_code": "一",
    "last_code": "尸",
    "first_key": "M",
    "last_key": "S",
    "full": "一尸 (MS)",
    "cj_full": "一大尸 (MKS)",
    "secret": "【功】速成取碼：首碼【一】(M) ＋ 尾碼【尸】(S)",
    "quickCode": "MS"
  },
  "劣": {
    "char": "劣",
    "codes": [
      "火",
      "尸"
    ],
    "keys": [
      "F",
      "S"
    ],
    "first_code": "火",
    "last_code": "尸",
    "first_key": "F",
    "last_key": "S",
    "full": "火尸 (FS)",
    "cj_full": "火竹大尸 (FHKS)",
    "secret": "【劣】速成取碼：首碼【火】(F) ＋ 尾碼【尸】(S)",
    "quickCode": "FS"
  },
  "勞": {
    "char": "勞",
    "codes": [
      "火",
      "尸"
    ],
    "keys": [
      "F",
      "S"
    ],
    "first_code": "火",
    "last_code": "尸",
    "first_key": "F",
    "last_key": "S",
    "full": "火尸 (FS)",
    "cj_full": "火火月大尸 (FFBKS)",
    "secret": "【勞】速成取碼：首碼【火】(F) ＋ 尾碼【尸】(S)",
    "quickCode": "FS"
  },
  "半": {
    "char": "半",
    "codes": [
      "火",
      "手"
    ],
    "keys": [
      "F",
      "Q"
    ],
    "first_code": "火",
    "last_code": "手",
    "first_key": "F",
    "last_key": "Q",
    "full": "火手 (FQ)",
    "cj_full": "火手 (FQ)",
    "secret": "【半】速成取碼：首碼【火】(F) ＋ 尾碼【手】(Q)",
    "quickCode": "FQ"
  },
  "乎": {
    "char": "乎",
    "codes": [
      "竹",
      "木"
    ],
    "keys": [
      "H",
      "D"
    ],
    "first_code": "竹",
    "last_code": "木",
    "first_key": "H",
    "last_key": "D",
    "full": "竹木 (HD)",
    "cj_full": "竹火木 (HFD)",
    "secret": "【乎】速成取碼：首碼【竹】(H) ＋ 尾碼【木】(D)",
    "quickCode": "HD"
  },
  "缶": {
    "char": "缶",
    "codes": [
      "人",
      "山"
    ],
    "keys": [
      "O",
      "U"
    ],
    "first_code": "人",
    "last_code": "山",
    "first_key": "O",
    "last_key": "U",
    "full": "人山 (OU)",
    "cj_full": "人十山 (OJU)",
    "secret": "【缶】速成取碼：首碼【人】(O) ＋ 尾碼【山】(U)",
    "quickCode": "OU"
  },
  "也": {
    "char": "也",
    "codes": [
      "心",
      "木"
    ],
    "keys": [
      "P",
      "D"
    ],
    "first_code": "心",
    "last_code": "木",
    "first_key": "P",
    "last_key": "D",
    "full": "心木 (PD)",
    "cj_full": "心木 (PD)",
    "secret": "【也】速成取碼：首碼【心】(P) ＋ 尾碼【木】(D)",
    "quickCode": "PD"
  },
  "世": {
    "char": "世",
    "codes": [
      "心",
      "廿"
    ],
    "keys": [
      "P",
      "T"
    ],
    "first_code": "心",
    "last_code": "廿",
    "first_key": "P",
    "last_key": "T",
    "full": "心廿 (PT)",
    "cj_full": "心廿 (PT)",
    "secret": "【世】速成取碼：首碼【心】(P) ＋ 尾碼【廿】(T)",
    "quickCode": "PT"
  },
  "七": {
    "char": "七",
    "codes": [
      "十",
      "山"
    ],
    "keys": [
      "J",
      "U"
    ],
    "first_code": "十",
    "last_code": "山",
    "first_key": "J",
    "last_key": "U",
    "full": "十山 (JU)",
    "cj_full": "十山 (JU)",
    "secret": "【七】速成取碼：首碼【十】(J) ＋ 尾碼【山】(U)",
    "quickCode": "JU"
  },
  "者": {
    "char": "者",
    "codes": [
      "十",
      "日"
    ],
    "keys": [
      "J",
      "A"
    ],
    "first_code": "十",
    "last_code": "日",
    "first_key": "J",
    "last_key": "A",
    "full": "十日 (JA)",
    "cj_full": "十大日 (JKA)",
    "secret": "【者】速成取碼：首碼【十】(J) ＋ 尾碼【日】(A)",
    "quickCode": "JA"
  },
  "夜": {
    "char": "夜",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜人弓大 (YONK)",
    "secret": "【夜】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "匆": {
    "char": "匆",
    "codes": [
      "心",
      "大"
    ],
    "keys": [
      "P",
      "K"
    ],
    "first_code": "心",
    "last_code": "大",
    "first_key": "P",
    "last_key": "K",
    "full": "心大 (PK)",
    "cj_full": "心大大 (PKK)",
    "secret": "【匆】速成取碼：首碼【心】(P) ＋ 尾碼【大】(K)",
    "quickCode": "PK"
  },
  "囪": {
    "char": "囪",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹田大大 (HWKK)",
    "secret": "【囪】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "由": {
    "char": "由",
    "codes": [
      "中",
      "田"
    ],
    "keys": [
      "L",
      "W"
    ],
    "first_code": "中",
    "last_code": "田",
    "first_key": "L",
    "last_key": "W",
    "full": "中田 (LW)",
    "cj_full": "中田 (LW)",
    "secret": "【由】速成取碼：首碼【中】(L) ＋ 尾碼【田】(W)",
    "quickCode": "LW"
  },
  "甲": {
    "char": "甲",
    "codes": [
      "田",
      "中"
    ],
    "keys": [
      "W",
      "L"
    ],
    "first_code": "田",
    "last_code": "中",
    "first_key": "W",
    "last_key": "L",
    "full": "田中 (WL)",
    "cj_full": "田中 (WL)",
    "secret": "【甲】速成取碼：首碼【田】(W) ＋ 尾碼【中】(L)",
    "quickCode": "WL"
  },
  "曳": {
    "char": "曳",
    "codes": [
      "中",
      "心"
    ],
    "keys": [
      "L",
      "P"
    ],
    "first_code": "中",
    "last_code": "心",
    "first_key": "L",
    "last_key": "P",
    "full": "中心 (LP)",
    "cj_full": "中田心 (LWP)",
    "secret": "【曳】速成取碼：首碼【中】(L) ＋ 尾碼【心】(P)",
    "quickCode": "LP"
  },
  "洩": {
    "char": "洩",
    "codes": [
      "水",
      "心"
    ],
    "keys": [
      "E",
      "P"
    ],
    "first_code": "水",
    "last_code": "心",
    "first_key": "E",
    "last_key": "P",
    "full": "水心 (EP)",
    "cj_full": "水中田心 (ELWP)",
    "secret": "【洩】速成取碼：首碼【水】(E) ＋ 尾碼【心】(P)",
    "quickCode": "EP"
  },
  "軒": {
    "char": "軒",
    "codes": [
      "十",
      "十"
    ],
    "keys": [
      "J",
      "J"
    ],
    "first_code": "十",
    "last_code": "十",
    "first_key": "J",
    "last_key": "J",
    "full": "十十 (JJ)",
    "cj_full": "十十一十 (JJMJ)",
    "secret": "【軒】速成取碼：首碼【十】(J) ＋ 尾碼【十】(J)",
    "quickCode": "JJ"
  },
  "奄": {
    "char": "奄",
    "codes": [
      "大",
      "山"
    ],
    "keys": [
      "K",
      "U"
    ],
    "first_code": "大",
    "last_code": "山",
    "first_key": "K",
    "last_key": "U",
    "full": "大山 (KU)",
    "cj_full": "大中田山 (KLWU)",
    "secret": "【奄】速成取碼：首碼【大】(K) ＋ 尾碼【山】(U)",
    "quickCode": "KU"
  },
  "淹": {
    "char": "淹",
    "codes": [
      "水",
      "山"
    ],
    "keys": [
      "E",
      "U"
    ],
    "first_code": "水",
    "last_code": "山",
    "first_key": "E",
    "last_key": "U",
    "full": "水山 (EU)",
    "cj_full": "水大中田山 (EKLWU)",
    "secret": "【淹】速成取碼：首碼【水】(E) ＋ 尾碼【山】(U)",
    "quickCode": "EU"
  },
  "吏": {
    "char": "吏",
    "codes": [
      "十",
      "大"
    ],
    "keys": [
      "J",
      "K"
    ],
    "first_code": "十",
    "last_code": "大",
    "first_key": "J",
    "last_key": "K",
    "full": "十大 (JK)",
    "cj_full": "十中大 (JLK)",
    "secret": "【吏】速成取碼：首碼【十】(J) ＋ 尾碼【大】(K)",
    "quickCode": "JK"
  },
  "婁": {
    "char": "婁",
    "codes": [
      "中",
      "女"
    ],
    "keys": [
      "L",
      "V"
    ],
    "first_code": "中",
    "last_code": "女",
    "first_key": "L",
    "last_key": "V",
    "full": "中女 (LV)",
    "cj_full": "中中女 (LLV)",
    "secret": "【婁】速成取碼：首碼【中】(L) ＋ 尾碼【女】(V)",
    "quickCode": "LV"
  },
  "縷": {
    "char": "縷",
    "codes": [
      "女",
      "女"
    ],
    "keys": [
      "V",
      "V"
    ],
    "first_code": "女",
    "last_code": "女",
    "first_key": "V",
    "last_key": "V",
    "full": "女女 (VV)",
    "cj_full": "女火中中女 (VFLLV)",
    "secret": "【縷】速成取碼：首碼【女】(V) ＋ 尾碼【女】(V)",
    "quickCode": "VV"
  },
  "向": {
    "char": "向",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹月口 (HBR)",
    "secret": "【向】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "師": {
    "char": "師",
    "codes": [
      "戈",
      "月"
    ],
    "keys": [
      "I",
      "B"
    ],
    "first_code": "戈",
    "last_code": "月",
    "first_key": "I",
    "last_key": "B",
    "full": "戈月 (IB)",
    "cj_full": "戈竹一中月 (IHMLB)",
    "secret": "【師】速成取碼：首碼【戈】(I) ＋ 尾碼【月】(B)",
    "quickCode": "IB"
  },
  "永": {
    "char": "永",
    "codes": [
      "戈",
      "水"
    ],
    "keys": [
      "I",
      "E"
    ],
    "first_code": "戈",
    "last_code": "水",
    "first_key": "I",
    "last_key": "E",
    "full": "戈水 (IE)",
    "cj_full": "戈弓水 (INE)",
    "secret": "【永】速成取碼：首碼【戈】(I) ＋ 尾碼【水】(E)",
    "quickCode": "IE"
  },
  "羊": {
    "char": "羊",
    "codes": [
      "廿",
      "手"
    ],
    "keys": [
      "T",
      "Q"
    ],
    "first_code": "廿",
    "last_code": "手",
    "first_key": "T",
    "last_key": "Q",
    "full": "廿手 (TQ)",
    "cj_full": "廿手 (TQ)",
    "secret": "【羊】速成取碼：首碼【廿】(T) ＋ 尾碼【手】(Q)",
    "quickCode": "TQ"
  },
  "牢": {
    "char": "牢",
    "codes": [
      "十",
      "手"
    ],
    "keys": [
      "J",
      "Q"
    ],
    "first_code": "十",
    "last_code": "手",
    "first_key": "J",
    "last_key": "Q",
    "full": "十手 (JQ)",
    "cj_full": "十竹手 (JHQ)",
    "secret": "【牢】速成取碼：首碼【十】(J) ＋ 尾碼【手】(Q)",
    "quickCode": "JQ"
  },
  "扒": {
    "char": "扒",
    "codes": [
      "手",
      "金"
    ],
    "keys": [
      "Q",
      "C"
    ],
    "first_code": "手",
    "last_code": "金",
    "first_key": "Q",
    "last_key": "C",
    "full": "手金 (QC)",
    "cj_full": "手金 (QC)",
    "secret": "【扒】速成取碼：首碼【手】(Q) ＋ 尾碼【金】(C)",
    "quickCode": "QC"
  },
  "丹": {
    "char": "丹",
    "codes": [
      "月",
      "卜"
    ],
    "keys": [
      "B",
      "Y"
    ],
    "first_code": "月",
    "last_code": "卜",
    "first_key": "B",
    "last_key": "Y",
    "full": "月卜 (BY)",
    "cj_full": "月卜 (BY)",
    "secret": "【丹】速成取碼：首碼【月】(B) ＋ 尾碼【卜】(Y)",
    "quickCode": "BY"
  },
  "扳": {
    "char": "扳",
    "codes": [
      "手",
      "水"
    ],
    "keys": [
      "Q",
      "E"
    ],
    "first_code": "手",
    "last_code": "水",
    "first_key": "Q",
    "last_key": "E",
    "full": "手水 (QE)",
    "cj_full": "手竹水 (QHE)",
    "secret": "【扳】速成取碼：首碼【手】(Q) ＋ 尾碼【水】(E)",
    "quickCode": "QE"
  },
  "展": {
    "char": "展",
    "codes": [
      "尸",
      "女"
    ],
    "keys": [
      "S",
      "V"
    ],
    "first_code": "尸",
    "last_code": "女",
    "first_key": "S",
    "last_key": "V",
    "full": "尸女 (SV)",
    "cj_full": "尸廿女 (STV)",
    "secret": "【展】速成取碼：首碼【尸】(S) ＋ 尾碼【女】(V)",
    "quickCode": "SV"
  },
  "姘": {
    "char": "姘",
    "codes": [
      "女",
      "廿"
    ],
    "keys": [
      "V",
      "T"
    ],
    "first_code": "女",
    "last_code": "廿",
    "first_key": "V",
    "last_key": "T",
    "full": "女廿 (VT)",
    "cj_full": "女廿廿 (VTT)",
    "secret": "【姘】速成取碼：首碼【女】(V) ＋ 尾碼【廿】(T)",
    "quickCode": "VT"
  },
  "曲": {
    "char": "曲",
    "codes": [
      "廿",
      "田"
    ],
    "keys": [
      "T",
      "W"
    ],
    "first_code": "廿",
    "last_code": "田",
    "first_key": "T",
    "last_key": "W",
    "full": "廿田 (TW)",
    "cj_full": "廿田 (TW)",
    "secret": "【曲】速成取碼：首碼【廿】(T) ＋ 尾碼【田】(W)",
    "quickCode": "TW"
  },
  "芒": {
    "char": "芒",
    "codes": [
      "廿",
      "女"
    ],
    "keys": [
      "T",
      "V"
    ],
    "first_code": "廿",
    "last_code": "女",
    "first_key": "T",
    "last_key": "V",
    "full": "廿女 (TV)",
    "cj_full": "廿卜女 (TYV)",
    "secret": "【芒】速成取碼：首碼【廿】(T) ＋ 尾碼【女】(V)",
    "quickCode": "TV"
  },
  "已": {
    "char": "已",
    "codes": [
      "尸",
      "山"
    ],
    "keys": [
      "S",
      "U"
    ],
    "first_code": "尸",
    "last_code": "山",
    "first_key": "S",
    "last_key": "U",
    "full": "尸山 (SU)",
    "cj_full": "尸山 (SU)",
    "secret": "【已】速成取碼：首碼【尸】(S) ＋ 尾碼【山】(U)",
    "quickCode": "SU"
  },
  "屈": {
    "char": "屈",
    "codes": [
      "尸",
      "山"
    ],
    "keys": [
      "S",
      "U"
    ],
    "first_code": "尸",
    "last_code": "山",
    "first_key": "S",
    "last_key": "U",
    "full": "尸山 (SU)",
    "cj_full": "尸山山 (SUU)",
    "secret": "【屈】速成取碼：首碼【尸】(S) ＋ 尾碼【山】(U)",
    "quickCode": "SU"
  },
  "茁": {
    "char": "茁",
    "codes": [
      "廿",
      "山"
    ],
    "keys": [
      "T",
      "U"
    ],
    "first_code": "廿",
    "last_code": "山",
    "first_key": "T",
    "last_key": "U",
    "full": "廿山 (TU)",
    "cj_full": "廿山山 (TUU)",
    "secret": "【茁】速成取碼：首碼【廿】(T) ＋ 尾碼【山】(U)",
    "quickCode": "TU"
  },
  "甘": {
    "char": "甘",
    "codes": [
      "廿",
      "一"
    ],
    "keys": [
      "T",
      "M"
    ],
    "first_code": "廿",
    "last_code": "一",
    "first_key": "T",
    "last_key": "M",
    "full": "廿一 (TM)",
    "cj_full": "廿一 (TM)",
    "secret": "【甘】速成取碼：首碼【廿】(T) ＋ 尾碼【一】(M)",
    "quickCode": "TM"
  },
  "苟": {
    "char": "苟",
    "codes": [
      "廿",
      "口"
    ],
    "keys": [
      "T",
      "R"
    ],
    "first_code": "廿",
    "last_code": "口",
    "first_key": "T",
    "last_key": "R",
    "full": "廿口 (TR)",
    "cj_full": "廿心口 (TPR)",
    "secret": "【苟】速成取碼：首碼【廿】(T) ＋ 尾碼【口】(R)",
    "quickCode": "TR"
  },
  "泵": {
    "char": "泵",
    "codes": [
      "一",
      "水"
    ],
    "keys": [
      "M",
      "E"
    ],
    "first_code": "一",
    "last_code": "水",
    "first_key": "M",
    "last_key": "E",
    "full": "一水 (ME)",
    "cj_full": "一口水 (MRE)",
    "secret": "【泵】速成取碼：首碼【一】(M) ＋ 尾碼【水】(E)",
    "quickCode": "ME"
  },
  "屁": {
    "char": "屁",
    "codes": [
      "尸",
      "心"
    ],
    "keys": [
      "S",
      "P"
    ],
    "first_code": "尸",
    "last_code": "心",
    "first_key": "S",
    "last_key": "P",
    "full": "尸心 (SP)",
    "cj_full": "尸心心 (SPP)",
    "secret": "【屁】速成取碼：首碼【尸】(S) ＋ 尾碼【心】(P)",
    "quickCode": "SP"
  },
  "迴": {
    "char": "迴",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜田口 (YWR)",
    "secret": "【迴】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "徊": {
    "char": "徊",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹人田口 (HOWR)",
    "secret": "【徊】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "幻": {
    "char": "幻",
    "codes": [
      "女",
      "尸"
    ],
    "keys": [
      "V",
      "S"
    ],
    "first_code": "女",
    "last_code": "尸",
    "first_key": "V",
    "last_key": "S",
    "full": "女尸 (VS)",
    "cj_full": "女戈尸 (VIS)",
    "secret": "【幻】速成取碼：首碼【女】(V) ＋ 尾碼【尸】(S)",
    "quickCode": "VS"
  },
  "乩": {
    "char": "乩",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜口山 (YRU)",
    "secret": "【乩】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "忌": {
    "char": "忌",
    "codes": [
      "尸",
      "心"
    ],
    "keys": [
      "S",
      "P"
    ],
    "first_code": "尸",
    "last_code": "心",
    "first_key": "S",
    "last_key": "P",
    "full": "尸心 (SP)",
    "cj_full": "尸山心 (SUP)",
    "secret": "【忌】速成取碼：首碼【尸】(S) ＋ 尾碼【心】(P)",
    "quickCode": "SP"
  },
  "窄": {
    "char": "窄",
    "codes": [
      "十",
      "尸"
    ],
    "keys": [
      "J",
      "S"
    ],
    "first_code": "十",
    "last_code": "尸",
    "first_key": "J",
    "last_key": "S",
    "full": "十尸 (JS)",
    "cj_full": "十金人尸 (JCOS)",
    "secret": "【窄】速成取碼：首碼【十】(J) ＋ 尾碼【尸】(S)",
    "quickCode": "JS"
  },
  "帚": {
    "char": "帚",
    "codes": [
      "尸",
      "月"
    ],
    "keys": [
      "S",
      "B"
    ],
    "first_code": "尸",
    "last_code": "月",
    "first_key": "S",
    "last_key": "B",
    "full": "尸月 (SB)",
    "cj_full": "尸一月中月 (SMBLB)",
    "secret": "【帚】速成取碼：首碼【尸】(S) ＋ 尾碼【月】(B)",
    "quickCode": "SB"
  },
  "刃": {
    "char": "刃",
    "codes": [
      "尸",
      "戈"
    ],
    "keys": [
      "S",
      "I"
    ],
    "first_code": "尸",
    "last_code": "戈",
    "first_key": "S",
    "last_key": "I",
    "full": "尸戈 (SI)",
    "cj_full": "尸竹戈 (SHI)",
    "secret": "【刃】速成取碼：首碼【尸】(S) ＋ 尾碼【戈】(I)",
    "quickCode": "SI"
  },
  "長": {
    "char": "長",
    "codes": [
      "尸",
      "女"
    ],
    "keys": [
      "S",
      "V"
    ],
    "first_code": "尸",
    "last_code": "女",
    "first_key": "S",
    "last_key": "V",
    "full": "尸女 (SV)",
    "cj_full": "尸一女 (SMV)",
    "secret": "【長】速成取碼：首碼【尸】(S) ＋ 尾碼【女】(V)",
    "quickCode": "SV"
  },
  "句": {
    "char": "句",
    "codes": [
      "心",
      "口"
    ],
    "keys": [
      "P",
      "R"
    ],
    "first_code": "心",
    "last_code": "口",
    "first_key": "P",
    "last_key": "R",
    "full": "心口 (PR)",
    "cj_full": "心口 (PR)",
    "secret": "【句】速成取碼：首碼【心】(P) ＋ 尾碼【口】(R)",
    "quickCode": "PR"
  },
  "穴": {
    "char": "穴",
    "codes": [
      "十",
      "金"
    ],
    "keys": [
      "J",
      "C"
    ],
    "first_code": "十",
    "last_code": "金",
    "first_key": "J",
    "last_key": "C",
    "full": "十金 (JC)",
    "cj_full": "十金 (JC)",
    "secret": "【穴】速成取碼：首碼【十】(J) ＋ 尾碼【金】(C)",
    "quickCode": "JC"
  },
  "豆": {
    "char": "豆",
    "codes": [
      "一",
      "廿"
    ],
    "keys": [
      "M",
      "T"
    ],
    "first_code": "一",
    "last_code": "廿",
    "first_key": "M",
    "last_key": "T",
    "full": "一廿 (MT)",
    "cj_full": "一口廿 (MRT)",
    "secret": "【豆】速成取碼：首碼【一】(M) ＋ 尾碼【廿】(T)",
    "quickCode": "MT"
  },
  "恭": {
    "char": "恭",
    "codes": [
      "廿",
      "心"
    ],
    "keys": [
      "T",
      "P"
    ],
    "first_code": "廿",
    "last_code": "心",
    "first_key": "T",
    "last_key": "P",
    "full": "廿心 (TP)",
    "cj_full": "廿金心 (TCP)",
    "secret": "【恭】速成取碼：首碼【廿】(T) ＋ 尾碼【心】(P)",
    "quickCode": "TP"
  },
  "皿": {
    "char": "皿",
    "codes": [
      "月",
      "廿"
    ],
    "keys": [
      "B",
      "T"
    ],
    "first_code": "月",
    "last_code": "廿",
    "first_key": "B",
    "last_key": "T",
    "full": "月廿 (BT)",
    "cj_full": "月廿 (BT)",
    "secret": "【皿】速成取碼：首碼【月】(B) ＋ 尾碼【廿】(T)",
    "quickCode": "BT"
  },
  "逆": {
    "char": "逆",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜廿山 (YTU)",
    "secret": "【逆】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "以": {
    "char": "以",
    "codes": [
      "女",
      "人"
    ],
    "keys": [
      "V",
      "O"
    ],
    "first_code": "女",
    "last_code": "人",
    "first_key": "V",
    "last_key": "O",
    "full": "女人 (VO)",
    "cj_full": "女戈人 (VIO)",
    "secret": "【以】速成取碼：首碼【女】(V) ＋ 尾碼【人】(O)",
    "quickCode": "VO"
  },
  "妄": {
    "char": "妄",
    "codes": [
      "卜",
      "女"
    ],
    "keys": [
      "Y",
      "V"
    ],
    "first_code": "卜",
    "last_code": "女",
    "first_key": "Y",
    "last_key": "V",
    "full": "卜女 (YV)",
    "cj_full": "卜女女 (YVV)",
    "secret": "【妄】速成取碼：首碼【卜】(Y) ＋ 尾碼【女】(V)",
    "quickCode": "YV"
  },
  "方": {
    "char": "方",
    "codes": [
      "卜",
      "尸"
    ],
    "keys": [
      "Y",
      "S"
    ],
    "first_code": "卜",
    "last_code": "尸",
    "first_key": "Y",
    "last_key": "S",
    "full": "卜尸 (YS)",
    "cj_full": "卜竹尸 (YHS)",
    "secret": "【方】速成取碼：首碼【卜】(Y) ＋ 尾碼【尸】(S)",
    "quickCode": "YS"
  },
  "週": {
    "char": "週",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜月土口 (YBGR)",
    "secret": "【週】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "幸": {
    "char": "幸",
    "codes": [
      "土",
      "十"
    ],
    "keys": [
      "G",
      "J"
    ],
    "first_code": "土",
    "last_code": "十",
    "first_key": "G",
    "last_key": "J",
    "full": "土十 (GJ)",
    "cj_full": "土廿十 (GTJ)",
    "secret": "【幸】速成取碼：首碼【土】(G) ＋ 尾碼【十】(J)",
    "quickCode": "GJ"
  },
  "皇": {
    "char": "皇",
    "codes": [
      "竹",
      "土"
    ],
    "keys": [
      "H",
      "G"
    ],
    "first_code": "竹",
    "last_code": "土",
    "first_key": "H",
    "last_key": "G",
    "full": "竹土 (HG)",
    "cj_full": "竹日一土 (HAMG)",
    "secret": "【皇】速成取碼：首碼【竹】(H) ＋ 尾碼【土】(G)",
    "quickCode": "HG"
  },
  "刺": {
    "char": "刺",
    "codes": [
      "木",
      "弓"
    ],
    "keys": [
      "D",
      "N"
    ],
    "first_code": "木",
    "last_code": "弓",
    "first_key": "D",
    "last_key": "N",
    "full": "木弓 (DN)",
    "cj_full": "木月中弓 (DBLN)",
    "secret": "【刺】速成取碼：首碼【木】(D) ＋ 尾碼【弓】(N)",
    "quickCode": "DN"
  },
  "夷": {
    "char": "夷",
    "codes": [
      "大",
      "弓"
    ],
    "keys": [
      "K",
      "N"
    ],
    "first_code": "大",
    "last_code": "弓",
    "first_key": "K",
    "last_key": "N",
    "full": "大弓 (KN)",
    "cj_full": "大弓 (KN)",
    "secret": "【夷】速成取碼：首碼【大】(K) ＋ 尾碼【弓】(N)",
    "quickCode": "KN"
  },
  "姨": {
    "char": "姨",
    "codes": [
      "女",
      "弓"
    ],
    "keys": [
      "V",
      "N"
    ],
    "first_code": "女",
    "last_code": "弓",
    "first_key": "V",
    "last_key": "N",
    "full": "女弓 (VN)",
    "cj_full": "女大弓 (VKN)",
    "secret": "【姨】速成取碼：首碼【女】(V) ＋ 尾碼【弓】(N)",
    "quickCode": "VN"
  },
  "痍": {
    "char": "痍",
    "codes": [
      "大",
      "弓"
    ],
    "keys": [
      "K",
      "N"
    ],
    "first_code": "大",
    "last_code": "弓",
    "first_key": "K",
    "last_key": "N",
    "full": "大弓 (KN)",
    "cj_full": "大大弓 (KKN)",
    "secret": "【痍】速成取碼：首碼【大】(K) ＋ 尾碼【弓】(N)",
    "quickCode": "KN"
  },
  "卷": {
    "char": "卷",
    "codes": [
      "火",
      "山"
    ],
    "keys": [
      "F",
      "U"
    ],
    "first_code": "火",
    "last_code": "山",
    "first_key": "F",
    "last_key": "U",
    "full": "火山 (FU)",
    "cj_full": "火手尸山 (FQSU)",
    "secret": "【卷】速成取碼：首碼【火】(F) ＋ 尾碼【山】(U)",
    "quickCode": "FU"
  },
  "再": {
    "char": "再",
    "codes": [
      "一",
      "月"
    ],
    "keys": [
      "M",
      "B"
    ],
    "first_code": "一",
    "last_code": "月",
    "first_key": "M",
    "last_key": "B",
    "full": "一月 (MB)",
    "cj_full": "一土月 (MGB)",
    "secret": "【再】速成取碼：首碼【一】(M) ＋ 尾碼【月】(B)",
    "quickCode": "MB"
  },
  "葉": {
    "char": "葉",
    "codes": [
      "心",
      "木"
    ],
    "keys": [
      "P",
      "D"
    ],
    "first_code": "心",
    "last_code": "木",
    "first_key": "P",
    "last_key": "D",
    "full": "心木 (PD)",
    "cj_full": "心廿木 (PTD)",
    "secret": "【葉】速成取碼：首碼【心】(P) ＋ 尾碼【木】(D)",
    "quickCode": "PD"
  },
  "泄": {
    "char": "泄",
    "codes": [
      "水",
      "廿"
    ],
    "keys": [
      "E",
      "T"
    ],
    "first_code": "水",
    "last_code": "廿",
    "first_key": "E",
    "last_key": "T",
    "full": "水廿 (ET)",
    "cj_full": "水心廿 (EPT)",
    "secret": "【泄】速成取碼：首碼【水】(E) ＋ 尾碼【廿】(T)",
    "quickCode": "ET"
  },
  "碟": {
    "char": "碟",
    "codes": [
      "一",
      "木"
    ],
    "keys": [
      "M",
      "D"
    ],
    "first_code": "一",
    "last_code": "木",
    "first_key": "M",
    "last_key": "D",
    "full": "一木 (MD)",
    "cj_full": "一口心廿木 (MRPTD)",
    "secret": "【碟】速成取碼：首碼【一】(M) ＋ 尾碼【木】(D)",
    "quickCode": "MD"
  },
  "東": {
    "char": "東",
    "codes": [
      "木",
      "田"
    ],
    "keys": [
      "D",
      "W"
    ],
    "first_code": "木",
    "last_code": "田",
    "first_key": "D",
    "last_key": "W",
    "full": "木田 (DW)",
    "cj_full": "木田 (DW)",
    "secret": "【東】速成取碼：首碼【木】(D) ＋ 尾碼【田】(W)",
    "quickCode": "DW"
  },
  "來": {
    "char": "來",
    "codes": [
      "木",
      "人"
    ],
    "keys": [
      "D",
      "O"
    ],
    "first_code": "木",
    "last_code": "人",
    "first_key": "D",
    "last_key": "O",
    "full": "木人 (DO)",
    "cj_full": "木人人 (DOO)",
    "secret": "【來】速成取碼：首碼【木】(D) ＋ 尾碼【人】(O)",
    "quickCode": "DO"
  },
  "睞": {
    "char": "睞",
    "codes": [
      "月",
      "人"
    ],
    "keys": [
      "B",
      "O"
    ],
    "first_code": "月",
    "last_code": "人",
    "first_key": "B",
    "last_key": "O",
    "full": "月人 (BO)",
    "cj_full": "月山木人人 (BUDOO)",
    "secret": "【睞】速成取碼：首碼【月】(B) ＋ 尾碼【人】(O)",
    "quickCode": "BO"
  },
  "束": {
    "char": "束",
    "codes": [
      "木",
      "中"
    ],
    "keys": [
      "D",
      "L"
    ],
    "first_code": "木",
    "last_code": "中",
    "first_key": "D",
    "last_key": "L",
    "full": "木中 (DL)",
    "cj_full": "木中 (DL)",
    "secret": "【束】速成取碼：首碼【木】(D) ＋ 尾碼【中】(L)",
    "quickCode": "DL"
  },
  "柬": {
    "char": "柬",
    "codes": [
      "木",
      "火"
    ],
    "keys": [
      "D",
      "F"
    ],
    "first_code": "木",
    "last_code": "火",
    "first_key": "D",
    "last_key": "F",
    "full": "木火 (DF)",
    "cj_full": "木田火 (DWF)",
    "secret": "【柬】速成取碼：首碼【木】(D) ＋ 尾碼【火】(F)",
    "quickCode": "DF"
  },
  "鍊": {
    "char": "鍊",
    "codes": [
      "金",
      "火"
    ],
    "keys": [
      "C",
      "F"
    ],
    "first_code": "金",
    "last_code": "火",
    "first_key": "C",
    "last_key": "F",
    "full": "金火 (CF)",
    "cj_full": "金木田火 (CDWF)",
    "secret": "【鍊】速成取碼：首碼【金】(C) ＋ 尾碼【火】(F)",
    "quickCode": "CF"
  },
  "煉": {
    "char": "煉",
    "codes": [
      "火",
      "火"
    ],
    "keys": [
      "F",
      "F"
    ],
    "first_code": "火",
    "last_code": "火",
    "first_key": "F",
    "last_key": "F",
    "full": "火火 (FF)",
    "cj_full": "火木田火 (FDWF)",
    "secret": "【煉】速成取碼：首碼【火】(F) ＋ 尾碼【火】(F)",
    "quickCode": "FF"
  },
  "爽": {
    "char": "爽",
    "codes": [
      "大",
      "大"
    ],
    "keys": [
      "K",
      "K"
    ],
    "first_code": "大",
    "last_code": "大",
    "first_key": "K",
    "last_key": "K",
    "full": "大大 (KK)",
    "cj_full": "大大大大 (KKKK)",
    "secret": "【爽】速成取碼：首碼【大】(K) ＋ 尾碼【大】(K)",
    "quickCode": "KK"
  },
  "拳": {
    "char": "拳",
    "codes": [
      "火",
      "手"
    ],
    "keys": [
      "F",
      "Q"
    ],
    "first_code": "火",
    "last_code": "手",
    "first_key": "F",
    "last_key": "Q",
    "full": "火手 (FQ)",
    "cj_full": "火人手 (FOQ)",
    "secret": "【拳】速成取碼：首碼【火】(F) ＋ 尾碼【手】(Q)",
    "quickCode": "FQ"
  },
  "脊": {
    "char": "脊",
    "codes": [
      "火",
      "月"
    ],
    "keys": [
      "F",
      "B"
    ],
    "first_code": "火",
    "last_code": "月",
    "first_key": "F",
    "last_key": "B",
    "full": "火月 (FB)",
    "cj_full": "火金月 (FCB)",
    "secret": "【脊】速成取碼：首碼【火】(F) ＋ 尾碼【月】(B)",
    "quickCode": "FB"
  },
  "夾": {
    "char": "夾",
    "codes": [
      "大",
      "人"
    ],
    "keys": [
      "K",
      "O"
    ],
    "first_code": "大",
    "last_code": "人",
    "first_key": "K",
    "last_key": "O",
    "full": "大人 (KO)",
    "cj_full": "大人人 (KOO)",
    "secret": "【夾】速成取碼：首碼【大】(K) ＋ 尾碼【人】(O)",
    "quickCode": "KO"
  },
  "俠": {
    "char": "俠",
    "codes": [
      "人",
      "人"
    ],
    "keys": [
      "O",
      "O"
    ],
    "first_code": "人",
    "last_code": "人",
    "first_key": "O",
    "last_key": "O",
    "full": "人人 (OO)",
    "cj_full": "人大人人 (OKOO)",
    "secret": "【俠】速成取碼：首碼【人】(O) ＋ 尾碼【人】(O)",
    "quickCode": "OO"
  },
  "峽": {
    "char": "峽",
    "codes": [
      "山",
      "人"
    ],
    "keys": [
      "U",
      "O"
    ],
    "first_code": "山",
    "last_code": "人",
    "first_key": "U",
    "last_key": "O",
    "full": "山人 (UO)",
    "cj_full": "山大人人 (UKOO)",
    "secret": "【峽】速成取碼：首碼【山】(U) ＋ 尾碼【人】(O)",
    "quickCode": "UO"
  },
  "首": {
    "char": "首",
    "codes": [
      "廿",
      "山"
    ],
    "keys": [
      "T",
      "U"
    ],
    "first_code": "廿",
    "last_code": "山",
    "first_key": "T",
    "last_key": "U",
    "full": "廿山 (TU)",
    "cj_full": "廿竹月山 (THBU)",
    "secret": "【首】速成取碼：首碼【廿】(T) ＋ 尾碼【山】(U)",
    "quickCode": "TU"
  },
  "冒": {
    "char": "冒",
    "codes": [
      "日",
      "山"
    ],
    "keys": [
      "A",
      "U"
    ],
    "first_code": "日",
    "last_code": "山",
    "first_key": "A",
    "last_key": "U",
    "full": "日山 (AU)",
    "cj_full": "日月山 (ABU)",
    "secret": "【冒】速成取碼：首碼【日】(A) ＋ 尾碼【山】(U)",
    "quickCode": "AU"
  },
  "隻": {
    "char": "隻",
    "codes": [
      "人",
      "水"
    ],
    "keys": [
      "O",
      "E"
    ],
    "first_code": "人",
    "last_code": "水",
    "first_key": "O",
    "last_key": "E",
    "full": "人水 (OE)",
    "cj_full": "人土水 (OGE)",
    "secret": "【隻】速成取碼：首碼【人】(O) ＋ 尾碼【水】(E)",
    "quickCode": "OE"
  },
  "員": {
    "char": "員",
    "codes": [
      "口",
      "金"
    ],
    "keys": [
      "R",
      "C"
    ],
    "first_code": "口",
    "last_code": "金",
    "first_key": "R",
    "last_key": "C",
    "full": "口金 (RC)",
    "cj_full": "口月山金 (RBUC)",
    "secret": "【員】速成取碼：首碼【口】(R) ＋ 尾碼【金】(C)",
    "quickCode": "RC"
  },
  "眉": {
    "char": "眉",
    "codes": [
      "日",
      "山"
    ],
    "keys": [
      "A",
      "U"
    ],
    "first_code": "日",
    "last_code": "山",
    "first_key": "A",
    "last_key": "U",
    "full": "日山 (AU)",
    "cj_full": "日竹月山 (AHBU)",
    "secret": "【眉】速成取碼：首碼【日】(A) ＋ 尾碼【山】(U)",
    "quickCode": "AU"
  },
  "親": {
    "char": "親",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜木月山山 (YDBUU)",
    "secret": "【親】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "看": {
    "char": "看",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹手月山 (HQBU)",
    "secret": "【看】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "們": {
    "char": "們",
    "codes": [
      "人",
      "弓"
    ],
    "keys": [
      "O",
      "N"
    ],
    "first_code": "人",
    "last_code": "弓",
    "first_key": "O",
    "last_key": "N",
    "full": "人弓 (ON)",
    "cj_full": "人日弓 (OAN)",
    "secret": "【們】速成取碼：首碼【人】(O) ＋ 尾碼【弓】(N)",
    "quickCode": "ON"
  },
  "現": {
    "char": "現",
    "codes": [
      "一",
      "山"
    ],
    "keys": [
      "M",
      "U"
    ],
    "first_code": "一",
    "last_code": "山",
    "first_key": "M",
    "last_key": "U",
    "full": "一山 (MU)",
    "cj_full": "一土一月山 (MGMBU)",
    "secret": "【現】速成取碼：首碼【一】(M) ＋ 尾碼【山】(U)",
    "quickCode": "MU"
  },
  "隊": {
    "char": "隊",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓中廿心人 (NLTPO)",
    "secret": "【隊】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "維": {
    "char": "維",
    "codes": [
      "女",
      "土"
    ],
    "keys": [
      "V",
      "G"
    ],
    "first_code": "女",
    "last_code": "土",
    "first_key": "V",
    "last_key": "G",
    "full": "女土 (VG)",
    "cj_full": "女火人土 (VFOG)",
    "secret": "【維】速成取碼：首碼【女】(V) ＋ 尾碼【土】(G)",
    "quickCode": "VG"
  },
  "覺": {
    "char": "覺",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹月月山山 (HBBUU)",
    "secret": "【覺】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "降": {
    "char": "降",
    "codes": [
      "弓",
      "手"
    ],
    "keys": [
      "N",
      "Q"
    ],
    "first_code": "弓",
    "last_code": "手",
    "first_key": "N",
    "last_key": "Q",
    "full": "弓手 (NQ)",
    "cj_full": "弓中竹水手 (NLHEQ)",
    "secret": "【降】速成取碼：首碼【弓】(N) ＋ 尾碼【手】(Q)",
    "quickCode": "NQ"
  },
  "郊": {
    "char": "郊",
    "codes": [
      "卜",
      "中"
    ],
    "keys": [
      "Y",
      "L"
    ],
    "first_code": "卜",
    "last_code": "中",
    "first_key": "Y",
    "last_key": "L",
    "full": "卜中 (YL)",
    "cj_full": "卜大弓中 (YKNL)",
    "secret": "【郊】速成取碼：首碼【卜】(Y) ＋ 尾碼【中】(L)",
    "quickCode": "YL"
  },
  "寫": {
    "char": "寫",
    "codes": [
      "十",
      "火"
    ],
    "keys": [
      "J",
      "F"
    ],
    "first_code": "十",
    "last_code": "火",
    "first_key": "J",
    "last_key": "F",
    "full": "十火 (JF)",
    "cj_full": "十竹難火 (JHXF)",
    "secret": "【寫】速成取碼：首碼【十】(J) ＋ 尾碼【火】(F)",
    "quickCode": "JF"
  },
  "兒": {
    "char": "兒",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹難竹山 (HXHU)",
    "secret": "【兒】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "姊": {
    "char": "姊",
    "codes": [
      "女",
      "竹"
    ],
    "keys": [
      "V",
      "H"
    ],
    "first_code": "女",
    "last_code": "竹",
    "first_key": "V",
    "last_key": "H",
    "full": "女竹 (VH)",
    "cj_full": "女中難竹 (VLXH)",
    "secret": "【姊】速成取碼：首碼【女】(V) ＋ 尾碼【竹】(H)",
    "quickCode": "VH"
  },
  "鹿": {
    "char": "鹿",
    "codes": [
      "戈",
      "心"
    ],
    "keys": [
      "I",
      "P"
    ],
    "first_code": "戈",
    "last_code": "心",
    "first_key": "I",
    "last_key": "P",
    "full": "戈心 (IP)",
    "cj_full": "戈難心 (IXP)",
    "secret": "【鹿】速成取碼：首碼【戈】(I) ＋ 尾碼【心】(P)",
    "quickCode": "IP"
  },
  "齊": {
    "char": "齊",
    "codes": [
      "卜",
      "難"
    ],
    "keys": [
      "Y",
      "X"
    ],
    "first_code": "卜",
    "last_code": "難",
    "first_key": "Y",
    "last_key": "X",
    "full": "卜難 (YX)",
    "cj_full": "卜難 (YX)",
    "secret": "【齊】速成取碼：首碼【卜】(Y) ＋ 尾碼【難】(X)",
    "quickCode": "YX"
  },
  "插": {
    "char": "插",
    "codes": [
      "手",
      "難"
    ],
    "keys": [
      "Q",
      "X"
    ],
    "first_code": "手",
    "last_code": "難",
    "first_key": "Q",
    "last_key": "X",
    "full": "手難 (QX)",
    "cj_full": "手竹十難 (QHJX)",
    "secret": "【插】速成取碼：首碼【手】(Q) ＋ 尾碼【難】(X)",
    "quickCode": "QX"
  },
  "嫂": {
    "char": "嫂",
    "codes": [
      "女",
      "水"
    ],
    "keys": [
      "V",
      "E"
    ],
    "first_code": "女",
    "last_code": "水",
    "first_key": "V",
    "last_key": "E",
    "full": "女水 (VE)",
    "cj_full": "女竹中水 (VHLE)",
    "secret": "【嫂】速成取碼：首碼【女】(V) ＋ 尾碼【水】(E)",
    "quickCode": "VE"
  },
  "慶": {
    "char": "慶",
    "codes": [
      "戈",
      "水"
    ],
    "keys": [
      "I",
      "E"
    ],
    "first_code": "戈",
    "last_code": "水",
    "first_key": "I",
    "last_key": "E",
    "full": "戈水 (IE)",
    "cj_full": "戈難水 (IXE)",
    "secret": "【慶】速成取碼：首碼【戈】(I) ＋ 尾碼【水】(E)",
    "quickCode": "IE"
  },
  "稻": {
    "char": "稻",
    "codes": [
      "竹",
      "難"
    ],
    "keys": [
      "H",
      "X"
    ],
    "first_code": "竹",
    "last_code": "難",
    "first_key": "H",
    "last_key": "X",
    "full": "竹難 (HX)",
    "cj_full": "竹木月竹難 (HDBHX)",
    "secret": "【稻】速成取碼：首碼【竹】(H) ＋ 尾碼【難】(X)",
    "quickCode": "HX"
  },
  "興": {
    "char": "興",
    "codes": [
      "竹",
      "金"
    ],
    "keys": [
      "H",
      "C"
    ],
    "first_code": "竹",
    "last_code": "金",
    "first_key": "H",
    "last_key": "C",
    "full": "竹金 (HC)",
    "cj_full": "竹難月金 (HXBC)",
    "secret": "【興】速成取碼：首碼【竹】(H) ＋ 尾碼【金】(C)",
    "quickCode": "HC"
  },
  "擠": {
    "char": "擠",
    "codes": [
      "手",
      "難"
    ],
    "keys": [
      "Q",
      "X"
    ],
    "first_code": "手",
    "last_code": "難",
    "first_key": "Q",
    "last_key": "X",
    "full": "手難 (QX)",
    "cj_full": "手卜難 (QYX)",
    "secret": "【擠】速成取碼：首碼【手】(Q) ＋ 尾碼【難】(X)",
    "quickCode": "QX"
  },
  "舊": {
    "char": "舊",
    "codes": [
      "廿",
      "難"
    ],
    "keys": [
      "T",
      "X"
    ],
    "first_code": "廿",
    "last_code": "難",
    "first_key": "T",
    "last_key": "X",
    "full": "廿難 (TX)",
    "cj_full": "廿人土難 (TOGX)",
    "secret": "【舊】速成取碼：首碼【廿】(T) ＋ 尾碼【難】(X)",
    "quickCode": "TX"
  },
  "繩": {
    "char": "繩",
    "codes": [
      "女",
      "山"
    ],
    "keys": [
      "V",
      "U"
    ],
    "first_code": "女",
    "last_code": "山",
    "first_key": "V",
    "last_key": "U",
    "full": "女山 (VU)",
    "cj_full": "女火口難山 (VFRXU)",
    "secret": "【繩】速成取碼：首碼【女】(V) ＋ 尾碼【山】(U)",
    "quickCode": "VU"
  },
  "蠅": {
    "char": "蠅",
    "codes": [
      "中",
      "山"
    ],
    "keys": [
      "L",
      "U"
    ],
    "first_code": "中",
    "last_code": "山",
    "first_key": "L",
    "last_key": "U",
    "full": "中山 (LU)",
    "cj_full": "中戈口難山 (LIRXU)",
    "secret": "【蠅】速成取碼：首碼【中】(L) ＋ 尾碼【山】(U)",
    "quickCode": "LU"
  },
  "圈": {
    "char": "圈",
    "codes": [
      "田",
      "山"
    ],
    "keys": [
      "W",
      "U"
    ],
    "first_code": "田",
    "last_code": "山",
    "first_key": "W",
    "last_key": "U",
    "full": "田山 (WU)",
    "cj_full": "田火手山 (WFQU)",
    "secret": "【圈】速成取碼：首碼【田】(W) ＋ 尾碼【山】(U)",
    "quickCode": "WU"
  },
  "勝": {
    "char": "勝",
    "codes": [
      "月",
      "尸"
    ],
    "keys": [
      "B",
      "S"
    ],
    "first_code": "月",
    "last_code": "尸",
    "first_key": "B",
    "last_key": "S",
    "full": "月尸 (BS)",
    "cj_full": "月火手尸 (BFQS)",
    "secret": "【勝】速成取碼：首碼【月】(B) ＋ 尾碼【尸】(S)",
    "quickCode": "BS"
  },
  "問": {
    "char": "問",
    "codes": [
      "日",
      "口"
    ],
    "keys": [
      "A",
      "R"
    ],
    "first_code": "日",
    "last_code": "口",
    "first_key": "A",
    "last_key": "R",
    "full": "日口 (AR)",
    "cj_full": "日弓口 (ANR)",
    "secret": "【問】速成取碼：首碼【日】(A) ＋ 尾碼【口】(R)",
    "quickCode": "AR"
  },
  "雄": {
    "char": "雄",
    "codes": [
      "大",
      "土"
    ],
    "keys": [
      "K",
      "G"
    ],
    "first_code": "大",
    "last_code": "土",
    "first_key": "K",
    "last_key": "G",
    "full": "大土 (KG)",
    "cj_full": "大戈人土 (KIOG)",
    "secret": "【雄】速成取碼：首碼【大】(K) ＋ 尾碼【土】(G)",
    "quickCode": "KG"
  },
  "進": {
    "char": "進",
    "codes": [
      "卜",
      "土"
    ],
    "keys": [
      "Y",
      "G"
    ],
    "first_code": "卜",
    "last_code": "土",
    "first_key": "Y",
    "last_key": "G",
    "full": "卜土 (YG)",
    "cj_full": "卜人土 (YOG)",
    "secret": "【進】速成取碼：首碼【卜】(Y) ＋ 尾碼【土】(G)",
    "quickCode": "YG"
  },
  "視": {
    "char": "視",
    "codes": [
      "戈",
      "山"
    ],
    "keys": [
      "I",
      "U"
    ],
    "first_code": "戈",
    "last_code": "山",
    "first_key": "I",
    "last_key": "U",
    "full": "戈山 (IU)",
    "cj_full": "戈火月山山 (IFBUU)",
    "secret": "【視】速成取碼：首碼【戈】(I) ＋ 尾碼【山】(U)",
    "quickCode": "IU"
  },
  "龜": {
    "char": "龜",
    "codes": [
      "弓",
      "山"
    ],
    "keys": [
      "N",
      "U"
    ],
    "first_code": "弓",
    "last_code": "山",
    "first_key": "N",
    "last_key": "U",
    "full": "弓山 (NU)",
    "cj_full": "弓難山 (NXU)",
    "secret": "【龜】速成取碼：首碼【弓】(N) ＋ 尾碼【山】(U)",
    "quickCode": "NU"
  },
  "麓": {
    "char": "麓",
    "codes": [
      "木",
      "心"
    ],
    "keys": [
      "D",
      "P"
    ],
    "first_code": "木",
    "last_code": "心",
    "first_key": "D",
    "last_key": "P",
    "full": "木心 (DP)",
    "cj_full": "木木戈難心 (DDIXP)",
    "secret": "【麓】速成取碼：首碼【木】(D) ＋ 尾碼【心】(P)",
    "quickCode": "DP"
  },
  "薦": {
    "char": "薦",
    "codes": [
      "廿",
      "火"
    ],
    "keys": [
      "T",
      "F"
    ],
    "first_code": "廿",
    "last_code": "火",
    "first_key": "T",
    "last_key": "F",
    "full": "廿火 (TF)",
    "cj_full": "廿戈難火 (TIXF)",
    "secret": "【薦】速成取碼：首碼【廿】(T) ＋ 尾碼【火】(F)",
    "quickCode": "TF"
  },
  "淵": {
    "char": "淵",
    "codes": [
      "水",
      "中"
    ],
    "keys": [
      "E",
      "L"
    ],
    "first_code": "水",
    "last_code": "中",
    "first_key": "E",
    "last_key": "L",
    "full": "水中 (EL)",
    "cj_full": "水中難中 (ELXL)",
    "secret": "【淵】速成取碼：首碼【水】(E) ＋ 尾碼【中】(L)",
    "quickCode": "EL"
  },
  "肅": {
    "char": "肅",
    "codes": [
      "中",
      "難"
    ],
    "keys": [
      "L",
      "X"
    ],
    "first_code": "中",
    "last_code": "難",
    "first_key": "L",
    "last_key": "X",
    "full": "中難 (LX)",
    "cj_full": "中難 (LX)",
    "secret": "【肅】速成取碼：首碼【中】(L) ＋ 尾碼【難】(X)",
    "quickCode": "LX"
  },
  "鏽": {
    "char": "鏽",
    "codes": [
      "金",
      "難"
    ],
    "keys": [
      "C",
      "X"
    ],
    "first_code": "金",
    "last_code": "難",
    "first_key": "C",
    "last_key": "X",
    "full": "金難 (CX)",
    "cj_full": "金中難 (CLX)",
    "secret": "【鏽】速成取碼：首碼【金】(C) ＋ 尾碼【難】(X)",
    "quickCode": "CX"
  },
  "兼": {
    "char": "兼",
    "codes": [
      "廿",
      "金"
    ],
    "keys": [
      "T",
      "C"
    ],
    "first_code": "廿",
    "last_code": "金",
    "first_key": "T",
    "last_key": "C",
    "full": "廿金 (TC)",
    "cj_full": "廿難金 (TXC)",
    "secret": "【兼】速成取碼：首碼【廿】(T) ＋ 尾碼【金】(C)",
    "quickCode": "TC"
  },
  "嫌": {
    "char": "嫌",
    "codes": [
      "女",
      "金"
    ],
    "keys": [
      "V",
      "C"
    ],
    "first_code": "女",
    "last_code": "金",
    "first_key": "V",
    "last_key": "C",
    "full": "女金 (VC)",
    "cj_full": "女廿難金 (VTXC)",
    "secret": "【嫌】速成取碼：首碼【女】(V) ＋ 尾碼【金】(C)",
    "quickCode": "VC"
  },
  "賺": {
    "char": "賺",
    "codes": [
      "月",
      "口"
    ],
    "keys": [
      "B",
      "R"
    ],
    "first_code": "月",
    "last_code": "口",
    "first_key": "B",
    "last_key": "R",
    "full": "月口 (BR)",
    "cj_full": "月金人戈口 (BCOIR)",
    "secret": "【賺】速成取碼：首碼【月】(B) ＋ 尾碼【口】(R)",
    "quickCode": "BR"
  },
  "舀": {
    "char": "舀",
    "codes": [
      "月",
      "難"
    ],
    "keys": [
      "B",
      "X"
    ],
    "first_code": "月",
    "last_code": "難",
    "first_key": "B",
    "last_key": "X",
    "full": "月難 (BX)",
    "cj_full": "月竹難 (BHX)",
    "secret": "【舀】速成取碼：首碼【月】(B) ＋ 尾碼【難】(X)",
    "quickCode": "BX"
  },
  "臼": {
    "char": "臼",
    "codes": [
      "竹",
      "難"
    ],
    "keys": [
      "H",
      "X"
    ],
    "first_code": "竹",
    "last_code": "難",
    "first_key": "H",
    "last_key": "X",
    "full": "竹難 (HX)",
    "cj_full": "竹難 (HX)",
    "secret": "【臼】速成取碼：首碼【竹】(H) ＋ 尾碼【難】(X)",
    "quickCode": "HX"
  },
  "舅": {
    "char": "舅",
    "codes": [
      "竹",
      "尸"
    ],
    "keys": [
      "H",
      "S"
    ],
    "first_code": "竹",
    "last_code": "尸",
    "first_key": "H",
    "last_key": "S",
    "full": "竹尸 (HS)",
    "cj_full": "竹難田大尸 (HXWKS)",
    "secret": "【舅】速成取碼：首碼【竹】(H) ＋ 尾碼【尸】(S)",
    "quickCode": "HS"
  },
  "倪": {
    "char": "倪",
    "codes": [
      "人",
      "山"
    ],
    "keys": [
      "O",
      "U"
    ],
    "first_code": "人",
    "last_code": "山",
    "first_key": "O",
    "last_key": "U",
    "full": "人山 (OU)",
    "cj_full": "人竹難山 (OHXU)",
    "secret": "【倪】速成取碼：首碼【人】(O) ＋ 尾碼【山】(U)",
    "quickCode": "OU"
  },
  "叟": {
    "char": "叟",
    "codes": [
      "竹",
      "水"
    ],
    "keys": [
      "H",
      "E"
    ],
    "first_code": "竹",
    "last_code": "水",
    "first_key": "H",
    "last_key": "E",
    "full": "竹水 (HE)",
    "cj_full": "竹難水 (HXE)",
    "secret": "【叟】速成取碼：首碼【竹】(H) ＋ 尾碼【水】(E)",
    "quickCode": "HE"
  },
  "臾": {
    "char": "臾",
    "codes": [
      "竹",
      "人"
    ],
    "keys": [
      "H",
      "O"
    ],
    "first_code": "竹",
    "last_code": "人",
    "first_key": "H",
    "last_key": "O",
    "full": "竹人 (HO)",
    "cj_full": "竹難人 (HXO)",
    "secret": "【臾】速成取碼：首碼【竹】(H) ＋ 尾碼【人】(O)",
    "quickCode": "HO"
  },
  "蕭": {
    "char": "蕭",
    "codes": [
      "廿",
      "難"
    ],
    "keys": [
      "T",
      "X"
    ],
    "first_code": "廿",
    "last_code": "難",
    "first_key": "T",
    "last_key": "X",
    "full": "廿難 (TX)",
    "cj_full": "廿中難 (TLX)",
    "secret": "【蕭】速成取碼：首碼【廿】(T) ＋ 尾碼【難】(X)",
    "quickCode": "TX"
  },
  "簫": {
    "char": "簫",
    "codes": [
      "竹",
      "難"
    ],
    "keys": [
      "H",
      "X"
    ],
    "first_code": "竹",
    "last_code": "難",
    "first_key": "H",
    "last_key": "X",
    "full": "竹難 (HX)",
    "cj_full": "竹中難 (HLX)",
    "secret": "【簫】速成取碼：首碼【竹】(H) ＋ 尾碼【難】(X)",
    "quickCode": "HX"
  },
  "霽": {
    "char": "霽",
    "codes": [
      "一",
      "難"
    ],
    "keys": [
      "M",
      "X"
    ],
    "first_code": "一",
    "last_code": "難",
    "first_key": "M",
    "last_key": "X",
    "full": "一難 (MX)",
    "cj_full": "一月卜難 (MBYX)",
    "secret": "【霽】速成取碼：首碼【一】(M) ＋ 尾碼【難】(X)",
    "quickCode": "MX"
  },
  "劑": {
    "char": "劑",
    "codes": [
      "卜",
      "弓"
    ],
    "keys": [
      "Y",
      "N"
    ],
    "first_code": "卜",
    "last_code": "弓",
    "first_key": "Y",
    "last_key": "N",
    "full": "卜弓 (YN)",
    "cj_full": "卜難中弓 (YXLN)",
    "secret": "【劑】速成取碼：首碼【卜】(Y) ＋ 尾碼【弓】(N)",
    "quickCode": "YN"
  },
  "齋": {
    "char": "齋",
    "codes": [
      "卜",
      "火"
    ],
    "keys": [
      "Y",
      "F"
    ],
    "first_code": "卜",
    "last_code": "火",
    "first_key": "Y",
    "last_key": "F",
    "full": "卜火 (YF)",
    "cj_full": "卜難火 (YXF)",
    "secret": "【齋】速成取碼：首碼【卜】(Y) ＋ 尾碼【火】(F)",
    "quickCode": "YF"
  },
  "濟": {
    "char": "濟",
    "codes": [
      "水",
      "難"
    ],
    "keys": [
      "E",
      "X"
    ],
    "first_code": "水",
    "last_code": "難",
    "first_key": "E",
    "last_key": "X",
    "full": "水難 (EX)",
    "cj_full": "水卜難 (EYX)",
    "secret": "【濟】速成取碼：首碼【水】(E) ＋ 尾碼【難】(X)",
    "quickCode": "EX"
  },
  "盥": {
    "char": "盥",
    "codes": [
      "竹",
      "廿"
    ],
    "keys": [
      "H",
      "T"
    ],
    "first_code": "竹",
    "last_code": "廿",
    "first_key": "H",
    "last_key": "T",
    "full": "竹廿 (HT)",
    "cj_full": "竹水月廿 (HEBT)",
    "secret": "【盥】速成取碼：首碼【竹】(H) ＋ 尾碼【廿】(T)",
    "quickCode": "HT"
  },
  "搜": {
    "char": "搜",
    "codes": [
      "手",
      "水"
    ],
    "keys": [
      "Q",
      "E"
    ],
    "first_code": "手",
    "last_code": "水",
    "first_key": "Q",
    "last_key": "E",
    "full": "手水 (QE)",
    "cj_full": "手竹難水 (QHXE)",
    "secret": "【搜】速成取碼：首碼【手】(Q) ＋ 尾碼【水】(E)",
    "quickCode": "QE"
  },
  "樁": {
    "char": "樁",
    "codes": [
      "木",
      "難"
    ],
    "keys": [
      "D",
      "X"
    ],
    "first_code": "木",
    "last_code": "難",
    "first_key": "D",
    "last_key": "X",
    "full": "木難 (DX)",
    "cj_full": "木手大難 (DQKX)",
    "secret": "【樁】速成取碼：首碼【木】(D) ＋ 尾碼【難】(X)",
    "quickCode": "DX"
  },
  "鼠": {
    "char": "鼠",
    "codes": [
      "竹",
      "女"
    ],
    "keys": [
      "H",
      "V"
    ],
    "first_code": "竹",
    "last_code": "女",
    "first_key": "H",
    "last_key": "V",
    "full": "竹女 (HV)",
    "cj_full": "竹難尸一女 (HXSMV)",
    "secret": "【鼠】速成取碼：首碼【竹】(H) ＋ 尾碼【女】(V)",
    "quickCode": "HV"
  },
  "諂": {
    "char": "諂",
    "codes": [
      "卜",
      "難"
    ],
    "keys": [
      "Y",
      "X"
    ],
    "first_code": "卜",
    "last_code": "難",
    "first_key": "Y",
    "last_key": "X",
    "full": "卜難 (YX)",
    "cj_full": "卜口弓竹難 (YRNHX)",
    "secret": "【諂】速成取碼：首碼【卜】(Y) ＋ 尾碼【難】(X)",
    "quickCode": "YX"
  },
  "焰": {
    "char": "焰",
    "codes": [
      "火",
      "難"
    ],
    "keys": [
      "F",
      "X"
    ],
    "first_code": "火",
    "last_code": "難",
    "first_key": "F",
    "last_key": "X",
    "full": "火難 (FX)",
    "cj_full": "火弓竹難 (FNHX)",
    "secret": "【焰】速成取碼：首碼【火】(F) ＋ 尾碼【難】(X)",
    "quickCode": "FX"
  },
  "舂": {
    "char": "舂",
    "codes": [
      "手",
      "難"
    ],
    "keys": [
      "Q",
      "X"
    ],
    "first_code": "手",
    "last_code": "難",
    "first_key": "Q",
    "last_key": "X",
    "full": "手難 (QX)",
    "cj_full": "手大竹難 (QKHX)",
    "secret": "【舂】速成取碼：首碼【手】(Q) ＋ 尾碼【難】(X)",
    "quickCode": "QX"
  },
  "輿": {
    "char": "輿",
    "codes": [
      "竹",
      "金"
    ],
    "keys": [
      "H",
      "C"
    ],
    "first_code": "竹",
    "last_code": "金",
    "first_key": "H",
    "last_key": "C",
    "full": "竹金 (HC)",
    "cj_full": "竹一金 (HMC)",
    "secret": "【輿】速成取碼：首碼【竹】(H) ＋ 尾碼【金】(C)",
    "quickCode": "HC"
  },
  "詔": {
    "char": "詔",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜口尸竹口 (YRSHR)",
    "secret": "【詔】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "霸": {
    "char": "霸",
    "codes": [
      "一",
      "月"
    ],
    "keys": [
      "M",
      "B"
    ],
    "first_code": "一",
    "last_code": "月",
    "first_key": "M",
    "last_key": "B",
    "full": "一月 (MB)",
    "cj_full": "一月廿十月 (MBTJB)",
    "secret": "【霸】速成取碼：首碼【一】(M) ＋ 尾碼【月】(B)",
    "quickCode": "MB"
  },
  "靈": {
    "char": "靈",
    "codes": [
      "一",
      "一"
    ],
    "keys": [
      "M",
      "M"
    ],
    "first_code": "一",
    "last_code": "一",
    "first_key": "M",
    "last_key": "M",
    "full": "一一 (MM)",
    "cj_full": "一月口口一 (MBRRM)",
    "secret": "【靈】速成取碼：首碼【一】(M) ＋ 尾碼【一】(M)",
    "quickCode": "MM"
  },
  "浙": {
    "char": "浙",
    "codes": [
      "水",
      "中"
    ],
    "keys": [
      "E",
      "L"
    ],
    "first_code": "水",
    "last_code": "中",
    "first_key": "E",
    "last_key": "L",
    "full": "水中 (EL)",
    "cj_full": "水手竹中 (EQHL)",
    "secret": "【浙】速成取碼：首碼【水】(E) ＋ 尾碼【中】(L)",
    "quickCode": "EL"
  },
  "概": {
    "char": "概",
    "codes": [
      "木",
      "山"
    ],
    "keys": [
      "D",
      "U"
    ],
    "first_code": "木",
    "last_code": "山",
    "first_key": "D",
    "last_key": "U",
    "full": "木山 (DU)",
    "cj_full": "木日戈山 (DAIU)",
    "secret": "【概】速成取碼：首碼【木】(D) ＋ 尾碼【山】(U)",
    "quickCode": "DU"
  },
  "勢": {
    "char": "勢",
    "codes": [
      "土",
      "尸"
    ],
    "keys": [
      "G",
      "S"
    ],
    "first_code": "土",
    "last_code": "尸",
    "first_key": "G",
    "last_key": "S",
    "full": "土尸 (GS)",
    "cj_full": "土戈大尸 (GIKS)",
    "secret": "【勢】速成取碼：首碼【土】(G) ＋ 尾碼【尸】(S)",
    "quickCode": "GS"
  },
  "甫": {
    "char": "甫",
    "codes": [
      "戈",
      "月"
    ],
    "keys": [
      "I",
      "B"
    ],
    "first_code": "戈",
    "last_code": "月",
    "first_key": "I",
    "last_key": "B",
    "full": "戈月 (IB)",
    "cj_full": "戈十月 (IJB)",
    "secret": "【甫】速成取碼：首碼【戈】(I) ＋ 尾碼【月】(B)",
    "quickCode": "IB"
  },
  "甥": {
    "char": "甥",
    "codes": [
      "竹",
      "尸"
    ],
    "keys": [
      "H",
      "S"
    ],
    "first_code": "竹",
    "last_code": "尸",
    "first_key": "H",
    "last_key": "S",
    "full": "竹尸 (HS)",
    "cj_full": "竹一田大尸 (HMWKS)",
    "secret": "【甥】速成取碼：首碼【竹】(H) ＋ 尾碼【尸】(S)",
    "quickCode": "HS"
  },
  "盈": {
    "char": "盈",
    "codes": [
      "弓",
      "廿"
    ],
    "keys": [
      "N",
      "T"
    ],
    "first_code": "弓",
    "last_code": "廿",
    "first_key": "N",
    "last_key": "T",
    "full": "弓廿 (NT)",
    "cj_full": "弓尸月廿 (NSBT)",
    "secret": "【盈】速成取碼：首碼【弓】(N) ＋ 尾碼【廿】(T)",
    "quickCode": "NT"
  },
  "颺": {
    "char": "颺",
    "codes": [
      "竹",
      "竹"
    ],
    "keys": [
      "H",
      "H"
    ],
    "first_code": "竹",
    "last_code": "竹",
    "first_key": "H",
    "last_key": "H",
    "full": "竹竹 (HH)",
    "cj_full": "竹弓弓日一竹 (HNNAMH)",
    "secret": "【颺】速成取碼：首碼【竹】(H) ＋ 尾碼【竹】(H)",
    "quickCode": "HH"
  },
  "稿": {
    "char": "稿",
    "codes": [
      "竹",
      "木"
    ],
    "keys": [
      "H",
      "D"
    ],
    "first_code": "竹",
    "last_code": "木",
    "first_key": "H",
    "last_key": "D",
    "full": "竹木 (HD)",
    "cj_full": "竹木口月木 (HDRBD)",
    "secret": "【稿】速成取碼：首碼【竹】(H) ＋ 尾碼【木】(D)",
    "quickCode": "HD"
  },
  "醇": {
    "char": "醇",
    "codes": [
      "一",
      "木"
    ],
    "keys": [
      "M",
      "D"
    ],
    "first_code": "一",
    "last_code": "木",
    "first_key": "M",
    "last_key": "D",
    "full": "一木 (MD)",
    "cj_full": "一田卜口木 (MWYRD)",
    "secret": "【醇】速成取碼：首碼【一】(M) ＋ 尾碼【木】(D)",
    "quickCode": "MD"
  },
  "魑": {
    "char": "魑",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水卜山月 (EYUB)",
    "secret": "【魑】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "裊": {
    "char": "裊",
    "codes": [
      "竹",
      "女"
    ],
    "keys": [
      "H",
      "V"
    ],
    "first_code": "竹",
    "last_code": "女",
    "first_key": "H",
    "last_key": "V",
    "full": "竹女 (HV)",
    "cj_full": "竹日卜女 (HAYV)",
    "secret": "【裊】速成取碼：首碼【竹】(H) ＋ 尾碼【女】(V)",
    "quickCode": "HV"
  },
  "髮": {
    "char": "髮",
    "codes": [
      "尸",
      "大"
    ],
    "keys": [
      "S",
      "K"
    ],
    "first_code": "尸",
    "last_code": "大",
    "first_key": "S",
    "last_key": "K",
    "full": "尸大 (SK)",
    "cj_full": "尸竹戈大大 (SHIKK)",
    "secret": "【髮】速成取碼：首碼【尸】(S) ＋ 尾碼【大】(K)",
    "quickCode": "SK"
  },
  "輸": {
    "char": "輸",
    "codes": [
      "十",
      "弓"
    ],
    "keys": [
      "J",
      "N"
    ],
    "first_code": "十",
    "last_code": "弓",
    "first_key": "J",
    "last_key": "N",
    "full": "十弓 (JN)",
    "cj_full": "十十人一弓 (JJOMN)",
    "secret": "【輸】速成取碼：首碼【十】(J) ＋ 尾碼【弓】(N)",
    "quickCode": "JN"
  },
  "賽": {
    "char": "賽",
    "codes": [
      "十",
      "金"
    ],
    "keys": [
      "J",
      "C"
    ],
    "first_code": "十",
    "last_code": "金",
    "first_key": "J",
    "last_key": "C",
    "full": "十金 (JC)",
    "cj_full": "十廿金金 (JTCC)",
    "secret": "【賽】速成取碼：首碼【十】(J) ＋ 尾碼【金】(C)",
    "quickCode": "JC"
  },
  "轟": {
    "char": "轟",
    "codes": [
      "十",
      "十"
    ],
    "keys": [
      "J",
      "J"
    ],
    "first_code": "十",
    "last_code": "十",
    "first_key": "J",
    "last_key": "J",
    "full": "十十 (JJ)",
    "cj_full": "十十十十十 (JJJJJ)",
    "secret": "【轟】速成取碼：首碼【十】(J) ＋ 尾碼【十】(J)",
    "quickCode": "JJ"
  },
  "蓮": {
    "char": "蓮",
    "codes": [
      "廿",
      "十"
    ],
    "keys": [
      "T",
      "J"
    ],
    "first_code": "廿",
    "last_code": "十",
    "first_key": "T",
    "last_key": "J",
    "full": "廿十 (TJ)",
    "cj_full": "廿卜十十 (TYJJ)",
    "secret": "【蓮】速成取碼：首碼【廿】(T) ＋ 尾碼【十】(J)",
    "quickCode": "TJ"
  },
  "條": {
    "char": "條",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人中人木 (OLOD)",
    "secret": "【條】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "別": {
    "char": "別",
    "codes": [
      "口",
      "弓"
    ],
    "keys": [
      "R",
      "N"
    ],
    "first_code": "口",
    "last_code": "弓",
    "first_key": "R",
    "last_key": "N",
    "full": "口弓 (RN)",
    "cj_full": "口尸中弓 (RSLN)",
    "secret": "【別】速成取碼：首碼【口】(R) ＋ 尾碼【弓】(N)",
    "quickCode": "RN"
  },
  "候": {
    "char": "候",
    "codes": [
      "人",
      "大"
    ],
    "keys": [
      "O",
      "K"
    ],
    "first_code": "人",
    "last_code": "大",
    "first_key": "O",
    "last_key": "K",
    "full": "人大 (OK)",
    "cj_full": "人弓一大 (ONMK)",
    "secret": "【候】速成取碼：首碼【人】(O) ＋ 尾碼【大】(K)",
    "quickCode": "OK"
  },
  "哪": {
    "char": "哪",
    "codes": [
      "口",
      "中"
    ],
    "keys": [
      "R",
      "L"
    ],
    "first_code": "口",
    "last_code": "中",
    "first_key": "R",
    "last_key": "L",
    "full": "口中 (RL)",
    "cj_full": "口尸手中 (RSQL)",
    "secret": "【哪】速成取碼：首碼【口】(R) ＋ 尾碼【中】(L)",
    "quickCode": "RL"
  },
  "做": {
    "char": "做",
    "codes": [
      "人",
      "大"
    ],
    "keys": [
      "O",
      "K"
    ],
    "first_code": "人",
    "last_code": "大",
    "first_key": "O",
    "last_key": "K",
    "full": "人大 (OK)",
    "cj_full": "人十口大 (OJRK)",
    "secret": "【做】速成取碼：首碼【人】(O) ＋ 尾碼【大】(K)",
    "quickCode": "OK"
  },
  "假": {
    "char": "假",
    "codes": [
      "人",
      "水"
    ],
    "keys": [
      "O",
      "E"
    ],
    "first_code": "人",
    "last_code": "水",
    "first_key": "O",
    "last_key": "E",
    "full": "人水 (OE)",
    "cj_full": "人口卜水 (ORYE)",
    "secret": "【假】速成取碼：首碼【人】(O) ＋ 尾碼【水】(E)",
    "quickCode": "OE"
  },
  "游": {
    "char": "游",
    "codes": [
      "水",
      "木"
    ],
    "keys": [
      "E",
      "D"
    ],
    "first_code": "水",
    "last_code": "木",
    "first_key": "E",
    "last_key": "D",
    "full": "水木 (ED)",
    "cj_full": "水卜尸木 (EYSD)",
    "secret": "【游】速成取碼：首碼【水】(E) ＋ 尾碼【木】(D)",
    "quickCode": "ED"
  },
  "跳": {
    "char": "跳",
    "codes": [
      "口",
      "人"
    ],
    "keys": [
      "R",
      "O"
    ],
    "first_code": "口",
    "last_code": "人",
    "first_key": "R",
    "last_key": "O",
    "full": "口人 (RO)",
    "cj_full": "口一中一人 (RMLMO)",
    "secret": "【跳】速成取碼：首碼【口】(R) ＋ 尾碼【人】(O)",
    "quickCode": "RO"
  },
  "蝴": {
    "char": "蝴",
    "codes": [
      "中",
      "月"
    ],
    "keys": [
      "L",
      "B"
    ],
    "first_code": "中",
    "last_code": "月",
    "first_key": "L",
    "last_key": "B",
    "full": "中月 (LB)",
    "cj_full": "中戈十口月 (LIJRB)",
    "secret": "【蝴】速成取碼：首碼【中】(L) ＋ 尾碼【月】(B)",
    "quickCode": "LB"
  },
  "樹": {
    "char": "樹",
    "codes": [
      "木",
      "戈"
    ],
    "keys": [
      "D",
      "I"
    ],
    "first_code": "木",
    "last_code": "戈",
    "first_key": "D",
    "last_key": "I",
    "full": "木戈 (DI)",
    "cj_full": "木土廿戈 (DGTI)",
    "secret": "【樹】速成取碼：首碼【木】(D) ＋ 尾碼【戈】(I)",
    "quickCode": "DI"
  },
  "徵": {
    "char": "徵",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹人山土大 (HOUGK)",
    "secret": "【徵】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "制": {
    "char": "制",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹月中弓 (HBLN)",
    "secret": "【制】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "鄉": {
    "char": "鄉",
    "codes": [
      "女",
      "中"
    ],
    "keys": [
      "V",
      "L"
    ],
    "first_code": "女",
    "last_code": "中",
    "first_key": "V",
    "last_key": "L",
    "full": "女中 (VL)",
    "cj_full": "女竹戈戈中 (VHIIL)",
    "secret": "【鄉】速成取碼：首碼【女】(V) ＋ 尾碼【中】(L)",
    "quickCode": "VL"
  },
  "批": {
    "char": "批",
    "codes": [
      "手",
      "心"
    ],
    "keys": [
      "Q",
      "P"
    ],
    "first_code": "手",
    "last_code": "心",
    "first_key": "Q",
    "last_key": "P",
    "full": "手心 (QP)",
    "cj_full": "手心心 (QPP)",
    "secret": "【批】速成取碼：首碼【手】(Q) ＋ 尾碼【心】(P)",
    "quickCode": "QP"
  },
  "刻": {
    "char": "刻",
    "codes": [
      "卜",
      "弓"
    ],
    "keys": [
      "Y",
      "N"
    ],
    "first_code": "卜",
    "last_code": "弓",
    "first_key": "Y",
    "last_key": "N",
    "full": "卜弓 (YN)",
    "cj_full": "卜人中弓 (YOLN)",
    "secret": "【刻】速成取碼：首碼【卜】(Y) ＋ 尾碼【弓】(N)",
    "quickCode": "YN"
  },
  "例": {
    "char": "例",
    "codes": [
      "人",
      "弓"
    ],
    "keys": [
      "O",
      "N"
    ],
    "first_code": "人",
    "last_code": "弓",
    "first_key": "O",
    "last_key": "N",
    "full": "人弓 (ON)",
    "cj_full": "人一弓弓 (OMNN)",
    "secret": "【例】速成取碼：首碼【人】(O) ＋ 尾碼【弓】(N)",
    "quickCode": "ON"
  },
  "迎": {
    "char": "迎",
    "codes": [
      "卜",
      "中"
    ],
    "keys": [
      "Y",
      "L"
    ],
    "first_code": "卜",
    "last_code": "中",
    "first_key": "Y",
    "last_key": "L",
    "full": "卜中 (YL)",
    "cj_full": "卜竹女中 (YHVL)",
    "secret": "【迎】速成取碼：首碼【卜】(Y) ＋ 尾碼【中】(L)",
    "quickCode": "YL"
  },
  "亡": {
    "char": "亡",
    "codes": [
      "卜",
      "女"
    ],
    "keys": [
      "Y",
      "V"
    ],
    "first_code": "卜",
    "last_code": "女",
    "first_key": "Y",
    "last_key": "V",
    "full": "卜女 (YV)",
    "cj_full": "卜女 (YV)",
    "secret": "【亡】速成取碼：首碼【卜】(Y) ＋ 尾碼【女】(V)",
    "quickCode": "YV"
  },
  "彩": {
    "char": "彩",
    "codes": [
      "月",
      "竹"
    ],
    "keys": [
      "B",
      "H"
    ],
    "first_code": "月",
    "last_code": "竹",
    "first_key": "B",
    "last_key": "H",
    "full": "月竹 (BH)",
    "cj_full": "月木竹竹竹 (BDHHH)",
    "secret": "【彩】速成取碼：首碼【月】(B) ＋ 尾碼【竹】(H)",
    "quickCode": "BH"
  },
  "步": {
    "char": "步",
    "codes": [
      "卜",
      "竹"
    ],
    "keys": [
      "Y",
      "H"
    ],
    "first_code": "卜",
    "last_code": "竹",
    "first_key": "Y",
    "last_key": "H",
    "full": "卜竹 (YH)",
    "cj_full": "卜中一竹 (YLMH)",
    "secret": "【步】速成取碼：首碼【卜】(Y) ＋ 尾碼【竹】(H)",
    "quickCode": "YH"
  },
  "民": {
    "char": "民",
    "codes": [
      "口",
      "心"
    ],
    "keys": [
      "R",
      "P"
    ],
    "first_code": "口",
    "last_code": "心",
    "first_key": "R",
    "last_key": "P",
    "full": "口心 (RP)",
    "cj_full": "口女心 (RVP)",
    "secret": "【民】速成取碼：首碼【口】(R) ＋ 尾碼【心】(P)",
    "quickCode": "RP"
  },
  "巧": {
    "char": "巧",
    "codes": [
      "一",
      "尸"
    ],
    "keys": [
      "M",
      "S"
    ],
    "first_code": "一",
    "last_code": "尸",
    "first_key": "M",
    "last_key": "S",
    "full": "一尸 (MS)",
    "cj_full": "一一尸 (MMS)",
    "secret": "【巧】速成取碼：首碼【一】(M) ＋ 尾碼【尸】(S)",
    "quickCode": "MS"
  },
  "目": {
    "char": "目",
    "codes": [
      "月",
      "山"
    ],
    "keys": [
      "B",
      "U"
    ],
    "first_code": "月",
    "last_code": "山",
    "first_key": "B",
    "last_key": "U",
    "full": "月山 (BU)",
    "cj_full": "月山 (BU)",
    "secret": "【目】速成取碼：首碼【月】(B) ＋ 尾碼【山】(U)",
    "quickCode": "BU"
  },
  "牙": {
    "char": "牙",
    "codes": [
      "一",
      "竹"
    ],
    "keys": [
      "M",
      "H"
    ],
    "first_code": "一",
    "last_code": "竹",
    "first_key": "M",
    "last_key": "H",
    "full": "一竹 (MH)",
    "cj_full": "一女木竹 (MVDH)",
    "secret": "【牙】速成取碼：首碼【一】(M) ＋ 尾碼【竹】(H)",
    "quickCode": "MH"
  },
  "泳": {
    "char": "泳",
    "codes": [
      "水",
      "水"
    ],
    "keys": [
      "E",
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水水 (EE)",
    "cj_full": "水戈弓水 (EINE)",
    "secret": "【泳】速成取碼：首碼【水】(E) ＋ 尾碼【水】(E)",
    "quickCode": "EE"
  },
  "倫": {
    "char": "倫",
    "codes": [
      "人",
      "月"
    ],
    "keys": [
      "O",
      "B"
    ],
    "first_code": "人",
    "last_code": "月",
    "first_key": "O",
    "last_key": "B",
    "full": "人月 (OB)",
    "cj_full": "人人一月 (OOMB)",
    "secret": "【倫】速成取碼：首碼【人】(O) ＋ 尾碼【月】(B)",
    "quickCode": "OB"
  },
  "圖": {
    "char": "圖",
    "codes": [
      "田",
      "田"
    ],
    "keys": [
      "W",
      "W"
    ],
    "first_code": "田",
    "last_code": "田",
    "first_key": "W",
    "last_key": "W",
    "full": "田田 (WW)",
    "cj_full": "田口卜田 (WRYW)",
    "secret": "【圖】速成取碼：首碼【田】(W) ＋ 尾碼【田】(W)",
    "quickCode": "WW"
  },
  "滴": {
    "char": "滴",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水卜金月 (EYCB)",
    "secret": "【滴】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "瓶": {
    "char": "瓶",
    "codes": [
      "廿",
      "弓"
    ],
    "keys": [
      "T",
      "N"
    ],
    "first_code": "廿",
    "last_code": "弓",
    "first_key": "T",
    "last_key": "N",
    "full": "廿弓 (TN)",
    "cj_full": "廿廿一女弓 (TTMVN)",
    "secret": "【瓶】速成取碼：首碼【廿】(T) ＋ 尾碼【弓】(N)",
    "quickCode": "TN"
  },
  "喝": {
    "char": "喝",
    "codes": [
      "口",
      "女"
    ],
    "keys": [
      "R",
      "V"
    ],
    "first_code": "口",
    "last_code": "女",
    "first_key": "R",
    "last_key": "V",
    "full": "口女 (RV)",
    "cj_full": "口日心女 (RAPV)",
    "secret": "【喝】速成取碼：首碼【口】(R) ＋ 尾碼【女】(V)",
    "quickCode": "RV"
  },
  "夠": {
    "char": "夠",
    "codes": [
      "心",
      "弓"
    ],
    "keys": [
      "P",
      "N"
    ],
    "first_code": "心",
    "last_code": "弓",
    "first_key": "P",
    "last_key": "N",
    "full": "心弓 (PN)",
    "cj_full": "心口弓戈弓 (PRNIN)",
    "secret": "【夠】速成取碼：首碼【心】(P) ＋ 尾碼【弓】(N)",
    "quickCode": "PN"
  },
  "齡": {
    "char": "齡",
    "codes": [
      "卜",
      "戈"
    ],
    "keys": [
      "Y",
      "I"
    ],
    "first_code": "卜",
    "last_code": "戈",
    "first_key": "Y",
    "last_key": "I",
    "full": "卜戈 (YI)",
    "cj_full": "卜山人戈戈 (YUOII)",
    "secret": "【齡】速成取碼：首碼【卜】(Y) ＋ 尾碼【戈】(I)",
    "quickCode": "YI"
  },
  "痛": {
    "char": "痛",
    "codes": [
      "大",
      "月"
    ],
    "keys": [
      "K",
      "B"
    ],
    "first_code": "大",
    "last_code": "月",
    "first_key": "K",
    "last_key": "B",
    "full": "大月 (KB)",
    "cj_full": "大弓戈月 (KNIB)",
    "secret": "【痛】速成取碼：首碼【大】(K) ＋ 尾碼【月】(B)",
    "quickCode": "KB"
  },
  "敵": {
    "char": "敵",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜月人大 (YBOK)",
    "secret": "【敵】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "總": {
    "char": "總",
    "codes": [
      "女",
      "心"
    ],
    "keys": [
      "V",
      "P"
    ],
    "first_code": "女",
    "last_code": "心",
    "first_key": "V",
    "last_key": "P",
    "full": "女心 (VP)",
    "cj_full": "女火竹田心 (VFHWP)",
    "secret": "【總】速成取碼：首碼【女】(V) ＋ 尾碼【心】(P)",
    "quickCode": "VP"
  },
  "卓": {
    "char": "卓",
    "codes": [
      "卜",
      "十"
    ],
    "keys": [
      "Y",
      "J"
    ],
    "first_code": "卜",
    "last_code": "十",
    "first_key": "Y",
    "last_key": "J",
    "full": "卜十 (YJ)",
    "cj_full": "卜日十 (YAJ)",
    "secret": "【卓】速成取碼：首碼【卜】(Y) ＋ 尾碼【十】(J)",
    "quickCode": "YJ"
  },
  "允": {
    "char": "允",
    "codes": [
      "戈",
      "山"
    ],
    "keys": [
      "I",
      "U"
    ],
    "first_code": "戈",
    "last_code": "山",
    "first_key": "I",
    "last_key": "U",
    "full": "戈山 (IU)",
    "cj_full": "戈竹山 (IHU)",
    "secret": "【允】速成取碼：首碼【戈】(I) ＋ 尾碼【山】(U)",
    "quickCode": "IU"
  },
  "妻": {
    "char": "妻",
    "codes": [
      "十",
      "女"
    ],
    "keys": [
      "J",
      "V"
    ],
    "first_code": "十",
    "last_code": "女",
    "first_key": "J",
    "last_key": "V",
    "full": "十女 (JV)",
    "cj_full": "十中女 (JLV)",
    "secret": "【妻】速成取碼：首碼【十】(J) ＋ 尾碼【女】(V)",
    "quickCode": "JV"
  },
  "地": {
    "char": "地",
    "codes": [
      "土",
      "木"
    ],
    "keys": [
      "G",
      "D"
    ],
    "first_code": "土",
    "last_code": "木",
    "first_key": "G",
    "last_key": "D",
    "full": "土木 (GD)",
    "cj_full": "土心木 (GPD)",
    "secret": "【地】速成取碼：首碼【土】(G) ＋ 尾碼【木】(D)",
    "quickCode": "GD"
  },
  "合": {
    "char": "合",
    "codes": [
      "人",
      "口"
    ],
    "keys": [
      "O",
      "R"
    ],
    "first_code": "人",
    "last_code": "口",
    "first_key": "O",
    "last_key": "R",
    "full": "人口 (OR)",
    "cj_full": "人一口 (OMR)",
    "secret": "【合】速成取碼：首碼【人】(O) ＋ 尾碼【口】(R)",
    "quickCode": "OR"
  },
  "區": {
    "char": "區",
    "codes": [
      "尸",
      "口"
    ],
    "keys": [
      "S",
      "R"
    ],
    "first_code": "尸",
    "last_code": "口",
    "first_key": "S",
    "last_key": "R",
    "full": "尸口 (SR)",
    "cj_full": "尸口口口 (SRRR)",
    "secret": "【區】速成取碼：首碼【尸】(S) ＋ 尾碼【口】(R)",
    "quickCode": "SR"
  },
  "題": {
    "char": "題",
    "codes": [
      "日",
      "金"
    ],
    "keys": [
      "A",
      "C"
    ],
    "first_code": "日",
    "last_code": "金",
    "first_key": "A",
    "last_key": "C",
    "full": "日金 (AC)",
    "cj_full": "日人一月金 (AOMBC)",
    "secret": "【題】速成取碼：首碼【日】(A) ＋ 尾碼【金】(C)",
    "quickCode": "AC"
  },
  "像": {
    "char": "像",
    "codes": [
      "人",
      "人"
    ],
    "keys": [
      "O",
      "O"
    ],
    "first_code": "人",
    "last_code": "人",
    "first_key": "O",
    "last_key": "O",
    "full": "人人 (OO)",
    "cj_full": "人弓日人 (ONAO)",
    "secret": "【像】速成取碼：首碼【人】(O) ＋ 尾碼【人】(O)",
    "quickCode": "OO"
  },
  "誰": {
    "char": "誰",
    "codes": [
      "卜",
      "土"
    ],
    "keys": [
      "Y",
      "G"
    ],
    "first_code": "卜",
    "last_code": "土",
    "first_key": "Y",
    "last_key": "G",
    "full": "卜土 (YG)",
    "cj_full": "卜口人土 (YROG)",
    "secret": "【誰】速成取碼：首碼【卜】(Y) ＋ 尾碼【土】(G)",
    "quickCode": "YG"
  },
  "止": {
    "char": "止",
    "codes": [
      "卜",
      "一"
    ],
    "keys": [
      "Y",
      "M"
    ],
    "first_code": "卜",
    "last_code": "一",
    "first_key": "Y",
    "last_key": "M",
    "full": "卜一 (YM)",
    "cj_full": "卜中一 (YLM)",
    "secret": "【止】速成取碼：首碼【卜】(Y) ＋ 尾碼【一】(M)",
    "quickCode": "YM"
  },
  "機": {
    "char": "機",
    "codes": [
      "木",
      "戈"
    ],
    "keys": [
      "D",
      "I"
    ],
    "first_code": "木",
    "last_code": "戈",
    "first_key": "D",
    "last_key": "I",
    "full": "木戈 (DI)",
    "cj_full": "木女戈戈 (DVII)",
    "secret": "【機】速成取碼：首碼【木】(D) ＋ 尾碼【戈】(I)",
    "quickCode": "DI"
  },
  "封": {
    "char": "封",
    "codes": [
      "土",
      "戈"
    ],
    "keys": [
      "G",
      "I"
    ],
    "first_code": "土",
    "last_code": "戈",
    "first_key": "G",
    "last_key": "I",
    "full": "土戈 (GI)",
    "cj_full": "土土木戈 (GGDI)",
    "secret": "【封】速成取碼：首碼【土】(G) ＋ 尾碼【戈】(I)",
    "quickCode": "GI"
  },
  "破": {
    "char": "破",
    "codes": [
      "一",
      "水"
    ],
    "keys": [
      "M",
      "E"
    ],
    "first_code": "一",
    "last_code": "水",
    "first_key": "M",
    "last_key": "E",
    "full": "一水 (ME)",
    "cj_full": "一口木竹水 (MRDHE)",
    "secret": "【破】速成取碼：首碼【一】(M) ＋ 尾碼【水】(E)",
    "quickCode": "ME"
  },
  "去": {
    "char": "去",
    "codes": [
      "土",
      "戈"
    ],
    "keys": [
      "G",
      "I"
    ],
    "first_code": "土",
    "last_code": "戈",
    "first_key": "G",
    "last_key": "I",
    "full": "土戈 (GI)",
    "cj_full": "土戈 (GI)",
    "secret": "【去】速成取碼：首碼【土】(G) ＋ 尾碼【戈】(I)",
    "quickCode": "GI"
  },
  "雖": {
    "char": "雖",
    "codes": [
      "口",
      "土"
    ],
    "keys": [
      "R",
      "G"
    ],
    "first_code": "口",
    "last_code": "土",
    "first_key": "R",
    "last_key": "G",
    "full": "口土 (RG)",
    "cj_full": "口戈人土 (RIOG)",
    "secret": "【雖】速成取碼：首碼【口】(R) ＋ 尾碼【土】(G)",
    "quickCode": "RG"
  },
  "金": {
    "char": "金",
    "codes": [
      "金"
    ],
    "keys": [
      "C"
    ],
    "first_code": "金",
    "last_code": "金",
    "first_key": "C",
    "last_key": "C",
    "full": "金 (C)",
    "cj_full": "金 (C)",
    "secret": "【金】單碼字：直取【金】(C)",
    "quickCode": "C"
  },
  "喊": {
    "char": "喊",
    "codes": [
      "口",
      "口"
    ],
    "keys": [
      "R",
      "R"
    ],
    "first_code": "口",
    "last_code": "口",
    "first_key": "R",
    "last_key": "R",
    "full": "口口 (RR)",
    "cj_full": "口戈竹口 (RIHR)",
    "secret": "【喊】速成取碼：首碼【口】(R) ＋ 尾碼【口】(R)",
    "quickCode": "RR"
  },
  "素": {
    "char": "素",
    "codes": [
      "手",
      "火"
    ],
    "keys": [
      "Q",
      "F"
    ],
    "first_code": "手",
    "last_code": "火",
    "first_key": "Q",
    "last_key": "F",
    "full": "手火 (QF)",
    "cj_full": "手一女戈火 (QMVIF)",
    "secret": "【素】速成取碼：首碼【手】(Q) ＋ 尾碼【火】(F)",
    "quickCode": "QF"
  },
  "迷": {
    "char": "迷",
    "codes": [
      "卜",
      "木"
    ],
    "keys": [
      "Y",
      "D"
    ],
    "first_code": "卜",
    "last_code": "木",
    "first_key": "Y",
    "last_key": "D",
    "full": "卜木 (YD)",
    "cj_full": "卜火木 (YFD)",
    "secret": "【迷】速成取碼：首碼【卜】(Y) ＋ 尾碼【木】(D)",
    "quickCode": "YD"
  },
  "拍": {
    "char": "拍",
    "codes": [
      "手",
      "日"
    ],
    "keys": [
      "Q",
      "A"
    ],
    "first_code": "手",
    "last_code": "日",
    "first_key": "Q",
    "last_key": "A",
    "full": "手日 (QA)",
    "cj_full": "手竹日 (QHA)",
    "secret": "【拍】速成取碼：首碼【手】(Q) ＋ 尾碼【日】(A)",
    "quickCode": "QA"
  },
  "級": {
    "char": "級",
    "codes": [
      "女",
      "水"
    ],
    "keys": [
      "V",
      "E"
    ],
    "first_code": "女",
    "last_code": "水",
    "first_key": "V",
    "last_key": "E",
    "full": "女水 (VE)",
    "cj_full": "女火弓竹水 (VFNHE)",
    "secret": "【級】速成取碼：首碼【女】(V) ＋ 尾碼【水】(E)",
    "quickCode": "VE"
  },
  "確": {
    "char": "確",
    "codes": [
      "一",
      "土"
    ],
    "keys": [
      "M",
      "G"
    ],
    "first_code": "一",
    "last_code": "土",
    "first_key": "M",
    "last_key": "G",
    "full": "一土 (MG)",
    "cj_full": "一口弓月土 (MRNBG)",
    "secret": "【確】速成取碼：首碼【一】(M) ＋ 尾碼【土】(G)",
    "quickCode": "MG"
  },
  "票": {
    "char": "票",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一田一一火 (MWMMF)",
    "secret": "【票】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "麗": {
    "char": "麗",
    "codes": [
      "一",
      "心"
    ],
    "keys": [
      "M",
      "P"
    ],
    "first_code": "一",
    "last_code": "心",
    "first_key": "M",
    "last_key": "P",
    "full": "一心 (MP)",
    "cj_full": "一一月月心 (MMBBP)",
    "secret": "【麗】速成取碼：首碼【一】(M) ＋ 尾碼【心】(P)",
    "quickCode": "MP"
  },
  "才": {
    "char": "才",
    "codes": [
      "木",
      "竹"
    ],
    "keys": [
      "D",
      "H"
    ],
    "first_code": "木",
    "last_code": "竹",
    "first_key": "D",
    "last_key": "H",
    "full": "木竹 (DH)",
    "cj_full": "木竹 (DH)",
    "secret": "【才】速成取碼：首碼【木】(D) ＋ 尾碼【竹】(H)",
    "quickCode": "DH"
  },
  "浪": {
    "char": "浪",
    "codes": [
      "水",
      "女"
    ],
    "keys": [
      "E",
      "V"
    ],
    "first_code": "水",
    "last_code": "女",
    "first_key": "E",
    "last_key": "V",
    "full": "水女 (EV)",
    "cj_full": "水戈日女 (EIAV)",
    "secret": "【浪】速成取碼：首碼【水】(E) ＋ 尾碼【女】(V)",
    "quickCode": "EV"
  },
  "命": {
    "char": "命",
    "codes": [
      "人",
      "中"
    ],
    "keys": [
      "O",
      "L"
    ],
    "first_code": "人",
    "last_code": "中",
    "first_key": "O",
    "last_key": "L",
    "full": "人中 (OL)",
    "cj_full": "人一口中 (OMRL)",
    "secret": "【命】速成取碼：首碼【人】(O) ＋ 尾碼【中】(L)",
    "quickCode": "OL"
  },
  "介": {
    "char": "介",
    "codes": [
      "人",
      "中"
    ],
    "keys": [
      "O",
      "L"
    ],
    "first_code": "人",
    "last_code": "中",
    "first_key": "O",
    "last_key": "L",
    "full": "人中 (OL)",
    "cj_full": "人中中 (OLL)",
    "secret": "【介】速成取碼：首碼【人】(O) ＋ 尾碼【中】(L)",
    "quickCode": "OL"
  },
  "飛": {
    "char": "飛",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓人竹廿人 (NOHTO)",
    "secret": "【飛】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "足": {
    "char": "足",
    "codes": [
      "口",
      "人"
    ],
    "keys": [
      "R",
      "O"
    ],
    "first_code": "口",
    "last_code": "人",
    "first_key": "R",
    "last_key": "O",
    "full": "口人 (RO)",
    "cj_full": "口卜人 (RYO)",
    "secret": "【足】速成取碼：首碼【口】(R) ＋ 尾碼【人】(O)",
    "quickCode": "RO"
  },
  "庭": {
    "char": "庭",
    "codes": [
      "戈",
      "土"
    ],
    "keys": [
      "I",
      "G"
    ],
    "first_code": "戈",
    "last_code": "土",
    "first_key": "I",
    "last_key": "G",
    "full": "戈土 (IG)",
    "cj_full": "戈弓大土 (INKG)",
    "secret": "【庭】速成取碼：首碼【戈】(I) ＋ 尾碼【土】(G)",
    "quickCode": "IG"
  },
  "拿": {
    "char": "拿",
    "codes": [
      "人",
      "手"
    ],
    "keys": [
      "O",
      "Q"
    ],
    "first_code": "人",
    "last_code": "手",
    "first_key": "O",
    "last_key": "Q",
    "full": "人手 (OQ)",
    "cj_full": "人一口手 (OMRQ)",
    "secret": "【拿】速成取碼：首碼【人】(O) ＋ 尾碼【手】(Q)",
    "quickCode": "OQ"
  },
  "登": {
    "char": "登",
    "codes": [
      "弓",
      "廿"
    ],
    "keys": [
      "N",
      "T"
    ],
    "first_code": "弓",
    "last_code": "廿",
    "first_key": "N",
    "last_key": "T",
    "full": "弓廿 (NT)",
    "cj_full": "弓人一口廿 (NOMRT)",
    "secret": "【登】速成取碼：首碼【弓】(N) ＋ 尾碼【廿】(T)",
    "quickCode": "NT"
  },
  "春": {
    "char": "春",
    "codes": [
      "手",
      "日"
    ],
    "keys": [
      "Q",
      "A"
    ],
    "first_code": "手",
    "last_code": "日",
    "first_key": "Q",
    "last_key": "A",
    "full": "手日 (QA)",
    "cj_full": "手大日 (QKA)",
    "secret": "【春】速成取碼：首碼【手】(Q) ＋ 尾碼【日】(A)",
    "quickCode": "QA"
  },
  "博": {
    "char": "博",
    "codes": [
      "十",
      "戈"
    ],
    "keys": [
      "J",
      "I"
    ],
    "first_code": "十",
    "last_code": "戈",
    "first_key": "J",
    "last_key": "I",
    "full": "十戈 (JI)",
    "cj_full": "十戈月戈 (JIBI)",
    "secret": "【博】速成取碼：首碼【十】(J) ＋ 尾碼【戈】(I)",
    "quickCode": "JI"
  },
  "氣": {
    "char": "氣",
    "codes": [
      "人",
      "弓"
    ],
    "keys": [
      "O",
      "N"
    ],
    "first_code": "人",
    "last_code": "弓",
    "first_key": "O",
    "last_key": "N",
    "full": "人弓 (ON)",
    "cj_full": "人弓 (ON)",
    "secret": "【氣】速成取碼：首碼【人】(O) ＋ 尾碼【弓】(N)",
    "quickCode": "ON"
  },
  "她": {
    "char": "她",
    "codes": [
      "女",
      "木"
    ],
    "keys": [
      "V",
      "D"
    ],
    "first_code": "女",
    "last_code": "木",
    "first_key": "V",
    "last_key": "D",
    "full": "女木 (VD)",
    "cj_full": "女心木 (VPD)",
    "secret": "【她】速成取碼：首碼【女】(V) ＋ 尾碼【木】(D)",
    "quickCode": "VD"
  },
  "露": {
    "char": "露",
    "codes": [
      "一",
      "口"
    ],
    "keys": [
      "M",
      "R"
    ],
    "first_code": "一",
    "last_code": "口",
    "first_key": "M",
    "last_key": "R",
    "full": "一口 (MR)",
    "cj_full": "一月口一口 (MBRMR)",
    "secret": "【露】速成取碼：首碼【一】(M) ＋ 尾碼【口】(R)",
    "quickCode": "MR"
  },
  "許": {
    "char": "許",
    "codes": [
      "卜",
      "十"
    ],
    "keys": [
      "Y",
      "J"
    ],
    "first_code": "卜",
    "last_code": "十",
    "first_key": "Y",
    "last_key": "J",
    "full": "卜十 (YJ)",
    "cj_full": "卜口人十 (YROJ)",
    "secret": "【許】速成取碼：首碼【卜】(Y) ＋ 尾碼【十】(J)",
    "quickCode": "YJ"
  },
  "志": {
    "char": "志",
    "codes": [
      "土",
      "心"
    ],
    "keys": [
      "G",
      "P"
    ],
    "first_code": "土",
    "last_code": "心",
    "first_key": "G",
    "last_key": "P",
    "full": "土心 (GP)",
    "cj_full": "土心 (GP)",
    "secret": "【志】速成取碼：首碼【土】(G) ＋ 尾碼【心】(P)",
    "quickCode": "GP"
  },
  "花": {
    "char": "花",
    "codes": [
      "廿",
      "心"
    ],
    "keys": [
      "T",
      "P"
    ],
    "first_code": "廿",
    "last_code": "心",
    "first_key": "T",
    "last_key": "P",
    "full": "廿心 (TP)",
    "cj_full": "廿人心 (TOP)",
    "secret": "【花】速成取碼：首碼【廿】(T) ＋ 尾碼【心】(P)",
    "quickCode": "TP"
  },
  "汽": {
    "char": "汽",
    "codes": [
      "水",
      "弓"
    ],
    "keys": [
      "E",
      "N"
    ],
    "first_code": "水",
    "last_code": "弓",
    "first_key": "E",
    "last_key": "N",
    "full": "水弓 (EN)",
    "cj_full": "水人一弓 (EOMN)",
    "secret": "【汽】速成取碼：首碼【水】(E) ＋ 尾碼【弓】(N)",
    "quickCode": "EN"
  },
  "蒙": {
    "char": "蒙",
    "codes": [
      "廿",
      "人"
    ],
    "keys": [
      "T",
      "O"
    ],
    "first_code": "廿",
    "last_code": "人",
    "first_key": "T",
    "last_key": "O",
    "full": "廿人 (TO)",
    "cj_full": "廿月一人 (TBMO)",
    "secret": "【蒙】速成取碼：首碼【廿】(T) ＋ 尾碼【人】(O)",
    "quickCode": "TO"
  },
  "持": {
    "char": "持",
    "codes": [
      "手",
      "戈"
    ],
    "keys": [
      "Q",
      "I"
    ],
    "first_code": "手",
    "last_code": "戈",
    "first_key": "Q",
    "last_key": "I",
    "full": "手戈 (QI)",
    "cj_full": "手土木戈 (QGDI)",
    "secret": "【持】速成取碼：首碼【手】(Q) ＋ 尾碼【戈】(I)",
    "quickCode": "QI"
  },
  "取": {
    "char": "取",
    "codes": [
      "尸",
      "水"
    ],
    "keys": [
      "S",
      "E"
    ],
    "first_code": "尸",
    "last_code": "水",
    "first_key": "S",
    "last_key": "E",
    "full": "尸水 (SE)",
    "cj_full": "尸十水 (SJE)",
    "secret": "【取】速成取碼：首碼【尸】(S) ＋ 尾碼【水】(E)",
    "quickCode": "SE"
  },
  "境": {
    "char": "境",
    "codes": [
      "土",
      "山"
    ],
    "keys": [
      "G",
      "U"
    ],
    "first_code": "土",
    "last_code": "山",
    "first_key": "G",
    "last_key": "U",
    "full": "土山 (GU)",
    "cj_full": "土卜廿山 (GYTU)",
    "secret": "【境】速成取碼：首碼【土】(G) ＋ 尾碼【山】(U)",
    "quickCode": "GU"
  },
  "跑": {
    "char": "跑",
    "codes": [
      "口",
      "山"
    ],
    "keys": [
      "R",
      "U"
    ],
    "first_code": "口",
    "last_code": "山",
    "first_key": "R",
    "last_key": "U",
    "full": "口山 (RU)",
    "cj_full": "口一心口山 (RMPRU)",
    "secret": "【跑】速成取碼：首碼【口】(R) ＋ 尾碼【山】(U)",
    "quickCode": "RU"
  },
  "傳": {
    "char": "傳",
    "codes": [
      "人",
      "戈"
    ],
    "keys": [
      "O",
      "I"
    ],
    "first_code": "人",
    "last_code": "戈",
    "first_key": "O",
    "last_key": "I",
    "full": "人戈 (OI)",
    "cj_full": "人十戈戈 (OJII)",
    "secret": "【傳】速成取碼：首碼【人】(O) ＋ 尾碼【戈】(I)",
    "quickCode": "OI"
  },
  "尋": {
    "char": "尋",
    "codes": [
      "尸",
      "戈"
    ],
    "keys": [
      "S",
      "I"
    ],
    "first_code": "尸",
    "last_code": "戈",
    "first_key": "S",
    "last_key": "I",
    "full": "尸戈 (SI)",
    "cj_full": "尸一木戈 (SMDI)",
    "secret": "【尋】速成取碼：首碼【尸】(S) ＋ 尾碼【戈】(I)",
    "quickCode": "SI"
  },
  "上": {
    "char": "上",
    "codes": [
      "卜",
      "一"
    ],
    "keys": [
      "Y",
      "M"
    ],
    "first_code": "卜",
    "last_code": "一",
    "first_key": "Y",
    "last_key": "M",
    "full": "卜一 (YM)",
    "cj_full": "卜一 (YM)",
    "secret": "【上】速成取碼：首碼【卜】(Y) ＋ 尾碼【一】(M)",
    "quickCode": "YM"
  },
  "道": {
    "char": "道",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜廿竹山 (YTHU)",
    "secret": "【道】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "證": {
    "char": "證",
    "codes": [
      "卜",
      "廿"
    ],
    "keys": [
      "Y",
      "T"
    ],
    "first_code": "卜",
    "last_code": "廿",
    "first_key": "Y",
    "last_key": "T",
    "full": "卜廿 (YT)",
    "cj_full": "卜口弓人廿 (YRNOT)",
    "secret": "【證】速成取碼：首碼【卜】(Y) ＋ 尾碼【廿】(T)",
    "quickCode": "YT"
  },
  "隨": {
    "char": "隨",
    "codes": [
      "弓",
      "月"
    ],
    "keys": [
      "N",
      "B"
    ],
    "first_code": "弓",
    "last_code": "月",
    "first_key": "N",
    "last_key": "B",
    "full": "弓月 (NB)",
    "cj_full": "弓中卜大月 (NLYKB)",
    "secret": "【隨】速成取碼：首碼【弓】(N) ＋ 尾碼【月】(B)",
    "quickCode": "NB"
  },
  "兵": {
    "char": "兵",
    "codes": [
      "人",
      "金"
    ],
    "keys": [
      "O",
      "C"
    ],
    "first_code": "人",
    "last_code": "金",
    "first_key": "O",
    "last_key": "C",
    "full": "人金 (OC)",
    "cj_full": "人一金 (OMC)",
    "secret": "【兵】速成取碼：首碼【人】(O) ＋ 尾碼【金】(C)",
    "quickCode": "OC"
  },
  "台": {
    "char": "台",
    "codes": [
      "戈",
      "口"
    ],
    "keys": [
      "I",
      "R"
    ],
    "first_code": "戈",
    "last_code": "口",
    "first_key": "I",
    "last_key": "R",
    "full": "戈口 (IR)",
    "cj_full": "戈口 (IR)",
    "secret": "【台】速成取碼：首碼【戈】(I) ＋ 尾碼【口】(R)",
    "quickCode": "IR"
  },
  "富": {
    "char": "富",
    "codes": [
      "十",
      "田"
    ],
    "keys": [
      "J",
      "W"
    ],
    "first_code": "十",
    "last_code": "田",
    "first_key": "J",
    "last_key": "W",
    "full": "十田 (JW)",
    "cj_full": "十一口田 (JMRW)",
    "secret": "【富】速成取碼：首碼【十】(J) ＋ 尾碼【田】(W)",
    "quickCode": "JW"
  },
  "背": {
    "char": "背",
    "codes": [
      "中",
      "月"
    ],
    "keys": [
      "L",
      "B"
    ],
    "first_code": "中",
    "last_code": "月",
    "first_key": "L",
    "last_key": "B",
    "full": "中月 (LB)",
    "cj_full": "中心月 (LPB)",
    "secret": "【背】速成取碼：首碼【中】(L) ＋ 尾碼【月】(B)",
    "quickCode": "LB"
  },
  "敢": {
    "char": "敢",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一十人大 (MJOK)",
    "secret": "【敢】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "蓋": {
    "char": "蓋",
    "codes": [
      "廿",
      "廿"
    ],
    "keys": [
      "T",
      "T"
    ],
    "first_code": "廿",
    "last_code": "廿",
    "first_key": "T",
    "last_key": "T",
    "full": "廿廿 (TT)",
    "cj_full": "廿土戈廿 (TGIT)",
    "secret": "【蓋】速成取碼：首碼【廿】(T) ＋ 尾碼【廿】(T)",
    "quickCode": "TT"
  },
  "頓": {
    "char": "頓",
    "codes": [
      "心",
      "金"
    ],
    "keys": [
      "P",
      "C"
    ],
    "first_code": "心",
    "last_code": "金",
    "first_key": "P",
    "last_key": "C",
    "full": "心金 (PC)",
    "cj_full": "心山一月金 (PUMBC)",
    "secret": "【頓】速成取碼：首碼【心】(P) ＋ 尾碼【金】(C)",
    "quickCode": "PC"
  },
  "將": {
    "char": "將",
    "codes": [
      "女",
      "戈"
    ],
    "keys": [
      "V",
      "I"
    ],
    "first_code": "女",
    "last_code": "戈",
    "first_key": "V",
    "last_key": "I",
    "full": "女戈 (VI)",
    "cj_full": "女一月木戈 (VMBDI)",
    "secret": "【將】速成取碼：首碼【女】(V) ＋ 尾碼【戈】(I)",
    "quickCode": "VI"
  },
  "管": {
    "char": "管",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹十口口 (HJRR)",
    "secret": "【管】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "認": {
    "char": "認",
    "codes": [
      "卜",
      "心"
    ],
    "keys": [
      "Y",
      "P"
    ],
    "first_code": "卜",
    "last_code": "心",
    "first_key": "Y",
    "last_key": "P",
    "full": "卜心 (YP)",
    "cj_full": "卜口尸戈心 (YRSIP)",
    "secret": "【認】速成取碼：首碼【卜】(Y) ＋ 尾碼【心】(P)",
    "quickCode": "YP"
  },
  "笑": {
    "char": "笑",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹竹大 (HHK)",
    "secret": "【笑】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "短": {
    "char": "短",
    "codes": [
      "人",
      "廿"
    ],
    "keys": [
      "O",
      "T"
    ],
    "first_code": "人",
    "last_code": "廿",
    "first_key": "O",
    "last_key": "T",
    "full": "人廿 (OT)",
    "cj_full": "人大一口廿 (OKMRT)",
    "secret": "【短】速成取碼：首碼【人】(O) ＋ 尾碼【廿】(T)",
    "quickCode": "OT"
  },
  "影": {
    "char": "影",
    "codes": [
      "日",
      "竹"
    ],
    "keys": [
      "A",
      "H"
    ],
    "first_code": "日",
    "last_code": "竹",
    "first_key": "A",
    "last_key": "H",
    "full": "日竹 (AH)",
    "cj_full": "日火竹竹竹 (AFHHH)",
    "secret": "【影】速成取碼：首碼【日】(A) ＋ 尾碼【竹】(H)",
    "quickCode": "AH"
  },
  "近": {
    "char": "近",
    "codes": [
      "卜",
      "中"
    ],
    "keys": [
      "Y",
      "L"
    ],
    "first_code": "卜",
    "last_code": "中",
    "first_key": "Y",
    "last_key": "L",
    "full": "卜中 (YL)",
    "cj_full": "卜竹一中 (YHML)",
    "secret": "【近】速成取碼：首碼【卜】(Y) ＋ 尾碼【中】(L)",
    "quickCode": "YL"
  },
  "沙": {
    "char": "沙",
    "codes": [
      "水",
      "竹"
    ],
    "keys": [
      "E",
      "H"
    ],
    "first_code": "水",
    "last_code": "竹",
    "first_key": "E",
    "last_key": "H",
    "full": "水竹 (EH)",
    "cj_full": "水火竹 (EFH)",
    "secret": "【沙】速成取碼：首碼【水】(E) ＋ 尾碼【竹】(H)",
    "quickCode": "EH"
  },
  "吧": {
    "char": "吧",
    "codes": [
      "口",
      "山"
    ],
    "keys": [
      "R",
      "U"
    ],
    "first_code": "口",
    "last_code": "山",
    "first_key": "R",
    "last_key": "U",
    "full": "口山 (RU)",
    "cj_full": "口日山 (RAU)",
    "secret": "【吧】速成取碼：首碼【口】(R) ＋ 尾碼【山】(U)",
    "quickCode": "RU"
  },
  "規": {
    "char": "規",
    "codes": [
      "手",
      "山"
    ],
    "keys": [
      "Q",
      "U"
    ],
    "first_code": "手",
    "last_code": "山",
    "first_key": "Q",
    "last_key": "U",
    "full": "手山 (QU)",
    "cj_full": "手人月山山 (QOBUU)",
    "secret": "【規】速成取碼：首碼【手】(Q) ＋ 尾碼【山】(U)",
    "quickCode": "QU"
  },
  "響": {
    "char": "響",
    "codes": [
      "女",
      "日"
    ],
    "keys": [
      "V",
      "A"
    ],
    "first_code": "女",
    "last_code": "日",
    "first_key": "V",
    "last_key": "A",
    "full": "女日 (VA)",
    "cj_full": "女中卜廿日 (VLYTA)",
    "secret": "【響】速成取碼：首碼【女】(V) ＋ 尾碼【日】(A)",
    "quickCode": "VA"
  },
  "次": {
    "char": "次",
    "codes": [
      "戈",
      "弓"
    ],
    "keys": [
      "I",
      "N"
    ],
    "first_code": "戈",
    "last_code": "弓",
    "first_key": "I",
    "last_key": "N",
    "full": "戈弓 (IN)",
    "cj_full": "戈人弓 (ION)",
    "secret": "【次】速成取碼：首碼【戈】(I) ＋ 尾碼【弓】(N)",
    "quickCode": "IN"
  },
  "水": {
    "char": "水",
    "codes": [
      "水"
    ],
    "keys": [
      "E"
    ],
    "first_code": "水",
    "last_code": "水",
    "first_key": "E",
    "last_key": "E",
    "full": "水 (E)",
    "cj_full": "水 (E)",
    "secret": "【水】單碼字：直取【水】(E)",
    "quickCode": "E"
  },
  "竟": {
    "char": "竟",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜廿日竹山 (YTAHU)",
    "secret": "【竟】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "住": {
    "char": "住",
    "codes": [
      "人",
      "土"
    ],
    "keys": [
      "O",
      "G"
    ],
    "first_code": "人",
    "last_code": "土",
    "first_key": "O",
    "last_key": "G",
    "full": "人土 (OG)",
    "cj_full": "人卜土 (OYG)",
    "secret": "【住】速成取碼：首碼【人】(O) ＋ 尾碼【土】(G)",
    "quickCode": "OG"
  },
  "必": {
    "char": "必",
    "codes": [
      "心",
      "竹"
    ],
    "keys": [
      "P",
      "H"
    ],
    "first_code": "心",
    "last_code": "竹",
    "first_key": "P",
    "last_key": "H",
    "full": "心竹 (PH)",
    "cj_full": "心竹 (PH)",
    "secret": "【必】速成取碼：首碼【心】(P) ＋ 尾碼【竹】(H)",
    "quickCode": "PH"
  },
  "甚": {
    "char": "甚",
    "codes": [
      "廿",
      "尸"
    ],
    "keys": [
      "T",
      "S"
    ],
    "first_code": "廿",
    "last_code": "尸",
    "first_key": "T",
    "last_key": "S",
    "full": "廿尸 (TS)",
    "cj_full": "廿一一尸 (TMMS)",
    "secret": "【甚】速成取碼：首碼【廿】(T) ＋ 尾碼【尸】(S)",
    "quickCode": "TS"
  },
  "亂": {
    "char": "亂",
    "codes": [
      "月",
      "山"
    ],
    "keys": [
      "B",
      "U"
    ],
    "first_code": "月",
    "last_code": "山",
    "first_key": "B",
    "last_key": "U",
    "full": "月山 (BU)",
    "cj_full": "月月山 (BBU)",
    "secret": "【亂】速成取碼：首碼【月】(B) ＋ 尾碼【山】(U)",
    "quickCode": "BU"
  },
  "就": {
    "char": "就",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜火戈大山 (YFIKU)",
    "secret": "【就】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "嗎": {
    "char": "嗎",
    "codes": [
      "口",
      "火"
    ],
    "keys": [
      "R",
      "F"
    ],
    "first_code": "口",
    "last_code": "火",
    "first_key": "R",
    "last_key": "F",
    "full": "口火 (RF)",
    "cj_full": "口尸手火 (RSQF)",
    "secret": "【嗎】速成取碼：首碼【口】(R) ＋ 尾碼【火】(F)",
    "quickCode": "RF"
  },
  "堂": {
    "char": "堂",
    "codes": [
      "火",
      "土"
    ],
    "keys": [
      "F",
      "G"
    ],
    "first_code": "火",
    "last_code": "土",
    "first_key": "F",
    "last_key": "G",
    "full": "火土 (FG)",
    "cj_full": "火月口土 (FBRG)",
    "secret": "【堂】速成取碼：首碼【火】(F) ＋ 尾碼【土】(G)",
    "quickCode": "FG"
  },
  "章": {
    "char": "章",
    "codes": [
      "卜",
      "十"
    ],
    "keys": [
      "Y",
      "J"
    ],
    "first_code": "卜",
    "last_code": "十",
    "first_key": "Y",
    "last_key": "J",
    "full": "卜十 (YJ)",
    "cj_full": "卜廿日十 (YTAJ)",
    "secret": "【章】速成取碼：首碼【卜】(Y) ＋ 尾碼【十】(J)",
    "quickCode": "YJ"
  },
  "講": {
    "char": "講",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜口廿廿月 (YRTTB)",
    "secret": "【講】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "爾": {
    "char": "爾",
    "codes": [
      "一",
      "大"
    ],
    "keys": [
      "M",
      "K"
    ],
    "first_code": "一",
    "last_code": "大",
    "first_key": "M",
    "last_key": "K",
    "full": "一大 (MK)",
    "cj_full": "一火月大 (MFBK)",
    "secret": "【爾】速成取碼：首碼【一】(M) ＋ 尾碼【大】(K)",
    "quickCode": "MK"
  },
  "後": {
    "char": "後",
    "codes": [
      "竹",
      "水"
    ],
    "keys": [
      "H",
      "E"
    ],
    "first_code": "竹",
    "last_code": "水",
    "first_key": "H",
    "last_key": "E",
    "full": "竹水 (HE)",
    "cj_full": "竹人女戈水 (HOVIE)",
    "secret": "【後】速成取碼：首碼【竹】(H) ＋ 尾碼【水】(E)",
    "quickCode": "HE"
  },
  "火": {
    "char": "火",
    "codes": [
      "火"
    ],
    "keys": [
      "F"
    ],
    "first_code": "火",
    "last_code": "火",
    "first_key": "F",
    "last_key": "F",
    "full": "火 (F)",
    "cj_full": "火 (F)",
    "secret": "【火】單碼字：直取【火】(F)",
    "quickCode": "F"
  },
  "適": {
    "char": "適",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜卜金月 (YYCB)",
    "secret": "【適】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "救": {
    "char": "救",
    "codes": [
      "戈",
      "大"
    ],
    "keys": [
      "I",
      "K"
    ],
    "first_code": "戈",
    "last_code": "大",
    "first_key": "I",
    "last_key": "K",
    "full": "戈大 (IK)",
    "cj_full": "戈水人大 (IEOK)",
    "secret": "【救】速成取碼：首碼【戈】(I) ＋ 尾碼【大】(K)",
    "quickCode": "IK"
  },
  "忙": {
    "char": "忙",
    "codes": [
      "心",
      "女"
    ],
    "keys": [
      "P",
      "V"
    ],
    "first_code": "心",
    "last_code": "女",
    "first_key": "P",
    "last_key": "V",
    "full": "心女 (PV)",
    "cj_full": "心卜女 (PYV)",
    "secret": "【忙】速成取碼：首碼【心】(P) ＋ 尾碼【女】(V)",
    "quickCode": "PV"
  },
  "很": {
    "char": "很",
    "codes": [
      "竹",
      "女"
    ],
    "keys": [
      "H",
      "V"
    ],
    "first_code": "竹",
    "last_code": "女",
    "first_key": "H",
    "last_key": "V",
    "full": "竹女 (HV)",
    "cj_full": "竹人日女 (HOAV)",
    "secret": "【很】速成取碼：首碼【竹】(H) ＋ 尾碼【女】(V)",
    "quickCode": "HV"
  },
  "室": {
    "char": "室",
    "codes": [
      "十",
      "土"
    ],
    "keys": [
      "J",
      "G"
    ],
    "first_code": "十",
    "last_code": "土",
    "first_key": "J",
    "last_key": "G",
    "full": "十土 (JG)",
    "cj_full": "十一戈土 (JMIG)",
    "secret": "【室】速成取碼：首碼【十】(J) ＋ 尾碼【土】(G)",
    "quickCode": "JG"
  },
  "字": {
    "char": "字",
    "codes": [
      "十",
      "木"
    ],
    "keys": [
      "J",
      "D"
    ],
    "first_code": "十",
    "last_code": "木",
    "first_key": "J",
    "last_key": "D",
    "full": "十木 (JD)",
    "cj_full": "十弓木 (JND)",
    "secret": "【字】速成取碼：首碼【十】(J) ＋ 尾碼【木】(D)",
    "quickCode": "JD"
  },
  "編": {
    "char": "編",
    "codes": [
      "女",
      "月"
    ],
    "keys": [
      "V",
      "B"
    ],
    "first_code": "女",
    "last_code": "月",
    "first_key": "V",
    "last_key": "B",
    "full": "女月 (VB)",
    "cj_full": "女火竹尸月 (VFHSB)",
    "secret": "【編】速成取碼：首碼【女】(V) ＋ 尾碼【月】(B)",
    "quickCode": "VB"
  },
  "未": {
    "char": "未",
    "codes": [
      "十",
      "木"
    ],
    "keys": [
      "J",
      "D"
    ],
    "first_code": "十",
    "last_code": "木",
    "first_key": "J",
    "last_key": "D",
    "full": "十木 (JD)",
    "cj_full": "十木 (JD)",
    "secret": "【未】速成取碼：首碼【十】(J) ＋ 尾碼【木】(D)",
    "quickCode": "JD"
  },
  "息": {
    "char": "息",
    "codes": [
      "竹",
      "心"
    ],
    "keys": [
      "H",
      "P"
    ],
    "first_code": "竹",
    "last_code": "心",
    "first_key": "H",
    "last_key": "P",
    "full": "竹心 (HP)",
    "cj_full": "竹山心 (HUP)",
    "secret": "【息】速成取碼：首碼【竹】(H) ＋ 尾碼【心】(P)",
    "quickCode": "HP"
  },
  "蘇": {
    "char": "蘇",
    "codes": [
      "廿",
      "木"
    ],
    "keys": [
      "T",
      "D"
    ],
    "first_code": "廿",
    "last_code": "木",
    "first_key": "T",
    "last_key": "D",
    "full": "廿木 (TD)",
    "cj_full": "廿弓火木 (TNFD)",
    "secret": "【蘇】速成取碼：首碼【廿】(T) ＋ 尾碼【木】(D)",
    "quickCode": "TD"
  },
  "群": {
    "char": "群",
    "codes": [
      "尸",
      "手"
    ],
    "keys": [
      "S",
      "Q"
    ],
    "first_code": "尸",
    "last_code": "手",
    "first_key": "S",
    "last_key": "Q",
    "full": "尸手 (SQ)",
    "cj_full": "尸口廿手 (SRTQ)",
    "secret": "【群】速成取碼：首碼【尸】(S) ＋ 尾碼【手】(Q)",
    "quickCode": "SQ"
  },
  "領": {
    "char": "領",
    "codes": [
      "人",
      "金"
    ],
    "keys": [
      "O",
      "C"
    ],
    "first_code": "人",
    "last_code": "金",
    "first_key": "O",
    "last_key": "C",
    "full": "人金 (OC)",
    "cj_full": "人戈一月金 (OIMBC)",
    "secret": "【領】速成取碼：首碼【人】(O) ＋ 尾碼【金】(C)",
    "quickCode": "OC"
  },
  "禁": {
    "char": "禁",
    "codes": [
      "木",
      "火"
    ],
    "keys": [
      "D",
      "F"
    ],
    "first_code": "木",
    "last_code": "火",
    "first_key": "D",
    "last_key": "F",
    "full": "木火 (DF)",
    "cj_full": "木木一一火 (DDMMF)",
    "secret": "【禁】速成取碼：首碼【木】(D) ＋ 尾碼【火】(F)",
    "quickCode": "DF"
  },
  "啊": {
    "char": "啊",
    "codes": [
      "口",
      "口"
    ],
    "keys": [
      "R",
      "R"
    ],
    "first_code": "口",
    "last_code": "口",
    "first_key": "R",
    "last_key": "R",
    "full": "口口 (RR)",
    "cj_full": "口弓中口 (RNLR)",
    "secret": "【啊】速成取碼：首碼【口】(R) ＋ 尾碼【口】(R)",
    "quickCode": "RR"
  },
  "請": {
    "char": "請",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜口手一月 (YRQMB)",
    "secret": "【請】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "耳": {
    "char": "耳",
    "codes": [
      "尸",
      "十"
    ],
    "keys": [
      "S",
      "J"
    ],
    "first_code": "尸",
    "last_code": "十",
    "first_key": "S",
    "last_key": "J",
    "full": "尸十 (SJ)",
    "cj_full": "尸十 (SJ)",
    "secret": "【耳】速成取碼：首碼【尸】(S) ＋ 尾碼【十】(J)",
    "quickCode": "SJ"
  },
  "解": {
    "char": "解",
    "codes": [
      "弓",
      "手"
    ],
    "keys": [
      "N",
      "Q"
    ],
    "first_code": "弓",
    "last_code": "手",
    "first_key": "N",
    "last_key": "Q",
    "full": "弓手 (NQ)",
    "cj_full": "弓月尸竹手 (NBSHQ)",
    "secret": "【解】速成取碼：首碼【弓】(N) ＋ 尾碼【手】(Q)",
    "quickCode": "NQ"
  },
  "送": {
    "char": "送",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜廿大 (YTK)",
    "secret": "【送】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "桌": {
    "char": "桌",
    "codes": [
      "卜",
      "木"
    ],
    "keys": [
      "Y",
      "D"
    ],
    "first_code": "卜",
    "last_code": "木",
    "first_key": "Y",
    "last_key": "D",
    "full": "卜木 (YD)",
    "cj_full": "卜日木 (YAD)",
    "secret": "【桌】速成取碼：首碼【卜】(Y) ＋ 尾碼【木】(D)",
    "quickCode": "YD"
  },
  "原": {
    "char": "原",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一竹日火 (MHAF)",
    "secret": "【原】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "獨": {
    "char": "獨",
    "codes": [
      "大",
      "戈"
    ],
    "keys": [
      "K",
      "I"
    ],
    "first_code": "大",
    "last_code": "戈",
    "first_key": "K",
    "last_key": "I",
    "full": "大戈 (KI)",
    "cj_full": "大竹田中戈 (KHWLI)",
    "secret": "【獨】速成取碼：首碼【大】(K) ＋ 尾碼【戈】(I)",
    "quickCode": "KI"
  },
  "百": {
    "char": "百",
    "codes": [
      "一",
      "日"
    ],
    "keys": [
      "M",
      "A"
    ],
    "first_code": "一",
    "last_code": "日",
    "first_key": "M",
    "last_key": "A",
    "full": "一日 (MA)",
    "cj_full": "一日 (MA)",
    "secret": "【百】速成取碼：首碼【一】(M) ＋ 尾碼【日】(A)",
    "quickCode": "MA"
  },
  "紀": {
    "char": "紀",
    "codes": [
      "女",
      "山"
    ],
    "keys": [
      "V",
      "U"
    ],
    "first_code": "女",
    "last_code": "山",
    "first_key": "V",
    "last_key": "U",
    "full": "女山 (VU)",
    "cj_full": "女火尸山 (VFSU)",
    "secret": "【紀】速成取碼：首碼【女】(V) ＋ 尾碼【山】(U)",
    "quickCode": "VU"
  },
  "或": {
    "char": "或",
    "codes": [
      "戈",
      "一"
    ],
    "keys": [
      "I",
      "M"
    ],
    "first_code": "戈",
    "last_code": "一",
    "first_key": "I",
    "last_key": "M",
    "full": "戈一 (IM)",
    "cj_full": "戈口一 (IRM)",
    "secret": "【或】速成取碼：首碼【戈】(I) ＋ 尾碼【一】(M)",
    "quickCode": "IM"
  },
  "望": {
    "char": "望",
    "codes": [
      "卜",
      "土"
    ],
    "keys": [
      "Y",
      "G"
    ],
    "first_code": "卜",
    "last_code": "土",
    "first_key": "Y",
    "last_key": "G",
    "full": "卜土 (YG)",
    "cj_full": "卜月竹土 (YBHG)",
    "secret": "【望】速成取碼：首碼【卜】(Y) ＋ 尾碼【土】(G)",
    "quickCode": "YG"
  },
  "子": {
    "char": "子",
    "codes": [
      "弓",
      "木"
    ],
    "keys": [
      "N",
      "D"
    ],
    "first_code": "弓",
    "last_code": "木",
    "first_key": "N",
    "last_key": "D",
    "full": "弓木 (ND)",
    "cj_full": "弓木 (ND)",
    "secret": "【子】速成取碼：首碼【弓】(N) ＋ 尾碼【木】(D)",
    "quickCode": "ND"
  },
  "判": {
    "char": "判",
    "codes": [
      "火",
      "弓"
    ],
    "keys": [
      "F",
      "N"
    ],
    "first_code": "火",
    "last_code": "弓",
    "first_key": "F",
    "last_key": "N",
    "full": "火弓 (FN)",
    "cj_full": "火手中弓 (FQLN)",
    "secret": "【判】速成取碼：首碼【火】(F) ＋ 尾碼【弓】(N)",
    "quickCode": "FN"
  },
  "呼": {
    "char": "呼",
    "codes": [
      "口",
      "木"
    ],
    "keys": [
      "R",
      "D"
    ],
    "first_code": "口",
    "last_code": "木",
    "first_key": "R",
    "last_key": "D",
    "full": "口木 (RD)",
    "cj_full": "口竹火木 (RHFD)",
    "secret": "【呼】速成取碼：首碼【口】(R) ＋ 尾碼【木】(D)",
    "quickCode": "RD"
  },
  "項": {
    "char": "項",
    "codes": [
      "一",
      "金"
    ],
    "keys": [
      "M",
      "C"
    ],
    "first_code": "一",
    "last_code": "金",
    "first_key": "M",
    "last_key": "C",
    "full": "一金 (MC)",
    "cj_full": "一一月金 (MMBC)",
    "secret": "【項】速成取碼：首碼【一】(M) ＋ 尾碼【金】(C)",
    "quickCode": "MC"
  },
  "旁": {
    "char": "旁",
    "codes": [
      "卜",
      "尸"
    ],
    "keys": [
      "Y",
      "S"
    ],
    "first_code": "卜",
    "last_code": "尸",
    "first_key": "Y",
    "last_key": "S",
    "full": "卜尸 (YS)",
    "cj_full": "卜月卜竹尸 (YBYHS)",
    "secret": "【旁】速成取碼：首碼【卜】(Y) ＋ 尾碼【尸】(S)",
    "quickCode": "YS"
  },
  "害": {
    "char": "害",
    "codes": [
      "十",
      "口"
    ],
    "keys": [
      "J",
      "R"
    ],
    "first_code": "十",
    "last_code": "口",
    "first_key": "J",
    "last_key": "R",
    "full": "十口 (JR)",
    "cj_full": "十手一口 (JQMR)",
    "secret": "【害】速成取碼：首碼【十】(J) ＋ 尾碼【口】(R)",
    "quickCode": "JR"
  },
  "令": {
    "char": "令",
    "codes": [
      "人",
      "戈"
    ],
    "keys": [
      "O",
      "I"
    ],
    "first_code": "人",
    "last_code": "戈",
    "first_key": "O",
    "last_key": "I",
    "full": "人戈 (OI)",
    "cj_full": "人戈弓戈 (OINI)",
    "secret": "【令】速成取碼：首碼【人】(O) ＋ 尾碼【戈】(I)",
    "quickCode": "OI"
  },
  "各": {
    "char": "各",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹水口 (HER)",
    "secret": "【各】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "單": {
    "char": "單",
    "codes": [
      "口",
      "十"
    ],
    "keys": [
      "R",
      "J"
    ],
    "first_code": "口",
    "last_code": "十",
    "first_key": "R",
    "last_key": "J",
    "full": "口十 (RJ)",
    "cj_full": "口口田十 (RRWJ)",
    "secret": "【單】速成取碼：首碼【口】(R) ＋ 尾碼【十】(J)",
    "quickCode": "RJ"
  },
  "賣": {
    "char": "賣",
    "codes": [
      "土",
      "金"
    ],
    "keys": [
      "G",
      "C"
    ],
    "first_code": "土",
    "last_code": "金",
    "first_key": "G",
    "last_key": "C",
    "full": "土金 (GC)",
    "cj_full": "土田中金 (GWLC)",
    "secret": "【賣】速成取碼：首碼【土】(G) ＋ 尾碼【金】(C)",
    "quickCode": "GC"
  },
  "遠": {
    "char": "遠",
    "codes": [
      "卜",
      "女"
    ],
    "keys": [
      "Y",
      "V"
    ],
    "first_code": "卜",
    "last_code": "女",
    "first_key": "Y",
    "last_key": "V",
    "full": "卜女 (YV)",
    "cj_full": "卜土口女 (YGRV)",
    "secret": "【遠】速成取碼：首碼【卜】(Y) ＋ 尾碼【女】(V)",
    "quickCode": "YV"
  },
  "度": {
    "char": "度",
    "codes": [
      "戈",
      "水"
    ],
    "keys": [
      "I",
      "E"
    ],
    "first_code": "戈",
    "last_code": "水",
    "first_key": "I",
    "last_key": "E",
    "full": "戈水 (IE)",
    "cj_full": "戈廿水 (ITE)",
    "secret": "【度】速成取碼：首碼【戈】(I) ＋ 尾碼【水】(E)",
    "quickCode": "IE"
  },
  "識": {
    "char": "識",
    "codes": [
      "卜",
      "日"
    ],
    "keys": [
      "Y",
      "A"
    ],
    "first_code": "卜",
    "last_code": "日",
    "first_key": "Y",
    "last_key": "A",
    "full": "卜日 (YA)",
    "cj_full": "卜口卜戈日 (YRYIA)",
    "secret": "【識】速成取碼：首碼【卜】(Y) ＋ 尾碼【日】(A)",
    "quickCode": "YA"
  },
  "想": {
    "char": "想",
    "codes": [
      "木",
      "心"
    ],
    "keys": [
      "D",
      "P"
    ],
    "first_code": "木",
    "last_code": "心",
    "first_key": "D",
    "last_key": "P",
    "full": "木心 (DP)",
    "cj_full": "木山心 (DUP)",
    "secret": "【想】速成取碼：首碼【木】(D) ＋ 尾碼【心】(P)",
    "quickCode": "DP"
  },
  "查": {
    "char": "查",
    "codes": [
      "木",
      "一"
    ],
    "keys": [
      "D",
      "M"
    ],
    "first_code": "木",
    "last_code": "一",
    "first_key": "D",
    "last_key": "M",
    "full": "木一 (DM)",
    "cj_full": "木日一 (DAM)",
    "secret": "【查】速成取碼：首碼【木】(D) ＋ 尾碼【一】(M)",
    "quickCode": "DM"
  },
  "貴": {
    "char": "貴",
    "codes": [
      "中",
      "金"
    ],
    "keys": [
      "L",
      "C"
    ],
    "first_code": "中",
    "last_code": "金",
    "first_key": "L",
    "last_key": "C",
    "full": "中金 (LC)",
    "cj_full": "中一月山金 (LMBUC)",
    "secret": "【貴】速成取碼：首碼【中】(L) ＋ 尾碼【金】(C)",
    "quickCode": "LC"
  },
  "換": {
    "char": "換",
    "codes": [
      "手",
      "大"
    ],
    "keys": [
      "Q",
      "K"
    ],
    "first_code": "手",
    "last_code": "大",
    "first_key": "Q",
    "last_key": "K",
    "full": "手大 (QK)",
    "cj_full": "手弓月大 (QNBK)",
    "secret": "【換】速成取碼：首碼【手】(Q) ＋ 尾碼【大】(K)",
    "quickCode": "QK"
  },
  "選": {
    "char": "選",
    "codes": [
      "卜",
      "金"
    ],
    "keys": [
      "Y",
      "C"
    ],
    "first_code": "卜",
    "last_code": "金",
    "first_key": "Y",
    "last_key": "C",
    "full": "卜金 (YC)",
    "cj_full": "卜口山金 (YRUC)",
    "secret": "【選】速成取碼：首碼【卜】(Y) ＋ 尾碼【金】(C)",
    "quickCode": "YC"
  },
  "幾": {
    "char": "幾",
    "codes": [
      "女",
      "戈"
    ],
    "keys": [
      "V",
      "I"
    ],
    "first_code": "女",
    "last_code": "戈",
    "first_key": "V",
    "last_key": "I",
    "full": "女戈 (VI)",
    "cj_full": "女戈竹戈 (VIHI)",
    "secret": "【幾】速成取碼：首碼【女】(V) ＋ 尾碼【戈】(I)",
    "quickCode": "VI"
  },
  "男": {
    "char": "男",
    "codes": [
      "田",
      "尸"
    ],
    "keys": [
      "W",
      "S"
    ],
    "first_code": "田",
    "last_code": "尸",
    "first_key": "W",
    "last_key": "S",
    "full": "田尸 (WS)",
    "cj_full": "田大尸 (WKS)",
    "secret": "【男】速成取碼：首碼【田】(W) ＋ 尾碼【尸】(S)",
    "quickCode": "WS"
  },
  "前": {
    "char": "前",
    "codes": [
      "廿",
      "弓"
    ],
    "keys": [
      "T",
      "N"
    ],
    "first_code": "廿",
    "last_code": "弓",
    "first_key": "T",
    "last_key": "N",
    "full": "廿弓 (TN)",
    "cj_full": "廿月中弓 (TBLN)",
    "secret": "【前】速成取碼：首碼【廿】(T) ＋ 尾碼【弓】(N)",
    "quickCode": "TN"
  },
  "諾": {
    "char": "諾",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜口廿大口 (YRTKR)",
    "secret": "【諾】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "印": {
    "char": "印",
    "codes": [
      "竹",
      "中"
    ],
    "keys": [
      "H",
      "L"
    ],
    "first_code": "竹",
    "last_code": "中",
    "first_key": "H",
    "last_key": "L",
    "full": "竹中 (HL)",
    "cj_full": "竹心尸中 (HPSL)",
    "secret": "【印】速成取碼：首碼【竹】(H) ＋ 尾碼【中】(L)",
    "quickCode": "HL"
  },
  "忽": {
    "char": "忽",
    "codes": [
      "心",
      "心"
    ],
    "keys": [
      "P",
      "P"
    ],
    "first_code": "心",
    "last_code": "心",
    "first_key": "P",
    "last_key": "P",
    "full": "心心 (PP)",
    "cj_full": "心竹心 (PHP)",
    "secret": "【忽】速成取碼：首碼【心】(P) ＋ 尾碼【心】(P)",
    "quickCode": "PP"
  },
  "見": {
    "char": "見",
    "codes": [
      "月",
      "山"
    ],
    "keys": [
      "B",
      "U"
    ],
    "first_code": "月",
    "last_code": "山",
    "first_key": "B",
    "last_key": "U",
    "full": "月山 (BU)",
    "cj_full": "月山竹山 (BUHU)",
    "secret": "【見】速成取碼：首碼【月】(B) ＋ 尾碼【山】(U)",
    "quickCode": "BU"
  },
  "報": {
    "char": "報",
    "codes": [
      "土",
      "水"
    ],
    "keys": [
      "G",
      "E"
    ],
    "first_code": "土",
    "last_code": "水",
    "first_key": "G",
    "last_key": "E",
    "full": "土水 (GE)",
    "cj_full": "土十尸中水 (GJSLE)",
    "secret": "【報】速成取碼：首碼【土】(G) ＋ 尾碼【水】(E)",
    "quickCode": "GE"
  },
  "銀": {
    "char": "銀",
    "codes": [
      "金",
      "女"
    ],
    "keys": [
      "C",
      "V"
    ],
    "first_code": "金",
    "last_code": "女",
    "first_key": "C",
    "last_key": "V",
    "full": "金女 (CV)",
    "cj_full": "金日女 (CAV)",
    "secret": "【銀】速成取碼：首碼【金】(C) ＋ 尾碼【女】(V)",
    "quickCode": "CV"
  },
  "指": {
    "char": "指",
    "codes": [
      "手",
      "日"
    ],
    "keys": [
      "Q",
      "A"
    ],
    "first_code": "手",
    "last_code": "日",
    "first_key": "Q",
    "last_key": "A",
    "full": "手日 (QA)",
    "cj_full": "手心日 (QPA)",
    "secret": "【指】速成取碼：首碼【手】(Q) ＋ 尾碼【日】(A)",
    "quickCode": "QA"
  },
  "整": {
    "char": "整",
    "codes": [
      "木",
      "一"
    ],
    "keys": [
      "D",
      "M"
    ],
    "first_code": "木",
    "last_code": "一",
    "first_key": "D",
    "last_key": "M",
    "full": "木一 (DM)",
    "cj_full": "木大一卜一 (DKMYM)",
    "secret": "【整】速成取碼：首碼【木】(D) ＋ 尾碼【一】(M)",
    "quickCode": "DM"
  },
  "些": {
    "char": "些",
    "codes": [
      "卜",
      "一"
    ],
    "keys": [
      "Y",
      "M"
    ],
    "first_code": "卜",
    "last_code": "一",
    "first_key": "Y",
    "last_key": "M",
    "full": "卜一 (YM)",
    "cj_full": "卜心一一 (YPMM)",
    "secret": "【些】速成取碼：首碼【卜】(Y) ＋ 尾碼【一】(M)",
    "quickCode": "YM"
  },
  "病": {
    "char": "病",
    "codes": [
      "大",
      "月"
    ],
    "keys": [
      "K",
      "B"
    ],
    "first_code": "大",
    "last_code": "月",
    "first_key": "K",
    "last_key": "B",
    "full": "大月 (KB)",
    "cj_full": "大一人月 (KMOB)",
    "secret": "【病】速成取碼：首碼【大】(K) ＋ 尾碼【月】(B)",
    "quickCode": "KB"
  },
  "魯": {
    "char": "魯",
    "codes": [
      "弓",
      "日"
    ],
    "keys": [
      "N",
      "A"
    ],
    "first_code": "弓",
    "last_code": "日",
    "first_key": "N",
    "last_key": "A",
    "full": "弓日 (NA)",
    "cj_full": "弓田火日 (NWFA)",
    "secret": "【魯】速成取碼：首碼【弓】(N) ＋ 尾碼【日】(A)",
    "quickCode": "NA"
  },
  "托": {
    "char": "托",
    "codes": [
      "手",
      "心"
    ],
    "keys": [
      "Q",
      "P"
    ],
    "first_code": "手",
    "last_code": "心",
    "first_key": "Q",
    "last_key": "P",
    "full": "手心 (QP)",
    "cj_full": "手竹心 (QHP)",
    "secret": "【托】速成取碼：首碼【手】(Q) ＋ 尾碼【心】(P)",
    "quickCode": "QP"
  },
  "北": {
    "char": "北",
    "codes": [
      "中",
      "心"
    ],
    "keys": [
      "L",
      "P"
    ],
    "first_code": "中",
    "last_code": "心",
    "first_key": "L",
    "last_key": "P",
    "full": "中心 (LP)",
    "cj_full": "中一心 (LMP)",
    "secret": "【北】速成取碼：首碼【中】(L) ＋ 尾碼【心】(P)",
    "quickCode": "LP"
  },
  "他": {
    "char": "他",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人心木 (OPD)",
    "secret": "【他】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "座": {
    "char": "座",
    "codes": [
      "戈",
      "土"
    ],
    "keys": [
      "I",
      "G"
    ],
    "first_code": "戈",
    "last_code": "土",
    "first_key": "I",
    "last_key": "G",
    "full": "戈土 (IG)",
    "cj_full": "戈人人土 (IOOG)",
    "secret": "【座】速成取碼：首碼【戈】(I) ＋ 尾碼【土】(G)",
    "quickCode": "IG"
  },
  "使": {
    "char": "使",
    "codes": [
      "人",
      "大"
    ],
    "keys": [
      "O",
      "K"
    ],
    "first_code": "人",
    "last_code": "大",
    "first_key": "O",
    "last_key": "K",
    "full": "人大 (OK)",
    "cj_full": "人十中大 (OJLK)",
    "secret": "【使】速成取碼：首碼【人】(O) ＋ 尾碼【大】(K)",
    "quickCode": "OK"
  },
  "備": {
    "char": "備",
    "codes": [
      "人",
      "月"
    ],
    "keys": [
      "O",
      "B"
    ],
    "first_code": "人",
    "last_code": "月",
    "first_key": "O",
    "last_key": "B",
    "full": "人月 (OB)",
    "cj_full": "人廿竹月 (OTHB)",
    "secret": "【備】速成取碼：首碼【人】(O) ＋ 尾碼【月】(B)",
    "quickCode": "OB"
  },
  "默": {
    "char": "默",
    "codes": [
      "田",
      "大"
    ],
    "keys": [
      "W",
      "K"
    ],
    "first_code": "田",
    "last_code": "大",
    "first_key": "W",
    "last_key": "K",
    "full": "田大 (WK)",
    "cj_full": "田火戈大 (WFIK)",
    "secret": "【默】速成取碼：首碼【田】(W) ＋ 尾碼【大】(K)",
    "quickCode": "WK"
  },
  "英": {
    "char": "英",
    "codes": [
      "廿",
      "大"
    ],
    "keys": [
      "T",
      "K"
    ],
    "first_code": "廿",
    "last_code": "大",
    "first_key": "T",
    "last_key": "K",
    "full": "廿大 (TK)",
    "cj_full": "廿中月大 (TLBK)",
    "secret": "【英】速成取碼：首碼【廿】(T) ＋ 尾碼【大】(K)",
    "quickCode": "TK"
  },
  "小": {
    "char": "小",
    "codes": [
      "弓",
      "金"
    ],
    "keys": [
      "N",
      "C"
    ],
    "first_code": "弓",
    "last_code": "金",
    "first_key": "N",
    "last_key": "C",
    "full": "弓金 (NC)",
    "cj_full": "弓金 (NC)",
    "secret": "【小】速成取碼：首碼【弓】(N) ＋ 尾碼【金】(C)",
    "quickCode": "NC"
  },
  "頭": {
    "char": "頭",
    "codes": [
      "一",
      "金"
    ],
    "keys": [
      "M",
      "C"
    ],
    "first_code": "一",
    "last_code": "金",
    "first_key": "M",
    "last_key": "C",
    "full": "一金 (MC)",
    "cj_full": "一廿一月金 (MTMBC)",
    "secret": "【頭】速成取碼：首碼【一】(M) ＋ 尾碼【金】(C)",
    "quickCode": "MC"
  },
  "莫": {
    "char": "莫",
    "codes": [
      "廿",
      "大"
    ],
    "keys": [
      "T",
      "K"
    ],
    "first_code": "廿",
    "last_code": "大",
    "first_key": "T",
    "last_key": "K",
    "full": "廿大 (TK)",
    "cj_full": "廿日大 (TAK)",
    "secret": "【莫】速成取碼：首碼【廿】(T) ＋ 尾碼【大】(K)",
    "quickCode": "TK"
  },
  "某": {
    "char": "某",
    "codes": [
      "廿",
      "木"
    ],
    "keys": [
      "T",
      "D"
    ],
    "first_code": "廿",
    "last_code": "木",
    "first_key": "T",
    "last_key": "D",
    "full": "廿木 (TD)",
    "cj_full": "廿一木 (TMD)",
    "secret": "【某】速成取碼：首碼【廿】(T) ＋ 尾碼【木】(D)",
    "quickCode": "TD"
  },
  "如": {
    "char": "如",
    "codes": [
      "女",
      "口"
    ],
    "keys": [
      "V",
      "R"
    ],
    "first_code": "女",
    "last_code": "口",
    "first_key": "V",
    "last_key": "R",
    "full": "女口 (VR)",
    "cj_full": "女口 (VR)",
    "secret": "【如】速成取碼：首碼【女】(V) ＋ 尾碼【口】(R)",
    "quickCode": "VR"
  },
  "會": {
    "char": "會",
    "codes": [
      "人",
      "日"
    ],
    "keys": [
      "O",
      "A"
    ],
    "first_code": "人",
    "last_code": "日",
    "first_key": "O",
    "last_key": "A",
    "full": "人日 (OA)",
    "cj_full": "人一田日 (OMWA)",
    "secret": "【會】速成取碼：首碼【人】(O) ＋ 尾碼【日】(A)",
    "quickCode": "OA"
  },
  "居": {
    "char": "居",
    "codes": [
      "尸",
      "口"
    ],
    "keys": [
      "S",
      "R"
    ],
    "first_code": "尸",
    "last_code": "口",
    "first_key": "S",
    "last_key": "R",
    "full": "尸口 (SR)",
    "cj_full": "尸十口 (SJR)",
    "secret": "【居】速成取碼：首碼【尸】(S) ＋ 尾碼【口】(R)",
    "quickCode": "SR"
  },
  "護": {
    "char": "護",
    "codes": [
      "卜",
      "水"
    ],
    "keys": [
      "Y",
      "E"
    ],
    "first_code": "卜",
    "last_code": "水",
    "first_key": "Y",
    "last_key": "E",
    "full": "卜水 (YE)",
    "cj_full": "卜口廿人水 (YRTOE)",
    "secret": "【護】速成取碼：首碼【卜】(Y) ＋ 尾碼【水】(E)",
    "quickCode": "YE"
  },
  "傑": {
    "char": "傑",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人弓手木 (ONQD)",
    "secret": "【傑】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "位": {
    "char": "位",
    "codes": [
      "人",
      "廿"
    ],
    "keys": [
      "O",
      "T"
    ],
    "first_code": "人",
    "last_code": "廿",
    "first_key": "O",
    "last_key": "T",
    "full": "人廿 (OT)",
    "cj_full": "人卜廿 (OYT)",
    "secret": "【位】速成取碼：首碼【人】(O) ＋ 尾碼【廿】(T)",
    "quickCode": "OT"
  },
  "中": {
    "char": "中",
    "codes": [
      "中"
    ],
    "keys": [
      "L"
    ],
    "first_code": "中",
    "last_code": "中",
    "first_key": "L",
    "last_key": "L",
    "full": "中 (L)",
    "cj_full": "中 (L)",
    "secret": "【中】單碼字：直取【中】(L)",
    "quickCode": "L"
  },
  "主": {
    "char": "主",
    "codes": [
      "卜",
      "土"
    ],
    "keys": [
      "Y",
      "G"
    ],
    "first_code": "卜",
    "last_code": "土",
    "first_key": "Y",
    "last_key": "G",
    "full": "卜土 (YG)",
    "cj_full": "卜土 (YG)",
    "secret": "【主】速成取碼：首碼【卜】(Y) ＋ 尾碼【土】(G)",
    "quickCode": "YG"
  },
  "久": {
    "char": "久",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓人 (NO)",
    "secret": "【久】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "京": {
    "char": "京",
    "codes": [
      "卜",
      "火"
    ],
    "keys": [
      "Y",
      "F"
    ],
    "first_code": "卜",
    "last_code": "火",
    "first_key": "Y",
    "last_key": "F",
    "full": "卜火 (YF)",
    "cj_full": "卜口火 (YRF)",
    "secret": "【京】速成取碼：首碼【卜】(Y) ＋ 尾碼【火】(F)",
    "quickCode": "YF"
  },
  "亮": {
    "char": "亮",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜口月山 (YRBU)",
    "secret": "【亮】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "人": {
    "char": "人",
    "codes": [
      "人"
    ],
    "keys": [
      "O"
    ],
    "first_code": "人",
    "last_code": "人",
    "first_key": "O",
    "last_key": "O",
    "full": "人 (O)",
    "cj_full": "人 (O)",
    "secret": "【人】單碼字：直取【人】(O)",
    "quickCode": "O"
  },
  "今": {
    "char": "今",
    "codes": [
      "人",
      "弓"
    ],
    "keys": [
      "O",
      "N"
    ],
    "first_code": "人",
    "last_code": "弓",
    "first_key": "O",
    "last_key": "N",
    "full": "人弓 (ON)",
    "cj_full": "人戈弓 (OIN)",
    "secret": "【今】速成取碼：首碼【人】(O) ＋ 尾碼【弓】(N)",
    "quickCode": "ON"
  },
  "仍": {
    "char": "仍",
    "codes": [
      "人",
      "尸"
    ],
    "keys": [
      "O",
      "S"
    ],
    "first_code": "人",
    "last_code": "尸",
    "first_key": "O",
    "last_key": "S",
    "full": "人尸 (OS)",
    "cj_full": "人弓竹尸 (ONHS)",
    "secret": "【仍】速成取碼：首碼【人】(O) ＋ 尾碼【尸】(S)",
    "quickCode": "OS"
  },
  "付": {
    "char": "付",
    "codes": [
      "人",
      "戈"
    ],
    "keys": [
      "O",
      "I"
    ],
    "first_code": "人",
    "last_code": "戈",
    "first_key": "O",
    "last_key": "I",
    "full": "人戈 (OI)",
    "cj_full": "人木戈 (ODI)",
    "secret": "【付】速成取碼：首碼【人】(O) ＋ 尾碼【戈】(I)",
    "quickCode": "OI"
  },
  "任": {
    "char": "任",
    "codes": [
      "人",
      "土"
    ],
    "keys": [
      "O",
      "G"
    ],
    "first_code": "人",
    "last_code": "土",
    "first_key": "O",
    "last_key": "G",
    "full": "人土 (OG)",
    "cj_full": "人竹土 (OHG)",
    "secret": "【任】速成取碼：首碼【人】(O) ＋ 尾碼【土】(G)",
    "quickCode": "OG"
  },
  "伊": {
    "char": "伊",
    "codes": [
      "人",
      "大"
    ],
    "keys": [
      "O",
      "K"
    ],
    "first_code": "人",
    "last_code": "大",
    "first_key": "O",
    "last_key": "K",
    "full": "人大 (OK)",
    "cj_full": "人尸大 (OSK)",
    "secret": "【伊】速成取碼：首碼【人】(O) ＋ 尾碼【大】(K)",
    "quickCode": "OK"
  },
  "伴": {
    "char": "伴",
    "codes": [
      "人",
      "手"
    ],
    "keys": [
      "O",
      "Q"
    ],
    "first_code": "人",
    "last_code": "手",
    "first_key": "O",
    "last_key": "Q",
    "full": "人手 (OQ)",
    "cj_full": "人火手 (OFQ)",
    "secret": "【伴】速成取碼：首碼【人】(O) ＋ 尾碼【手】(Q)",
    "quickCode": "OQ"
  },
  "何": {
    "char": "何",
    "codes": [
      "人",
      "口"
    ],
    "keys": [
      "O",
      "R"
    ],
    "first_code": "人",
    "last_code": "口",
    "first_key": "O",
    "last_key": "R",
    "full": "人口 (OR)",
    "cj_full": "人一弓口 (OMNR)",
    "secret": "【何】速成取碼：首碼【人】(O) ＋ 尾碼【口】(R)",
    "quickCode": "OR"
  },
  "供": {
    "char": "供",
    "codes": [
      "人",
      "金"
    ],
    "keys": [
      "O",
      "C"
    ],
    "first_code": "人",
    "last_code": "金",
    "first_key": "O",
    "last_key": "C",
    "full": "人金 (OC)",
    "cj_full": "人廿金 (OTC)",
    "secret": "【供】速成取碼：首碼【人】(O) ＋ 尾碼【金】(C)",
    "quickCode": "OC"
  },
  "保": {
    "char": "保",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人口木 (ORD)",
    "secret": "【保】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "信": {
    "char": "信",
    "codes": [
      "人",
      "口"
    ],
    "keys": [
      "O",
      "R"
    ],
    "first_code": "人",
    "last_code": "口",
    "first_key": "O",
    "last_key": "R",
    "full": "人口 (OR)",
    "cj_full": "人卜一口 (OYMR)",
    "secret": "【信】速成取碼：首碼【人】(O) ＋ 尾碼【口】(R)",
    "quickCode": "OR"
  },
  "值": {
    "char": "值",
    "codes": [
      "人",
      "一"
    ],
    "keys": [
      "O",
      "M"
    ],
    "first_code": "人",
    "last_code": "一",
    "first_key": "O",
    "last_key": "M",
    "full": "人一 (OM)",
    "cj_full": "人十月一 (OJBM)",
    "secret": "【值】速成取碼：首碼【人】(O) ＋ 尾碼【一】(M)",
    "quickCode": "OM"
  },
  "光": {
    "char": "光",
    "codes": [
      "火",
      "山"
    ],
    "keys": [
      "F",
      "U"
    ],
    "first_code": "火",
    "last_code": "山",
    "first_key": "F",
    "last_key": "U",
    "full": "火山 (FU)",
    "cj_full": "火一山 (FMU)",
    "secret": "【光】速成取碼：首碼【火】(F) ＋ 尾碼【山】(U)",
    "quickCode": "FU"
  },
  "內": {
    "char": "內",
    "codes": [
      "人",
      "月"
    ],
    "keys": [
      "O",
      "B"
    ],
    "first_code": "人",
    "last_code": "月",
    "first_key": "O",
    "last_key": "B",
    "full": "人月 (OB)",
    "cj_full": "人月 (OB)",
    "secret": "【內】速成取碼：首碼【人】(O) ＋ 尾碼【月】(B)",
    "quickCode": "OB"
  },
  "八": {
    "char": "八",
    "codes": [
      "竹",
      "人"
    ],
    "keys": [
      "H",
      "O"
    ],
    "first_code": "竹",
    "last_code": "人",
    "first_key": "H",
    "last_key": "O",
    "full": "竹人 (HO)",
    "cj_full": "竹人 (HO)",
    "secret": "【八】速成取碼：首碼【竹】(H) ＋ 尾碼【人】(O)",
    "quickCode": "HO"
  },
  "六": {
    "char": "六",
    "codes": [
      "卜",
      "金"
    ],
    "keys": [
      "Y",
      "C"
    ],
    "first_code": "卜",
    "last_code": "金",
    "first_key": "Y",
    "last_key": "C",
    "full": "卜金 (YC)",
    "cj_full": "卜金 (YC)",
    "secret": "【六】速成取碼：首碼【卜】(Y) ＋ 尾碼【金】(C)",
    "quickCode": "YC"
  },
  "剛": {
    "char": "剛",
    "codes": [
      "月",
      "弓"
    ],
    "keys": [
      "B",
      "N"
    ],
    "first_code": "月",
    "last_code": "弓",
    "first_key": "B",
    "last_key": "N",
    "full": "月弓 (BN)",
    "cj_full": "月山中弓 (BULN)",
    "secret": "【剛】速成取碼：首碼【月】(B) ＋ 尾碼【弓】(N)",
    "quickCode": "BN"
  },
  "加": {
    "char": "加",
    "codes": [
      "大",
      "口"
    ],
    "keys": [
      "K",
      "R"
    ],
    "first_code": "大",
    "last_code": "口",
    "first_key": "K",
    "last_key": "R",
    "full": "大口 (KR)",
    "cj_full": "大尸口 (KSR)",
    "secret": "【加】速成取碼：首碼【大】(K) ＋ 尾碼【口】(R)",
    "quickCode": "KR"
  },
  "動": {
    "char": "動",
    "codes": [
      "竹",
      "尸"
    ],
    "keys": [
      "H",
      "S"
    ],
    "first_code": "竹",
    "last_code": "尸",
    "first_key": "H",
    "last_key": "S",
    "full": "竹尸 (HS)",
    "cj_full": "竹土大尸 (HGKS)",
    "secret": "【動】速成取碼：首碼【竹】(H) ＋ 尾碼【尸】(S)",
    "quickCode": "HS"
  },
  "卡": {
    "char": "卡",
    "codes": [
      "卜",
      "卜"
    ],
    "keys": [
      "Y",
      "Y"
    ],
    "first_code": "卜",
    "last_code": "卜",
    "first_key": "Y",
    "last_key": "Y",
    "full": "卜卜 (YY)",
    "cj_full": "卜一卜 (YMY)",
    "secret": "【卡】速成取碼：首碼【卜】(Y) ＋ 尾碼【卜】(Y)",
    "quickCode": "YY"
  },
  "古": {
    "char": "古",
    "codes": [
      "十",
      "口"
    ],
    "keys": [
      "J",
      "R"
    ],
    "first_code": "十",
    "last_code": "口",
    "first_key": "J",
    "last_key": "R",
    "full": "十口 (JR)",
    "cj_full": "十口 (JR)",
    "secret": "【古】速成取碼：首碼【十】(J) ＋ 尾碼【口】(R)",
    "quickCode": "JR"
  },
  "另": {
    "char": "另",
    "codes": [
      "口",
      "尸"
    ],
    "keys": [
      "R",
      "S"
    ],
    "first_code": "口",
    "last_code": "尸",
    "first_key": "R",
    "last_key": "S",
    "full": "口尸 (RS)",
    "cj_full": "口大尸 (RKS)",
    "secret": "【另】速成取碼：首碼【口】(R) ＋ 尾碼【尸】(S)",
    "quickCode": "RS"
  },
  "可": {
    "char": "可",
    "codes": [
      "一",
      "口"
    ],
    "keys": [
      "M",
      "R"
    ],
    "first_code": "一",
    "last_code": "口",
    "first_key": "M",
    "last_key": "R",
    "full": "一口 (MR)",
    "cj_full": "一弓口 (MNR)",
    "secret": "【可】速成取碼：首碼【一】(M) ＋ 尾碼【口】(R)",
    "quickCode": "MR"
  },
  "右": {
    "char": "右",
    "codes": [
      "大",
      "口"
    ],
    "keys": [
      "K",
      "R"
    ],
    "first_code": "大",
    "last_code": "口",
    "first_key": "K",
    "last_key": "R",
    "full": "大口 (KR)",
    "cj_full": "大口 (KR)",
    "secret": "【右】速成取碼：首碼【大】(K) ＋ 尾碼【口】(R)",
    "quickCode": "KR"
  },
  "司": {
    "char": "司",
    "codes": [
      "尸",
      "口"
    ],
    "keys": [
      "S",
      "R"
    ],
    "first_code": "尸",
    "last_code": "口",
    "first_key": "S",
    "last_key": "R",
    "full": "尸口 (SR)",
    "cj_full": "尸一口 (SMR)",
    "secret": "【司】速成取碼：首碼【尸】(S) ＋ 尾碼【口】(R)",
    "quickCode": "SR"
  },
  "吃": {
    "char": "吃",
    "codes": [
      "口",
      "弓"
    ],
    "keys": [
      "R",
      "N"
    ],
    "first_code": "口",
    "last_code": "弓",
    "first_key": "R",
    "last_key": "N",
    "full": "口弓 (RN)",
    "cj_full": "口人弓 (RON)",
    "secret": "【吃】速成取碼：首碼【口】(R) ＋ 尾碼【弓】(N)",
    "quickCode": "RN"
  },
  "吸": {
    "char": "吸",
    "codes": [
      "口",
      "水"
    ],
    "keys": [
      "R",
      "E"
    ],
    "first_code": "口",
    "last_code": "水",
    "first_key": "R",
    "last_key": "E",
    "full": "口水 (RE)",
    "cj_full": "口弓竹水 (RNHE)",
    "secret": "【吸】速成取碼：首碼【口】(R) ＋ 尾碼【水】(E)",
    "quickCode": "RE"
  },
  "和": {
    "char": "和",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹木口 (HDR)",
    "secret": "【和】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "哭": {
    "char": "哭",
    "codes": [
      "口",
      "大"
    ],
    "keys": [
      "R",
      "K"
    ],
    "first_code": "口",
    "last_code": "大",
    "first_key": "R",
    "last_key": "K",
    "full": "口大 (RK)",
    "cj_full": "口口戈大 (RRIK)",
    "secret": "【哭】速成取碼：首碼【口】(R) ＋ 尾碼【大】(K)",
    "quickCode": "RK"
  },
  "喜": {
    "char": "喜",
    "codes": [
      "土",
      "口"
    ],
    "keys": [
      "G",
      "R"
    ],
    "first_code": "土",
    "last_code": "口",
    "first_key": "G",
    "last_key": "R",
    "full": "土口 (GR)",
    "cj_full": "土口廿口 (GRTR)",
    "secret": "【喜】速成取碼：首碼【土】(G) ＋ 尾碼【口】(R)",
    "quickCode": "GR"
  },
  "四": {
    "char": "四",
    "codes": [
      "田",
      "金"
    ],
    "keys": [
      "W",
      "C"
    ],
    "first_code": "田",
    "last_code": "金",
    "first_key": "W",
    "last_key": "C",
    "full": "田金 (WC)",
    "cj_full": "田金 (WC)",
    "secret": "【四】速成取碼：首碼【田】(W) ＋ 尾碼【金】(C)",
    "quickCode": "WC"
  },
  "回": {
    "char": "回",
    "codes": [
      "田",
      "口"
    ],
    "keys": [
      "W",
      "R"
    ],
    "first_code": "田",
    "last_code": "口",
    "first_key": "W",
    "last_key": "R",
    "full": "田口 (WR)",
    "cj_full": "田口 (WR)",
    "secret": "【回】速成取碼：首碼【田】(W) ＋ 尾碼【口】(R)",
    "quickCode": "WR"
  },
  "圍": {
    "char": "圍",
    "codes": [
      "田",
      "手"
    ],
    "keys": [
      "W",
      "Q"
    ],
    "first_code": "田",
    "last_code": "手",
    "first_key": "W",
    "last_key": "Q",
    "full": "田手 (WQ)",
    "cj_full": "田木一手 (WDMQ)",
    "secret": "【圍】速成取碼：首碼【田】(W) ＋ 尾碼【手】(Q)",
    "quickCode": "WQ"
  },
  "園": {
    "char": "園",
    "codes": [
      "田",
      "女"
    ],
    "keys": [
      "W",
      "V"
    ],
    "first_code": "田",
    "last_code": "女",
    "first_key": "W",
    "last_key": "V",
    "full": "田女 (WV)",
    "cj_full": "田土口女 (WGRV)",
    "secret": "【園】速成取碼：首碼【田】(W) ＋ 尾碼【女】(V)",
    "quickCode": "WV"
  },
  "坐": {
    "char": "坐",
    "codes": [
      "人",
      "土"
    ],
    "keys": [
      "O",
      "G"
    ],
    "first_code": "人",
    "last_code": "土",
    "first_key": "O",
    "last_key": "G",
    "full": "人土 (OG)",
    "cj_full": "人人土 (OOG)",
    "secret": "【坐】速成取碼：首碼【人】(O) ＋ 尾碼【土】(G)",
    "quickCode": "OG"
  },
  "型": {
    "char": "型",
    "codes": [
      "一",
      "土"
    ],
    "keys": [
      "M",
      "G"
    ],
    "first_code": "一",
    "last_code": "土",
    "first_key": "M",
    "last_key": "G",
    "full": "一土 (MG)",
    "cj_full": "一弓土 (MNG)",
    "secret": "【型】速成取碼：首碼【一】(M) ＋ 尾碼【土】(G)",
    "quickCode": "MG"
  },
  "基": {
    "char": "基",
    "codes": [
      "廿",
      "土"
    ],
    "keys": [
      "T",
      "G"
    ],
    "first_code": "廿",
    "last_code": "土",
    "first_key": "T",
    "last_key": "G",
    "full": "廿土 (TG)",
    "cj_full": "廿金土 (TCG)",
    "secret": "【基】速成取碼：首碼【廿】(T) ＋ 尾碼【土】(G)",
    "quickCode": "TG"
  },
  "場": {
    "char": "場",
    "codes": [
      "土",
      "竹"
    ],
    "keys": [
      "G",
      "H"
    ],
    "first_code": "土",
    "last_code": "竹",
    "first_key": "G",
    "last_key": "H",
    "full": "土竹 (GH)",
    "cj_full": "土日一竹 (GAMH)",
    "secret": "【場】速成取碼：首碼【土】(G) ＋ 尾碼【竹】(H)",
    "quickCode": "GH"
  },
  "夏": {
    "char": "夏",
    "codes": [
      "一",
      "水"
    ],
    "keys": [
      "M",
      "E"
    ],
    "first_code": "一",
    "last_code": "水",
    "first_key": "M",
    "last_key": "E",
    "full": "一水 (ME)",
    "cj_full": "一山竹水 (MUHE)",
    "secret": "【夏】速成取碼：首碼【一】(M) ＋ 尾碼【水】(E)",
    "quickCode": "ME"
  },
  "外": {
    "char": "外",
    "codes": [
      "弓",
      "卜"
    ],
    "keys": [
      "N",
      "Y"
    ],
    "first_code": "弓",
    "last_code": "卜",
    "first_key": "N",
    "last_key": "Y",
    "full": "弓卜 (NY)",
    "cj_full": "弓戈卜 (NIY)",
    "secret": "【外】速成取碼：首碼【弓】(N) ＋ 尾碼【卜】(Y)",
    "quickCode": "NY"
  },
  "夢": {
    "char": "夢",
    "codes": [
      "廿",
      "弓"
    ],
    "keys": [
      "T",
      "N"
    ],
    "first_code": "廿",
    "last_code": "弓",
    "first_key": "T",
    "last_key": "N",
    "full": "廿弓 (TN)",
    "cj_full": "廿田中弓 (TWLN)",
    "secret": "【夢】速成取碼：首碼【廿】(T) ＋ 尾碼【弓】(N)",
    "quickCode": "TN"
  },
  "失": {
    "char": "失",
    "codes": [
      "竹",
      "人"
    ],
    "keys": [
      "H",
      "O"
    ],
    "first_code": "竹",
    "last_code": "人",
    "first_key": "H",
    "last_key": "O",
    "full": "竹人 (HO)",
    "cj_full": "竹手人 (HQO)",
    "secret": "【失】速成取碼：首碼【竹】(H) ＋ 尾碼【人】(O)",
    "quickCode": "HO"
  },
  "奇": {
    "char": "奇",
    "codes": [
      "大",
      "口"
    ],
    "keys": [
      "K",
      "R"
    ],
    "first_code": "大",
    "last_code": "口",
    "first_key": "K",
    "last_key": "R",
    "full": "大口 (KR)",
    "cj_full": "大一弓口 (KMNR)",
    "secret": "【奇】速成取碼：首碼【大】(K) ＋ 尾碼【口】(R)",
    "quickCode": "KR"
  },
  "奧": {
    "char": "奧",
    "codes": [
      "竹",
      "大"
    ],
    "keys": [
      "H",
      "K"
    ],
    "first_code": "竹",
    "last_code": "大",
    "first_key": "H",
    "last_key": "K",
    "full": "竹大 (HK)",
    "cj_full": "竹月大 (HBK)",
    "secret": "【奧】速成取碼：首碼【竹】(H) ＋ 尾碼【大】(K)",
    "quickCode": "HK"
  },
  "委": {
    "char": "委",
    "codes": [
      "竹",
      "女"
    ],
    "keys": [
      "H",
      "V"
    ],
    "first_code": "竹",
    "last_code": "女",
    "first_key": "H",
    "last_key": "V",
    "full": "竹女 (HV)",
    "cj_full": "竹木女 (HDV)",
    "secret": "【委】速成取碼：首碼【竹】(H) ＋ 尾碼【女】(V)",
    "quickCode": "HV"
  },
  "娜": {
    "char": "娜",
    "codes": [
      "女",
      "中"
    ],
    "keys": [
      "V",
      "L"
    ],
    "first_code": "女",
    "last_code": "中",
    "first_key": "V",
    "last_key": "L",
    "full": "女中 (VL)",
    "cj_full": "女尸手中 (VSQL)",
    "secret": "【娜】速成取碼：首碼【女】(V) ＋ 尾碼【中】(L)",
    "quickCode": "VL"
  },
  "媽": {
    "char": "媽",
    "codes": [
      "女",
      "火"
    ],
    "keys": [
      "V",
      "F"
    ],
    "first_code": "女",
    "last_code": "火",
    "first_key": "V",
    "last_key": "F",
    "full": "女火 (VF)",
    "cj_full": "女尸手火 (VSQF)",
    "secret": "【媽】速成取碼：首碼【女】(V) ＋ 尾碼【火】(F)",
    "quickCode": "VF"
  },
  "存": {
    "char": "存",
    "codes": [
      "大",
      "木"
    ],
    "keys": [
      "K",
      "D"
    ],
    "first_code": "大",
    "last_code": "木",
    "first_key": "K",
    "last_key": "D",
    "full": "大木 (KD)",
    "cj_full": "大中弓木 (KLND)",
    "secret": "【存】速成取碼：首碼【大】(K) ＋ 尾碼【木】(D)",
    "quickCode": "KD"
  },
  "孤": {
    "char": "孤",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓木竹女人 (NDHVO)",
    "secret": "【孤】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "完": {
    "char": "完",
    "codes": [
      "十",
      "山"
    ],
    "keys": [
      "J",
      "U"
    ],
    "first_code": "十",
    "last_code": "山",
    "first_key": "J",
    "last_key": "U",
    "full": "十山 (JU)",
    "cj_full": "十一一山 (JMMU)",
    "secret": "【完】速成取碼：首碼【十】(J) ＋ 尾碼【山】(U)",
    "quickCode": "JU"
  },
  "宣": {
    "char": "宣",
    "codes": [
      "十",
      "一"
    ],
    "keys": [
      "J",
      "M"
    ],
    "first_code": "十",
    "last_code": "一",
    "first_key": "J",
    "last_key": "M",
    "full": "十一 (JM)",
    "cj_full": "十一日一 (JMAM)",
    "secret": "【宣】速成取碼：首碼【十】(J) ＋ 尾碼【一】(M)",
    "quickCode": "JM"
  },
  "宮": {
    "char": "宮",
    "codes": [
      "十",
      "口"
    ],
    "keys": [
      "J",
      "R"
    ],
    "first_code": "十",
    "last_code": "口",
    "first_key": "J",
    "last_key": "R",
    "full": "十口 (JR)",
    "cj_full": "十口竹口 (JRHR)",
    "secret": "【宮】速成取碼：首碼【十】(J) ＋ 尾碼【口】(R)",
    "quickCode": "JR"
  },
  "家": {
    "char": "家",
    "codes": [
      "十",
      "人"
    ],
    "keys": [
      "J",
      "O"
    ],
    "first_code": "十",
    "last_code": "人",
    "first_key": "J",
    "last_key": "O",
    "full": "十人 (JO)",
    "cj_full": "十一尸人 (JMSO)",
    "secret": "【家】速成取碼：首碼【十】(J) ＋ 尾碼【人】(O)",
    "quickCode": "JO"
  },
  "察": {
    "char": "察",
    "codes": [
      "十",
      "火"
    ],
    "keys": [
      "J",
      "F"
    ],
    "first_code": "十",
    "last_code": "火",
    "first_key": "J",
    "last_key": "F",
    "full": "十火 (JF)",
    "cj_full": "十月人火 (JBOF)",
    "secret": "【察】速成取碼：首碼【十】(J) ＋ 尾碼【火】(F)",
    "quickCode": "JF"
  },
  "導": {
    "char": "導",
    "codes": [
      "卜",
      "戈"
    ],
    "keys": [
      "Y",
      "I"
    ],
    "first_code": "卜",
    "last_code": "戈",
    "first_key": "Y",
    "last_key": "I",
    "full": "卜戈 (YI)",
    "cj_full": "卜山木戈 (YUDI)",
    "secret": "【導】速成取碼：首碼【卜】(Y) ＋ 尾碼【戈】(I)",
    "quickCode": "YI"
  },
  "屋": {
    "char": "屋",
    "codes": [
      "尸",
      "土"
    ],
    "keys": [
      "S",
      "G"
    ],
    "first_code": "尸",
    "last_code": "土",
    "first_key": "S",
    "last_key": "G",
    "full": "尸土 (SG)",
    "cj_full": "尸一戈土 (SMIG)",
    "secret": "【屋】速成取碼：首碼【尸】(S) ＋ 尾碼【土】(G)",
    "quickCode": "SG"
  },
  "屬": {
    "char": "屬",
    "codes": [
      "尸",
      "戈"
    ],
    "keys": [
      "S",
      "I"
    ],
    "first_code": "尸",
    "last_code": "戈",
    "first_key": "S",
    "last_key": "I",
    "full": "尸戈 (SI)",
    "cj_full": "尸卜卜戈 (SYYI)",
    "secret": "【屬】速成取碼：首碼【尸】(S) ＋ 尾碼【戈】(I)",
    "quickCode": "SI"
  },
  "布": {
    "char": "布",
    "codes": [
      "大",
      "月"
    ],
    "keys": [
      "K",
      "B"
    ],
    "first_code": "大",
    "last_code": "月",
    "first_key": "K",
    "last_key": "B",
    "full": "大月 (KB)",
    "cj_full": "大中月 (KLB)",
    "secret": "【布】速成取碼：首碼【大】(K) ＋ 尾碼【月】(B)",
    "quickCode": "KB"
  },
  "希": {
    "char": "希",
    "codes": [
      "大",
      "月"
    ],
    "keys": [
      "K",
      "B"
    ],
    "first_code": "大",
    "last_code": "月",
    "first_key": "K",
    "last_key": "B",
    "full": "大月 (KB)",
    "cj_full": "大大中月 (KKLB)",
    "secret": "【希】速成取碼：首碼【大】(K) ＋ 尾碼【月】(B)",
    "quickCode": "KB"
  },
  "帝": {
    "char": "帝",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜月中月 (YBLB)",
    "secret": "【帝】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "帶": {
    "char": "帶",
    "codes": [
      "大",
      "月"
    ],
    "keys": [
      "K",
      "B"
    ],
    "first_code": "大",
    "last_code": "月",
    "first_key": "K",
    "last_key": "B",
    "full": "大月 (KB)",
    "cj_full": "大心月中月 (KPBLB)",
    "secret": "【帶】速成取碼：首碼【大】(K) ＋ 尾碼【月】(B)",
    "quickCode": "KB"
  },
  "年": {
    "char": "年",
    "codes": [
      "人",
      "手"
    ],
    "keys": [
      "O",
      "Q"
    ],
    "first_code": "人",
    "last_code": "手",
    "first_key": "O",
    "last_key": "Q",
    "full": "人手 (OQ)",
    "cj_full": "人手 (OQ)",
    "secret": "【年】速成取碼：首碼【人】(O) ＋ 尾碼【手】(Q)",
    "quickCode": "OQ"
  },
  "店": {
    "char": "店",
    "codes": [
      "戈",
      "口"
    ],
    "keys": [
      "I",
      "R"
    ],
    "first_code": "戈",
    "last_code": "口",
    "first_key": "I",
    "last_key": "R",
    "full": "戈口 (IR)",
    "cj_full": "戈卜口 (IYR)",
    "secret": "【店】速成取碼：首碼【戈】(I) ＋ 尾碼【口】(R)",
    "quickCode": "IR"
  },
  "康": {
    "char": "康",
    "codes": [
      "戈",
      "水"
    ],
    "keys": [
      "I",
      "E"
    ],
    "first_code": "戈",
    "last_code": "水",
    "first_key": "I",
    "last_key": "E",
    "full": "戈水 (IE)",
    "cj_full": "戈中水 (ILE)",
    "secret": "【康】速成取碼：首碼【戈】(I) ＋ 尾碼【水】(E)",
    "quickCode": "IE"
  },
  "弄": {
    "char": "弄",
    "codes": [
      "一",
      "廿"
    ],
    "keys": [
      "M",
      "T"
    ],
    "first_code": "一",
    "last_code": "廿",
    "first_key": "M",
    "last_key": "T",
    "full": "一廿 (MT)",
    "cj_full": "一土廿 (MGT)",
    "secret": "【弄】速成取碼：首碼【一】(M) ＋ 尾碼【廿】(T)",
    "quickCode": "MT"
  },
  "張": {
    "char": "張",
    "codes": [
      "弓",
      "女"
    ],
    "keys": [
      "N",
      "V"
    ],
    "first_code": "弓",
    "last_code": "女",
    "first_key": "N",
    "last_key": "V",
    "full": "弓女 (NV)",
    "cj_full": "弓尸一女 (NSMV)",
    "secret": "【張】速成取碼：首碼【弓】(N) ＋ 尾碼【女】(V)",
    "quickCode": "NV"
  },
  "征": {
    "char": "征",
    "codes": [
      "竹",
      "一"
    ],
    "keys": [
      "H",
      "M"
    ],
    "first_code": "竹",
    "last_code": "一",
    "first_key": "H",
    "last_key": "M",
    "full": "竹一 (HM)",
    "cj_full": "竹人一卜一 (HOMYM)",
    "secret": "【征】速成取碼：首碼【竹】(H) ＋ 尾碼【一】(M)",
    "quickCode": "HM"
  },
  "從": {
    "char": "從",
    "codes": [
      "竹",
      "人"
    ],
    "keys": [
      "H",
      "O"
    ],
    "first_code": "竹",
    "last_code": "人",
    "first_key": "H",
    "last_key": "O",
    "full": "竹人 (HO)",
    "cj_full": "竹人人人 (HOOO)",
    "secret": "【從】速成取碼：首碼【竹】(H) ＋ 尾碼【人】(O)",
    "quickCode": "HO"
  },
  "德": {
    "char": "德",
    "codes": [
      "竹",
      "心"
    ],
    "keys": [
      "H",
      "P"
    ],
    "first_code": "竹",
    "last_code": "心",
    "first_key": "H",
    "last_key": "P",
    "full": "竹心 (HP)",
    "cj_full": "竹人十田心 (HOJWP)",
    "secret": "【德】速成取碼：首碼【竹】(H) ＋ 尾碼【心】(P)",
    "quickCode": "HP"
  },
  "忍": {
    "char": "忍",
    "codes": [
      "尸",
      "心"
    ],
    "keys": [
      "S",
      "P"
    ],
    "first_code": "尸",
    "last_code": "心",
    "first_key": "S",
    "last_key": "P",
    "full": "尸心 (SP)",
    "cj_full": "尸戈心 (SIP)",
    "secret": "【忍】速成取碼：首碼【尸】(S) ＋ 尾碼【心】(P)",
    "quickCode": "SP"
  },
  "忘": {
    "char": "忘",
    "codes": [
      "卜",
      "心"
    ],
    "keys": [
      "Y",
      "P"
    ],
    "first_code": "卜",
    "last_code": "心",
    "first_key": "Y",
    "last_key": "P",
    "full": "卜心 (YP)",
    "cj_full": "卜女心 (YVP)",
    "secret": "【忘】速成取碼：首碼【卜】(Y) ＋ 尾碼【心】(P)",
    "quickCode": "YP"
  },
  "念": {
    "char": "念",
    "codes": [
      "人",
      "心"
    ],
    "keys": [
      "O",
      "P"
    ],
    "first_code": "人",
    "last_code": "心",
    "first_key": "O",
    "last_key": "P",
    "full": "人心 (OP)",
    "cj_full": "人戈弓心 (OINP)",
    "secret": "【念】速成取碼：首碼【人】(O) ＋ 尾碼【心】(P)",
    "quickCode": "OP"
  },
  "怕": {
    "char": "怕",
    "codes": [
      "心",
      "日"
    ],
    "keys": [
      "P",
      "A"
    ],
    "first_code": "心",
    "last_code": "日",
    "first_key": "P",
    "last_key": "A",
    "full": "心日 (PA)",
    "cj_full": "心竹日 (PHA)",
    "secret": "【怕】速成取碼：首碼【心】(P) ＋ 尾碼【日】(A)",
    "quickCode": "PA"
  },
  "急": {
    "char": "急",
    "codes": [
      "弓",
      "心"
    ],
    "keys": [
      "N",
      "P"
    ],
    "first_code": "弓",
    "last_code": "心",
    "first_key": "N",
    "last_key": "P",
    "full": "弓心 (NP)",
    "cj_full": "弓一心 (NMP)",
    "secret": "【急】速成取碼：首碼【弓】(N) ＋ 尾碼【心】(P)",
    "quickCode": "NP"
  },
  "惡": {
    "char": "惡",
    "codes": [
      "一",
      "心"
    ],
    "keys": [
      "M",
      "P"
    ],
    "first_code": "一",
    "last_code": "心",
    "first_key": "M",
    "last_key": "P",
    "full": "一心 (MP)",
    "cj_full": "一一心 (MMP)",
    "secret": "【惡】速成取碼：首碼【一】(M) ＋ 尾碼【心】(P)",
    "quickCode": "MP"
  },
  "意": {
    "char": "意",
    "codes": [
      "卜",
      "心"
    ],
    "keys": [
      "Y",
      "P"
    ],
    "first_code": "卜",
    "last_code": "心",
    "first_key": "Y",
    "last_key": "P",
    "full": "卜心 (YP)",
    "cj_full": "卜廿日心 (YTAP)",
    "secret": "【意】速成取碼：首碼【卜】(Y) ＋ 尾碼【心】(P)",
    "quickCode": "YP"
  },
  "感": {
    "char": "感",
    "codes": [
      "戈",
      "心"
    ],
    "keys": [
      "I",
      "P"
    ],
    "first_code": "戈",
    "last_code": "心",
    "first_key": "I",
    "last_key": "P",
    "full": "戈心 (IP)",
    "cj_full": "戈口心 (IRP)",
    "secret": "【感】速成取碼：首碼【戈】(I) ＋ 尾碼【心】(P)",
    "quickCode": "IP"
  },
  "慢": {
    "char": "慢",
    "codes": [
      "心",
      "水"
    ],
    "keys": [
      "P",
      "E"
    ],
    "first_code": "心",
    "last_code": "水",
    "first_key": "P",
    "last_key": "E",
    "full": "心水 (PE)",
    "cj_full": "心日田水 (PAWE)",
    "secret": "【慢】速成取碼：首碼【心】(P) ＋ 尾碼【水】(E)",
    "quickCode": "PE"
  },
  "懷": {
    "char": "懷",
    "codes": [
      "心",
      "女"
    ],
    "keys": [
      "P",
      "V"
    ],
    "first_code": "心",
    "last_code": "女",
    "first_key": "P",
    "last_key": "V",
    "full": "心女 (PV)",
    "cj_full": "心卜田女 (PYWV)",
    "secret": "【懷】速成取碼：首碼【心】(P) ＋ 尾碼【女】(V)",
    "quickCode": "PV"
  },
  "打": {
    "char": "打",
    "codes": [
      "手",
      "弓"
    ],
    "keys": [
      "Q",
      "N"
    ],
    "first_code": "手",
    "last_code": "弓",
    "first_key": "Q",
    "last_key": "N",
    "full": "手弓 (QN)",
    "cj_full": "手一弓 (QMN)",
    "secret": "【打】速成取碼：首碼【手】(Q) ＋ 尾碼【弓】(N)",
    "quickCode": "QN"
  },
  "找": {
    "char": "找",
    "codes": [
      "手",
      "戈"
    ],
    "keys": [
      "Q",
      "I"
    ],
    "first_code": "手",
    "last_code": "戈",
    "first_key": "Q",
    "last_key": "I",
    "full": "手戈 (QI)",
    "cj_full": "手戈 (QI)",
    "secret": "【找】速成取碼：首碼【手】(Q) ＋ 尾碼【戈】(I)",
    "quickCode": "QI"
  },
  "承": {
    "char": "承",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓弓手人 (NNQO)",
    "secret": "【承】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "把": {
    "char": "把",
    "codes": [
      "手",
      "山"
    ],
    "keys": [
      "Q",
      "U"
    ],
    "first_code": "手",
    "last_code": "山",
    "first_key": "Q",
    "last_key": "U",
    "full": "手山 (QU)",
    "cj_full": "手日山 (QAU)",
    "secret": "【把】速成取碼：首碼【手】(Q) ＋ 尾碼【山】(U)",
    "quickCode": "QU"
  },
  "投": {
    "char": "投",
    "codes": [
      "手",
      "水"
    ],
    "keys": [
      "Q",
      "E"
    ],
    "first_code": "手",
    "last_code": "水",
    "first_key": "Q",
    "last_key": "E",
    "full": "手水 (QE)",
    "cj_full": "手竹弓水 (QHNE)",
    "secret": "【投】速成取碼：首碼【手】(Q) ＋ 尾碼【水】(E)",
    "quickCode": "QE"
  },
  "拉": {
    "char": "拉",
    "codes": [
      "手",
      "廿"
    ],
    "keys": [
      "Q",
      "T"
    ],
    "first_code": "手",
    "last_code": "廿",
    "first_key": "Q",
    "last_key": "T",
    "full": "手廿 (QT)",
    "cj_full": "手卜廿 (QYT)",
    "secret": "【拉】速成取碼：首碼【手】(Q) ＋ 尾碼【廿】(T)",
    "quickCode": "QT"
  },
  "授": {
    "char": "授",
    "codes": [
      "手",
      "水"
    ],
    "keys": [
      "Q",
      "E"
    ],
    "first_code": "手",
    "last_code": "水",
    "first_key": "Q",
    "last_key": "E",
    "full": "手水 (QE)",
    "cj_full": "手月月水 (QBBE)",
    "secret": "【授】速成取碼：首碼【手】(Q) ＋ 尾碼【水】(E)",
    "quickCode": "QE"
  },
  "排": {
    "char": "排",
    "codes": [
      "手",
      "卜"
    ],
    "keys": [
      "Q",
      "Y"
    ],
    "first_code": "手",
    "last_code": "卜",
    "first_key": "Q",
    "last_key": "Y",
    "full": "手卜 (QY)",
    "cj_full": "手中一卜 (QLMY)",
    "secret": "【排】速成取碼：首碼【手】(Q) ＋ 尾碼【卜】(Y)",
    "quickCode": "QY"
  },
  "接": {
    "char": "接",
    "codes": [
      "手",
      "女"
    ],
    "keys": [
      "Q",
      "V"
    ],
    "first_code": "手",
    "last_code": "女",
    "first_key": "Q",
    "last_key": "V",
    "full": "手女 (QV)",
    "cj_full": "手卜廿女 (QYTV)",
    "secret": "【接】速成取碼：首碼【手】(Q) ＋ 尾碼【女】(V)",
    "quickCode": "QV"
  },
  "推": {
    "char": "推",
    "codes": [
      "手",
      "土"
    ],
    "keys": [
      "Q",
      "G"
    ],
    "first_code": "手",
    "last_code": "土",
    "first_key": "Q",
    "last_key": "G",
    "full": "手土 (QG)",
    "cj_full": "手人土 (QOG)",
    "secret": "【推】速成取碼：首碼【手】(Q) ＋ 尾碼【土】(G)",
    "quickCode": "QG"
  },
  "搖": {
    "char": "搖",
    "codes": [
      "手",
      "山"
    ],
    "keys": [
      "Q",
      "U"
    ],
    "first_code": "手",
    "last_code": "山",
    "first_key": "Q",
    "last_key": "U",
    "full": "手山 (QU)",
    "cj_full": "手月人山 (QBOU)",
    "secret": "【搖】速成取碼：首碼【手】(Q) ＋ 尾碼【山】(U)",
    "quickCode": "QU"
  },
  "擁": {
    "char": "擁",
    "codes": [
      "手",
      "土"
    ],
    "keys": [
      "Q",
      "G"
    ],
    "first_code": "手",
    "last_code": "土",
    "first_key": "Q",
    "last_key": "G",
    "full": "手土 (QG)",
    "cj_full": "手卜女土 (QYVG)",
    "secret": "【擁】速成取碼：首碼【手】(Q) ＋ 尾碼【土】(G)",
    "quickCode": "QG"
  },
  "擔": {
    "char": "擔",
    "codes": [
      "手",
      "口"
    ],
    "keys": [
      "Q",
      "R"
    ],
    "first_code": "手",
    "last_code": "口",
    "first_key": "Q",
    "last_key": "R",
    "full": "手口 (QR)",
    "cj_full": "手弓金口 (QNCR)",
    "secret": "【擔】速成取碼：首碼【手】(Q) ＋ 尾碼【口】(R)",
    "quickCode": "QR"
  },
  "放": {
    "char": "放",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜尸人大 (YSOK)",
    "secret": "【放】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "新": {
    "char": "新",
    "codes": [
      "卜",
      "中"
    ],
    "keys": [
      "Y",
      "L"
    ],
    "first_code": "卜",
    "last_code": "中",
    "first_key": "Y",
    "last_key": "L",
    "full": "卜中 (YL)",
    "cj_full": "卜木竹一中 (YDHML)",
    "secret": "【新】速成取碼：首碼【卜】(Y) ＋ 尾碼【中】(L)",
    "quickCode": "YL"
  },
  "斷": {
    "char": "斷",
    "codes": [
      "女",
      "中"
    ],
    "keys": [
      "V",
      "L"
    ],
    "first_code": "女",
    "last_code": "中",
    "first_key": "V",
    "last_key": "L",
    "full": "女中 (VL)",
    "cj_full": "女戈竹一中 (VIHML)",
    "secret": "【斷】速成取碼：首碼【女】(V) ＋ 尾碼【中】(L)",
    "quickCode": "VL"
  },
  "族": {
    "char": "族",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜尸卜人大 (YSYOK)",
    "secret": "【族】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "既": {
    "char": "既",
    "codes": [
      "日",
      "山"
    ],
    "keys": [
      "A",
      "U"
    ],
    "first_code": "日",
    "last_code": "山",
    "first_key": "A",
    "last_key": "U",
    "full": "日山 (AU)",
    "cj_full": "日戈一女山 (AIMVU)",
    "secret": "【既】速成取碼：首碼【日】(A) ＋ 尾碼【山】(U)",
    "quickCode": "AU"
  },
  "早": {
    "char": "早",
    "codes": [
      "日",
      "十"
    ],
    "keys": [
      "A",
      "J"
    ],
    "first_code": "日",
    "last_code": "十",
    "first_key": "A",
    "last_key": "J",
    "full": "日十 (AJ)",
    "cj_full": "日十 (AJ)",
    "secret": "【早】速成取碼：首碼【日】(A) ＋ 尾碼【十】(J)",
    "quickCode": "AJ"
  },
  "易": {
    "char": "易",
    "codes": [
      "日",
      "竹"
    ],
    "keys": [
      "A",
      "H"
    ],
    "first_code": "日",
    "last_code": "竹",
    "first_key": "A",
    "last_key": "H",
    "full": "日竹 (AH)",
    "cj_full": "日心竹竹 (APHH)",
    "secret": "【易】速成取碼：首碼【日】(A) ＋ 尾碼【竹】(H)",
    "quickCode": "AH"
  },
  "星": {
    "char": "星",
    "codes": [
      "日",
      "一"
    ],
    "keys": [
      "A",
      "M"
    ],
    "first_code": "日",
    "last_code": "一",
    "first_key": "A",
    "last_key": "M",
    "full": "日一 (AM)",
    "cj_full": "日竹手一 (AHQM)",
    "secret": "【星】速成取碼：首碼【日】(A) ＋ 尾碼【一】(M)",
    "quickCode": "AM"
  },
  "普": {
    "char": "普",
    "codes": [
      "廿",
      "日"
    ],
    "keys": [
      "T",
      "A"
    ],
    "first_code": "廿",
    "last_code": "日",
    "first_key": "T",
    "last_key": "A",
    "full": "廿日 (TA)",
    "cj_full": "廿金日 (TCA)",
    "secret": "【普】速成取碼：首碼【廿】(T) ＋ 尾碼【日】(A)",
    "quickCode": "TA"
  },
  "本": {
    "char": "本",
    "codes": [
      "木",
      "一"
    ],
    "keys": [
      "D",
      "M"
    ],
    "first_code": "木",
    "last_code": "一",
    "first_key": "D",
    "last_key": "M",
    "full": "木一 (DM)",
    "cj_full": "木一 (DM)",
    "secret": "【本】速成取碼：首碼【木】(D) ＋ 尾碼【一】(M)",
    "quickCode": "DM"
  },
  "根": {
    "char": "根",
    "codes": [
      "木",
      "女"
    ],
    "keys": [
      "D",
      "V"
    ],
    "first_code": "木",
    "last_code": "女",
    "first_key": "D",
    "last_key": "V",
    "full": "木女 (DV)",
    "cj_full": "木日女 (DAV)",
    "secret": "【根】速成取碼：首碼【木】(D) ＋ 尾碼【女】(V)",
    "quickCode": "DV"
  },
  "案": {
    "char": "案",
    "codes": [
      "十",
      "木"
    ],
    "keys": [
      "J",
      "D"
    ],
    "first_code": "十",
    "last_code": "木",
    "first_key": "J",
    "last_key": "D",
    "full": "十木 (JD)",
    "cj_full": "十女木 (JVD)",
    "secret": "【案】速成取碼：首碼【十】(J) ＋ 尾碼【木】(D)",
    "quickCode": "JD"
  },
  "模": {
    "char": "模",
    "codes": [
      "木",
      "大"
    ],
    "keys": [
      "D",
      "K"
    ],
    "first_code": "木",
    "last_code": "大",
    "first_key": "D",
    "last_key": "K",
    "full": "木大 (DK)",
    "cj_full": "木廿日大 (DTAK)",
    "secret": "【模】速成取碼：首碼【木】(D) ＋ 尾碼【大】(K)",
    "quickCode": "DK"
  },
  "歐": {
    "char": "歐",
    "codes": [
      "尸",
      "人"
    ],
    "keys": [
      "S",
      "O"
    ],
    "first_code": "尸",
    "last_code": "人",
    "first_key": "S",
    "last_key": "O",
    "full": "尸人 (SO)",
    "cj_full": "尸口弓人 (SRNO)",
    "secret": "【歐】速成取碼：首碼【尸】(S) ＋ 尾碼【人】(O)",
    "quickCode": "SO"
  },
  "歲": {
    "char": "歲",
    "codes": [
      "卜",
      "竹"
    ],
    "keys": [
      "Y",
      "H"
    ],
    "first_code": "卜",
    "last_code": "竹",
    "first_key": "Y",
    "last_key": "H",
    "full": "卜竹 (YH)",
    "cj_full": "卜一戈竹竹 (YMIHH)",
    "secret": "【歲】速成取碼：首碼【卜】(Y) ＋ 尾碼【竹】(H)",
    "quickCode": "YH"
  },
  "每": {
    "char": "每",
    "codes": [
      "人",
      "戈"
    ],
    "keys": [
      "O",
      "I"
    ],
    "first_code": "人",
    "last_code": "戈",
    "first_key": "O",
    "last_key": "I",
    "full": "人戈 (OI)",
    "cj_full": "人田卜戈 (OWYI)",
    "secret": "【每】速成取碼：首碼【人】(O) ＋ 尾碼【戈】(I)",
    "quickCode": "OI"
  },
  "決": {
    "char": "決",
    "codes": [
      "水",
      "大"
    ],
    "keys": [
      "E",
      "K"
    ],
    "first_code": "水",
    "last_code": "大",
    "first_key": "E",
    "last_key": "K",
    "full": "水大 (EK)",
    "cj_full": "水木大 (EDK)",
    "secret": "【決】速成取碼：首碼【水】(E) ＋ 尾碼【大】(K)",
    "quickCode": "EK"
  },
  "況": {
    "char": "況",
    "codes": [
      "水",
      "山"
    ],
    "keys": [
      "E",
      "U"
    ],
    "first_code": "水",
    "last_code": "山",
    "first_key": "E",
    "last_key": "U",
    "full": "水山 (EU)",
    "cj_full": "水口竹山 (ERHU)",
    "secret": "【況】速成取碼：首碼【水】(E) ＋ 尾碼【山】(U)",
    "quickCode": "EU"
  },
  "洲": {
    "char": "洲",
    "codes": [
      "水",
      "中"
    ],
    "keys": [
      "E",
      "L"
    ],
    "first_code": "水",
    "last_code": "中",
    "first_key": "E",
    "last_key": "L",
    "full": "水中 (EL)",
    "cj_full": "水戈中中 (EILL)",
    "secret": "【洲】速成取碼：首碼【水】(E) ＋ 尾碼【中】(L)",
    "quickCode": "EL"
  },
  "派": {
    "char": "派",
    "codes": [
      "水",
      "女"
    ],
    "keys": [
      "E",
      "V"
    ],
    "first_code": "水",
    "last_code": "女",
    "first_key": "E",
    "last_key": "V",
    "full": "水女 (EV)",
    "cj_full": "水竹竹女 (EHHV)",
    "secret": "【派】速成取碼：首碼【水】(E) ＋ 尾碼【女】(V)",
    "quickCode": "EV"
  },
  "流": {
    "char": "流",
    "codes": [
      "水",
      "山"
    ],
    "keys": [
      "E",
      "U"
    ],
    "first_code": "水",
    "last_code": "山",
    "first_key": "E",
    "last_key": "U",
    "full": "水山 (EU)",
    "cj_full": "水卜戈山 (EYIU)",
    "secret": "【流】速成取碼：首碼【水】(E) ＋ 尾碼【山】(U)",
    "quickCode": "EU"
  },
  "海": {
    "char": "海",
    "codes": [
      "水",
      "卜"
    ],
    "keys": [
      "E",
      "Y"
    ],
    "first_code": "水",
    "last_code": "卜",
    "first_key": "E",
    "last_key": "Y",
    "full": "水卜 (EY)",
    "cj_full": "水人田卜 (EOWY)",
    "secret": "【海】速成取碼：首碼【水】(E) ＋ 尾碼【卜】(Y)",
    "quickCode": "EY"
  },
  "淚": {
    "char": "淚",
    "codes": [
      "水",
      "大"
    ],
    "keys": [
      "E",
      "K"
    ],
    "first_code": "水",
    "last_code": "大",
    "first_key": "E",
    "last_key": "K",
    "full": "水大 (EK)",
    "cj_full": "水竹尸大 (EHSK)",
    "secret": "【淚】速成取碼：首碼【水】(E) ＋ 尾碼【大】(K)",
    "quickCode": "EK"
  },
  "溫": {
    "char": "溫",
    "codes": [
      "水",
      "廿"
    ],
    "keys": [
      "E",
      "T"
    ],
    "first_code": "水",
    "last_code": "廿",
    "first_key": "E",
    "last_key": "T",
    "full": "水廿 (ET)",
    "cj_full": "水田人廿 (EWOT)",
    "secret": "【溫】速成取碼：首碼【水】(E) ＋ 尾碼【廿】(T)",
    "quickCode": "ET"
  },
  "滿": {
    "char": "滿",
    "codes": [
      "水",
      "月"
    ],
    "keys": [
      "E",
      "B"
    ],
    "first_code": "水",
    "last_code": "月",
    "first_key": "E",
    "last_key": "B",
    "full": "水月 (EB)",
    "cj_full": "水廿中月 (ETLB)",
    "secret": "【滿】速成取碼：首碼【水】(E) ＋ 尾碼【月】(B)",
    "quickCode": "EB"
  },
  "漢": {
    "char": "漢",
    "codes": [
      "水",
      "人"
    ],
    "keys": [
      "E",
      "O"
    ],
    "first_code": "水",
    "last_code": "人",
    "first_key": "E",
    "last_key": "O",
    "full": "水人 (EO)",
    "cj_full": "水廿中人 (ETLO)",
    "secret": "【漢】速成取碼：首碼【水】(E) ＋ 尾碼【人】(O)",
    "quickCode": "EO"
  },
  "熟": {
    "char": "熟",
    "codes": [
      "卜",
      "火"
    ],
    "keys": [
      "Y",
      "F"
    ],
    "first_code": "卜",
    "last_code": "火",
    "first_key": "Y",
    "last_key": "F",
    "full": "卜火 (YF)",
    "cj_full": "卜戈火 (YIF)",
    "secret": "【熟】速成取碼：首碼【卜】(Y) ＋ 尾碼【火】(F)",
    "quickCode": "YF"
  },
  "玩": {
    "char": "玩",
    "codes": [
      "一",
      "山"
    ],
    "keys": [
      "M",
      "U"
    ],
    "first_code": "一",
    "last_code": "山",
    "first_key": "M",
    "last_key": "U",
    "full": "一山 (MU)",
    "cj_full": "一土一一山 (MGMMU)",
    "secret": "【玩】速成取碼：首碼【一】(M) ＋ 尾碼【山】(U)",
    "quickCode": "MU"
  },
  "理": {
    "char": "理",
    "codes": [
      "一",
      "土"
    ],
    "keys": [
      "M",
      "G"
    ],
    "first_code": "一",
    "last_code": "土",
    "first_key": "M",
    "last_key": "G",
    "full": "一土 (MG)",
    "cj_full": "一土田土 (MGWG)",
    "secret": "【理】速成取碼：首碼【一】(M) ＋ 尾碼【土】(G)",
    "quickCode": "MG"
  },
  "瑪": {
    "char": "瑪",
    "codes": [
      "一",
      "火"
    ],
    "keys": [
      "M",
      "F"
    ],
    "first_code": "一",
    "last_code": "火",
    "first_key": "M",
    "last_key": "F",
    "full": "一火 (MF)",
    "cj_full": "一土尸手火 (MGSQF)",
    "secret": "【瑪】速成取碼：首碼【一】(M) ＋ 尾碼【火】(F)",
    "quickCode": "MF"
  },
  "留": {
    "char": "留",
    "codes": [
      "竹",
      "田"
    ],
    "keys": [
      "H",
      "W"
    ],
    "first_code": "竹",
    "last_code": "田",
    "first_key": "H",
    "last_key": "W",
    "full": "竹田 (HW)",
    "cj_full": "竹竹田 (HHW)",
    "secret": "【留】速成取碼：首碼【竹】(H) ＋ 尾碼【田】(W)",
    "quickCode": "HW"
  },
  "疑": {
    "char": "疑",
    "codes": [
      "心",
      "人"
    ],
    "keys": [
      "P",
      "O"
    ],
    "first_code": "心",
    "last_code": "人",
    "first_key": "P",
    "last_key": "O",
    "full": "心人 (PO)",
    "cj_full": "心大弓戈人 (PKNIO)",
    "secret": "【疑】速成取碼：首碼【心】(P) ＋ 尾碼【人】(O)",
    "quickCode": "PO"
  },
  "盛": {
    "char": "盛",
    "codes": [
      "戈",
      "廿"
    ],
    "keys": [
      "I",
      "T"
    ],
    "first_code": "戈",
    "last_code": "廿",
    "first_key": "I",
    "last_key": "T",
    "full": "戈廿 (IT)",
    "cj_full": "戈尸月廿 (ISBT)",
    "secret": "【盛】速成取碼：首碼【戈】(I) ＋ 尾碼【廿】(T)",
    "quickCode": "IT"
  },
  "禮": {
    "char": "禮",
    "codes": [
      "戈",
      "田"
    ],
    "keys": [
      "I",
      "W"
    ],
    "first_code": "戈",
    "last_code": "田",
    "first_key": "I",
    "last_key": "W",
    "full": "戈田 (IW)",
    "cj_full": "戈火廿田 (IFTW)",
    "secret": "【禮】速成取碼：首碼【戈】(I) ＋ 尾碼【田】(W)",
    "quickCode": "IW"
  },
  "程": {
    "char": "程",
    "codes": [
      "竹",
      "土"
    ],
    "keys": [
      "H",
      "G"
    ],
    "first_code": "竹",
    "last_code": "土",
    "first_key": "H",
    "last_key": "G",
    "full": "竹土 (HG)",
    "cj_full": "竹木口竹土 (HDRHG)",
    "secret": "【程】速成取碼：首碼【竹】(H) ＋ 尾碼【土】(G)",
    "quickCode": "HG"
  },
  "稱": {
    "char": "稱",
    "codes": [
      "竹",
      "月"
    ],
    "keys": [
      "H",
      "B"
    ],
    "first_code": "竹",
    "last_code": "月",
    "first_key": "H",
    "last_key": "B",
    "full": "竹月 (HB)",
    "cj_full": "竹木月土月 (HDBGB)",
    "secret": "【稱】速成取碼：首碼【竹】(H) ＋ 尾碼【月】(B)",
    "quickCode": "HB"
  },
  "立": {
    "char": "立",
    "codes": [
      "卜",
      "廿"
    ],
    "keys": [
      "Y",
      "T"
    ],
    "first_code": "卜",
    "last_code": "廿",
    "first_key": "Y",
    "last_key": "T",
    "full": "卜廿 (YT)",
    "cj_full": "卜廿 (YT)",
    "secret": "【立】速成取碼：首碼【卜】(Y) ＋ 尾碼【廿】(T)",
    "quickCode": "YT"
  },
  "端": {
    "char": "端",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜廿山一月 (YTUMB)",
    "secret": "【端】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "筆": {
    "char": "筆",
    "codes": [
      "竹",
      "手"
    ],
    "keys": [
      "H",
      "Q"
    ],
    "first_code": "竹",
    "last_code": "手",
    "first_key": "H",
    "last_key": "Q",
    "full": "竹手 (HQ)",
    "cj_full": "竹中手 (HLQ)",
    "secret": "【筆】速成取碼：首碼【竹】(H) ＋ 尾碼【手】(Q)",
    "quickCode": "HQ"
  },
  "答": {
    "char": "答",
    "codes": [
      "竹",
      "口"
    ],
    "keys": [
      "H",
      "R"
    ],
    "first_code": "竹",
    "last_code": "口",
    "first_key": "H",
    "last_key": "R",
    "full": "竹口 (HR)",
    "cj_full": "竹人一口 (HOMR)",
    "secret": "【答】速成取碼：首碼【竹】(H) ＋ 尾碼【口】(R)",
    "quickCode": "HR"
  },
  "算": {
    "char": "算",
    "codes": [
      "竹",
      "廿"
    ],
    "keys": [
      "H",
      "T"
    ],
    "first_code": "竹",
    "last_code": "廿",
    "first_key": "H",
    "last_key": "T",
    "full": "竹廿 (HT)",
    "cj_full": "竹月山廿 (HBUT)",
    "secret": "【算】速成取碼：首碼【竹】(H) ＋ 尾碼【廿】(T)",
    "quickCode": "HT"
  },
  "範": {
    "char": "範",
    "codes": [
      "竹",
      "山"
    ],
    "keys": [
      "H",
      "U"
    ],
    "first_code": "竹",
    "last_code": "山",
    "first_key": "H",
    "last_key": "U",
    "full": "竹山 (HU)",
    "cj_full": "竹十十山 (HJJU)",
    "secret": "【範】速成取碼：首碼【竹】(H) ＋ 尾碼【山】(U)",
    "quickCode": "HU"
  },
  "系": {
    "char": "系",
    "codes": [
      "竹",
      "火"
    ],
    "keys": [
      "H",
      "F"
    ],
    "first_code": "竹",
    "last_code": "火",
    "first_key": "H",
    "last_key": "F",
    "full": "竹火 (HF)",
    "cj_full": "竹女戈火 (HVIF)",
    "secret": "【系】速成取碼：首碼【竹】(H) ＋ 尾碼【火】(F)",
    "quickCode": "HF"
  },
  "緊": {
    "char": "緊",
    "codes": [
      "尸",
      "火"
    ],
    "keys": [
      "S",
      "F"
    ],
    "first_code": "尸",
    "last_code": "火",
    "first_key": "S",
    "last_key": "F",
    "full": "尸火 (SF)",
    "cj_full": "尸水女戈火 (SEVIF)",
    "secret": "【緊】速成取碼：首碼【尸】(S) ＋ 尾碼【火】(F)",
    "quickCode": "SF"
  },
  "線": {
    "char": "線",
    "codes": [
      "女",
      "水"
    ],
    "keys": [
      "V",
      "E"
    ],
    "first_code": "女",
    "last_code": "水",
    "first_key": "V",
    "last_key": "E",
    "full": "女水 (VE)",
    "cj_full": "女火竹日水 (VFHAE)",
    "secret": "【線】速成取碼：首碼【女】(V) ＋ 尾碼【水】(E)",
    "quickCode": "VE"
  },
  "練": {
    "char": "練",
    "codes": [
      "女",
      "火"
    ],
    "keys": [
      "V",
      "F"
    ],
    "first_code": "女",
    "last_code": "火",
    "first_key": "V",
    "last_key": "F",
    "full": "女火 (VF)",
    "cj_full": "女火木田火 (VFDWF)",
    "secret": "【練】速成取碼：首碼【女】(V) ＋ 尾碼【火】(F)",
    "quickCode": "VF"
  },
  "繼": {
    "char": "繼",
    "codes": [
      "女",
      "戈"
    ],
    "keys": [
      "V",
      "I"
    ],
    "first_code": "女",
    "last_code": "戈",
    "first_key": "V",
    "last_key": "I",
    "full": "女戈 (VI)",
    "cj_full": "女火女女戈 (VFVVI)",
    "secret": "【繼】速成取碼：首碼【女】(V) ＋ 尾碼【戈】(I)",
    "quickCode": "VI"
  },
  "羅": {
    "char": "羅",
    "codes": [
      "田",
      "土"
    ],
    "keys": [
      "W",
      "G"
    ],
    "first_code": "田",
    "last_code": "土",
    "first_key": "W",
    "last_key": "G",
    "full": "田土 (WG)",
    "cj_full": "田中女火土 (WLVFG)",
    "secret": "【羅】速成取碼：首碼【田】(W) ＋ 尾碼【土】(G)",
    "quickCode": "WG"
  },
  "義": {
    "char": "義",
    "codes": [
      "廿",
      "戈"
    ],
    "keys": [
      "T",
      "I"
    ],
    "first_code": "廿",
    "last_code": "戈",
    "first_key": "T",
    "last_key": "I",
    "full": "廿戈 (TI)",
    "cj_full": "廿土竹手戈 (TGHQI)",
    "secret": "【義】速成取碼：首碼【廿】(T) ＋ 尾碼【戈】(I)",
    "quickCode": "TI"
  },
  "習": {
    "char": "習",
    "codes": [
      "尸",
      "日"
    ],
    "keys": [
      "S",
      "A"
    ],
    "first_code": "尸",
    "last_code": "日",
    "first_key": "S",
    "last_key": "A",
    "full": "尸日 (SA)",
    "cj_full": "尸一竹日 (SMHA)",
    "secret": "【習】速成取碼：首碼【尸】(S) ＋ 尾碼【日】(A)",
    "quickCode": "SA"
  },
  "聯": {
    "char": "聯",
    "codes": [
      "尸",
      "廿"
    ],
    "keys": [
      "S",
      "T"
    ],
    "first_code": "尸",
    "last_code": "廿",
    "first_key": "S",
    "last_key": "T",
    "full": "尸廿 (ST)",
    "cj_full": "尸十女戈廿 (SJVIT)",
    "secret": "【聯】速成取碼：首碼【尸】(S) ＋ 尾碼【廿】(T)",
    "quickCode": "ST"
  },
  "聲": {
    "char": "聲",
    "codes": [
      "土",
      "十"
    ],
    "keys": [
      "G",
      "J"
    ],
    "first_code": "土",
    "last_code": "十",
    "first_key": "G",
    "last_key": "J",
    "full": "土十 (GJ)",
    "cj_full": "土水尸十 (GESJ)",
    "secret": "【聲】速成取碼：首碼【土】(G) ＋ 尾碼【十】(J)",
    "quickCode": "GJ"
  },
  "聽": {
    "char": "聽",
    "codes": [
      "尸",
      "心"
    ],
    "keys": [
      "S",
      "P"
    ],
    "first_code": "尸",
    "last_code": "心",
    "first_key": "S",
    "last_key": "P",
    "full": "尸心 (SP)",
    "cj_full": "尸土十田心 (SGJWP)",
    "secret": "【聽】速成取碼：首碼【尸】(S) ＋ 尾碼【心】(P)",
    "quickCode": "SP"
  },
  "臨": {
    "char": "臨",
    "codes": [
      "尸",
      "口"
    ],
    "keys": [
      "S",
      "R"
    ],
    "first_code": "尸",
    "last_code": "口",
    "first_key": "S",
    "last_key": "R",
    "full": "尸口 (SR)",
    "cj_full": "尸中人口口 (SLORR)",
    "secret": "【臨】速成取碼：首碼【尸】(S) ＋ 尾碼【口】(R)",
    "quickCode": "SR"
  },
  "舞": {
    "char": "舞",
    "codes": [
      "人",
      "手"
    ],
    "keys": [
      "O",
      "Q"
    ],
    "first_code": "人",
    "last_code": "手",
    "first_key": "O",
    "last_key": "Q",
    "full": "人手 (OQ)",
    "cj_full": "人廿弓戈手 (OTNIQ)",
    "secret": "【舞】速成取碼：首碼【人】(O) ＋ 尾碼【手】(Q)",
    "quickCode": "OQ"
  },
  "草": {
    "char": "草",
    "codes": [
      "廿",
      "十"
    ],
    "keys": [
      "T",
      "J"
    ],
    "first_code": "廿",
    "last_code": "十",
    "first_key": "T",
    "last_key": "J",
    "full": "廿十 (TJ)",
    "cj_full": "廿日十 (TAJ)",
    "secret": "【草】速成取碼：首碼【廿】(T) ＋ 尾碼【十】(J)",
    "quickCode": "TJ"
  },
  "著": {
    "char": "著",
    "codes": [
      "廿",
      "日"
    ],
    "keys": [
      "T",
      "A"
    ],
    "first_code": "廿",
    "last_code": "日",
    "first_key": "T",
    "last_key": "A",
    "full": "廿日 (TA)",
    "cj_full": "廿十大日 (TJKA)",
    "secret": "【著】速成取碼：首碼【廿】(T) ＋ 尾碼【日】(A)",
    "quickCode": "TA"
  },
  "藏": {
    "char": "藏",
    "codes": [
      "廿",
      "尸"
    ],
    "keys": [
      "T",
      "S"
    ],
    "first_code": "廿",
    "last_code": "尸",
    "first_key": "T",
    "last_key": "S",
    "full": "廿尸 (TS)",
    "cj_full": "廿戈一尸 (TIMS)",
    "secret": "【藏】速成取碼：首碼【廿】(T) ＋ 尾碼【尸】(S)",
    "quickCode": "TS"
  },
  "藝": {
    "char": "藝",
    "codes": [
      "廿",
      "戈"
    ],
    "keys": [
      "T",
      "I"
    ],
    "first_code": "廿",
    "last_code": "戈",
    "first_key": "T",
    "last_key": "I",
    "full": "廿戈 (TI)",
    "cj_full": "廿土戈戈 (TGII)",
    "secret": "【藝】速成取碼：首碼【廿】(T) ＋ 尾碼【戈】(I)",
    "quickCode": "TI"
  },
  "藥": {
    "char": "藥",
    "codes": [
      "廿",
      "木"
    ],
    "keys": [
      "T",
      "D"
    ],
    "first_code": "廿",
    "last_code": "木",
    "first_key": "T",
    "last_key": "D",
    "full": "廿木 (TD)",
    "cj_full": "廿女戈木 (TVID)",
    "secret": "【藥】速成取碼：首碼【廿】(T) ＋ 尾碼【木】(D)",
    "quickCode": "TD"
  },
  "衛": {
    "char": "衛",
    "codes": [
      "竹",
      "弓"
    ],
    "keys": [
      "H",
      "N"
    ],
    "first_code": "竹",
    "last_code": "弓",
    "first_key": "H",
    "last_key": "N",
    "full": "竹弓 (HN)",
    "cj_full": "竹人木手弓 (HODQN)",
    "secret": "【衛】速成取碼：首碼【竹】(H) ＋ 尾碼【弓】(N)",
    "quickCode": "HN"
  },
  "表": {
    "char": "表",
    "codes": [
      "手",
      "女"
    ],
    "keys": [
      "Q",
      "V"
    ],
    "first_code": "手",
    "last_code": "女",
    "first_key": "Q",
    "last_key": "V",
    "full": "手女 (QV)",
    "cj_full": "手一女 (QMV)",
    "secret": "【表】速成取碼：首碼【手】(Q) ＋ 尾碼【女】(V)",
    "quickCode": "QV"
  },
  "袋": {
    "char": "袋",
    "codes": [
      "人",
      "女"
    ],
    "keys": [
      "O",
      "V"
    ],
    "first_code": "人",
    "last_code": "女",
    "first_key": "O",
    "last_key": "V",
    "full": "人女 (OV)",
    "cj_full": "人心卜竹女 (OPYHV)",
    "secret": "【袋】速成取碼：首碼【人】(O) ＋ 尾碼【女】(V)",
    "quickCode": "OV"
  },
  "西": {
    "char": "西",
    "codes": [
      "一",
      "田"
    ],
    "keys": [
      "M",
      "W"
    ],
    "first_code": "一",
    "last_code": "田",
    "first_key": "M",
    "last_key": "W",
    "full": "一田 (MW)",
    "cj_full": "一金田 (MCW)",
    "secret": "【西】速成取碼：首碼【一】(M) ＋ 尾碼【田】(W)",
    "quickCode": "MW"
  },
  "要": {
    "char": "要",
    "codes": [
      "一",
      "女"
    ],
    "keys": [
      "M",
      "V"
    ],
    "first_code": "一",
    "last_code": "女",
    "first_key": "M",
    "last_key": "V",
    "full": "一女 (MV)",
    "cj_full": "一田女 (MWV)",
    "secret": "【要】速成取碼：首碼【一】(M) ＋ 尾碼【女】(V)",
    "quickCode": "MV"
  },
  "言": {
    "char": "言",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜一一口 (YMMR)",
    "secret": "【言】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "計": {
    "char": "計",
    "codes": [
      "卜",
      "十"
    ],
    "keys": [
      "Y",
      "J"
    ],
    "first_code": "卜",
    "last_code": "十",
    "first_key": "Y",
    "last_key": "J",
    "full": "卜十 (YJ)",
    "cj_full": "卜口十 (YRJ)",
    "secret": "【計】速成取碼：首碼【卜】(Y) ＋ 尾碼【十】(J)",
    "quickCode": "YJ"
  },
  "記": {
    "char": "記",
    "codes": [
      "卜",
      "山"
    ],
    "keys": [
      "Y",
      "U"
    ],
    "first_code": "卜",
    "last_code": "山",
    "first_key": "Y",
    "last_key": "U",
    "full": "卜山 (YU)",
    "cj_full": "卜口尸山 (YRSU)",
    "secret": "【記】速成取碼：首碼【卜】(Y) ＋ 尾碼【山】(U)",
    "quickCode": "YU"
  },
  "設": {
    "char": "設",
    "codes": [
      "卜",
      "水"
    ],
    "keys": [
      "Y",
      "E"
    ],
    "first_code": "卜",
    "last_code": "水",
    "first_key": "Y",
    "last_key": "E",
    "full": "卜水 (YE)",
    "cj_full": "卜口竹弓水 (YRHNE)",
    "secret": "【設】速成取碼：首碼【卜】(Y) ＋ 尾碼【水】(E)",
    "quickCode": "YE"
  },
  "話": {
    "char": "話",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜口竹十口 (YRHJR)",
    "secret": "【話】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "該": {
    "char": "該",
    "codes": [
      "卜",
      "人"
    ],
    "keys": [
      "Y",
      "O"
    ],
    "first_code": "卜",
    "last_code": "人",
    "first_key": "Y",
    "last_key": "O",
    "full": "卜人 (YO)",
    "cj_full": "卜口卜女人 (YRYVO)",
    "secret": "【該】速成取碼：首碼【卜】(Y) ＋ 尾碼【人】(O)",
    "quickCode": "YO"
  },
  "課": {
    "char": "課",
    "codes": [
      "卜",
      "木"
    ],
    "keys": [
      "Y",
      "D"
    ],
    "first_code": "卜",
    "last_code": "木",
    "first_key": "Y",
    "last_key": "D",
    "full": "卜木 (YD)",
    "cj_full": "卜口田木 (YRWD)",
    "secret": "【課】速成取碼：首碼【卜】(Y) ＋ 尾碼【木】(D)",
    "quickCode": "YD"
  },
  "談": {
    "char": "談",
    "codes": [
      "卜",
      "火"
    ],
    "keys": [
      "Y",
      "F"
    ],
    "first_code": "卜",
    "last_code": "火",
    "first_key": "Y",
    "last_key": "F",
    "full": "卜火 (YF)",
    "cj_full": "卜口火火 (YRFF)",
    "secret": "【談】速成取碼：首碼【卜】(Y) ＋ 尾碼【火】(F)",
    "quickCode": "YF"
  },
  "論": {
    "char": "論",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜口人一月 (YROMB)",
    "secret": "【論】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "警": {
    "char": "警",
    "codes": [
      "廿",
      "口"
    ],
    "keys": [
      "T",
      "R"
    ],
    "first_code": "廿",
    "last_code": "口",
    "first_key": "T",
    "last_key": "R",
    "full": "廿口 (TR)",
    "cj_full": "廿大卜一口 (TKYMR)",
    "secret": "【警】速成取碼：首碼【廿】(T) ＋ 尾碼【口】(R)",
    "quickCode": "TR"
  },
  "負": {
    "char": "負",
    "codes": [
      "弓",
      "金"
    ],
    "keys": [
      "N",
      "C"
    ],
    "first_code": "弓",
    "last_code": "金",
    "first_key": "N",
    "last_key": "C",
    "full": "弓金 (NC)",
    "cj_full": "弓月山金 (NBUC)",
    "secret": "【負】速成取碼：首碼【弓】(N) ＋ 尾碼【金】(C)",
    "quickCode": "NC"
  },
  "責": {
    "char": "責",
    "codes": [
      "手",
      "金"
    ],
    "keys": [
      "Q",
      "C"
    ],
    "first_code": "手",
    "last_code": "金",
    "first_key": "Q",
    "last_key": "C",
    "full": "手金 (QC)",
    "cj_full": "手一月山金 (QMBUC)",
    "secret": "【責】速成取碼：首碼【手】(Q) ＋ 尾碼【金】(C)",
    "quickCode": "QC"
  },
  "資": {
    "char": "資",
    "codes": [
      "戈",
      "金"
    ],
    "keys": [
      "I",
      "C"
    ],
    "first_code": "戈",
    "last_code": "金",
    "first_key": "I",
    "last_key": "C",
    "full": "戈金 (IC)",
    "cj_full": "戈人月山金 (IOBUC)",
    "secret": "【資】速成取碼：首碼【戈】(I) ＋ 尾碼【金】(C)",
    "quickCode": "IC"
  },
  "走": {
    "char": "走",
    "codes": [
      "土",
      "人"
    ],
    "keys": [
      "G",
      "O"
    ],
    "first_code": "土",
    "last_code": "人",
    "first_key": "G",
    "last_key": "O",
    "full": "土人 (GO)",
    "cj_full": "土卜人 (GYO)",
    "secret": "【走】速成取碼：首碼【土】(G) ＋ 尾碼【人】(O)",
    "quickCode": "GO"
  },
  "起": {
    "char": "起",
    "codes": [
      "土",
      "山"
    ],
    "keys": [
      "G",
      "U"
    ],
    "first_code": "土",
    "last_code": "山",
    "first_key": "G",
    "last_key": "U",
    "full": "土山 (GU)",
    "cj_full": "土人口山 (GORU)",
    "secret": "【起】速成取碼：首碼【土】(G) ＋ 尾碼【山】(U)",
    "quickCode": "GU"
  },
  "超": {
    "char": "超",
    "codes": [
      "土",
      "口"
    ],
    "keys": [
      "G",
      "R"
    ],
    "first_code": "土",
    "last_code": "口",
    "first_key": "G",
    "last_key": "R",
    "full": "土口 (GR)",
    "cj_full": "土人尸竹口 (GOSHR)",
    "secret": "【超】速成取碼：首碼【土】(G) ＋ 尾碼【口】(R)",
    "quickCode": "GR"
  },
  "越": {
    "char": "越",
    "codes": [
      "土",
      "女"
    ],
    "keys": [
      "G",
      "V"
    ],
    "first_code": "土",
    "last_code": "女",
    "first_key": "G",
    "last_key": "V",
    "full": "土女 (GV)",
    "cj_full": "土人戈女 (GOIV)",
    "secret": "【越】速成取碼：首碼【土】(G) ＋ 尾碼【女】(V)",
    "quickCode": "GV"
  },
  "趕": {
    "char": "趕",
    "codes": [
      "土",
      "十"
    ],
    "keys": [
      "G",
      "J"
    ],
    "first_code": "土",
    "last_code": "十",
    "first_key": "G",
    "last_key": "J",
    "full": "土十 (GJ)",
    "cj_full": "土人日一十 (GOAMJ)",
    "secret": "【趕】速成取碼：首碼【土】(G) ＋ 尾碼【十】(J)",
    "quickCode": "GJ"
  },
  "跡": {
    "char": "跡",
    "codes": [
      "口",
      "金"
    ],
    "keys": [
      "R",
      "C"
    ],
    "first_code": "口",
    "last_code": "金",
    "first_key": "R",
    "last_key": "C",
    "full": "口金 (RC)",
    "cj_full": "口一卜中金 (RMYLC)",
    "secret": "【跡】速成取碼：首碼【口】(R) ＋ 尾碼【金】(C)",
    "quickCode": "RC"
  },
  "路": {
    "char": "路",
    "codes": [
      "口",
      "口"
    ],
    "keys": [
      "R",
      "R"
    ],
    "first_code": "口",
    "last_code": "口",
    "first_key": "R",
    "last_key": "R",
    "full": "口口 (RR)",
    "cj_full": "口一竹水口 (RMHER)",
    "secret": "【路】速成取碼：首碼【口】(R) ＋ 尾碼【口】(R)",
    "quickCode": "RR"
  },
  "速": {
    "char": "速",
    "codes": [
      "卜",
      "中"
    ],
    "keys": [
      "Y",
      "L"
    ],
    "first_code": "卜",
    "last_code": "中",
    "first_key": "Y",
    "last_key": "L",
    "full": "卜中 (YL)",
    "cj_full": "卜木中 (YDL)",
    "secret": "【速】速成取碼：首碼【卜】(Y) ＋ 尾碼【中】(L)",
    "quickCode": "YL"
  },
  "造": {
    "char": "造",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜竹土口 (YHGR)",
    "secret": "【造】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "遇": {
    "char": "遇",
    "codes": [
      "卜",
      "月"
    ],
    "keys": [
      "Y",
      "B"
    ],
    "first_code": "卜",
    "last_code": "月",
    "first_key": "Y",
    "last_key": "B",
    "full": "卜月 (YB)",
    "cj_full": "卜田中月 (YWLB)",
    "secret": "【遇】速成取碼：首碼【卜】(Y) ＋ 尾碼【月】(B)",
    "quickCode": "YB"
  },
  "達": {
    "char": "達",
    "codes": [
      "卜",
      "大"
    ],
    "keys": [
      "Y",
      "K"
    ],
    "first_code": "卜",
    "last_code": "大",
    "first_key": "Y",
    "last_key": "K",
    "full": "卜大 (YK)",
    "cj_full": "卜土戈大 (YGIK)",
    "secret": "【達】速成取碼：首碼【卜】(Y) ＋ 尾碼【大】(K)",
    "quickCode": "YK"
  },
  "還": {
    "char": "還",
    "codes": [
      "卜",
      "女"
    ],
    "keys": [
      "Y",
      "V"
    ],
    "first_code": "卜",
    "last_code": "女",
    "first_key": "Y",
    "last_key": "V",
    "full": "卜女 (YV)",
    "cj_full": "卜田中女 (YWLV)",
    "secret": "【還】速成取碼：首碼【卜】(Y) ＋ 尾碼【女】(V)",
    "quickCode": "YV"
  },
  "醫": {
    "char": "醫",
    "codes": [
      "尸",
      "田"
    ],
    "keys": [
      "S",
      "W"
    ],
    "first_code": "尸",
    "last_code": "田",
    "first_key": "S",
    "last_key": "W",
    "full": "尸田 (SW)",
    "cj_full": "尸水一金田 (SEMCW)",
    "secret": "【醫】速成取碼：首碼【尸】(S) ＋ 尾碼【田】(W)",
    "quickCode": "SW"
  },
  "野": {
    "char": "野",
    "codes": [
      "田",
      "弓"
    ],
    "keys": [
      "W",
      "N"
    ],
    "first_code": "田",
    "last_code": "弓",
    "first_key": "W",
    "last_key": "N",
    "full": "田弓 (WN)",
    "cj_full": "田土弓戈弓 (WGNIN)",
    "secret": "【野】速成取碼：首碼【田】(W) ＋ 尾碼【弓】(N)",
    "quickCode": "WN"
  },
  "錢": {
    "char": "錢",
    "codes": [
      "金",
      "戈"
    ],
    "keys": [
      "C",
      "I"
    ],
    "first_code": "金",
    "last_code": "戈",
    "first_key": "C",
    "last_key": "I",
    "full": "金戈 (CI)",
    "cj_full": "金戈戈 (CII)",
    "secret": "【錢】速成取碼：首碼【金】(C) ＋ 尾碼【戈】(I)",
    "quickCode": "CI"
  },
  "鐵": {
    "char": "鐵",
    "codes": [
      "金",
      "土"
    ],
    "keys": [
      "C",
      "G"
    ],
    "first_code": "金",
    "last_code": "土",
    "first_key": "C",
    "last_key": "G",
    "full": "金土 (CG)",
    "cj_full": "金十戈土 (CJIG)",
    "secret": "【鐵】速成取碼：首碼【金】(C) ＋ 尾碼【土】(G)",
    "quickCode": "CG"
  },
  "門": {
    "char": "門",
    "codes": [
      "日",
      "弓"
    ],
    "keys": [
      "A",
      "N"
    ],
    "first_code": "日",
    "last_code": "弓",
    "first_key": "A",
    "last_key": "N",
    "full": "日弓 (AN)",
    "cj_full": "日弓 (AN)",
    "secret": "【門】速成取碼：首碼【日】(A) ＋ 尾碼【弓】(N)",
    "quickCode": "AN"
  },
  "阿": {
    "char": "阿",
    "codes": [
      "弓",
      "口"
    ],
    "keys": [
      "N",
      "R"
    ],
    "first_code": "弓",
    "last_code": "口",
    "first_key": "N",
    "last_key": "R",
    "full": "弓口 (NR)",
    "cj_full": "弓中一弓口 (NLMNR)",
    "secret": "【阿】速成取碼：首碼【弓】(N) ＋ 尾碼【口】(R)",
    "quickCode": "NR"
  },
  "院": {
    "char": "院",
    "codes": [
      "弓",
      "山"
    ],
    "keys": [
      "N",
      "U"
    ],
    "first_code": "弓",
    "last_code": "山",
    "first_key": "N",
    "last_key": "U",
    "full": "弓山 (NU)",
    "cj_full": "弓中十一山 (NLJMU)",
    "secret": "【院】速成取碼：首碼【弓】(N) ＋ 尾碼【山】(U)",
    "quickCode": "NU"
  },
  "際": {
    "char": "際",
    "codes": [
      "弓",
      "火"
    ],
    "keys": [
      "N",
      "F"
    ],
    "first_code": "弓",
    "last_code": "火",
    "first_key": "N",
    "last_key": "F",
    "full": "弓火 (NF)",
    "cj_full": "弓中月人火 (NLBOF)",
    "secret": "【際】速成取碼：首碼【弓】(N) ＋ 尾碼【火】(F)",
    "quickCode": "NF"
  },
  "險": {
    "char": "險",
    "codes": [
      "弓",
      "人"
    ],
    "keys": [
      "N",
      "O"
    ],
    "first_code": "弓",
    "last_code": "人",
    "first_key": "N",
    "last_key": "O",
    "full": "弓人 (NO)",
    "cj_full": "弓中人一人 (NLOMO)",
    "secret": "【險】速成取碼：首碼【弓】(N) ＋ 尾碼【人】(O)",
    "quickCode": "NO"
  },
  "集": {
    "char": "集",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人土木 (OGD)",
    "secret": "【集】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "離": {
    "char": "離",
    "codes": [
      "卜",
      "土"
    ],
    "keys": [
      "Y",
      "G"
    ],
    "first_code": "卜",
    "last_code": "土",
    "first_key": "Y",
    "last_key": "G",
    "full": "卜土 (YG)",
    "cj_full": "卜月人土 (YBOG)",
    "secret": "【離】速成取碼：首碼【卜】(Y) ＋ 尾碼【土】(G)",
    "quickCode": "YG"
  },
  "難": {
    "char": "難",
    "codes": [
      "廿",
      "土"
    ],
    "keys": [
      "T",
      "G"
    ],
    "first_code": "廿",
    "last_code": "土",
    "first_key": "T",
    "last_key": "G",
    "full": "廿土 (TG)",
    "cj_full": "廿人人土 (TOOG)",
    "secret": "【難】速成取碼：首碼【廿】(T) ＋ 尾碼【土】(G)",
    "quickCode": "TG"
  },
  "雷": {
    "char": "雷",
    "codes": [
      "一",
      "田"
    ],
    "keys": [
      "M",
      "W"
    ],
    "first_code": "一",
    "last_code": "田",
    "first_key": "M",
    "last_key": "W",
    "full": "一田 (MW)",
    "cj_full": "一月田 (MBW)",
    "secret": "【雷】速成取碼：首碼【一】(M) ＋ 尾碼【田】(W)",
    "quickCode": "MW"
  },
  "鞋": {
    "char": "鞋",
    "codes": [
      "廿",
      "土"
    ],
    "keys": [
      "T",
      "G"
    ],
    "first_code": "廿",
    "last_code": "土",
    "first_key": "T",
    "last_key": "G",
    "full": "廿土 (TG)",
    "cj_full": "廿十土土 (TJGG)",
    "secret": "【鞋】速成取碼：首碼【廿】(T) ＋ 尾碼【土】(G)",
    "quickCode": "TG"
  },
  "音": {
    "char": "音",
    "codes": [
      "卜",
      "日"
    ],
    "keys": [
      "Y",
      "A"
    ],
    "first_code": "卜",
    "last_code": "日",
    "first_key": "Y",
    "last_key": "A",
    "full": "卜日 (YA)",
    "cj_full": "卜廿日 (YTA)",
    "secret": "【音】速成取碼：首碼【卜】(Y) ＋ 尾碼【日】(A)",
    "quickCode": "YA"
  },
  "預": {
    "char": "預",
    "codes": [
      "弓",
      "金"
    ],
    "keys": [
      "N",
      "C"
    ],
    "first_code": "弓",
    "last_code": "金",
    "first_key": "N",
    "last_key": "C",
    "full": "弓金 (NC)",
    "cj_full": "弓弓一月金 (NNMBC)",
    "secret": "【預】速成取碼：首碼【弓】(N) ＋ 尾碼【金】(C)",
    "quickCode": "NC"
  },
  "願": {
    "char": "願",
    "codes": [
      "一",
      "金"
    ],
    "keys": [
      "M",
      "C"
    ],
    "first_code": "一",
    "last_code": "金",
    "first_key": "M",
    "last_key": "C",
    "full": "一金 (MC)",
    "cj_full": "一火一月金 (MFMBC)",
    "secret": "【願】速成取碼：首碼【一】(M) ＋ 尾碼【金】(C)",
    "quickCode": "MC"
  },
  "飯": {
    "char": "飯",
    "codes": [
      "人",
      "水"
    ],
    "keys": [
      "O",
      "E"
    ],
    "first_code": "人",
    "last_code": "水",
    "first_key": "O",
    "last_key": "E",
    "full": "人水 (OE)",
    "cj_full": "人戈竹水 (OIHE)",
    "secret": "【飯】速成取碼：首碼【人】(O) ＋ 尾碼【水】(E)",
    "quickCode": "OE"
  },
  "餘": {
    "char": "餘",
    "codes": [
      "人",
      "木"
    ],
    "keys": [
      "O",
      "D"
    ],
    "first_code": "人",
    "last_code": "木",
    "first_key": "O",
    "last_key": "D",
    "full": "人木 (OD)",
    "cj_full": "人戈人一木 (OIOMD)",
    "secret": "【餘】速成取碼：首碼【人】(O) ＋ 尾碼【木】(D)",
    "quickCode": "OD"
  },
  "館": {
    "char": "館",
    "codes": [
      "人",
      "口"
    ],
    "keys": [
      "O",
      "R"
    ],
    "first_code": "人",
    "last_code": "口",
    "first_key": "O",
    "last_key": "R",
    "full": "人口 (OR)",
    "cj_full": "人戈十口口 (OIJRR)",
    "secret": "【館】速成取碼：首碼【人】(O) ＋ 尾碼【口】(R)",
    "quickCode": "OR"
  },
  "體": {
    "char": "體",
    "codes": [
      "月",
      "廿"
    ],
    "keys": [
      "B",
      "T"
    ],
    "first_code": "月",
    "last_code": "廿",
    "first_key": "B",
    "last_key": "T",
    "full": "月廿 (BT)",
    "cj_full": "月月廿田廿 (BBTWT)",
    "secret": "【體】速成取碼：首碼【月】(B) ＋ 尾碼【廿】(T)",
    "quickCode": "BT"
  },
  "高": {
    "char": "高",
    "codes": [
      "卜",
      "口"
    ],
    "keys": [
      "Y",
      "R"
    ],
    "first_code": "卜",
    "last_code": "口",
    "first_key": "Y",
    "last_key": "R",
    "full": "卜口 (YR)",
    "cj_full": "卜口月口 (YRBR)",
    "secret": "【高】速成取碼：首碼【卜】(Y) ＋ 尾碼【口】(R)",
    "quickCode": "YR"
  },
  "鮮": {
    "char": "鮮",
    "codes": [
      "弓",
      "手"
    ],
    "keys": [
      "N",
      "Q"
    ],
    "first_code": "弓",
    "last_code": "手",
    "first_key": "N",
    "last_key": "Q",
    "full": "弓手 (NQ)",
    "cj_full": "弓火廿手 (NFTQ)",
    "secret": "【鮮】速成取碼：首碼【弓】(N) ＋ 尾碼【手】(Q)",
    "quickCode": "NQ"
  },
  "黃": {
    "char": "黃",
    "codes": [
      "廿",
      "金"
    ],
    "keys": [
      "T",
      "C"
    ],
    "first_code": "廿",
    "last_code": "金",
    "first_key": "T",
    "last_key": "C",
    "full": "廿金 (TC)",
    "cj_full": "廿一田金 (TMWC)",
    "secret": "【黃】速成取碼：首碼【廿】(T) ＋ 尾碼【金】(C)",
    "quickCode": "TC"
  },
  "點": {
    "char": "點",
    "codes": [
      "田",
      "口"
    ],
    "keys": [
      "W",
      "R"
    ],
    "first_code": "田",
    "last_code": "口",
    "first_key": "W",
    "last_key": "R",
    "full": "田口 (WR)",
    "cj_full": "田火卜口 (WFYR)",
    "secret": "【點】速成取碼：首碼【田】(W) ＋ 尾碼【口】(R)",
    "quickCode": "WR"
  }
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
