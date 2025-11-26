"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal, GoalStats, CheckRecord } from "@/types/goal";
import { cn } from "@/lib/utils";
import {
  Calendar,
  TrendingUp,
  RotateCcw,
  Target,
  Clock,
  Flame,
  Trophy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Zap,
  Star,
} from "lucide-react";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(input: string | null | undefined) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatFullDate(input: string | null | undefined) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

type GoalWithHistory = Goal & {
  stats: GoalStats;
  checks: CheckRecord[];
};

const CARD_COLORS = [
  {
    gradient: "from-cyan-500 to-teal-500",
    light: "from-cyan-50 to-teal-50",
    ring: "ring-cyan-200/50",
    bg: "bg-cyan-500",
    text: "text-cyan-600",
  },
  {
    gradient: "from-emerald-500 to-green-500",
    light: "from-emerald-50 to-green-50",
    ring: "ring-emerald-200/50",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
  },
  {
    gradient: "from-sky-500 to-blue-500",
    light: "from-sky-50 to-blue-50",
    ring: "ring-sky-200/50",
    bg: "bg-sky-500",
    text: "text-sky-600",
  },
];

// モジュールレベルのキャッシュ
let cachedHistoryGoals: GoalWithHistory[] | null = null;
let historyCacheDate: string | null = null;

