import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";
import type { CheckRecord } from "@/types/goal";
import type { GoalInput } from "@/lib/schemas/goal";

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

type WeeklyData = {
  weekStart: string;
  weekEnd: string;
  totalChecks: number;
  possibleChecks: number;
  completionRate: number;
  habitBreakdown: {
    goalId: string;
    goalText: string;
    checks: number;
    possibleDays: number;
    rate: number;
  }[];
};

type MonthlyData = {
  month: string;
  totalChecks: number;
  possibleChecks: number;
  completionRate: number;
  habitBreakdown: {
    goalId: string;
    goalText: string;
    checks: number;
    possibleDays: number;
    rate: number;
  }[];
};

type BestHabit = {
  goalId: string;
  goalText: string;
  currentStreak: number;
  totalChecks: number;
  completionRate: number;
  isHallOfFame: boolean;
};

type OverallStats = {
  totalChecks: number;
  averageStreakDays: number;
  longestStreakEver: number;
  totalRestarts: number;
  activeHabitsCount: number;
  hallOfFameCount: number;
  totalDaysTracked: number;
  overallCompletionRate: number;
};

export type StatsResponse = {
  weekly: WeeklyData[];
  monthly: MonthlyData[];
  bestHabitThisWeek: BestHabit | null;
  bestHabitOverall: BestHabit | null;
  overall: OverallStats;
};

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const collection = collectionFor(user.uid);
    const today = todayKey();

    const snapshot = await collection.orderBy("startDate", "desc").get();

    const goalsWithChecks = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() as GoalInput & { hallOfFameAt?: string | null };
        const checksSnap = await doc.ref
          .collection("checks")
          .orderBy("date", "desc")
          .get();

        const checks: CheckRecord[] = checksSnap.docs
          .map((d) => d.data() as CheckRecord)
          .filter((c) => c.checked && c.date);

        return {
          id: doc.id,
          text: data.text,
          startDate: data.startDate,
          hallOfFameAt: data.hallOfFameAt ?? null,
          isHallOfFame: Boolean(data.hallOfFameAt),
          checks,
        };
      })
    );

    // 週間データを計算（過去4週間）
    const weekly = computeWeeklyData(goalsWithChecks, today, 4);

    // 月間データを計算（過去3ヶ月）
    const monthly = computeMonthlyData(goalsWithChecks, today, 3);

    // 今週のベスト習慣を計算
    const bestHabitThisWeek = computeBestHabitThisWeek(goalsWithChecks, today);

    // 全体でのベスト習慣を計算
    const bestHabitOverall = computeBestHabitOverall(goalsWithChecks);

    // 全体の統計を計算
    const overall = computeOverallStats(goalsWithChecks, today);

    const response: StatsResponse = {
      weekly,
      monthly,
      bestHabitThisWeek,
      bestHabitOverall,
      overall,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function computeWeeklyData(
  goals: {
    id: string;
    text: string;
    startDate: string;
    isHallOfFame: boolean;
    checks: CheckRecord[];
  }[],
  today: string,
  weeksCount: number
): WeeklyData[] {
  const weeks: WeeklyData[] = [];
  const todayDate = parseDateKey(today);

  for (let w = 0; w < weeksCount; w++) {
    const weekEnd = new Date(todayDate);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekStartKey = formatDateKey(weekStart);
    const weekEndKey = formatDateKey(weekEnd);

    const habitBreakdown: WeeklyData["habitBreakdown"] = [];
    let totalChecks = 0;
    let possibleChecks = 0;

    for (const goal of goals) {
      const goalStartDate = parseDateKey(goal.startDate);
      const effectiveStart = goalStartDate > weekStart ? goalStartDate : weekStart;
      const effectiveEnd = weekEnd;

      if (effectiveStart > effectiveEnd) continue;

      const daysInWeek = Math.min(7, dateDiff(formatDateKey(effectiveStart), formatDateKey(effectiveEnd)) + 1);
      const checksInWeek = goal.checks.filter((c) => {
        return c.date >= weekStartKey && c.date <= weekEndKey;
      }).length;

      habitBreakdown.push({
        goalId: goal.id,
        goalText: goal.text,
        checks: checksInWeek,
        possibleDays: daysInWeek,
        rate: daysInWeek > 0 ? Math.round((checksInWeek / daysInWeek) * 100) : 0,
      });

      totalChecks += checksInWeek;
      possibleChecks += daysInWeek;
    }

    weeks.push({
      weekStart: weekStartKey,
      weekEnd: weekEndKey,
      totalChecks,
      possibleChecks,
      completionRate: possibleChecks > 0 ? Math.round((totalChecks / possibleChecks) * 100) : 0,
      habitBreakdown,
    });
  }

  return weeks;
}

function computeMonthlyData(
  goals: {
    id: string;
    text: string;
    startDate: string;
    isHallOfFame: boolean;
    checks: CheckRecord[];
  }[],
  today: string,
  monthsCount: number
): MonthlyData[] {
  const months: MonthlyData[] = [];
  const todayDate = parseDateKey(today);

  for (let m = 0; m < monthsCount; m++) {
    const monthDate = new Date(todayDate);
    monthDate.setMonth(monthDate.getMonth() - m);

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));

    // 今月の場合は今日までに制限
    if (m === 0) {
      monthEnd.setTime(Math.min(monthEnd.getTime(), todayDate.getTime()));
    }

    const monthStartKey = formatDateKey(monthStart);
    const monthEndKey = formatDateKey(monthEnd);
    const monthLabel = `${year}年${month + 1}月`;

    const habitBreakdown: MonthlyData["habitBreakdown"] = [];
    let totalChecks = 0;
    let possibleChecks = 0;

    for (const goal of goals) {
      const goalStartDate = parseDateKey(goal.startDate);
      const effectiveStart = goalStartDate > monthStart ? goalStartDate : monthStart;
      const effectiveEnd = monthEnd;

      if (effectiveStart > effectiveEnd) continue;

      const daysInMonth = dateDiff(formatDateKey(effectiveStart), formatDateKey(effectiveEnd)) + 1;
      const checksInMonth = goal.checks.filter((c) => {
        return c.date >= monthStartKey && c.date <= monthEndKey;
      }).length;

      habitBreakdown.push({
        goalId: goal.id,
        goalText: goal.text,
        checks: checksInMonth,
        possibleDays: daysInMonth,
        rate: daysInMonth > 0 ? Math.round((checksInMonth / daysInMonth) * 100) : 0,
      });

      totalChecks += checksInMonth;
      possibleChecks += daysInMonth;
    }

    months.push({
      month: monthLabel,
      totalChecks,
      possibleChecks,
      completionRate: possibleChecks > 0 ? Math.round((totalChecks / possibleChecks) * 100) : 0,
      habitBreakdown,
    });
  }

  return months;
}

