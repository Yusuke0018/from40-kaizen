"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import { todayKey } from "@/lib/date";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Footprints,
  Moon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ranges = [
  { label: "7 Days", value: 6 },
  { label: "14 Days", value: 13 },
  { label: "30 Days", value: 29 },
  { label: "90 Days", value: 89 },
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
  const missNextHistory = useMemo(() => buildMissNextHistory(records), [records]);

  return (
    <div className="space-y-8 pb-20">
      {/* ヘッダー & レンジ選択 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Review
          </h2>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {ranges.map((option) => (
              <button
                key={option.value}
                onClick={() => setRange(option.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  range === option.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-500">
            {error}
          </p>
        )}
      </section>

      {/* ダイジェスト */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Avg Sleep"
          value={summary.avgSleepHours}
          unit="h"
          icon={<Moon className="h-4 w-4 text-indigo-500" />}
        />
        <SummaryCard
          label="Avg Mood"
          value={summary.avgMood}
          unit="/ 5"
          icon={<BrainCircuit className="h-4 w-4 text-mint-600" />}
        />
        <SummaryCard
          label="Avg Steps"
          value={summary.avgSteps.toLocaleString()}
          unit="steps"
          icon={<Footprints className="h-4 w-4 text-orange-500" />}
        />
        <SummaryCard
          label="Avg Sleep HRV"
          value={summary.avgHrv || "--"}
          unit="ms"
          icon={<Activity className="h-4 w-4 text-rose-500" />}
        />
      </section>

      {/* 相関インサイト */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Correlations
          </h3>
        </div>
        <div className="grid gap-3">
          {correlations.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-[var(--shadow-soft)]"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    "block text-xl font-bold",
                    item.value === "--"
                      ? "text-slate-300"
                      : Number(item.value) > 0.5
                      ? "text-mint-600"
                      : Number(item.value) < -0.5
                      ? "text-rose-500"
                      : "text-slate-700"
                  )}
                >
                  {item.value}
                </span>
                <span className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                  {item.trend || "No Data"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* しくじり / 修正履歴 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
            MISS / NEXT 履歴
          </h3>
        </div>
        <div className="space-y-3">
          {missNextHistory.map((item, index) => (
            <div
              key={`${item.date}-${index}`}
              className="rounded-2xl border border-rose-100 bg-white p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-rose-500">
                      MISS
                    </p>
                    <p className="text-sm text-slate-700">
                      {item.miss || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-mint-50 px-3 py-2">
                    <p className="text-[0.7rem] font-bold uppercase tracking-wider text-mint-600">
                      NEXT
                    </p>
                    <p className="text-sm font-semibold text-mint-800">
                      {item.next || "—"}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-rose-50 px-2 py-1 text-[0.7rem] font-bold text-rose-600">
                  {formatJapaneseDate(item.date)}
                </span>
              </div>
            </div>
          ))}
          {missNextHistory.length === 0 && (
            <p className="rounded-2xl border border-dashed border-rose-100 bg-white/80 p-4 text-center text-sm text-rose-500">
              まだ MISS / NEXT の記録がありません。Today で入力するとここに一覧表示されます。
            </p>
          )}
        </div>
      </section>

      {/* タイムライン */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Timeline
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {records.length} Records
          </span>
        </div>
        <div className="relative space-y-3">
          <div className="pointer-events-none absolute left-4 top-4 bottom-4 w-px bg-slate-100" />
          {records.map((record) => (
            <article key={record.date} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-100 bg-white shadow-sm">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      (record.moodEvening ?? record.moodMorning ?? 3) >= 4
                        ? "bg-mint-400"
                        : (record.moodEvening ?? record.moodMorning ?? 3) <= 2
                        ? "bg-slate-400"
                        : "bg-sky-400"
                    )}
                  />
                </div>
              </div>
              <div className="mb-2 flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-[var(--shadow-soft)]">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {formatJapaneseDate(record.date)}
                    </h4>
                    <p className="mt-0.5 text-xs font-medium text-slate-400">
                      {record.sleepStart
                        ? `睡眠 ${record.sleepStart} - ${record.sleepEnd ?? "--"}`
                        : "睡眠記録なし"}
                      {record.sleepHours != null && (
                        <>
                          <span className="mx-2">·</span>
                          {record.sleepHours}h
                        </>
                      )}
                    </p>
                  </div>
                  <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
                    Sleep HRV {record.hrv ?? "-"}
                  </span>
                </div>
                {(record.emotionNote || record.highlight) && (
                  <div className="mt-2 border-t border-slate-50 pt-2 text-sm leading-relaxed text-slate-600">
                    {record.emotionNote && <p>{record.emotionNote}</p>}
                    {record.highlight && (
                      <p className="mt-1 font-bold text-mint-700">
                        ✨ {record.highlight}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
          {records.length === 0 && !loading && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
              まだ記録がありません。Today画面から記録を追加してください。
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex h-32 flex-col justify-between rounded-2xl border border-slate-100/60 bg-white p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between">
        <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className="rounded-lg bg-slate-50 p-1.5">{icon}</div>
      </div>
      <div>
        <span className="block text-2xl font-bold tracking-tight text-slate-800">
          {value}
        </span>
        <span className="ml-1 text-xs font-bold text-slate-400">{unit}</span>
      </div>
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

function buildMissNextHistory(records: DailyRecord[]) {
  return records
    .flatMap((record) =>
      (record.missNext ?? []).map((entry) => ({
        date: record.date,
        miss: (entry.miss ?? "").trim(),
        next: (entry.next ?? "").trim(),
      }))
    )
    .filter((item) => item.miss || item.next)
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
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
  const focusMood = correlation(
    records.map((r) => r.concentrationEvening ?? 0),
    records.map((r) => r.moodEvening ?? r.moodMorning ?? 0)
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
      label: "集中力 × 気分",
      value: focusMood.value,
      trend: focusMood.trend,
      desc: "集中力の高まりが気分にどう響くかをチェック",
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
