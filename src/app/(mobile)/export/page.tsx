"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import { todayKey } from "@/lib/date";

const columnOptions = [
  "date",
  "weightKg",
  "sleepStart",
  "sleepEnd",
  "sleepHours",
  "avgSleepHr",
  "hrv",
  "moodMorning",
  "moodEvening",
  "steps",
  "hydrationMl",
  "calories",
  "mealsNote",
  "emotionNote",
  "highlight",
  "challenge",
  "photoUrls",
];

export default function ExportPage() {
  const { user } = useAuthContext();
  const [fromDate, setFromDate] = useState(() => daysAgo(todayKey(), 13));
  const [toDate, setToDate] = useState(todayKey());
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "date",
    "weightKg",
    "sleepStart",
    "sleepEnd",
    "sleepHours",
    "moodMorning",
    "hrv",
  ]);
  const [preview, setPreview] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const url = `/api/records?from=${fromDate}&to=${toDate}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load preview");
      const data = (await res.json()) as DailyRecord[];
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError("プレビュー取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [user, fromDate, toDate]);

  useEffect(() => {
    if (!user) return;
    void fetchPreview();
  }, [user, fetchPreview]);

  async function handleDownload() {
    if (!user) return;
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        columns: selectedColumns.join(","),
      });
      const res = await fetch(`/api/records/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to export CSV");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chronicle-${fromDate}-${toDate}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("CSVの生成に失敗しました。");
    }
  }

  function toggleColumn(column: string) {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((item) => item !== column)
        : [...prev, column]
    );
  }

  return (
    <div className="space-y-6 pb-16 md:pb-10">
      {/* エクスポート設定（入力） */}
      <section className="rounded-3xl border border-mint-100/80 bg-gradient-to-r from-mint-50 to-sky-50 p-5 shadow-inner shadow-mint-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          CSV EXPORT
        </p>
        <h2 className="text-xl font-semibold">AIが読みやすい形式で出力</h2>
        <p className="text-sm text-slate-500">
          期間と列を指定して、1日1行のシンプルなCSVをダウンロードできます。
        </p>
        {error && <p className="pt-3 text-sm text-red-500">{error}</p>}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-sky-100/80">
        <form
          className="space-y-4 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void handleDownload();
          }}
        >
          <div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                期間
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                />
                <input
                  type="date"
                  max={todayKey()}
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                />
              </div>
            </label>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              列を選択
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {columnOptions.map((field) => (
                <label
                  key={field}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100/70 bg-slate-50/60 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(field)}
                    onChange={() => toggleColumn(field)}
                    className="h-4 w-4 rounded border-mint-400 text-mint-500"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    {field}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-mint-500 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/70 disabled:opacity-70"
            disabled={loading}
          >
            CSVをダウンロード
          </button>
        </form>
      </section>

      {/* プレビュー（結果の一部確認） */}
      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-mint-100/70">
        <div className="flex items-center justify-between text-sm">
          <div>
            <h3 className="text-lg font-semibold">プレビュー</h3>
            <p className="text-slate-500">エクスポートの一部を確認できます。</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {preview.length} 件
          </span>
        </div>
        {loading ? (
          <p className="pt-4 text-sm text-slate-500">読込中…</p>
        ) : (
          <div className="mt-4 space-y-3 text-xs text-slate-600">
            {preview.slice(0, 4).map((row) => (
              <div
                key={row.date}
                className="rounded-2xl border border-slate-100/80 bg-slate-50/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-700">{row.date}</p>
                  <p className="text-mint-600">Mood {row.moodEvening ?? "-"}</p>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <span>体重: {row.weightKg ?? "-"}kg</span>
                  <span>歩数: {row.steps?.toLocaleString() ?? "-"}</span>
                  <span>
                    睡眠: {row.sleepStart ?? "--"} - {row.sleepEnd ?? "--"}
                  </span>
                </div>
                <p className="mt-2 text-slate-500">
                  {row.emotionNote || row.highlight || row.mealsNote}
                </p>
              </div>
            ))}
            {preview.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                プレビューできるデータがまだありません。
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function daysAgo(toDate: string, days: number) {
  const date = new Date(toDate);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}
