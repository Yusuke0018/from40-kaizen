"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import { todayKey } from "@/lib/date";

const ranges = [
  { label: "7日", value: 6 },
  { label: "14日", value: 13 },
  { label: "30日", value: 29 },
  { label: "90日", value: 89 },
];

export default function HistoryPage() {
  const { user } = useAuthContext();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [range, setRange] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(
    async (rangeDays: number, showSpinner = true) => {
      if (!user) return;
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/records?range=${rangeDays}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch records");
        const data = (await res.json()) as DailyRecord[];
        setRecords(data);
      } catch (err) {
        console.error(err);
        setError("データの取得に失敗しました。");
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    void loadRecords(range);
  }, [user, range, loadRecords]);

  const summary = useMemo(() => summarize(records), [records]);
  const correlations = useMemo(() => buildCorrelations(records), [records]);

  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-3xl border border-sky-100/70 bg-gradient-to-r from-sky-50 to-mint-50 p-5 shadow-inner shadow-sky-100/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              REVIEW MODE
            </p>
            <h2 className="text-xl font-semibold">過去の記録を俯瞰</h2>
          </div>
          <button
            className="text-xs font-semibold text-sky-600"
            disabled={loading}
            onClick={() => loadRecords(range, false)}
          >
            {loading ? "更新中…" : "最新"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {ranges.map((option) => (
            <button
              key={option.value}
              onClick={() => setRange(option.value)}
              className={`rounded-full px-4 py-1 text-sm font-semibold ${
                range === option.value
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-200/60"
                  : "border border-white/60 bg-white/80 text-slate-500 shadow-sm"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {error && <p className="pt-3 text-sm text-red-500">{error}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ダイジェスト</h3>
          <span className="text-xs font-semibold text-mint-600">
            {summary.rangeLabel}
          </span>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-100/70">
          <p className="text-sm text-slate-500">
            平均睡眠は{" "}
            <strong className="text-mint-700">{summary.avgSleepHours}h</strong>、
            気分スコアは{" "}
            <strong className="text-mint-700">{summary.avgMood}</strong>でした。
            歩数は平均{" "}
            <strong className="text-mint-700">
              {summary.avgSteps.toLocaleString()}歩
            </strong>
            、平均HRVは{" "}
            <strong className="text-mint-700">
              {summary.avgHrv ? `${summary.avgHrv}ms` : "--"}
            </strong>
            です。
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-mint-50/80 px-4 py-2">
              <span className="font-semibold text-slate-600">記録日数</span>
              <span className="text-mint-700">{summary.days}日</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-sky-50/80 px-4 py-2">
              <span className="font-semibold text-slate-600">
                睡眠アラート ({"<"}5h)
              </span>
              <span className="text-sky-700">{summary.sleepAlerts}日</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">タイムライン</h3>
          <span className="text-xs text-slate-500">
            最新 {records.length} / {range + 1}日
          </span>
        </div>
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.date}
              className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-100/80"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {formatJapaneseDate(record.date)}
                  </p>
                  <p className="text-xs text-slate-400">
                    睡眠 {record.sleepStart ?? "--"} - {record.sleepEnd ?? "--"}
                  </p>
                </div>
                <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-700">
                  Mood {record.moodEvening ?? record.moodMorning ?? "-"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  睡眠 {record.sleepHours ?? "-"}h
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  歩数 {record.steps?.toLocaleString() ?? "-"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  水分 {record.hydrationMl ?? "-"}ml
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  HRV {record.hrv != null ? `${record.hrv}ms` : "-"}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {record.emotionNote || record.highlight || record.journal || "メモなし"}
              </p>
            </article>
          ))}
          {records.length === 0 && !loading && (
            <p className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
              まだ記録がありません。Today画面から記録を追加してください。
            </p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-200/60">
        <h3 className="text-lg font-semibold">関連性のヒント</h3>
        <p className="text-sm text-slate-500">
          CSVでの分析前に、気になる相関をピックアップ。
        </p>
        <div className="mt-4 space-y-3">
          {correlations.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100/70 bg-slate-50/70 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.label}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {item.value}
                </span>
                <span className="text-xs font-semibold text-mint-600">
                  {item.trend}
                </span>
              </div>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function summarize(records: DailyRecord[]) {
  if (!records.length) {
    return {
      avgSleepHours: 0,
      avgMood: 0,
      avgSteps: 0,
      avgHrv: 0,
      days: 0,
      sleepAlerts: 0,
      rangeLabel: `~ ${todayKey()}`,
    };
  }
  const sleep = avg(records.map((r) => r.sleepHours ?? 0));
  const mood = avg(records.map((r) => r.moodEvening ?? r.moodMorning ?? 0));
  const steps = avg(records.map((r) => r.steps ?? 0));
   const hrvValues = records
     .map((r) => r.hrv)
     .filter((value): value is number => value != null);
   const hrv = hrvValues.length ? avg(hrvValues) : 0;
  const alerts = records.filter((r) => (r.sleepHours ?? 24) < 5).length;
  const first = records[records.length - 1];
  const last = records[0];

  return {
    avgSleepHours: sleep.toFixed(2),
    avgMood: mood.toFixed(2),
    avgSteps: Math.round(steps),
    avgHrv: Math.round(hrv),
    days: records.length,
    sleepAlerts: alerts,
    rangeLabel: `${first.date} ~ ${last.date}`,
  };
}

function buildCorrelations(records: DailyRecord[]) {
  if (records.length < 2) {
    return [
      { label: "十分なデータがありません", value: "--", trend: "", desc: "" },
    ];
  }
  const sleepMood = correlation(
    records.map((r) => r.sleepHours ?? 0),
    records.map((r) => r.moodEvening ?? r.moodMorning ?? 0)
  );
  const caffeineMood = correlation(
    records.map((r) => r.hydrationMl ?? 0),
    records.map((r) => r.sleepiness ?? 0)
  );
  const hrvMood = correlation(
    records.map((r) => r.hrv ?? 0),
    records.map((r) => r.moodEvening ?? r.moodMorning ?? 0)
  );
  return [
    {
      label: "睡眠 × 気分",
      value: sleepMood.value,
      trend: sleepMood.trend,
      desc: "睡眠が長いほど気分スコアが高い傾向",
    },
    {
      label: "水分 × 眠気",
      value: caffeineMood.value,
      trend: caffeineMood.trend,
      desc: "水分補給が眠気をどう変えるかをチェック",
    },
    {
      label: "HRV × 気分",
      value: hrvMood.value,
      trend: hrvMood.trend,
      desc: "自律神経バランスと主観的な気分の関係",
    },
  ];
}

function correlation(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  const sliceX = xs.slice(0, n);
  const sliceY = ys.slice(0, n);
  const meanX = avg(sliceX);
  const meanY = avg(sliceY);
  const numerator = sliceX.reduce(
    (sum, x, idx) => sum + (x - meanX) * (sliceY[idx] - meanY),
    0
  );
  const denominator =
    Math.sqrt(
      sliceX.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0) *
        sliceY.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0)
    ) || 1;
  const value = numerator / denominator;
  const rounded = Number.isFinite(value) ? value.toFixed(2) : "--";
  return {
    value: rounded,
    trend:
      typeof value === "number"
        ? value > 0
          ? "Positive"
          : value < 0
          ? "Negative"
          : "Neutral"
        : "",
  };
}

function avg(values: number[]) {
  if (!values.length) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function formatJapaneseDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
