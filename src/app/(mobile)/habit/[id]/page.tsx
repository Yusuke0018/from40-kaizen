"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { ArrowLeft, Trophy, Calendar, Flame, Target } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HabitHistory = {
  goalId: string;
  text: string;
  frequency: "daily" | "weekly";
  weeklyTarget?: number;
  startDate: string;
  endDate: string;
  hallOfFameAt: string | null;
  checks: { date: string; checked: boolean; createdAt: string }[];
  stats: {
    totalDaysChecked: number;
    currentStreak: number;
    longestStreak: number;
    currentWeekChecks?: number;
    weeklyTarget?: number;
  };
};

function formatDate(input: string | null | undefined) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export default function HabitHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuthContext();
  const [history, setHistory] = useState<HabitHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals/${id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load history");
      }
      const data = (await res.json()) as HabitHistory;
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError("履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    if (!user) return;
    void loadHistory();
  }, [user, loadHistory]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm font-medium text-slate-400">読み込み中...</p>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="space-y-4 pb-16">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-mint-600"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error ?? "データが見つかりません"}
        </p>
      </div>
    );
  }

  const checkedDatesSet = new Set(
    history.checks.filter((c) => c.checked).map((c) => c.date)
  );

  return (
    <div className="space-y-6 pb-16">
      {/* ヘッダー */}
      <section>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-mint-600"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
          {history.text}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {formatDate(history.startDate)} 〜 {formatDate(history.endDate)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
            {history.frequency === "weekly"
              ? `週${history.weeklyTarget}回`
              : "毎日"}
          </span>
          {history.hallOfFameAt && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-600">
              <Trophy className="h-3 w-3" />
              殿堂入り
            </span>
          )}
        </div>
      </section>

      {/* 統計 */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-500" />}
          label="現在の連続"
          value={`${history.stats.currentStreak}日`}
          sublabel={
            history.frequency === "weekly"
              ? `(${Math.floor(history.stats.currentStreak / 7)}週)`
              : undefined
          }
        />
        <StatCard
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
          label="最長連続"
          value={`${history.stats.longestStreak}日`}
          sublabel={
            history.frequency === "weekly"
              ? `(${Math.floor(history.stats.longestStreak / 7)}週)`
              : undefined
          }
        />
        <StatCard
          icon={<Calendar className="h-5 w-5 text-mint-500" />}
          label="総達成日数"
          value={`${history.stats.totalDaysChecked}日`}
        />
        <StatCard
          icon={<Target className="h-5 w-5 text-violet-500" />}
          label="殿堂入りまで"
          value={
            history.hallOfFameAt
              ? "達成済み"
              : `あと${Math.max(0, 90 - history.stats.currentStreak)}日`
          }
          highlight={!!history.hallOfFameAt}
        />
      </section>

      {/* 今週の進捗（週間習慣の場合） */}
      {history.frequency === "weekly" &&
        history.stats.currentWeekChecks !== undefined && (
          <section className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              今週の進捗
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-3 rounded-full transition-all",
                    history.stats.currentWeekChecks >=
                      (history.stats.weeklyTarget ?? 1)
                      ? "bg-mint-500"
                      : "bg-slate-400"
                  )}
                  style={{
                    width: `${Math.min(100, (history.stats.currentWeekChecks / (history.stats.weeklyTarget ?? 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-lg font-black text-slate-700">
                {history.stats.currentWeekChecks}/
                {history.stats.weeklyTarget ?? 1}
              </span>
            </div>
            {history.stats.currentWeekChecks >=
            (history.stats.weeklyTarget ?? 1) ? (
              <p className="mt-2 text-sm font-semibold text-mint-600">
                今週の目標達成！
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-slate-500">
                あと
                {(history.stats.weeklyTarget ?? 1) -
                  history.stats.currentWeekChecks}
                回で今週達成
              </p>
            )}
          </section>
        )}

      {/* カレンダー */}
      <section className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-lg">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
          達成履歴
        </p>
        <MonthlyCalendar
          checkedDates={checkedDatesSet}
          startDate={history.startDate}
        />
      </section>

      {/* 詳細履歴 */}
      <section className="rounded-2xl border-2 border-slate-200 bg-white p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          最近の記録 ({history.checks.length}件)
        </p>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {history.checks.slice(0, 30).map((check) => (
            <div
              key={check.date}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2",
                check.checked ? "bg-mint-50" : "bg-slate-50"
              )}
            >
              <span className="text-sm font-medium text-slate-700">
                {formatDate(check.date)}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  check.checked ? "text-mint-600" : "text-slate-400"
                )}
              >
                {check.checked ? "達成" : "未達成"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 p-4",
        highlight
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
      {sublabel && (
        <p className="text-xs font-medium text-slate-400">{sublabel}</p>
      )}
    </div>
  );
}

function MonthlyCalendar({
  checkedDates,
  startDate,
}: {
  checkedDates: Set<string>;
  startDate: string;
}) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => {
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  ).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const prevMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
    );
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          ←
        </button>
        <span className="text-sm font-bold text-slate-700">
          {viewMonth.getFullYear()}年{viewMonth.getMonth() + 1}月
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-50"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
          <div
            key={day}
            className="py-1 text-xs font-bold uppercase text-slate-400"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />;
          }
          const dateKey = formatDateKey(
            viewMonth.getFullYear(),
            viewMonth.getMonth(),
            day
          );
          const isChecked = checkedDates.has(dateKey);
          const isToday =
            today.getFullYear() === viewMonth.getFullYear() &&
            today.getMonth() === viewMonth.getMonth() &&
            today.getDate() === day;
          const isBeforeStart = dateKey < startDate;

          return (
            <div
              key={dateKey}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium mx-auto",
                isChecked && "bg-mint-500 text-white font-bold",
                !isChecked && !isBeforeStart && "text-slate-600",
                isBeforeStart && "text-slate-300",
                isToday && !isChecked && "ring-2 ring-mint-400"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-mint-500" />
          <span className="text-slate-500">達成</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full ring-2 ring-mint-400" />
          <span className="text-slate-500">今日</span>
        </div>
      </div>
    </div>
  );
}
