// 個別のチェック記録
export type CheckRecord = {
  date: string; // YYYY-MM-DD
  checked: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// 習慣の統計情報
export type GoalStats = {
  totalChecks: number; // 総チェック回数
  currentStreak: number; // 現在の連続達成日数
  longestStreak: number; // 最長連続達成日数
  lastCheckDate: string | null; // 最後にチェックした日
  lastGapDays: number; // 最後の中断日数
  restartCount: number; // リスタート回数（3日以上空いた回数）
  averageInterval: number; // 平均チェック間隔（日）
  completionRate: number; // 達成率（%）
  daysFromStart: number; // 開始からの日数
  progressToHallOfFame: number; // 殿堂入りまでの進捗（0-90）
};

// 習慣データ
export type Goal = {
  id: string;
  text: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // 殿堂入り時に自動設定（hallOfFameAtと同じ）
  expireAt?: string;
  createdAt?: string;
  hallOfFameAt?: string | null; // 殿堂入り日（終了日）
  checkedToday?: boolean;
  streak?: number; // 現在の連続達成（2日に1回でもOK）
  totalChecks?: number;
  isHallOfFame?: boolean;
  stats?: GoalStats;
  checks?: CheckRecord[]; // 履歴画面用
  daysSinceLastCheck?: number; // 最後のチェックからの日数
};

// 履歴画面用のサマリーデータ
export type GoalHistorySummary = {
  goal: Goal;
  stats: GoalStats;
  recentChecks: CheckRecord[];
  streakHistory: {
    startDate: string;
    endDate: string;
    length: number;
  }[];
  gapHistory: {
    startDate: string;
    endDate: string;
    length: number;
  }[];
};
