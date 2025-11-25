// レベルシステム
// 90日×6習慣 = 540チェック → LV50
// 基本: 1pt/チェック + ボーナス で約600pt前後でLV50

export type LevelTitle = {
  level: number;
  title: string;
  titleEn: string;
  minPoints: number;
};

// LV1-50の肩書き（10pt刻みでレベルアップ、約600ptでLV50）
export const LEVEL_TITLES: LevelTitle[] = [
  { level: 1, title: "見習い", titleEn: "Novice", minPoints: 0 },
  { level: 2, title: "初心者", titleEn: "Beginner", minPoints: 12 },
  { level: 3, title: "挑戦者", titleEn: "Challenger", minPoints: 24 },
  { level: 4, title: "継続者", titleEn: "Continuer", minPoints: 36 },
  { level: 5, title: "努力家", titleEn: "Hard Worker", minPoints: 50 },
  { level: 6, title: "実践者", titleEn: "Practitioner", minPoints: 65 },
  { level: 7, title: "鍛錬者", titleEn: "Trainee", minPoints: 80 },
  { level: 8, title: "精進者", titleEn: "Devotee", minPoints: 96 },
  { level: 9, title: "修行者", titleEn: "Apprentice", minPoints: 113 },
  { level: 10, title: "熟練者", titleEn: "Skilled", minPoints: 130 },
  { level: 11, title: "習慣の芽", titleEn: "Habit Sprout", minPoints: 148 },
  { level: 12, title: "意志の炎", titleEn: "Willpower Flame", minPoints: 167 },
  { level: 13, title: "継続の風", titleEn: "Wind of Continuity", minPoints: 186 },
  { level: 14, title: "鉄の意志", titleEn: "Iron Will", minPoints: 206 },
  { level: 15, title: "不屈の心", titleEn: "Indomitable", minPoints: 227 },
  { level: 16, title: "習慣の柱", titleEn: "Habit Pillar", minPoints: 248 },
  { level: 17, title: "決意の剣", titleEn: "Sword of Resolve", minPoints: 270 },
  { level: 18, title: "忍耐の盾", titleEn: "Shield of Patience", minPoints: 293 },
  { level: 19, title: "精神の鍛冶", titleEn: "Mind Smith", minPoints: 316 },
  { level: 20, title: "習慣の騎士", titleEn: "Habit Knight", minPoints: 340 },
  { level: 21, title: "意志の戦士", titleEn: "Will Warrior", minPoints: 365 },
  { level: 22, title: "継続の守護者", titleEn: "Continuity Guardian", minPoints: 390 },
  { level: 23, title: "鍛錬の達人", titleEn: "Training Master", minPoints: 416 },
  { level: 24, title: "習慣の賢者", titleEn: "Habit Sage", minPoints: 443 },
  { level: 25, title: "意志の覇者", titleEn: "Will Champion", minPoints: 470 },
  { level: 26, title: "継続の王", titleEn: "Continuity King", minPoints: 498 },
  { level: 27, title: "習慣の導師", titleEn: "Habit Guide", minPoints: 527 },
  { level: 28, title: "精神の守護神", titleEn: "Spirit Guardian", minPoints: 556 },
  { level: 29, title: "意志の帝王", titleEn: "Emperor of Will", minPoints: 586 },
  { level: 30, title: "習慣の英雄", titleEn: "Habit Hero", minPoints: 617 },
  { level: 31, title: "継続の勇者", titleEn: "Brave Continuer", minPoints: 648 },
  { level: 32, title: "鉄壁の意志", titleEn: "Ironclad Will", minPoints: 680 },
  { level: 33, title: "習慣の支配者", titleEn: "Habit Ruler", minPoints: 713 },
  { level: 34, title: "精神の征服者", titleEn: "Mind Conqueror", minPoints: 746 },
  { level: 35, title: "意志の大帝", titleEn: "Grand Emperor", minPoints: 780 },
  { level: 36, title: "継続の神官", titleEn: "High Priest", minPoints: 815 },
  { level: 37, title: "習慣の魔導師", titleEn: "Habit Mage", minPoints: 850 },
  { level: 38, title: "精神の巨匠", titleEn: "Mind Maestro", minPoints: 886 },
  { level: 39, title: "意志の覇王", titleEn: "Overlord of Will", minPoints: 923 },
  { level: 40, title: "習慣の伝説", titleEn: "Habit Legend", minPoints: 960 },
  { level: 41, title: "継続の神", titleEn: "God of Continuity", minPoints: 998 },
  { level: 42, title: "意志の創造主", titleEn: "Creator of Will", minPoints: 1037 },
  { level: 43, title: "習慣の超越者", titleEn: "Transcendent", minPoints: 1076 },
  { level: 44, title: "精神の化身", titleEn: "Spirit Incarnate", minPoints: 1116 },
  { level: 45, title: "意志の絶対者", titleEn: "Absolute Will", minPoints: 1157 },
  { level: 46, title: "習慣の至高者", titleEn: "Supreme One", minPoints: 1198 },
  { level: 47, title: "継続の永遠", titleEn: "Eternal Continuer", minPoints: 1240 },
  { level: 48, title: "意志の無限", titleEn: "Infinite Will", minPoints: 1283 },
  { level: 49, title: "習慣の宇宙", titleEn: "Habit Cosmos", minPoints: 1326 },
  { level: 50, title: "習慣神", titleEn: "Habit God", minPoints: 1370 },
];

