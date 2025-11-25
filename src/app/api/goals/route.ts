import { NextResponse } from "next/server";
import type { DocumentReference } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import type { GoalInput } from "@/lib/schemas/goal";
import { todayKey } from "@/lib/date";
import { getComment } from "@/lib/comments";
import type { GoalStats, CheckRecord } from "@/types/goal";

const MAX_ACTIVE_HABITS = 3;
const HALL_OF_FAME_DAYS = 90;
const MAX_GAP_DAYS = 2; // 2日までOK、3日以上空くとリセット

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const collection = collectionFor(user.uid);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") ?? todayKey();
    const includeHistory = searchParams.get("history") === "true";

    const snapshot = await collection.orderBy("startDate", "desc").get();

    const baseGoals = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as GoalInput & { hallOfFameAt?: string | null },
    }));

    const enriched = await Promise.all(
      baseGoals.map(async ({ id, data }) => {
        const result = await buildHabitStats(
          collection.doc(id),
          dateParam,
          data.startDate,
          includeHistory
        );

        const isHallOfFame = Boolean(data.hallOfFameAt);
        const isRestart = result.stats.restartCount > 0 && result.stats.currentStreak < 3;

        // コメント生成
        const comment = getComment({
          streak: result.stats.progressToHallOfFame,
          isRestart,
          isMilestone: [7, 14, 21, 30, 45, 50, 60, 70, 80].includes(result.stats.progressToHallOfFame),
          isHallOfFame,
          isWarning: result.daysSinceLastCheck === 2,
        });

        return {
          id,
          ...data,
          checkedToday: result.checkedToday,
          streak: result.stats.progressToHallOfFame,
          totalChecks: result.stats.totalChecks,
          hallOfFameAt: data.hallOfFameAt ?? null,
          isHallOfFame,
          stats: result.stats,
          comment,
          isRestart,
          daysSinceLastCheck: result.daysSinceLastCheck,
          ...(includeHistory ? { checks: result.checks } : {}),
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
    const parsed = z
      .object({
        text: z.string().min(1),
        startDate: z.string().min(1),
      })
      .parse(payload);

    const start = new Date(parsed.startDate);

    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "開始日の指定が正しくありません。" },
        { status: 400 }
      );
    }

    const collection = collectionFor(user.uid);
    const snapshot = await collection.get();

    const activeCount = snapshot.docs.filter((doc) => {
      const data = doc.data() as GoalInput & { hallOfFameAt?: string | null };
      if (data.hallOfFameAt) return false;
      return true;
    }).length;

    if (activeCount >= MAX_ACTIVE_HABITS) {
      return NextResponse.json(
        { error: `習慣は最大${MAX_ACTIVE_HABITS}つまでです。` },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    const docRef = await collection.add({
      text: parsed.text,
      startDate: parsed.startDate,
      createdAt: timestamp,
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
      })
      .parse(payload);

    const start = new Date(parsed.startDate);
    if (Number.isNaN(start.getTime())) {
      return NextResponse.json(
        { error: "開始日の指定が正しくありません。" },
        { status: 400 }
      );
    }

    const goalRef = collectionFor(user.uid).doc(parsed.id);

    await goalRef.set(
      {
        text: parsed.text,
        startDate: parsed.startDate,
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
  startDate: string,
  includeChecks: boolean = false
): Promise<{
  checkedToday: boolean;
  stats: GoalStats;
  daysSinceLastCheck: number;
  checks?: CheckRecord[];
}> {
  const checksSnap = await goalRef
    .collection("checks")
    .orderBy("date", "desc")
    .get();

  const allChecks: CheckRecord[] = checksSnap.docs
    .map((doc) => doc.data() as CheckRecord)
    .filter((item) => item.checked && item.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const checkedDates = new Set(allChecks.map((c) => c.date));
  const checkedToday = checkedDates.has(dateKey);

  // 最後にチェックした日を取得
  const sortedDates = Array.from(checkedDates).sort().reverse();
  const lastCheckDate = sortedDates[0] ?? null;

  // 最後のチェックからの日数
  const daysSinceLastCheck = lastCheckDate
    ? dateDiff(lastCheckDate, dateKey)
    : 999;

  // 新ルール: 2日に1回以上で継続、3日以上空くとリセット
  const { progressToHallOfFame, currentStreak, longestStreak, restartCount, streakHistory, gapHistory } =
    computeProgressWithNewRules(allChecks, dateKey);

  // 開始日からの日数
  const daysFromStart = dateDiff(startDate, dateKey) + 1;

  // 平均チェック間隔
  let averageInterval = 0;
  if (allChecks.length > 1) {
    let totalGap = 0;
    for (let i = 1; i < allChecks.length; i++) {
      totalGap += dateDiff(allChecks[i - 1].date, allChecks[i].date);
    }
    averageInterval = Math.round((totalGap / (allChecks.length - 1)) * 10) / 10;
  }

  // 達成率
  const completionRate = daysFromStart > 0
    ? Math.round((allChecks.length / daysFromStart) * 100)
    : 0;

  // 最後の中断日数
  const lastGapDays = gapHistory.length > 0
    ? gapHistory[gapHistory.length - 1].length
    : 0;

  const stats: GoalStats = {
    totalChecks: allChecks.length,
    currentStreak,
    longestStreak,
    lastCheckDate,
    lastGapDays,
    restartCount,
    averageInterval,
    completionRate,
    daysFromStart,
    progressToHallOfFame,
  };

  return {
    checkedToday,
    stats,
    daysSinceLastCheck,
    ...(includeChecks ? { checks: allChecks } : {}),
  };
}

/**
 * 新ルールでの進捗計算
 * - 2日に1回以上チェックすれば継続（達成日としてカウント）
 * - 3日以上空くとリセット（また0から）
 * - 90日達成で殿堂入り
 */
function computeProgressWithNewRules(
  checks: CheckRecord[],
  currentDate: string
): {
  progressToHallOfFame: number;
  currentStreak: number;
  longestStreak: number;
  restartCount: number;
  streakHistory: { startDate: string; endDate: string; length: number }[];
  gapHistory: { startDate: string; endDate: string; length: number }[];
} {
  if (checks.length === 0) {
    return {
      progressToHallOfFame: 0,
      currentStreak: 0,
      longestStreak: 0,
      restartCount: 0,
      streakHistory: [],
      gapHistory: [],
    };
  }

  const sortedChecks = [...checks].sort((a, b) => a.date.localeCompare(b.date));
  const streakHistory: { startDate: string; endDate: string; length: number }[] = [];
  const gapHistory: { startDate: string; endDate: string; length: number }[] = [];

  let currentProgress = 0; // 殿堂入りに向けた進捗
  let currentStreakStart = sortedChecks[0].date;
  let currentStreakLength = 1;
  let longestStreak = 1;
  let restartCount = 0;

  for (let i = 1; i < sortedChecks.length; i++) {
    const prevDate = sortedChecks[i - 1].date;
    const currDate = sortedChecks[i].date;
    const gap = dateDiff(prevDate, currDate);

    if (gap <= MAX_GAP_DAYS) {
      // 2日以内なので継続
      currentStreakLength++;
    } else {
      // 3日以上空いたのでリセット
      streakHistory.push({
        startDate: currentStreakStart,
        endDate: prevDate,
        length: currentStreakLength,
      });

      // ギャップを記録
      gapHistory.push({
        startDate: addDays(prevDate, 1),
        endDate: addDays(currDate, -1),
        length: gap - 1,
      });

      if (currentStreakLength > longestStreak) {
        longestStreak = currentStreakLength;
      }

      // リセット
      currentStreakStart = currDate;
      currentStreakLength = 1;
      restartCount++;
      currentProgress = 0; // 進捗もリセット
    }

    // 進捗をカウント（2日に1回でも1日分としてカウント）
    if (gap <= MAX_GAP_DAYS) {
      currentProgress++;
    } else {
      currentProgress = 1; // リセット後の最初の1日
    }
  }

  // 現在のストリークを記録
  const lastCheckDate = sortedChecks[sortedChecks.length - 1].date;
  const daysSinceLastCheck = dateDiff(lastCheckDate, currentDate);

  // 最後のチェックから3日以上経過していたらリセット
  if (daysSinceLastCheck > MAX_GAP_DAYS) {
    streakHistory.push({
      startDate: currentStreakStart,
      endDate: lastCheckDate,
      length: currentStreakLength,
    });

    if (currentStreakLength > longestStreak) {
      longestStreak = currentStreakLength;
    }

    currentStreakLength = 0;
    currentProgress = 0;
    restartCount++;
  } else {
    if (currentStreakLength > longestStreak) {
      longestStreak = currentStreakLength;
    }
  }

  // progressToHallOfFameは連続達成日数（最大90）
  const progressToHallOfFame = Math.min(HALL_OF_FAME_DAYS, currentStreakLength);

  return {
    progressToHallOfFame,
    currentStreak: currentStreakLength,
    longestStreak,
    restartCount,
    streakHistory,
    gapHistory,
  };
}

function dateDiff(dateA: string, dateB: string): number {
  const a = parseDateKey(dateA);
  const b = parseDateKey(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateKey: string, offset: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + offset);
  return formatDateKey(date);
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
