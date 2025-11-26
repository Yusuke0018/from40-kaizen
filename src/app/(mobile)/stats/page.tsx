"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { UserLevel } from "@/lib/level-system";
import { cn } from "@/lib/utils";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Crown,
  Flame,
  RotateCcw,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Award,
  Clock,
  Star,
  Users,
} from "lucide-react";
import type { StatsResponse } from "@/app/api/stats/route";
import { getCachedStats, setCachedStats, getCachedUserLevel, setCachedUserLevel } from "@/lib/cache-store";

export default function StatsPage() {
  const { user } = useAuthContext();

  // グローバルキャッシュから初期値を取得
  const initialStats = getCachedStats<StatsResponse>();
  const initialLevel = getCachedUserLevel();

  const [stats, setStats] = useState<StatsResponse | null>(initialStats);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(initialLevel);
  const [loading, setLoading] = useState(initialStats === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // キャッシュが有効な場合はスキップ
    if (initialStats !== null) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();

        const [statsRes, levelRes] = await Promise.all([
          fetch("/api/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/user/level", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) {
          const statsData = (await statsRes.json()) as StatsResponse;
          setStats(statsData);
          setCachedStats(statsData);
        }

        if (levelRes.ok) {
          const levelData = (await levelRes.json()) as UserLevel;
          setUserLevel(levelData);
          setCachedUserLevel(levelData);
        }
      } catch (err) {
        console.error(err);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-purple-400/15 to-indigo-400/15 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Stats</h2>
              <p className="text-xs text-slate-500">詳細な統計情報</p>
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
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-indigo-500" />
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Level Summary Card */}
          {userLevel && (
            <section className="glass-card relative overflow-hidden rounded-2xl p-5">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400/15 to-yellow-400/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                      <Crown className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                        現在のレベル
                      </p>
                      <p className="text-2xl font-black gradient-text-gold">LV.{userLevel.level}</p>
                      <p className="text-sm font-bold text-slate-700">{userLevel.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black gradient-text-gold">{userLevel.totalPoints}</p>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                      TOTAL PT
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-50/50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-600">{userLevel.phase}</p>
                </div>
              </div>
            </section>
          )}

          {/* Main Stats Grid */}
          <section className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconGradient="from-emerald-500 to-green-500"
              iconBg="bg-emerald-50"
              label="総チェック回数"
              value={stats.overall.totalChecks}
              unit="回"
            />
            <StatCard
              icon={<Flame className="h-5 w-5" />}
              iconGradient="from-orange-500 to-red-500"
              iconBg="bg-orange-50"
              label="平均継続日数"
              value={stats.overall.averageStreakDays}
              unit="日"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              iconGradient="from-cyan-500 to-blue-500"
              iconBg="bg-cyan-50"
              label="最長継続記録"
              value={stats.overall.longestStreakEver}
              unit="日"
              highlight
            />
            <StatCard
              icon={<RotateCcw className="h-5 w-5" />}
              iconGradient="from-rose-500 to-pink-500"
              iconBg="bg-rose-50"
              label="復帰回数"
              value={stats.overall.totalRestarts}
              unit="回"
            />
          </section>

          {/* Overall Completion Rate */}
          <section className="glass-card relative overflow-hidden rounded-2xl p-5">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/10 to-violet-400/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-indigo-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  全体達成率
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-black gradient-text-indigo">
                    {stats.overall.overallCompletionRate}%
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {stats.overall.totalChecks} チェック / {stats.overall.totalDaysTracked} 日
                  </p>
                </div>
                <div className="relative h-24 w-24">
                  <svg className="h-24 w-24 -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      fill="none"
                      stroke="url(#indigoGradient)"
                      strokeWidth="10"
                      strokeDasharray={`${stats.overall.overallCompletionRate * 2.64} 264`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Habits Overview */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                習慣の状態
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700">アクティブ</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {stats.overall.activeHabitsCount}
                </p>
                <p className="text-xs text-slate-500">個の習慣</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700">殿堂入り</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {stats.overall.hallOfFameCount}
                </p>
                <p className="text-xs text-slate-500">個の習慣</p>
              </div>
            </div>
          </section>

          {/* Best Habit This Week */}
          {stats.bestHabitThisWeek && (
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  今週のベスト習慣
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{stats.bestHabitThisWeek.goalText}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Flame className="h-3 w-3" />
                        {stats.bestHabitThisWeek.currentStreak}日連続
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <Target className="h-3 w-3" />
                        達成率 {stats.bestHabitThisWeek.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Best Habit Overall */}
          {stats.bestHabitOverall && (
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  最も継続している習慣
                </p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{stats.bestHabitOverall.goalText}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <Calendar className="h-3 w-3" />
                        総チェック {stats.bestHabitOverall.totalChecks}回
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <Flame className="h-3 w-3" />
                        連続 {stats.bestHabitOverall.currentStreak}日
                      </span>
                    </div>
                  </div>
                  {stats.bestHabitOverall.isHallOfFame ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Tracking Info */}
          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                トラッキング期間
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-400 to-slate-500">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">合計日数</p>
                  <p className="text-xs text-slate-500">習慣を記録した日数</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {stats.overall.totalDaysTracked}
                <span className="text-sm font-medium text-slate-500">日</span>
              </p>
            </div>
          </section>

          {/* Empty State */}
          {stats.overall.totalChecks === 0 && (
            <section className="glass-card rounded-2xl border-2 border-dashed border-slate-200/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
                <Activity className="h-7 w-7 text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                まだデータがありません
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                習慣をチェックして統計を積み重ねましょう
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconGradient,
  iconBg,
  label,
  value,
  unit,
  highlight,
}: {
  icon: React.ReactNode;
  iconGradient: string;
  iconBg: string;
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-4 transition-all",
        highlight && "ring-2 ring-cyan-200/50"
      )}
    >
      {highlight && (
        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-xl" />
      )}
      <div className="relative">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <div className={cn("bg-gradient-to-br bg-clip-text text-transparent", iconGradient)}>
            {icon}
          </div>
        </div>
        <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-800">
          {value}
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        </p>
      </div>
    </div>
  );
}
