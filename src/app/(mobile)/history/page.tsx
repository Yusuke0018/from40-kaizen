"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal, GoalStats, CheckRecord } from "@/types/goal";
import { cn } from "@/lib/utils";
import {
  Calendar,
  TrendingUp,
  Award,
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
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    light: "from-violet-50 to-purple-50",
    accent: "violet",
    border: "border-violet-200",
    bg: "bg-violet-500",
    text: "text-violet-600",
    ring: "ring-violet-200",
  },
  {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    light: "from-pink-50 to-rose-50",
    accent: "pink",
    border: "border-pink-200",
    bg: "bg-pink-500",
    text: "text-pink-600",
    ring: "ring-pink-200",
  },
  {
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    light: "from-cyan-50 to-sky-50",
    accent: "sky",
    border: "border-sky-200",
    bg: "bg-sky-500",
    text: "text-sky-600",
    ring: "ring-sky-200",
  },
];

export default function HistoryPage() {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<GoalWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${todayKey()}&history=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as GoalWithHistory[];
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError("履歴の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  }, [user, loadGoals]);

  const toggleExpand = (goalId: string) => {
    setExpandedGoalId((prev) => (prev === goalId ? null : goalId));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ヘッダー */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-yellow-400/20 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-yellow-300" />
            <h2 className="text-2xl font-extrabold tracking-tight">
              History
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium text-white/80">
            習慣の記録と統計を確認しましょう
          </p>
        </div>
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
        </div>
      )}

      {/* ローディング */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        </div>
      )}

      {/* 習慣がない場合 */}
      {!loading && goals.length === 0 && (
        <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            まだ習慣が登録されていません
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Habits画面から習慣を追加してください
          </p>
        </section>
      )}

      {/* 習慣リスト */}
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

      {/* 凡例 */}
      {!loading && goals.length > 0 && (
        <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 ring-1 ring-slate-200">
          <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
            ルール説明
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <Zap className="h-3 w-3" />
              2日に1回以上で継続
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
              <RotateCcw className="h-3 w-3" />
              3日以上空くとリセット
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
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
        gradient: "from-amber-400 via-yellow-500 to-orange-500",
        light: "from-amber-50 to-yellow-50",
        accent: "amber",
        border: "border-amber-300",
        bg: "bg-amber-500",
        text: "text-amber-600",
        ring: "ring-amber-300",
      }
    : CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl bg-white shadow-lg transition-all",
        goal.isHallOfFame ? "ring-2 ring-amber-300" : "ring-1 ring-slate-200"
      )}
    >
      {/* ヘッダー部分 */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {goal.isHallOfFame && (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            )}
            <h3 className="text-base font-bold text-slate-900">{goal.text}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatDate(goal.startDate)} 開始
          </p>

          {/* 進捗バー */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Progress</span>
              <span className="text-sm font-black text-slate-700">
                {progress}
                <span className="text-xs font-medium text-slate-400">/90日</span>
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
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
          "ml-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          expanded ? "bg-slate-100" : "bg-slate-50"
        )}>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* 展開部分 */}
      {expanded && (
        <div className="border-t border-slate-100 p-5">
          {/* 統計グリッド */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard
              icon={<Flame className="h-4 w-4" />}
              iconColor="text-orange-500"
              iconBg="bg-orange-100"
              label="現在の連続"
              value={`${stats?.currentStreak ?? 0}日`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              iconColor="text-emerald-500"
              iconBg="bg-emerald-100"
              label="最長連続"
              value={`${stats?.longestStreak ?? 0}日`}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4" />}
              iconColor="text-blue-500"
              iconBg="bg-blue-100"
              label="総チェック"
              value={`${stats?.totalChecks ?? 0}回`}
            />
            <StatCard
              icon={<Target className="h-4 w-4" />}
              iconColor="text-purple-500"
              iconBg="bg-purple-100"
              label="達成率"
              value={`${stats?.completionRate ?? 0}%`}
            />
            <StatCard
              icon={<RotateCcw className="h-4 w-4" />}
              iconColor="text-rose-500"
              iconBg="bg-rose-100"
              label="リスタート"
              value={`${stats?.restartCount ?? 0}回`}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              iconColor="text-slate-500"
              iconBg="bg-slate-100"
              label="平均間隔"
              value={`${stats?.averageInterval ?? 0}日`}
            />
          </div>

          {/* 追加情報 */}
          <div className="mt-4 space-y-2 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">開始からの日数</span>
              <span className="font-bold text-slate-700">
                {stats?.daysFromStart ?? 0}日
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">最後のチェック</span>
              <span className="font-bold text-slate-700">
                {formatFullDate(stats?.lastCheckDate)}
              </span>
            </div>
            {goal.isHallOfFame && goal.hallOfFameAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-600">
                  <Trophy className="h-3 w-3" />
                  殿堂入り日
                </span>
                <span className="font-bold text-amber-700">
                  {formatFullDate(goal.hallOfFameAt)}
                </span>
              </div>
            )}
          </div>

          {/* カレンダー表示 */}
          {checks.length > 0 && (
            <div className="mt-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <Calendar className="h-4 w-4" />
                最近30日間のチェック
              </p>
              <CheckCalendar checks={checks} colors={colors} />
            </div>
          )}

          {/* モチベーションメッセージ */}
          {goal.comment && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-mint-50 to-sky-50 p-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-mint-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
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
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-2 text-lg font-black text-slate-800">{value}</p>
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
  // 最近30日分を表示
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
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex flex-wrap gap-1.5">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all",
              day.checked
                ? `bg-gradient-to-br ${colors.gradient} text-white shadow-md`
                : day.dayOfWeek === 0 || day.dayOfWeek === 6
                ? "bg-slate-200 text-slate-500"
                : "bg-white text-slate-400 ring-1 ring-slate-200"
            )}
            title={day.date}
          >
            {parseInt(day.date.split("-")[2], 10)}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className={cn("h-3 w-3 rounded bg-gradient-to-br", colors.gradient)} />
          <span>チェック済み</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-white ring-1 ring-slate-200" />
          <span>未チェック</span>
        </div>
      </div>
    </div>
  );
}
