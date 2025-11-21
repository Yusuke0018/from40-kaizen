import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyRequestUser } from "@/lib/auth/server-token";
import { todayKey } from "@/lib/date";

const defaultColumns = [
  "date",
  "weightKg",
  "sleepStart",
  "sleepEnd",
  "sleepHours",
  "avgSleepHr",
  "hrv",
  "moodMorning",
  "moodEvening",
  "sleepiness",
  "steps",
  "hydrationMl",
  "calories",
  "journal",
  "mealsNote",
  "meals",
  "emotionNote",
  "highlight",
  "challenge",
  "healthCheck",
  "workCheck",
  "familyCheck",
  "tradeOffs",
  "missNext",
  "tomorrowAction",
  "verdict",
  "photoUrls",
];

export async function GET(request: Request) {
  try {
    const user = await verifyRequestUser(request);
    const { searchParams } = new URL(request.url);
    const to = searchParams.get("to") ?? todayKey();
    const from =
      searchParams.get("from") ??
      daysAgo(to, Number(searchParams.get("range") ?? "6"));

    const columns =
      searchParams.get("columns")?.split(",").filter(Boolean) ?? defaultColumns;

    const snapshot = await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .collection("records")
      .where("date", ">=", from)
      .where("date", "<=", to)
      .orderBy("date", "asc")
      .get();

    const records = snapshot.docs.map((doc) => doc.data());
    const csv = buildCsv(columns, records);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="chronicle-${from}-${to}.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function buildCsv(columns: string[], rows: Record<string, unknown>[]) {
  const header = columns.map((col) => toSnakeCase(col)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => formatValue(col, (row as Record<string, unknown>)[col]))
      .join(",")
  );
  return [header, ...lines].join("\n");
}

function formatValue(column: string, value: unknown) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    if (column === "meals" && isMealList(value)) {
      const meals = value.map((meal) =>
        [
          meal.time ? `[${meal.time}]` : null,
          meal.note ?? "",
          meal.photoUrl ? meal.photoUrl : null,
        ]
          .filter(Boolean)
          .join(" ")
      );
      return escapeCsv(meals.join("|"));
    }

    if (column === "missNext" && isMissNextList(value)) {
      const pairs = value.map(
        (entry) => `MISS: ${entry.miss ?? ""} / NEXT: ${entry.next ?? ""}`.trim()
      );
      return escapeCsv(pairs.join("|"));
    }

    if (value.every((item) => typeof item === "string" || typeof item === "number")) {
      return escapeCsv(value.join("|"));
    }

    return escapeCsv(JSON.stringify(value));
  }

  if (typeof value === "object") {
    return escapeCsv(JSON.stringify(value));
  }

  return escapeCsv(String(value));
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function daysAgo(toDate: string, days: number) {
  const date = new Date(toDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

type MealValue = {
  time?: string;
  note?: string;
  photoUrl?: string;
};

function isMealList(value: unknown[]): value is MealValue[] {
  return value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      ("time" in item || "note" in item || "photoUrl" in item)
  );
}

type MissNextValue = {
  miss?: string;
  next?: string;
};

function isMissNextList(value: unknown[]): value is MissNextValue[] {
  return value.every(
    (item) =>
      item !== null &&
      typeof item === "object" &&
      ("miss" in item || "next" in item)
  );
}
