"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { getCachedStats, setCachedStats } from "@/lib/cache-store";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Star,
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  Crown,
} from "lucide-react";
import type { StatsResponse } from "@/app/api/stats/route";

type ViewMode = "weekly" | "monthly";

export default function SummaryPage() {
  const { user } = useAuthContext();

  // グローバルキャッシュから初期値を取得
  const initialStats = getCachedStats<StatsResponse>();

  const [stats, setStats] = useState<StatsResponse | null>(initialStats);
  const [loading, setLoading] = useState(initialStats === null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!user) return;

    // キャッシュが有効な場合はスキップ
    if (initialStats !== null) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load stats");
        }
        const data = (await res.json()) as StatsResponse;
        setStats(data);
        setCachedStats(data);
      } catch (err) {
        console.error(err);
        setError("統計データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const currentData = viewMode === "weekly" ? stats?.weekly : stats?.monthly;
  const maxIndex = currentData ? currentData.length - 1 : 0;

  const handlePrev = () => {
    setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  };

  const selectedPeriod = currentData?.[selectedIndex];

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-violet-400/15 to-purple-400/15 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Summary</h2>
              <p className="text-xs text-slate-500">週間・月間のサマリー</p>
            </div>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="glass-card rounded-xl border border-rose-200/50 bg-rose-50/50 px-4 py-3">
          <p className="text-sm font-medium text-rose-600">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-purple-500" />
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Best Habit This Week */}
          {stats.bestHabitThisWeek && (
            <section className="glass-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 p-5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-400/20 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
                    <Award className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                    This Week&apos;s Best
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-800">
                      {stats.bestHabitThisWeek.goalText}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <Flame className="h-3.5 w-3.5" />
                        {stats.bestHabitThisWeek.currentStreak}日連続
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        達成率 {stats.bestHabitThisWeek.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30">
                    <Crown className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* View Mode Toggle */}
          <section className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode("weekly");
                setSelectedIndex(0);
              }}
              className={cn(
                "glass-card flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                viewMode === "weekly"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-slate-500 hover:bg-white/80"
              )}
            >
              <Calendar className="h-4 w-4" />
              週間
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("monthly");
                setSelectedIndex(0);
              }}
              className={cn(
                "glass-card flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                viewMode === "monthly"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-slate-500 hover:bg-white/80"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              月間
            </button>
          </section>

          {/* Period Navigation */}
          {selectedPeriod && (
            <section className="flex items-center justify-between px-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={selectedIndex >= maxIndex}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                  selectedIndex >= maxIndex
                    ? "text-slate-300"
                    : "glass text-slate-600 hover:bg-white/80"
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800">
                  {viewMode === "weekly"
                    ? `${formatDateShort((selectedPeriod as { weekStart: string; weekEnd: string }).weekStart)} - ${formatDateShort((selectedPeriod as { weekStart: string; weekEnd: string }).weekEnd)}`
                    : (selectedPeriod as { month: string }).month}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedIndex === 0
                    ? viewMode === "weekly"
                      ? "今週"
                      : "今月"
                    : viewMode === "weekly"
                    ? `${selectedIndex}週間前`
                    : `${selectedIndex}ヶ月前`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedIndex <= 0}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-all",
                  selectedIndex <= 0
                    ? "text-slate-300"
                    : "glass text-slate-600 hover:bg-white/80"
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </section>
          )}

          {/* Completion Rate Card */}
          {selectedPeriod && (
            <section className="glass-card relative overflow-hidden rounded-2xl p-5">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-purple-400/10 to-pink-400/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      達成率
                    </p>
                    <p className="mt-2 text-4xl font-bold gradient-text-purple">
                      {selectedPeriod.completionRate}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedPeriod.totalChecks} / {selectedPeriod.possibleChecks} チェック
                    </p>
                  </div>
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="url(#purpleGradient)"
                        strokeWidth="8"
                        strokeDasharray={`${selectedPeriod.completionRate * 2.26} 226`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Weekly Bar Chart */}
          {viewMode === "weekly" && stats.weekly.length > 0 && (
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  週間推移
                </p>
              </div>
              <div className="flex items-end justify-between gap-1 h-24">
                {[...stats.weekly].reverse().map((week, index) => {
                  const isSelected = index === stats.weekly.length - 1 - selectedIndex;
                  return (
                    <button
                      key={week.weekStart}
                      type="button"
                      onClick={() => setSelectedIndex(stats.weekly.length - 1 - index)}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all",
                          isSelected
                            ? "bg-gradient-to-t from-purple-500 to-pink-500"
                            : "bg-slate-200 group-hover:bg-slate-300"
                        )}
                        style={{
                          height: `${Math.max(8, week.completionRate * 0.96)}px`,
                        }}
                      />
                      <span
                        className={cn(
                          "text-[0.6rem] font-semibold",
                          isSelected ? "text-purple-600" : "text-slate-400"
                        )}
                      >
                        {index === stats.weekly.length - 1 ? "今週" : `${stats.weekly.length - 1 - index}w前`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Habit Breakdown */}
          {selectedPeriod && selectedPeriod.habitBreakdown.length > 0 && (
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  習慣別達成率
                </p>
              </div>
              <div className="space-y-3">
                {selectedPeriod.habitBreakdown.map((habit, index) => (
                  <HabitBreakdownCard key={habit.goalId} habit={habit} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Overall Best Habit */}
          {stats.bestHabitOverall && (
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  最も継続できている習慣
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 p-4">
                <p className="font-bold text-slate-800">
                  {stats.bestHabitOverall.goalText}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/60 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Calendar className="h-3 w-3" />
                    総チェック {stats.bestHabitOverall.totalChecks}回
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/60 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Flame className="h-3 w-3" />
                    連続 {stats.bestHabitOverall.currentStreak}日
                  </span>
                  {stats.bestHabitOverall.isHallOfFame && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <Trophy className="h-3 w-3" />
                      殿堂入り
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {(!selectedPeriod || selectedPeriod.habitBreakdown.length === 0) && (
            <section className="glass-card rounded-2xl border-2 border-dashed border-slate-200/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
                <BarChart3 className="h-7 w-7 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                この期間のデータがありません
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                習慣をチェックして記録を積み重ねましょう
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

const CARD_COLORS = [
  { gradient: "from-purple-500 to-pink-500", bg: "bg-purple-100", text: "text-purple-700" },
  { gradient: "from-cyan-500 to-teal-500", bg: "bg-cyan-100", text: "text-cyan-700" },
  { gradient: "from-amber-500 to-orange-500", bg: "bg-amber-100", text: "text-amber-700" },
];

function HabitBreakdownCard({
  habit,
  index,
}: {
  habit: {
    goalId: string;
    goalText: string;
    checks: number;
    possibleDays: number;
    rate: number;
  };
  index: number;
}) {
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div className="rounded-xl bg-white/60 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">{habit.goalText}</p>
        <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", colors.bg, colors.text)}>
          {habit.rate}%
        </span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all", colors.gradient)}
            style={{ width: `${habit.rate}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {habit.checks} / {habit.possibleDays} チェック
        </p>
      </div>
    </div>
  );
}

function formatDateShort(dateKey: string): string {
  const date = new Date(dateKey);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}