function computeBestHabitThisWeek(
  goals: {
    id: string;
    text: string;
    startDate: string;
    isHallOfFame: boolean;
    checks: CheckRecord[];
  }[],
  today: string
): BestHabit | null {
  const todayDate = parseDateKey(today);
  const weekStart = new Date(todayDate);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = formatDateKey(weekStart);

  let best: BestHabit | null = null;
  let bestScore = -1;

  for (const goal of goals) {
    const checksThisWeek = goal.checks.filter((c) => c.date >= weekStartKey && c.date <= today);
    const currentStreak = computeCurrentStreak(goal.checks, today);
    const completionRate = Math.min(100, checksThisWeek.length * (100 / 7));

    // スコア計算: 今週のチェック数 + 現在の連続日数 / 10
    const score = checksThisWeek.length + currentStreak / 10;

    if (score > bestScore && checksThisWeek.length > 0) {
      bestScore = score;
      best = {
        goalId: goal.id,
        goalText: goal.text,
        currentStreak,
        totalChecks: goal.checks.length,
        completionRate: Math.round(completionRate),
        isHallOfFame: goal.isHallOfFame,
      };
    }
  }

  return best;
}

function computeBestHabitOverall(
  goals: {
    id: string;
    text: string;
    startDate: string;
    isHallOfFame: boolean;
    checks: CheckRecord[];
  }[]
): BestHabit | null {
  let best: BestHabit | null = null;
  let bestTotalChecks = -1;

  for (const goal of goals) {
    const currentStreak = computeCurrentStreak(goal.checks, todayKey());
    const daysFromStart = Math.max(1, dateDiff(goal.startDate, todayKey()) + 1);
    const completionRate = Math.min(100, Math.round((goal.checks.length / daysFromStart) * 100));

    if (goal.checks.length > bestTotalChecks) {
      bestTotalChecks = goal.checks.length;
      best = {
        goalId: goal.id,
        goalText: goal.text,
        currentStreak,
        totalChecks: goal.checks.length,
        completionRate,
        isHallOfFame: goal.isHallOfFame,
      };
    }
  }

  return best;
}

