/**
 * ==============================================================================
 * 🎮 MODES.JS - 四年級寶可夢速成打字聯賽 · 模式註冊表與每日階梯式解鎖鏈
 * ==============================================================================
 */

(function(root) {
  var SafeStorage = (typeof window !== 'undefined' && window.SafeStorage) ? window.SafeStorage : {
    _mem: {},
    getItem: function(key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          var v = window.localStorage.getItem(key);
          if (v !== null) return v;
        }
      } catch(e) {}
      return this._mem[key] !== undefined ? this._mem[key] : null;
    },
    setItem: function(key, val) {
      var strVal = String(val);
      this._mem[key] = strVal;
      try {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, strVal);
      } catch(e) {}
    },
    removeItem: function(key) {
      delete this._mem[key];
      try {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
      } catch(e) {}
    }
  };
  if (typeof window !== 'undefined') window.SafeStorage = SafeStorage;
  if (typeof global !== 'undefined') global.SafeStorage = SafeStorage;

  'use strict';

  var P4_MODES = [
    {
      id: 'typo',
      line: 'main',
      order: 1,
      circle: '1',
      icon: '⚔️',
      name: '錯字魔王討伐',
      short: '錯字魔王',
      badge: '首尾2碼',
      color: '#2563EB',
      pool: 'typo_words',
      mult: 1.0,
      completeAt: 150,
      note: '【第 1 站】在野生原野擊破高頻錯字魔王 · 每日得滿 150 分解鎖下一關'
    },
    {
      id: 'aux',
      line: 'main',
      order: 2,
      circle: '2',
      icon: '🕵️',
      name: '輔助字型大抓寶',
      short: '輔助字型',
      badge: '字根特訓',
      color: '#0D9488',
      pool: 'aux_words',
      mult: 1.1,
      completeAt: 250,
      note: '【第 2 站】辨識 24 字母繁複輔助字形 · 每日得滿 250 分解鎖下一關'
    },
    {
      id: 'letter',
      line: 'main',
      order: 3,
      circle: '3',
      icon: '🐣',
      name: '速成字母配對',
      short: '字母配對',
      badge: '鍵位感知',
      color: '#EC4899',
      pool: 'letter_words',
      mult: 1.0,
      completeAt: 350,
      note: '【第 3 站】速成 24 字母與鍵盤方位極速配對 · 每日得滿 350 分解鎖下一關'
    },
    {
      id: 'siege',
      line: 'main',
      order: 4,
      circle: '4',
      icon: '🧙',
      name: '逃出恐怖屋',
      short: '逃出恐怖屋',
      badge: '字靈倖存者',
      color: '#7C3AED',
      pool: 'siege_words',
      mult: 1.2,
      completeAt: 450,
      note: '【第 4 站】幽靈寶可夢字靈洶湧入侵，速成首尾二碼防守 · 每日得滿 450 分大通關！'
    },
    {
      id: 'speed',
      line: 'challenge',
      order: 5,
      circle: '挑戰',
      icon: '⚡',
      name: '速成極速手速賽',
      short: '手速賽',
      badge: '10字秒數天梯',
      color: '#0284C7',
      pool: 'w8_hw1',
      mult: 1.0,
      completeAt: 0,
      note: '【挑戰天梯】純 10 字極速秒數競技 · 常駐開放'
    }
  ];

  var P4Mode = {
    all: function() { return P4_MODES; },
    get: function(id) {
      for (var i = 0; i < P4_MODES.length; i++) {
        if (P4_MODES[i].id === id) return P4_MODES[i];
      }
      return P4_MODES[0];
    },
    mainSequence: function() {
      return P4_MODES.filter(function(m) { return m.line === 'main'; });
    },
    getTodayDateStr: function() {
      var d = new Date();
      var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      var nd = new Date(utc + (3600000 * 8)); // Macau UTC+8
      var y = nd.getFullYear();
      var m = ('0' + (nd.getMonth() + 1)).slice(-2);
      var day = ('0' + nd.getDate()).slice(-2);
      return y + '-' + m + '-' + day;
    },
    reconcileWithCloud: function(cls, num) {
      if (!cls || !num) return 0;
      var today = this.getTodayDateStr();
      var key = 'p4_daily_score_' + today + '_' + cls + '_' + num;
      var localScore = 0;
      try {
        if (typeof SafeStorage !== 'undefined' && SafeStorage.getItem) {
          var val = SafeStorage.getItem(key);
          if (val) localScore = parseInt(val, 10) || 0;
        }
      } catch(e) {}

      var isOnline = (typeof isCloudOnline !== 'undefined' && isCloudOnline);
      var cloudDailyScore = 0;
      var hasCloudData = false;
      try {
        var cloudList = null;
        if (typeof DATA !== 'undefined' && Array.isArray(DATA.benchmark_leaderboard) && DATA.benchmark_leaderboard.length > 0) {
          cloudList = DATA.benchmark_leaderboard;
        } else if (typeof window !== 'undefined' && window.DATA && Array.isArray(window.DATA.benchmark_leaderboard)) {
          cloudList = window.DATA.benchmark_leaderboard;
        }

        if (isOnline && cloudList && cloudList.length > 0) {
          var padNum = parseInt(num, 10);
          var match = cloudList.find(function(item) {
            return item.cls === cls && parseInt(item.num, 10) === padNum;
          });
          if (match && typeof match.todayScore === 'number') {
            cloudDailyScore = Math.max(0, match.todayScore);
            hasCloudData = true;
          }
        }
      } catch(e) {}

      var finalScore = localScore;
      if (hasCloudData) {
        var localPlaysToday = 0;
        var modeIds = ['typo', 'aux', 'letter', 'siege', 'speed'];
        for (var mi = 0; mi < modeIds.length; mi++) {
          localPlaysToday += this.getDailyStationPlayCount(modeIds[mi], cls, num);
        }

        if (cloudDailyScore === 0 && localPlaysToday === 0) {
          finalScore = 0;
          try {
            if (typeof SafeStorage !== 'undefined' && SafeStorage.setItem) {
              SafeStorage.setItem(key, '0');
            }
          } catch(e) {}
        } else {
          finalScore = Math.max(localScore, cloudDailyScore);
        }
      }
      return finalScore;
    },
    getDailyEarnedScore: function(cls, num) {
      return this.reconcileWithCloud(cls, num);
    },
    addDailyEarnedScore: function(cls, num, pts) {
      if (!cls || !num || !pts) return 0;
      var current = this.getDailyEarnedScore(cls, num);
      var updated = current + Math.max(0, parseInt(pts, 10) || 0);
      var today = this.getTodayDateStr();
      var key = 'p4_daily_score_' + today + '_' + cls + '_' + num;
      try {
        if (typeof SafeStorage !== 'undefined' && SafeStorage.setItem) {
          SafeStorage.setItem(key, String(updated));
        }
      } catch(e) {}
      return updated;
    },
    getDailyStationPlayCount: function(modeId, cls, num) {
      if (!modeId || !cls || !num) return 0;
      var today = this.getTodayDateStr();
      var key = 'p4_plays_' + today + '_' + modeId + '_' + cls + '_' + num;
      try {
        if (typeof SafeStorage !== 'undefined' && SafeStorage.getItem) {
          var v = SafeStorage.getItem(key);
          if (v) return parseInt(v, 10) || 0;
        }
      } catch(e) {}
      return 0;
    },
    recordStationPlay: function(modeId, cls, num) {
      if (!modeId || !cls || !num) return 0;
      var current = this.getDailyStationPlayCount(modeId, cls, num);
      var updated = current + 1;
      var today = this.getTodayDateStr();
      var key = 'p4_plays_' + today + '_' + modeId + '_' + cls + '_' + num;
      try {
        if (typeof SafeStorage !== 'undefined' && SafeStorage.setItem) {
          SafeStorage.setItem(key, String(updated));
        }
      } catch(e) {}
      return updated;
    },
    _isTeacherUnlocked: function(isTeacher) {
      return Boolean(
        isTeacher ||
        (typeof root !== "undefined" && (root.isTeacherMode || root.DEV_TEST_ALL_UNLOCKED)) ||
        (typeof window !== "undefined" && (window.isTeacherMode || window.DEV_TEST_ALL_UNLOCKED))
      );
    },
    isMainLineFullyUnlocked: function(cls, num, isTeacher) {
      isTeacher = this._isTeacherUnlocked(isTeacher);
      if (isTeacher) return true;
      var dailyPts = this.getDailyEarnedScore(cls, num);
      return dailyPts >= 350; // 達到站4門檻即視為主線全解鎖
    },
    getCurrentHighestUnlockedOrder: function(cls, num, isTeacher) {
      isTeacher = this._isTeacherUnlocked(isTeacher);
      if (isTeacher) return 4;
      var dailyPts = this.getDailyEarnedScore(cls, num);
      var mainSeq = this.mainSequence();
      var highest = 1;
      for (var i = 0; i < mainSeq.length; i++) {
        if (i === 0 || dailyPts >= mainSeq[i - 1].completeAt) {
          highest = mainSeq[i].order;
        }
      }
      return highest;
    },
    getScoreDecayMultiplier: function(modeId, cls, num, isTeacher) {
      isTeacher = this._isTeacherUnlocked(isTeacher);
      if (modeId === 'speed') return 1.0;
      if (isTeacher) return 1.0;

      var isAllUnlocked = this.isMainLineFullyUnlocked(cls, num, isTeacher);

      // 當遊戲主線全解鎖時，只有站 4 (siege 逃出恐怖屋) 能按原來設定無限獲取分數！
      if (isAllUnlocked) {
        if (modeId === 'siege') {
          return 1.0;
        }
        var count = this.getDailyStationPlayCount(modeId, cls, num);
        if (count === 0) return 1.0;
        if (count === 1) return 0.5;
        if (count === 2) return 0.25;
        return 0.0;
      }

      var targetMode = this.get(modeId);
      var highestOrder = this.getCurrentHighestUnlockedOrder(cls, num, isTeacher);

      // 當遊戲主線未全解時，當前關卡的前面所有關卡得分按防刷分規則計算：第 1 次全額，第 2 次一半，第 3 次四分之一
      if (!isAllUnlocked && targetMode.order < highestOrder) {
        var count = this.getDailyStationPlayCount(modeId, cls, num);
        if (count === 0) return 1.0;
        if (count === 1) return 0.5;
        if (count === 2) return 0.25;
        return 0.0;
      }

      return 1.0;
    },
    getUnlockStatus: function(modeId, cls, num, isTeacher) {
      isTeacher = this._isTeacherUnlocked(isTeacher);
      if (isTeacher) {
        return { unlocked: true, currentDailyScore: 9999, threshold: 0, neededScore: 0, prevStationName: '' };
      }
      var targetMode = this.get(modeId);
      if (!targetMode || targetMode.line === 'challenge') {
        return { unlocked: true, currentDailyScore: 0, threshold: 0, neededScore: 0, prevStationName: '' };
      }
      var mainSeq = this.mainSequence();
      var targetIdx = -1;
      for (var i = 0; i < mainSeq.length; i++) {
        if (mainSeq[i].id === targetMode.id) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx <= 0) {
        return { unlocked: true, currentDailyScore: this.getDailyEarnedScore(cls, num), threshold: 0, neededScore: 0, completeAt: targetMode.completeAt };
      }
      var prevStation = mainSeq[targetIdx - 1];
      var threshold = prevStation.completeAt;
      var dailyPts = this.getDailyEarnedScore(cls, num);
      var isUnlocked = dailyPts >= threshold;
      var needed = Math.max(0, threshold - dailyPts);
      return {
        unlocked: isUnlocked,
        currentDailyScore: dailyPts,
        threshold: threshold,
        neededScore: needed,
        prevStationName: prevStation.name,
        completeAt: targetMode.completeAt
      };
    }
  };

  root.P4_MODES = P4_MODES;
  root.P4Mode = P4Mode;
  root.P6Mode = P4Mode; // 向下相容
})(typeof window !== 'undefined' ? window : this);
