// レベルシステム
// 90日×6習慣 = 540チェック → LV50
// 基本: 1pt/チェック + ボーナス で約600pt前後でLV50

export type LevelTitle = {
  level: number;
  title: string;
  titleEn: string;
  minPoints: number;
  phase?: string;
  isMilestone?: boolean;
};

// LV1-50の肩書き（約12pt刻みでレベルアップ、約600ptでLV50）
export const LEVEL_TITLES: LevelTitle[] = [
  // 【第1フェーズ：胎動編】（Lv.1〜10）
  { level: 1, title: "目覚めし者", titleEn: "The Awakened", minPoints: 0, phase: "胎動編" },
  { level: 2, title: "無名の村人", titleEn: "Unknown Villager", minPoints: 12 },
  { level: 3, title: "棒切れを持った少年", titleEn: "Boy with a Stick", minPoints: 24 },
  { level: 4, title: "見習い冒険者", titleEn: "Apprentice Adventurer", minPoints: 36 },
  { level: 5, title: "駆け出しの探索者", titleEn: "Novice Explorer", minPoints: 50 },
  { level: 6, title: "銅ランクの冒険者", titleEn: "Bronze Adventurer", minPoints: 65 },
  { level: 7, title: "街角の用心棒", titleEn: "Street Bodyguard", minPoints: 80 },
  { level: 8, title: "鍛錬を始めた戦士", titleEn: "Training Warrior", minPoints: 96 },
  { level: 9, title: "期待のルーキー", titleEn: "Promising Rookie", minPoints: 113 },
  { level: 10, title: "一人前の冒険者", titleEn: "Full-fledged Adventurer", minPoints: 130, isMilestone: true },

  // 【第2フェーズ：実力編】（Lv.11〜20）
  { level: 11, title: "鉄の剣士", titleEn: "Iron Swordsman", minPoints: 148, phase: "実力編" },
  { level: 12, title: "迷宮の案内人", titleEn: "Dungeon Guide", minPoints: 167 },
  { level: 13, title: "熟練の傭兵", titleEn: "Veteran Mercenary", minPoints: 186 },
  { level: 14, title: "小隊長", titleEn: "Squad Leader", minPoints: 206 },
  { level: 15, title: "銀ランクの冒険者", titleEn: "Silver Adventurer", minPoints: 227 },
  { level: 16, title: "歴戦の猛者", titleEn: "Battle-hardened Warrior", minPoints: 248 },
  { level: 17, title: "疾風の追跡者", titleEn: "Swift Tracker", minPoints: 270 },
  { level: 18, title: "鋼の守護者", titleEn: "Steel Guardian", minPoints: 293 },
  { level: 19, title: "王国騎士団員", titleEn: "Royal Knight", minPoints: 316 },
  { level: 20, title: "近衛騎士", titleEn: "Imperial Guard", minPoints: 340, isMilestone: true },

  // 【第3フェーズ：覚醒編】（Lv.21〜30）
  { level: 21, title: "金ランクの冒険者", titleEn: "Gold Adventurer", minPoints: 365, phase: "覚醒編" },
  { level: 22, title: "竜殺しの英雄", titleEn: "Dragon Slayer", minPoints: 390 },
  { level: 23, title: "辺境の伯爵", titleEn: "Frontier Count", minPoints: 416 },
  { level: 24, title: "王国騎士団長", titleEn: "Knight Commander", minPoints: 443 },
  { level: 25, title: "大地の守り手", titleEn: "Guardian of Earth", minPoints: 470 },
  { level: 26, title: "賢者の弟子", titleEn: "Sage's Disciple", minPoints: 498 },
  { level: 27, title: "天空の覇者", titleEn: "Sky Conqueror", minPoints: 527 },
  { level: 28, title: "次期国王候補", titleEn: "Crown Prince", minPoints: 556 },
  { level: 29, title: "伝説の勇者", titleEn: "Legendary Hero", minPoints: 586 },
  { level: 30, title: "救世主", titleEn: "The Savior", minPoints: 617, isMilestone: true },

  // 【第4フェーズ：超越編】（Lv.31〜40）
  { level: 31, title: "覚醒せし賢者", titleEn: "Awakened Sage", minPoints: 648, phase: "超越編" },
  { level: 32, title: "時空の旅人", titleEn: "Time Traveler", minPoints: 680 },
  { level: 33, title: "運命を紡ぐ者", titleEn: "Fate Weaver", minPoints: 713 },
  { level: 34, title: "半神（デミゴッド）", titleEn: "Demigod", minPoints: 746 },
  { level: 35, title: "習慣の守護神", titleEn: "Habit Guardian God", minPoints: 780 },
  { level: 36, title: "継続の魔神", titleEn: "Demon of Continuity", minPoints: 815 },
  { level: 37, title: "意志の具現者", titleEn: "Will Incarnate", minPoints: 850 },
  { level: 38, title: "破壊と創造の王", titleEn: "King of Destruction & Creation", minPoints: 886 },
  { level: 39, title: "星を統べる者", titleEn: "Ruler of Stars", minPoints: 923 },
  { level: 40, title: "太陽神", titleEn: "Sun God", minPoints: 960, isMilestone: true },

  // 【第5フェーズ：宇宙・真理編】（Lv.41〜50）
  { level: 41, title: "銀河の観測者", titleEn: "Galaxy Observer", minPoints: 998, phase: "宇宙・真理編" },
  { level: 42, title: "次元を超越せし者", titleEn: "Dimension Transcender", minPoints: 1037 },
  { level: 43, title: "アカシックレコードの管理者", titleEn: "Akashic Librarian", minPoints: 1076 },
  { level: 44, title: "虚空の支配者", titleEn: "Void Sovereign", minPoints: 1116 },
  { level: 45, title: "ビッグバン・クリエイター", titleEn: "Big Bang Creator", minPoints: 1157 },
  { level: 46, title: "全知全能の書記官", titleEn: "Omniscient Scribe", minPoints: 1198 },
  { level: 47, title: "オメガ・カイザー", titleEn: "Omega Kaiser", minPoints: 1240 },
  { level: 48, title: "終焉と始まりの神", titleEn: "God of End & Beginning", minPoints: 1283 },
  { level: 49, title: "概念存在「継続」", titleEn: "Conceptual Being: Continuity", minPoints: 1326 },
  { level: 50, title: "THE GOKIGEN MASTER", titleEn: "The Ultimate Habit God", minPoints: 1370, isMilestone: true },
];

