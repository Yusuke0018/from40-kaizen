import { NextResponse } from "next/server";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { goalSchema, type GoalInput } from "@/lib/schemas/goal";
import { todayKey } from "@/lib/date";

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const collection = collectionFor(user.uid);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") ?? todayKey();
    const limitParam = Number(searchParams.get("limit") ?? "0");

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
        const stats = await buildHabitStats(collection.doc(id), dateParam);
        return {
          id,
          ...data,
          ...stats,
          hallOfFameAt: data.hallOfFameAt ?? null,
          isHallOfFame: Boolean(data.hallOfFameAt),
        };
      })
    );

    const activeHabits = enriched.filter((goal) => !goal.isHallOfFame);
    const limited =
      limitParam > 0 ? activeHabits.slice(0, limitParam) : activeHabits;
    const hallOfFame = enriched.filter((goal) => goal.isHallOfFame);

    return NextResponse.json([...limited, ...hallOfFame]);
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
      .omit({ expireAt: true, createdAt: true })
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

    const timestamp = new Date().toISOString();

    const collection = collectionFor(user.uid);
    const docRef = await collection.add({
      text: parsed.text,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      expireAt: expire.toISOString(),
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

async function buildHabitStats(goalRef: DocumentReference, dateKey: string) {
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

  const checkedToday = checkedDates.has(dateKey);
  const streak = computeStreak(checkedDates, dateKey);

  return {
    checkedToday,
    streak,
  };
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