// ポイント計算用の定数
export const POINTS = {
  BASE_CHECK: 1,           // 基本チェック
  STREAK_BONUS_7: 2,       // 7日連続ボーナス
  STREAK_BONUS_14: 3,      // 14日連続ボーナス
  STREAK_BONUS_30: 5,      // 30日連続ボーナス
  HALL_OF_FAME: 20,        // 殿堂入りボーナス
  RESTART_BONUS: 2,        // 復帰ボーナス（3日以上空いた後の復帰）
} as const;

export type UserLevel = {
  totalPoints: number;
  level: number;
  title: string;
  titleEn: string;
  currentLevelPoints: number;  // 現レベル内の獲得ポイント
  nextLevelPoints: number;     // 次のレベルまでに必要なポイント
  progress: number;            // 次のレベルまでの進捗（0-100）
};

// ポイントからレベル情報を計算
export function calculateLevel(totalPoints: number): UserLevel {
  let currentLevel = LEVEL_TITLES[0];
  let nextLevel: LevelTitle | null = LEVEL_TITLES[1] || null;

  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_TITLES[i].minPoints) {
      currentLevel = LEVEL_TITLES[i];
      nextLevel = LEVEL_TITLES[i + 1] || null;
      break;
    }
  }

  const currentLevelPoints = totalPoints - currentLevel.minPoints;
  const nextLevelPoints = nextLevel
    ? nextLevel.minPoints - currentLevel.minPoints
    : 0;
  const progress = nextLevel
    ? Math.min(100, Math.round((currentLevelPoints / nextLevelPoints) * 100))
    : 100;

  return {
    totalPoints,
    level: currentLevel.level,
    title: currentLevel.title,
    titleEn: currentLevel.titleEn,
    currentLevelPoints,
    nextLevelPoints,
    progress,
  };
}

// チェック時のポイント計算
export function calculateCheckPoints(params: {
  streak: number;
  isRestart: boolean;
  isHallOfFame: boolean;
}): { points: number; breakdown: { type: string; points: number }[] } {
  const breakdown: { type: string; points: number }[] = [];
  let points = POINTS.BASE_CHECK;
  breakdown.push({ type: "チェック", points: POINTS.BASE_CHECK });

  // 連続ボーナス（重複しない、最大のみ）
  if (params.streak >= 30 && params.streak % 30 === 0) {
    points += POINTS.STREAK_BONUS_30;
    breakdown.push({ type: "30日連続", points: POINTS.STREAK_BONUS_30 });
  } else if (params.streak >= 14 && params.streak % 14 === 0) {
    points += POINTS.STREAK_BONUS_14;
    breakdown.push({ type: "14日連続", points: POINTS.STREAK_BONUS_14 });
  } else if (params.streak >= 7 && params.streak % 7 === 0) {
    points += POINTS.STREAK_BONUS_7;
    breakdown.push({ type: "7日連続", points: POINTS.STREAK_BONUS_7 });
  }

  // 復帰ボーナス
  if (params.isRestart) {
    points += POINTS.RESTART_BONUS;
    breakdown.push({ type: "復帰", points: POINTS.RESTART_BONUS });
  }

  // 殿堂入りボーナス
  if (params.isHallOfFame) {
    points += POINTS.HALL_OF_FAME;
    breakdown.push({ type: "殿堂入り", points: POINTS.HALL_OF_FAME });
  }

  return { points, breakdown };
}

// レベルアップしたかどうかを判定
export function checkLevelUp(
  oldPoints: number,
  newPoints: number
): { leveledUp: boolean; oldLevel: UserLevel; newLevel: UserLevel } {
  const oldLevel = calculateLevel(oldPoints);
  const newLevel = calculateLevel(newPoints);

  return {
    leveledUp: newLevel.level > oldLevel.level,
    oldLevel,
    newLevel,
  };
}
