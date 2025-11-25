import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import type { FrequencyType } from "@/types/goal";

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyRequestUser(request);
    const { id: goalId } = await params;

    const goalRef = collectionFor(user.uid).doc(goalId);
    const goalSnap = await goalRef.get();

    if (!goalSnap.exists) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const goalData = goalSnap.data() ?? {};
    const frequency = (goalData.frequency as FrequencyType) ?? "daily";
    const weeklyTarget = (goalData.weeklyTarget as number) ?? 2;

    // 全ての履歴を取得（最新500件）
    const checksSnap = await goalRef
      .collection("checks")
      .orderBy("date", "desc")
      .limit(500)
      .get();

    const checks = checksSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date as string,
        checked: data.checked as boolean,
        createdAt: data.createdAt as string,
      };
    });

    // 統計情報を計算
    const checkedDates = new Set(
      checks.filter((c) => c.checked).map((c) => c.date)
    );

    const totalDaysChecked = checkedDates.size;

    let stats: {
      currentStreak: number;
      longestStreak: number;
      currentWeekChecks?: number;
      weeklyTarget?: number;
    };

    if (frequency === "weekly") {
      stats = computeWeeklyStats(checkedDates, weeklyTarget);
    } else {
      stats = computeDailyStats(checkedDates);
    }

    return NextResponse.json({
      goalId,
      text: goalData.text,
      frequency,
      weeklyTarget: frequency === "weekly" ? weeklyTarget : undefined,
      startDate: goalData.startDate,
      endDate: goalData.endDate,
      hallOfFameAt: goalData.hallOfFameAt ?? null,
      checks,
      stats: {
        totalDaysChecked,
        ...stats,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "履歴の取得に失敗しました。" },
      { status: 400 }
    );
  }
}

function computeDailyStats(checkedDates: Set<string>) {
  if (checkedDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = Array.from(checkedDates).sort().reverse();
  const today = getTodayKey();

  // 現在のストリーク
  let currentStreak = 0;
  let cursor = today;
  while (checkedDates.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  // 最長ストリーク
  const sortedAsc = Array.from(checkedDates).sort();
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = sortedAsc[i - 1];
    const curr = sortedAsc[i];
    if (addDays(prev, 1) === curr) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

function computeWeeklyStats(checkedDates: Set<string>, weeklyTarget: number) {
  if (checkedDates.size === 0) {
    return { currentStreak: 0, longestStreak: 0, currentWeekChecks: 0, weeklyTarget };
  }

  // 週ごとのチェック数を集計
  const weeklyChecks = new Map<string, number>();
  for (const date of checkedDates) {
    const weekStart = getWeekStart(date);
    weeklyChecks.set(weekStart, (weeklyChecks.get(weekStart) ?? 0) + 1);
  }

  const today = getTodayKey();
  const currentWeekStart = getWeekStart(today);
  const currentWeekChecks = weeklyChecks.get(currentWeekStart) ?? 0;

  // 連続達成週数を計算
  let currentStreak = 0;
  let cursor = currentWeekStart;
  const isCurrentWeekComplete = currentWeekChecks >= weeklyTarget;

  if (isCurrentWeekComplete) {
    currentStreak = 1;
    cursor = addDays(cursor, -7);
    while ((weeklyChecks.get(cursor) ?? 0) >= weeklyTarget) {
      currentStreak++;
      cursor = addDays(cursor, -7);
    }
  } else {
    const lastWeek = addDays(currentWeekStart, -7);
    if ((weeklyChecks.get(lastWeek) ?? 0) >= weeklyTarget) {
      currentStreak = 1;
      cursor = addDays(lastWeek, -7);
      while ((weeklyChecks.get(cursor) ?? 0) >= weeklyTarget) {
        currentStreak++;
        cursor = addDays(cursor, -7);
      }
    }
  }

  // 最長連続週数を計算
  const sortedWeeks = Array.from(weeklyChecks.keys()).sort();
  let longestStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sortedWeeks.length; i++) {
    const week = sortedWeeks[i];
    if ((weeklyChecks.get(week) ?? 0) >= weeklyTarget) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;

      // 次の週との連続性をチェック
      if (i < sortedWeeks.length - 1) {
        const nextWeek = sortedWeeks[i + 1];
        if (addDays(week, 7) !== nextWeek) {
          tempStreak = 0;
        }
      }
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak: currentStreak * 7,
    longestStreak: longestStreak * 7,
    currentWeekChecks,
    weeklyTarget,
  };
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateKey(date);
}

function addDays(dateKey: string, offset: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + offset);
  return formatDateKey(date);
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
