import { NextResponse } from "next/server";
import { z } from "zod";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";
import type { FrequencyType } from "@/types/goal";

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

const inputSchema = z.object({
  goalId: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(todayKey()),
  checked: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const payload = inputSchema.parse(await request.json());

    const goalRef = collectionFor(user.uid).doc(payload.goalId);
    const goalSnap = await goalRef.get();
    if (!goalSnap.exists) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const checks = goalRef.collection("checks");
    const timestamp = new Date().toISOString();

    if (payload.checked) {
      await checks.doc(payload.date).set(
        {
          date: payload.date,
          checked: true,
          updatedAt: timestamp,
          createdAt: timestamp,
        },
        { merge: true }
      );
    } else {
      await checks.doc(payload.date).delete();
    }

    const goalData = goalSnap.data() ?? {};
    const frequency = (goalData.frequency as FrequencyType) ?? "daily";
    const weeklyTarget = (goalData.weeklyTarget as number) ?? 2;

    const { streak, hallOfFameAt, currentWeekChecks } =
      await computeStreakAndHallOfFame(
        goalRef,
        payload.date,
        frequency,
        weeklyTarget
      );

    return NextResponse.json({
      ok: true,
      streak,
      hallOfFameAt,
      currentWeekChecks,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "チェックの保存に失敗しました。" },
      { status: 400 }
    );
  }
}

async function computeStreakAndHallOfFame(
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

  let streak: number;
  let currentWeekChecks: number | undefined;

  if (frequency === "weekly") {
    const weeklyStats = computeWeeklyStreak(checkedDates, dateKey, weeklyTarget);
    streak = weeklyStats.streak;
    currentWeekChecks = weeklyStats.currentWeekChecks;
  } else {
    streak = computeDailyStreak(checkedDates, dateKey);
  }

  const goalData = goalRef.get().then((snap) => snap.data() ?? {});
  const existingHall = (await goalData).hallOfFameAt as
    | string
    | undefined
    | null;

  if (!existingHall && streak >= 90) {
    const hallOfFameAt = new Date().toISOString();
    await goalRef.set({ hallOfFameAt }, { merge: true });
    return { streak, hallOfFameAt, currentWeekChecks };
  }

  return { streak, hallOfFameAt: existingHall ?? null, currentWeekChecks };
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

// 週の開始日（月曜日）を取得
function getWeekStart(dateKey: string): string {
  const date = parseDateKey(dateKey);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return formatDateKey(date);
}

// 週間の習慣: 連続達成週数を計算
function computeWeeklyStreak(
  checkedDates: Set<string>,
  dateKey: string,
  weeklyTarget: number
): { streak: number; currentWeekChecks: number } {
  if (checkedDates.size === 0) {
    return { streak: 0, currentWeekChecks: 0 };
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

  // 連続達成週数を計算（今週から遡る）
  let streak = 0;
  let cursor = currentWeekStart;

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

  // 週数を日数に換算（1週 = 7日として表示）
  return {
    streak: streak * 7,
    currentWeekChecks,
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
