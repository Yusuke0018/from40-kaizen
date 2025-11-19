export type MealEntry = {
  id: string;
  time: string;
  note: string;
  photoUrl?: string | null;
};

export type DailyRecord = {
  date: string;
  weightKg: number | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepHours: number | null;
  avgSleepHr?: number | null;
  hrv: number | null;
  wakeCondition: string | null;
  moodMorning: number | null;
  moodEvening: number | null;
  sleepiness: number | null;
  hydrationMl: number | null;
  calories: number | null;
  steps: number | null;
  mealsNote: string;
  meals?: MealEntry[];
  emotionNote: string;
  highlight: string;
  challenge: string;
  journal: string;
  photoUrls: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type RecordFilters = {
  from?: string;
  to?: string;
  rangeDays?: number;
};
