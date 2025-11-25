export type FrequencyType = "daily" | "weekly";

export type Goal = {
  id: string;
  text: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  expireAt?: string;
  createdAt?: string;
  hallOfFameAt?: string | null;
  checkedToday?: boolean;
  streak?: number;
  totalChecks?: number;
  isHallOfFame?: boolean;
  // 頻度設定
  frequency?: FrequencyType; // "daily" = 毎日, "weekly" = 週N回
  weeklyTarget?: number; // frequency === "weekly" の場合、週に何回達成すべきか (1-7)
  // 履歴統計
  currentWeekChecks?: number; // 今週のチェック数
  longestStreak?: number; // 過去最長の連続記録
  totalDaysChecked?: number; // 総達成日数
};

export type CheckRecord = {
  date: string; // YYYY-MM-DD
  checked: boolean;
  createdAt: string;
  updatedAt: string;
};
