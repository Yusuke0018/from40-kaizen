import { NextResponse } from "next/server";
import { z } from "zod";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";

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

    const { streak, hallOfFameAt } = await computeStreakAndHallOfFame(
      goalRef,
      payload.date
    );

    return NextResponse.json({
      ok: true,
      streak,
      hallOfFameAt,
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
) {
  const checksSnap = await goalRef
    .collection("checks")
    .where("date", "<=", dateKey)
    .orderBy("date", "desc")
    .limit(100)
    .get();

  const checkedDates = new Set(
    checksSnap.docs
      .map((doc) => doc.data() as { date?: string; checked?: boolean })
      .filter((item) => item.checked && item.date)
      .map((item) => item.date as string)
  );

  const streak = computeStreak(checkedDates, dateKey);

  const goalData = goalRef.get().then((snap) => snap.data() ?? {});
  const existingHall = (await goalData).hallOfFameAt as string | undefined | null;

  if (!existingHall && streak >= 90) {
    const hallOfFameAt = new Date().toISOString();
    await goalRef.set({ hallOfFameAt }, { merge: true });
    return { streak, hallOfFameAt };
  }

  return { streak, hallOfFameAt: existingHall ?? null };
}

function computeStreak(checkedDates: Set<string>, startDate: string) {
  let streak = 0;
  let cursor = startDate;
  while (checkedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
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
