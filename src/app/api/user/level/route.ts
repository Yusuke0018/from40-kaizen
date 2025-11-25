import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { calculateLevel } from "@/lib/level-system";

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const userDoc = getAdminDb().collection("users").doc(user.uid);
    const userSnap = await userDoc.get();

    const totalPoints = (userSnap.data()?.totalPoints as number) || 0;
    const levelInfo = calculateLevel(totalPoints);

    return NextResponse.json(levelInfo);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "レベル情報の取得に失敗しました。" },
      { status: 400 }
    );
  }
}
