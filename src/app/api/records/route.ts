import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { z } from "zod";
import { dailyRecordSchema } from "@/lib/schemas/daily-record";
import { calcSleepHours, todayKey } from "@/lib/date";

const collectionFor = (uid: string) =>
  adminDb.collection("users").doc(uid).collection("records");

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const collection = collectionFor(user.uid);

    if (dateParam) {
      const doc = await collection.doc(dateParam).get();
      if (!doc.exists) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
      }
      return NextResponse.json(doc.data());
    }

    const to = searchParams.get("to") ?? todayKey();
    const from =
      searchParams.get("from") ??
      daysAgo(to, Number(searchParams.get("range") ?? "6"));

    const snapshot = await collection
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "desc")
      .get();

    const records = snapshot.docs.map((doc) => doc.data());
    return NextResponse.json(records);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const payload = await request.json();
    const parsed = dailyRecordSchema
      .extend({ date: z.string().min(1) })
      .parse(payload);

    const collection = collectionFor(user.uid);
    const docRef = collection.doc(parsed.date);
    const existing = await docRef.get();
    const timestamp = new Date().toISOString();

    const record = {
      ...parsed,
      sleepHours:
        parsed.sleepHours ??
        calcSleepHours(parsed.date, parsed.sleepStart, parsed.sleepEnd),
      photoUrls: parsed.photoUrls ?? [],
      createdAt: existing.exists ? existing.data()?.createdAt : timestamp,
      updatedAt: timestamp,
    };

    await docRef.set(record, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 400 });
  }
}

function daysAgo(toDate: string, days: number) {
  const date = new Date(toDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
