import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";
import type { CheckRecord } from "@/types/goal";
import {
  calculateCheckPoints,
  checkLevelUp,
} from "@/lib/level-system";

const HALL_OF_FAME_DAYS = 90;
const MAX_GAP_DAYS = 2; // 2日までOK、3日以上空くとリセット

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

const userDocFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid);

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
    const checks = goalRef.collection("checks");
    const userDoc = userDocFor(user.uid);

    // 必要な読み取りを全て並列で実行（大幅な速度改善）
    const [goalSnap, existingCheck, checksSnap, userSnap] = await Promise.all([
      goalRef.get(),
      checks.doc(payload.date).get(),
      checks.orderBy("date", "desc").get(),
      userDoc.get(),
    ]);

    if (!goalSnap.exists) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const goalData = goalSnap.data() ?? {};
    const wasChecked = existingCheck.exists && existingCheck.data()?.checked;
    const currentPoints = (userSnap.data()?.totalPoints as number) || 0;
    const existingHall = goalData.hallOfFameAt as string | undefined | null;

    const timestamp = new Date().toISOString();

    // チェック保存/削除
    const checkWritePromise = payload.checked
      ? checks.doc(payload.date).set(
          {
            date: payload.date,
            checked: true,
            updatedAt: timestamp,
            createdAt: timestamp,
          },
          { merge: true }
        )
      : checks.doc(payload.date).delete();

    // ストリーク計算（既に取得したchecksSnapを使用）
    const allChecks: CheckRecord[] = checksSnap.docs
      .map((doc) => doc.data() as CheckRecord)
      .filter((item) => item.checked && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));

    // チェックONの場合は新しいチェックを追加してストリーク計算
    // チェックOFFの場合は該当チェックを除外してストリーク計算
    let checksForCalc = allChecks;
    if (payload.checked && !wasChecked) {
      // 新しいチェックを追加
      checksForCalc = [...allChecks, { date: payload.date, checked: true }].sort(
        (a, b) => a.date.localeCompare(b.date)
      );
    } else if (!payload.checked && wasChecked) {
      // チェックを除外
      checksForCalc = allChecks.filter((c) => c.date !== payload.date);
    }

    const { progressToHallOfFame, restartCount } = computeProgressWithNewRules(
      checksForCalc,
      payload.date
    );

    const streak = progressToHallOfFame;
    const isRestart = restartCount > 0 && progressToHallOfFame < 3;

    // 殿堂入り判定
    let hallOfFameAt = existingHall ?? null;
    let hallOfFameWritePromise: Promise<unknown> | null = null;
    if (!existingHall && progressToHallOfFame >= HALL_OF_FAME_DAYS) {
      hallOfFameAt = timestamp;
      hallOfFameWritePromise = goalRef.set({ hallOfFameAt }, { merge: true });
    }

    // ポイント計算とレベルアップ判定
    let pointsEarned = 0;
    let pointsLost = 0;
    let levelUp = null;
    let levelDown = null;
    let newLevel = null;
    let pointsWritePromise: Promise<unknown> | null = null;

    // チェックON時のみポイント付与（既にチェック済みでなければ）
    if (payload.checked && !wasChecked) {
      const { points } = calculateCheckPoints({
        streak,
        isRestart,
        isHallOfFame: hallOfFameAt !== null && streak === HALL_OF_FAME_DAYS,
      });

      pointsEarned = points;

      // ポイント更新
      pointsWritePromise = userDoc.set(
        { totalPoints: FieldValue.increment(points) },
        { merge: true }
      );

      // レベルアップ判定
      const levelResult = checkLevelUp(currentPoints, currentPoints + points);
      if (levelResult.leveledUp) {
        levelUp = {
          oldLevel: levelResult.oldLevel.level,
          newLevel: levelResult.newLevel.level,
          newTitle: levelResult.newLevel.title,
          newTitleEn: levelResult.newLevel.titleEn,
          isMilestone: levelResult.newLevel.isMilestone,
          phase: levelResult.newLevel.phase,
        };
      }
      newLevel = levelResult.newLevel;
    }

    // チェックOFF時はポイント減算
    if (!payload.checked && wasChecked) {
      // 最低1ポイント減算（0未満にはならない）
      pointsLost = Math.min(1, currentPoints);
      if (pointsLost > 0) {
        pointsWritePromise = userDoc.set(
          { totalPoints: FieldValue.increment(-pointsLost) },
          { merge: true }
        );
      }

      // レベルダウン判定
      const levelResult = checkLevelUp(currentPoints, currentPoints - pointsLost);
      newLevel = levelResult.newLevel;
      if (levelResult.oldLevel.level > levelResult.newLevel.level) {
        levelDown = {
          oldLevel: levelResult.oldLevel.level,
          newLevel: levelResult.newLevel.level,
          newTitle: levelResult.newLevel.title,
          newTitleEn: levelResult.newLevel.titleEn,
        };
      }
    }

    // 全ての書き込みを並列で実行
    const writePromises: Promise<unknown>[] = [checkWritePromise];
    if (hallOfFameWritePromise) writePromises.push(hallOfFameWritePromise);
    if (pointsWritePromise) writePromises.push(pointsWritePromise);
    await Promise.all(writePromises);

    return NextResponse.json({
      ok: true,
      streak,
      hallOfFameAt,
      pointsEarned,
      pointsLost,
      levelUp,
      levelDown,
      level: newLevel,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "チェックの保存に失敗しました。" },
      { status: 400 }
    );
  }
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
