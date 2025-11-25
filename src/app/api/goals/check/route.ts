import { NextResponse } from "next/server";
import { z } from "zod";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";
import { getComment } from "@/lib/comments";
import type { CheckRecord } from "@/types/goal";

const HALL_OF_FAME_DAYS = 90;
const MAX_GAP_DAYS = 2; // 2日までOK、3日以上空くとリセット

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

    const { streak, hallOfFameAt, isRestart, comment } =
      await computeStreakAndHallOfFame(goalRef, payload.date);

    return NextResponse.json({
      ok: true,
      streak,
      hallOfFameAt,
      isRestart,
      comment,
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
  dateKey: string
): Promise<{
  streak: number;
  hallOfFameAt: string | null;
  isRestart: boolean;
  comment: string;
}> {
  const checksSnap = await goalRef
    .collection("checks")
    .orderBy("date", "desc")
    .get();

  const allChecks: CheckRecord[] = checksSnap.docs
    .map((doc) => doc.data() as CheckRecord)
    .filter((item) => item.checked && item.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const { progressToHallOfFame, restartCount } = computeProgressWithNewRules(
    allChecks,
    dateKey
  );

  const isRestart = restartCount > 0 && progressToHallOfFame < 3;

  const goalData = goalRef.get().then((snap) => snap.data() ?? {});
  const existingHall = (await goalData).hallOfFameAt as
    | string
    | undefined
    | null;

  // コメント生成
  const comment = getComment({
    streak: progressToHallOfFame,
    isRestart,
    isMilestone: [7, 14, 21, 30, 45, 50, 60, 70, 80, 90].includes(
      progressToHallOfFame
    ),
    isHallOfFame: progressToHallOfFame >= HALL_OF_FAME_DAYS,
  });

  if (!existingHall && progressToHallOfFame >= HALL_OF_FAME_DAYS) {
    const hallOfFameAt = new Date().toISOString();
    await goalRef.set({ hallOfFameAt }, { merge: true });
    return {
      streak: progressToHallOfFame,
      hallOfFameAt,
      isRestart,
      comment: getComment({ streak: 90, isHallOfFame: true }),
    };
  }

  return {
    streak: progressToHallOfFame,
    hallOfFameAt: existingHall ?? null,
    isRestart,
    comment,
  };
}

/**
 * 新ルールでの進捗計算
 * - 2日に1回以上チェックすれば継続
 * - 3日以上空くとリセット
 * - 90日達成で殿堂入り
 */
function computeProgressWithNewRules(
  checks: CheckRecord[],
  currentDate: string
): {
  progressToHallOfFame: number;
  currentStreak: number;
  restartCount: number;
} {
  if (checks.length === 0) {
    return {
      progressToHallOfFame: 0,
      currentStreak: 0,
      restartCount: 0,
    };
  }

  const sortedChecks = [...checks].sort((a, b) => a.date.localeCompare(b.date));

  let currentStreakLength = 1;
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
      currentStreakLength = 1;
      restartCount++;
    }
  }

  // 最後のチェックから3日以上経過していたらリセット
  const lastCheckDate = sortedChecks[sortedChecks.length - 1].date;
  const daysSinceLastCheck = dateDiff(lastCheckDate, currentDate);

  if (daysSinceLastCheck > MAX_GAP_DAYS) {
    currentStreakLength = 0;
    restartCount++;
  }

  const progressToHallOfFame = Math.min(HALL_OF_FAME_DAYS, currentStreakLength);

  return {
    progressToHallOfFame,
    currentStreak: currentStreakLength,
    restartCount,
  };
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
