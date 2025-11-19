import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { goalSchema } from "@/lib/schemas/goal";

const collectionFor = (uid: string) =>
  getAdminDb().collection("users").doc(uid).collection("goals");

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const collection = collectionFor(user.uid);
    const snapshot = await collection.orderBy("startDate", "desc").get();
    const now = new Date();

    const goals = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((goal) => {
        const rawExpire = goal.expireAt;
        if (!rawExpire || typeof rawExpire !== "string") return true;
        const expireAt = new Date(rawExpire);
        if (Number.isNaN(expireAt.getTime())) return true;
        return expireAt > now;
      });

    return NextResponse.json(goals);
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