export default function HistoryPage() {
  const { user } = useAuthContext();

  const today = todayKey();
  const hasValidCache = cachedHistoryGoals !== null && historyCacheDate === today;

  const [goals, setGoals] = useState<GoalWithHistory[]>(hasValidCache ? cachedHistoryGoals! : []);
  const [loading, setLoading] = useState(!hasValidCache);
  const [error, setError] = useState<string | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // キャッシュが有効な場合はスキップ
    if (hasValidCache) {
      setLoading(false);
      return;
    }

    const loadGoals = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/goals?date=${today}&history=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load goals");
        }
        const data = (await res.json()) as GoalWithHistory[];
        setGoals(data);
        // キャッシュを更新
        cachedHistoryGoals = data;
        historyCacheDate = today;
      } catch (err) {
        console.error(err);
        setError("履歴の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void loadGoals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleExpand = (goalId: string) => {
    setExpandedGoalId((prev) => (prev === goalId ? null : goalId));
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400/15 to-sky-400/15 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">History</h2>
              <p className="text-xs text-slate-500">習慣の記録と統計</p>
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
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-teal-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && goals.length === 0 && (
        <section className="glass-card rounded-2xl border-2 border-dashed border-slate-200/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100">
            <BarChart3 className="h-7 w-7 text-teal-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            まだ習慣が登録されていません
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Habits画面から習慣を追加してください
          </p>
        </section>
      )}

      {/* Goal List */}
      {!loading &&
        goals.map((goal, index) => (
          <GoalHistoryCard
            key={goal.id}
            goal={goal}
            index={index}
            expanded={expandedGoalId === goal.id}
            onToggle={() => toggleExpand(goal.id)}
          />
        ))}

      {/* Rules Legend */}
      {!loading && goals.length > 0 && (
        <section className="glass-card rounded-xl p-4">
          <p className="mb-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
            ルール説明
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              <Zap className="h-3 w-3" />
              2日に1回以上で継続
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
              <RotateCcw className="h-3 w-3" />
              3日以上空くとリセット
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Trophy className="h-3 w-3" />
              90日達成で殿堂入り
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

function GoalHistoryCard({
  goal,
  index,
  expanded,
  onToggle,
}: {
  goal: GoalWithHistory;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stats = goal.stats;
  const checks = goal.checks || [];
  const progress = Math.min(90, stats?.progressToHallOfFame ?? 0);
  const colors = goal.isHallOfFame
    ? {
        gradient: "from-amber-400 to-yellow-500",
        light: "from-amber-50 to-yellow-50",
        ring: "ring-amber-200/50",
        bg: "bg-amber-500",
        text: "text-amber-600",
      }
    : CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className={cn(
        "glass-card overflow-hidden rounded-2xl transition-all",
        goal.isHallOfFame && "ring-2 ring-amber-200/50"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {goal.isHallOfFame && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
                <Trophy className="h-3.5 w-3.5 text-white" />
              </div>
            )}
            <h3 className="text-sm font-semibold text-slate-800">{goal.text}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatDate(goal.startDate)} 開始
          </p>

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-semibold text-slate-500">Progress</span>
              <span className="text-xs font-bold text-slate-600">
                {progress}
                <span className="font-medium text-slate-400">/90日</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100/80">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r transition-all",
                  colors.gradient
                )}
                style={{ width: `${(progress / 90) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className={cn(
          "ml-4 flex h-9 w-9 items-center justify-center rounded-lg transition-all",
          expanded ? "bg-slate-100" : "glass"
        )}>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-slate-100/50 p-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatCard
              icon={<Flame className="h-3.5 w-3.5" />}
              iconColor="text-orange-500"
              iconBg="bg-orange-50"
              label="現在の連続"
              value={`${stats?.currentStreak ?? 0}日`}
            />
            <StatCard
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-50"
              label="最長連続"
              value={`${stats?.longestStreak ?? 0}日`}
            />
            <StatCard
              icon={<Calendar className="h-3.5 w-3.5" />}
              iconColor="text-sky-500"
              iconBg="bg-sky-50"
              label="総チェック"
              value={`${stats?.totalChecks ?? 0}回`}
            />
            <StatCard
              icon={<Target className="h-3.5 w-3.5" />}
              iconColor="text-teal-500"
              iconBg="bg-teal-50"
              label="達成率"
              value={`${stats?.completionRate ?? 0}%`}
            />
            <StatCard
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              iconColor="text-rose-500"
              iconBg="bg-rose-50"
              label="リスタート"
              value={`${stats?.restartCount ?? 0}回`}
            />
            <StatCard
              icon={<Clock className="h-3.5 w-3.5" />}
              iconColor="text-slate-500"
              iconBg="bg-slate-50"
              label="平均間隔"
              value={`${stats?.averageInterval ?? 0}日`}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50/50 p-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">開始からの日数</span>
              <span className="font-semibold text-slate-700">
                {stats?.daysFromStart ?? 0}日
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">最後のチェック</span>
              <span className="font-semibold text-slate-700">
                {formatFullDate(stats?.lastCheckDate)}
              </span>
            </div>
            {goal.isHallOfFame && goal.hallOfFameAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-600">
                  <Trophy className="h-3 w-3" />
                  殿堂入り日
                </span>
                <span className="font-semibold text-amber-700">
                  {formatFullDate(goal.hallOfFameAt)}
                </span>
              </div>
            )}
          </div>

          {/* Calendar */}
          {checks.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                最近30日間のチェック
              </p>
              <CheckCalendar checks={checks} colors={colors} />
            </div>
          )}

          {/* Motivation Message */}
          {goal.comment && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-gradient-to-r from-teal-50/80 to-emerald-50/80 p-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-xs font-medium text-slate-700">
                {goal.comment}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/60 p-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-base font-bold text-slate-800">{value}</p>
    </div>
  );
}

function CheckCalendar({
  checks,
  colors,
}: {
  checks: CheckRecord[];
  colors: {
    gradient: string;
    bg: string;
  };
}) {
  const today = new Date();
  const days: { date: string; checked: boolean; dayOfWeek: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const checked = checks.some((c) => c.date === dateKey);
    days.push({ date: dateKey, checked, dayOfWeek: d.getDay() });
  }

  return (
    <div className="rounded-xl bg-slate-50/50 p-3">
      <div className="flex flex-wrap gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-[0.65rem] font-semibold transition-all",
              day.checked
                ? `bg-gradient-to-br ${colors.gradient} text-white shadow-sm`
                : day.dayOfWeek === 0 || day.dayOfWeek === 6
                ? "bg-slate-200/80 text-slate-500"
                : "bg-white/80 text-slate-400"
            )}
            title={day.date}
          >
            {parseInt(day.date.split("-")[2], 10)}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-4 text-[0.6rem] text-slate-500">
        <div className="flex items-center gap-1">
          <div className={cn("h-2.5 w-2.5 rounded bg-gradient-to-br", colors.gradient)} />
          <span>チェック済み</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded bg-white/80 ring-1 ring-slate-200" />
          <span>未チェック</span>
        </div>
      </div>
    </div>
  );
}