function computeOverallStats(
  goals: {
    id: string;
    text: string;
    startDate: string;
    isHallOfFame: boolean;
    checks: CheckRecord[];
  }[],
  today: string
): OverallStats {
  let totalChecks = 0;
  let totalStreakDays = 0;
  let longestStreakEver = 0;
  let totalRestarts = 0;
  let totalDaysTracked = 0;
  let activeHabitsCount = 0;
  let hallOfFameCount = 0;

  for (const goal of goals) {
    totalChecks += goal.checks.length;

    const currentStreak = computeCurrentStreak(goal.checks, today);
    totalStreakDays += currentStreak;

    const { longestStreak, restarts } = computeStreakStats(goal.checks, today);
    if (longestStreak > longestStreakEver) {
      longestStreakEver = longestStreak;
    }
    totalRestarts += restarts;

    totalDaysTracked += Math.max(0, dateDiff(goal.startDate, today) + 1);

    if (goal.isHallOfFame) {
      hallOfFameCount++;
    } else {
      activeHabitsCount++;
    }
  }

  const averageStreakDays = goals.length > 0 ? Math.round(totalStreakDays / goals.length) : 0;
  const overallCompletionRate = totalDaysTracked > 0
    ? Math.round((totalChecks / totalDaysTracked) * 100)
    : 0;

  return {
    totalChecks,
    averageStreakDays,
    longestStreakEver,
    totalRestarts,
    activeHabitsCount,
    hallOfFameCount,
    totalDaysTracked,
    overallCompletionRate,
  };
}

function computeCurrentStreak(checks: CheckRecord[], today: string): number {
  if (checks.length === 0) return 0;

  const sortedChecks = [...checks].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let lastDate = today;

  for (const check of sortedChecks) {
    const gap = dateDiff(check.date, lastDate);
    if (gap <= 2) {
      streak++;
      lastDate = check.date;
    } else {
      break;
    }
  }

  return streak;
}

function computeStreakStats(
  checks: CheckRecord[],
  _today: string
): { longestStreak: number; restarts: number } {
  if (checks.length === 0) return { longestStreak: 0, restarts: 0 };

  const sortedChecks = [...checks].sort((a, b) => a.date.localeCompare(b.date));
  let longestStreak = 1;
  let currentStreak = 1;
  let restarts = 0;

  for (let i = 1; i < sortedChecks.length; i++) {
    const gap = dateDiff(sortedChecks[i - 1].date, sortedChecks[i].date);
    if (gap <= 2) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      restarts++;
      currentStreak = 1;
    }
  }

  return { longestStreak, restarts };
}

function dateDiff(dateA: string, dateB: string): number {
  const a = parseDateKey(dateA);
  const b = parseDateKey(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