// フェーズ情報
export const PHASES = [
  { name: "胎動編", levelRange: "1-10", description: "全ての始まり。何者でもなかった自分が、徐々に個を持ち始める段階。" },
  { name: "実力編", levelRange: "11-20", description: "習慣が少しずつ板についてくる時期。周りからも認識され始める。" },
  { name: "覚醒編", levelRange: "21-30", description: "「やらないと気持ち悪い」レベルへ。実力は確固たるものに。" },
  { name: "超越編", levelRange: "31-40", description: "もはや努力ではなく「当たり前」の領域。概念的な存在へ。" },
  { name: "宇宙・真理編", levelRange: "41-50", description: "習慣化の最終形態。周囲にも良き影響を与える「ゾーン」。" },
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
  phase: string;
  currentLevelPoints: number;  // 現レベル内の獲得ポイント
  nextLevelPoints: number;     // 次のレベルまでに必要なポイント
  progress: number;            // 次のレベルまでの進捗（0-100）
  isMilestone: boolean;
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

  // フェーズを取得
  let phase = "胎動編";
  if (currentLevel.level >= 41) phase = "宇宙・真理編";
  else if (currentLevel.level >= 31) phase = "超越編";
  else if (currentLevel.level >= 21) phase = "覚醒編";
  else if (currentLevel.level >= 11) phase = "実力編";

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
    phase,
    currentLevelPoints,
    nextLevelPoints,
    progress,
    isMilestone: currentLevel.isMilestone ?? false,
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
