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
};
