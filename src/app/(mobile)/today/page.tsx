"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { cn } from "@/lib/utils";
import { AlertTriangle, MessageCircle, Sparkles, Trophy, Zap, Star, Flame, Moon, ChevronLeft, ChevronRight, Check } from "lucide-react";

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayKey() {
  return getDateKey(new Date());
}

function yesterdayKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
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

function formatDateWithWeekday(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const formatted = new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
  }).format(date);
  return `${formatted} (${weekday})`;
}

type GoalWithYesterday = Goal & {
  checkedYesterday?: boolean;
};

export default function TodayPage() {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<GoalWithYesterday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitLoading, setHabitLoading] = useState<Record<string, boolean>>({});
  const [showComment, setShowComment] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<"today" | "yesterday">("today");

  const currentDateKey = selectedDate === "today" ? todayKey() : yesterdayKey();

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${todayKey()}&includeYesterday=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as GoalWithYesterday[];
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError("習慣の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  }, [user, loadGoals]);

  const handleHabitCheck = useCallback(
    async (goalId: string, nextChecked: boolean, dateKey: string) => {
      if (!user) return;
      if (habitLoading[goalId]) return;
      setError(null);
      setHabitLoading((prev) => ({ ...prev, [goalId]: true }));

      const isToday = dateKey === todayKey();
      const checkField = isToday ? "checkedToday" : "checkedYesterday";

      let previousChecked = false;
      setGoals((prev) =>
        prev.map((habit) => {
          if (habit.id === goalId) {
            previousChecked = (isToday ? habit.checkedToday : habit.checkedYesterday) ?? false;
            return { ...habit, [checkField]: nextChecked };
          }
          return habit;
        })
      );

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/goals/check", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalId,
            date: dateKey,
            checked: nextChecked,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = (await res.json()) as {
          streak?: number;
          hallOfFameAt?: string | null;
          comment?: string;
        };

        setGoals((prev) =>
          prev.map((habit) =>
            habit.id === goalId
              ? {
                  ...habit,
                  [checkField]: nextChecked,
                  streak: data.streak ?? habit.streak ?? 0,
                  hallOfFameAt: data.hallOfFameAt ?? habit.hallOfFameAt ?? null,
                  isHallOfFame: Boolean(data.hallOfFameAt ?? habit.hallOfFameAt),
                  comment: data.comment ?? habit.comment,
                }
              : habit
          )
        );

        if (nextChecked && data.comment) {
          setShowComment(data.comment);
          setTimeout(() => setShowComment(null), 4000);
        }
      } catch (err) {
        console.error(err);
        setError("チェックの更新に失敗しました。");
        setGoals((prev) =>
          prev.map((habit) =>
            habit.id === goalId ? { ...habit, [checkField]: previousChecked } : habit
          )
        );
      }
      setHabitLoading((prev) => {
        const copy = { ...prev };
        delete copy[goalId];
        return copy;
      });
    },
    [user, habitLoading]
  );

  const activeHabits = goals.filter((g) => !g.isHallOfFame);
  const hallOfFameHabits = goals.filter((g) => g.isHallOfFame);
  const isToday = selectedDate === "today";
  const completedCount = activeHabits.filter((h) =>
    isToday ? h.checkedToday : h.checkedYesterday
  ).length;

  return (
    <div className="space-y-5 pb-20">
      {/* Comment Popup */}
      {showComment && (
        <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md">
          <div className="glass-card animate-float rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <p className="flex-1 text-sm font-semibold text-slate-700">{showComment}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Card */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            {isToday ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-600">
                <Moon className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isToday ? "Today's Habits" : "昨日の習慣"}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDateWithWeekday(currentDateKey)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Date Toggle */}
      <section className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDate("yesterday")}
          className={cn(
            "glass-card flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            selectedDate === "yesterday"
              ? "bg-slate-700/90 text-white"
              : "text-slate-500 hover:bg-white/80"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <Moon className="h-4 w-4" />
          昨日
        </button>
        <button
          type="button"
          onClick={() => setSelectedDate("today")}
          className={cn(
            "glass-card flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            selectedDate === "today"
              ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
              : "text-slate-500 hover:bg-white/80"
          )}
        >
          <Sparkles className="h-4 w-4" />
          今日
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      {/* Yesterday Notice */}
      {selectedDate === "yesterday" && (
        <section className="glass-card rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <Moon className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">寝る前の習慣を翌日に記録</p>
              <p className="mt-0.5 text-xs text-slate-500">
                昨晩の習慣をまだチェックしていない場合はここで記録できます
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Progress Summary */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-teal-400/10 to-emerald-400/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isToday ? "Today's Progress" : "Yesterday's Progress"}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              <span className="gradient-text-primary">{completedCount}</span>
              <span className="mx-1 text-slate-300">/</span>
              <span className="text-slate-600">{activeHabits.length}</span>
            </p>
          </div>
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold transition-all",
            completedCount === activeHabits.length && activeHabits.length > 0
              ? "bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-lg"
              : "glass text-slate-500"
          )}>
            {activeHabits.length > 0
              ? `${Math.round((completedCount / activeHabits.length) * 100)}%`
              : "-"}
          </div>
        </div>
        {completedCount === activeHabits.length && activeHabits.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-2.5">
            <Star className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-semibold text-teal-700">
              {isToday ? "今日の習慣をすべて達成しました！" : "昨日の習慣をすべて記録しました！"}
            </p>
          </div>
        )}
      </section>

      {/* Rules */}
      <section className="glass-card rounded-xl p-4">
        <p className="mb-2.5 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
          ルール
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
            <Zap className="h-3 w-3" />
            2日に1回以上で継続
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
            <AlertTriangle className="h-3 w-3" />
            3日以上空くとリセット
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Trophy className="h-3 w-3" />
            90日達成で殿堂入り
          </span>
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
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-cyan-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && activeHabits.length === 0 && (
        <section className="glass-card rounded-2xl border-2 border-dashed border-slate-200/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100">
            <Sparkles className="h-7 w-7 text-cyan-600" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            まだ習慣が登録されていません
          </p>
          <p className="mt-1.5 text-xs text-slate-400">
            Habits画面から習慣を追加してください（最大3つ）
          </p>
        </section>
      )}

      {/* Habit List */}
      {!loading && activeHabits.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className={cn(
              "h-1.5 w-1.5 rounded-full",
              isToday ? "bg-cyan-500" : "bg-slate-400"
            )} />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Habits
            </p>
            <span className={cn(
              "rounded-md px-2 py-0.5 text-xs font-semibold",
              isToday ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"
            )}>
              {activeHabits.length}/3
            </span>
          </div>
          {activeHabits.map((habit, index) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={index}
              isToday={isToday}
              currentDateKey={currentDateKey}
              onToggle={handleHabitCheck}
              loading={habitLoading[habit.id]}
            />
          ))}
        </section>
      )}

      {/* Hall of Fame */}
      {hallOfFameHabits.length > 0 && (
        <section className="glass-card space-y-3 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Hall of Fame
            </p>
          </div>
          <div className="space-y-2">
            {hallOfFameHabits.map((habit) => (
              <div
                key={`hof-${habit.id}`}
                className="flex items-center gap-3 rounded-xl bg-white/60 p-3 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-amber-800">{habit.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const CARD_COLORS = [
  {
    gradient: "from-cyan-500 to-teal-500",
    light: "from-cyan-50/50 to-teal-50/50",
    ring: "ring-cyan-200/50",
    progress: "from-cyan-400 to-teal-500",
    bg: "bg-cyan-500",
  },
  {
    gradient: "from-emerald-500 to-green-500",
    light: "from-emerald-50/50 to-green-50/50",
    ring: "ring-emerald-200/50",
    progress: "from-emerald-400 to-green-500",
    bg: "bg-emerald-500",
  },
  {
    gradient: "from-sky-500 to-blue-500",
    light: "from-sky-50/50 to-blue-50/50",
    ring: "ring-sky-200/50",
    progress: "from-sky-400 to-blue-500",
    bg: "bg-sky-500",
  },
];

function HabitCard({
  habit,
  index,
  isToday,
  currentDateKey,
  onToggle,
  loading,
}: {
  habit: GoalWithYesterday;
  index: number;
  isToday: boolean;
  currentDateKey: string;
  onToggle: (goalId: string, nextChecked: boolean, dateKey: string) => void;
  loading?: boolean;
}) {
  const checked = isToday ? (habit.checkedToday ?? false) : (habit.checkedYesterday ?? false);
  const streak = habit.streak ?? 0;
  const progress = Math.min(90, streak);
  const daysSinceLastCheck = habit.daysSinceLastCheck ?? 0;
  const showWarning = isToday && !checked && daysSinceLastCheck === 2;
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden rounded-2xl p-4 transition-all",
        checked && `ring-2 ${colors.ring}`,
        showWarning && "ring-2 ring-rose-300/50 animate-pulse-warning"
      )}
    >
      {/* Background gradient when checked */}
      {checked && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30",
          colors.light
        )} />
      )}

      {/* Status Badge */}
      {checked && (
        <div className={cn(
          "absolute -right-1 -top-1 rotate-6 rounded-lg bg-gradient-to-r px-3 py-1 text-[0.65rem] font-bold text-white shadow-md",
          colors.gradient
        )}>
          <div className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            DONE
          </div>
        </div>
      )}

      {/* Warning Badge */}
      {showWarning && (
        <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-[0.65rem] font-bold text-white shadow-md">
          <AlertTriangle className="h-3 w-3" />
          あと1日！
        </div>
      )}

      <div className="relative flex items-start gap-4">
        {/* Check Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onToggle(habit.id, !checked, currentDateKey)}
          className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-all",
            checked
              ? `bg-gradient-to-br ${colors.gradient} text-white shadow-lg`
              : showWarning
              ? "bg-rose-100 text-rose-400 hover:bg-rose-200"
              : "glass text-slate-300 hover:bg-white/80 hover:text-slate-400",
            loading && "animate-pulse cursor-wait"
          )}
          aria-pressed={checked}
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : checked ? (
            <Check className="h-6 w-6" />
          ) : (
            <span className="text-2xl">○</span>
          )}
        </button>

        {/* Habit Info */}
        <div className="flex-1 space-y-2.5">
          <div>
            <p className="text-sm font-semibold text-slate-800">{habit.text}</p>
            <p className="text-xs text-slate-400">
              {formatDate(habit.startDate)} 開始
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Flame className={cn(
                  "h-3.5 w-3.5",
                  streak >= 7 ? "text-orange-500" : "text-slate-400"
                )} />
                <span className="text-[0.65rem] font-semibold text-slate-500">Progress</span>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {streak}
                <span className="font-medium text-slate-400">/90日</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100/80">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  checked
                    ? `bg-gradient-to-r ${colors.progress}`
                    : showWarning
                    ? "bg-gradient-to-r from-rose-400 to-pink-500"
                    : "bg-slate-300"
                )}
                style={{ width: `${(progress / 90) * 100}%` }}
              />
            </div>
          </div>

          {/* Comment */}
          {habit.comment && (
            <div className={cn(
              "rounded-lg px-3 py-2",
              habit.isRestart
                ? "bg-sky-50/80 text-sky-700"
                : streak >= 7
                ? "bg-teal-50/80 text-teal-700"
                : "bg-slate-50/80 text-slate-600"
            )}>
              <p className="text-xs font-medium">{habit.comment}</p>
            </div>
          )}

          {/* Warning Message */}
          {showWarning && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50/80 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
              <p className="text-xs font-semibold text-rose-600">
                明日までにチェックしないとリセットされます！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
