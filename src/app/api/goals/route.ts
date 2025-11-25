import { NextResponse } from "next/server";
import type { DocumentReference } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { goalSchema, type GoalInput } from "@/lib/schemas/goal";
import { todayKey } from "@/lib/date";
import type { FrequencyType } from "@/types/goal";

const MAX_ACTIVE_HABITS = 3;

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const collection = collectionFor(user.uid);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") ?? todayKey();

    const snapshot = await collection.orderBy("startDate", "desc").get();
    const now = new Date();

    const baseGoals = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: doc.data() as GoalInput & { hallOfFameAt?: string | null },
      }))
      .filter(({ data }) => {
        const rawExpire = data.expireAt;
        if (!rawExpire || typeof rawExpire !== "string") return true;
        const expireAt = new Date(rawExpire);
        if (Number.isNaN(expireAt.getTime())) return true;
        return expireAt > now;
      });

    const enriched = await Promise.all(
      baseGoals.map(async ({ id, data }) => {
        const frequency = (data.frequency as FrequencyType) ?? "daily";
        const weeklyTarget = data.weeklyTarget as number | undefined;
        const stats = await buildHabitStats(
          collection.doc(id),
          dateParam,
          frequency,
          weeklyTarget ?? 1
        );
        return {
          id,
          ...data,
          ...stats,
          frequency,
          weeklyTarget: weeklyTarget ?? (frequency === "weekly" ? 1 : undefined),
          hallOfFameAt: data.hallOfFameAt ?? null,
          isHallOfFame: Boolean(data.hallOfFameAt),
        };
      })
    );

    const activeHabits = enriched.filter((goal) => !goal.isHallOfFame);
    const hallOfFame = enriched.filter((goal) => goal.isHallOfFame);

    return NextResponse.json([...activeHabits, ...hallOfFame]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const payload = await request.json();
    const parsed = goalSchema
      .omit({ expireAt: true, createdAt: true, hallOfFameAt: true })
      .parse(payload);

    const start = new Date(parsed.startDate);
    const end = new Date(parsed.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return NextResponse.json(
        { error: "期間の指定が正しくありません。" },
        { status: 400 }
      );
    }

    const collection = collectionFor(user.uid);
    const snapshot = await collection.get();
    const now = new Date();

    const activeCount = snapshot.docs.filter((doc) => {
      const data = doc.data() as GoalInput & { hallOfFameAt?: string | null };
      if (data.hallOfFameAt) return false;
      const rawExpire = data.expireAt;
      if (!rawExpire || typeof rawExpire !== "string") return true;
      const expireAt = new Date(rawExpire);
      if (Number.isNaN(expireAt.getTime())) return true;
      return expireAt > now;
    }).length;

    if (activeCount >= MAX_ACTIVE_HABITS) {
      return NextResponse.json(
        { error: `習慣は最大${MAX_ACTIVE_HABITS}つまでです。` },
        { status: 400 }
      );
    }

    const expire = new Date(end);
    expire.setDate(expire.getDate() + 1);

    const timestamp = new Date().toISOString();
    const frequency = parsed.frequency ?? "daily";
    const weeklyTarget =
      frequency === "weekly" ? (parsed.weeklyTarget ?? 2) : undefined;

    const docRef = await collection.add({
      text: parsed.text,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      expireAt: expire.toISOString(),
      createdAt: timestamp,
      frequency,
      ...(weeklyTarget !== undefined && { weeklyTarget }),
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "目標の保存に失敗しました。" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const payload = await request.json();
    const parsed = z
      .object({
        id: z.string().min(1),
        text: z.string().min(1),
        startDate: z.string().min(1),
        endDate: z.string().min(1),
        frequency: z.enum(["daily", "weekly"]).optional(),
        weeklyTarget: z.number().min(1).max(7).optional(),
      })
      .parse(payload);

    const start = new Date(parsed.startDate);
    const end = new Date(parsed.endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return NextResponse.json(
        { error: "期間の指定が正しくありません。" },
        { status: 400 }
      );
    }

    const expire = new Date(end);
    expire.setDate(expire.getDate() + 1);
    const goalRef = collectionFor(user.uid).doc(parsed.id);

    const frequency = parsed.frequency ?? "daily";
    const weeklyTarget =
      frequency === "weekly" ? (parsed.weeklyTarget ?? 2) : undefined;

    await goalRef.set(
      {
        text: parsed.text,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        expireAt: expire.toISOString(),
        frequency,
        ...(weeklyTarget !== undefined && { weeklyTarget }),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "目標の更新に失敗しました。" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("id");
    if (!goalId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const goalRef = collectionFor(user.uid).doc(goalId);
    await goalRef.delete();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "目標の削除に失敗しました。" },
      { status: 400 }
    );
  }
}

async function buildHabitStats(
  goalRef: DocumentReference,
  dateKey: string,
  frequency: FrequencyType,
  weeklyTarget: number
) {
  const checksSnap = await goalRef
    .collection("checks")
    .where("date", "<=", dateKey)
    .orderBy("date", "desc")
    .limit(200)
    .get();

  const checkedDates = new Set(
    checksSnap.docs
      .map((doc) => doc.data() as { date?: string; checked?: boolean })
      .filter((item) => item.checked && item.date)
      .map((item) => item.date as string)
  );

  const checkedToday = checkedDates.has(dateKey);
  const totalDaysChecked = checkedDates.size;

  let streak: number;
  let currentWeekChecks: number | undefined;
  let longestStreak: number;

  if (frequency === "weekly") {
    const weeklyStats = computeWeeklyStreak(
      checkedDates,
      dateKey,
      weeklyTarget
    );
    streak = weeklyStats.streak;
    currentWeekChecks = weeklyStats.currentWeekChecks;
    longestStreak = weeklyStats.longestStreak;
  } else {
    streak = computeDailyStreak(checkedDates, dateKey);
    longestStreak = computeLongestDailyStreak(checkedDates);
  }

  return {
    checkedToday,
    streak,
    currentWeekChecks,
    longestStreak,
    totalDaysChecked,
  };
}

// 毎日の習慣: 連続日数を計算
function computeDailyStreak(checkedDates: Set<string>, startDate: string) {
  let streak = 0;
  let cursor = startDate;
  while (checkedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// 毎日の習慣: 過去最長の連続記録を計算
function computeLongestDailyStreak(checkedDates: Set<string>) {
  if (checkedDates.size === 0) return 0;

  const sortedDates = Array.from(checkedDates).sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = sortedDates[i - 1];
    const curr = sortedDates[i];
    const expected = addDays(prev, 1);
    if (curr === expected) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

// 週の開始日（月曜日）を取得
function getWeekStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // 月曜日を週の開始とする
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateKey(date);
}

// 週間の習慣: 連続達成週数を計算
function computeWeeklyStreak(
  checkedDates: Set<string>,
  dateKey: string,
  weeklyTarget: number
): { streak: number; currentWeekChecks: number; longestStreak: number } {
  if (checkedDates.size === 0) {
    return { streak: 0, currentWeekChecks: 0, longestStreak: 0 };
  }

  // 週ごとのチェック数を集計
  const weeklyChecks = new Map<string, number>();
  for (const date of checkedDates) {
    const weekStart = getWeekStart(date);
    weeklyChecks.set(weekStart, (weeklyChecks.get(weekStart) ?? 0) + 1);
  }

  // 今週のチェック数
  const currentWeekStart = getWeekStart(dateKey);
  const currentWeekChecks = weeklyChecks.get(currentWeekStart) ?? 0;

  // 週を新しい順にソート
  const sortedWeeks = Array.from(weeklyChecks.keys()).sort().reverse();

  // 連続達成週数を計算（今週から遡る）
  let streak = 0;
  let cursor = currentWeekStart;

  // 今週がターゲットに達していなくても、進行中としてカウント
  // ただし、過去の週は達成していないと連続が途切れる
  const isCurrentWeekComplete = currentWeekChecks >= weeklyTarget;

  if (isCurrentWeekComplete) {
    streak = 1;
    cursor = addDays(cursor, -7);

    while (true) {
      const checks = weeklyChecks.get(cursor) ?? 0;
      if (checks >= weeklyTarget) {
        streak++;
        cursor = addDays(cursor, -7);
      } else {
        break;
      }
    }
  } else {
    // 今週はまだ達成していないが、先週から遡って連続をカウント
    // （今週はまだ進行中なので、ストリークは維持される可能性がある）
    const lastWeek = addDays(currentWeekStart, -7);
    const lastWeekChecks = weeklyChecks.get(lastWeek) ?? 0;

    if (lastWeekChecks >= weeklyTarget) {
      streak = 1;
      cursor = addDays(lastWeek, -7);

      while (true) {
        const checks = weeklyChecks.get(cursor) ?? 0;
        if (checks >= weeklyTarget) {
          streak++;
          cursor = addDays(cursor, -7);
        } else {
          break;
        }
      }
    }
  }

  // 最長連続週数を計算
  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < sortedWeeks.length; i++) {
    const week = sortedWeeks[i];
    const checks = weeklyChecks.get(week) ?? 0;

    if (checks >= weeklyTarget) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }

      // 次の週（1週間前）との連続性をチェック
      if (i < sortedWeeks.length - 1) {
        const nextWeek = sortedWeeks[i + 1];
        const expectedNext = addDays(week, -7);
        if (nextWeek !== expectedNext) {
          currentStreak = 0;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // 週数を日数に換算（1週 = 7日として表示）
  return {
    streak: streak * 7,
    currentWeekChecks,
    longestStreak: longestStreak * 7,
  };
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
