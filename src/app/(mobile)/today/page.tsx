"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { cn } from "@/lib/utils";
import { AlertTriangle, MessageCircle, Sparkles, Trophy, Zap, Star, Flame } from "lucide-react";

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

export default function TodayPage() {
  const { user } = useAuthContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitLoading, setHabitLoading] = useState<Record<string, boolean>>({});
  const [showComment, setShowComment] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${todayKey()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as Goal[];
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
    async (goalId: string, nextChecked: boolean) => {
      if (!user) return;
      if (habitLoading[goalId]) return;
      setError(null);
      setHabitLoading((prev) => ({ ...prev, [goalId]: true }));

      let previousChecked = false;
      setGoals((prev) =>
        prev.map((habit) => {
          if (habit.id === goalId) {
            previousChecked = habit.checkedToday ?? false;
            return { ...habit, checkedToday: nextChecked };
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
            date: todayKey(),
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
                  checkedToday: nextChecked,
                  streak: data.streak ?? habit.streak ?? 0,
                  hallOfFameAt: data.hallOfFameAt ?? habit.hallOfFameAt ?? null,
                  isHallOfFame: Boolean(data.hallOfFameAt ?? habit.hallOfFameAt),
                  comment: data.comment ?? habit.comment,
                }
              : habit
          )
        );

        // チェック時にコメントを表示
        if (nextChecked && data.comment) {
          setShowComment(data.comment);
          setTimeout(() => setShowComment(null), 4000);
        }
      } catch (err) {
        console.error(err);
        setError("チェックの更新に失敗しました。");
        setGoals((prev) =>
          prev.map((habit) =>
            habit.id === goalId ? { ...habit, checkedToday: previousChecked } : habit
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
  const completedCount = activeHabits.filter((h) => h.checkedToday).length;

  return (
    <div className="space-y-6 pb-20">
      {/* コメントポップアップ */}
      {showComment && (
        <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md">
          <div className="animate-float rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-50 via-mint-50 to-sky-50 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-mint-500">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <p className="flex-1 text-sm font-bold text-slate-700">{showComment}</p>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-pink-500/20 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-300" />
            <h2 className="text-2xl font-extrabold tracking-tight">
              Today&apos;s Habits
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium text-white/80">
            毎日チェックして習慣を形成しましょう
          </p>
          <p className="mt-1 text-xs font-semibold text-white/60">
            {formatDate(todayKey())}
          </p>
        </div>
      </section>

      {/* 進捗サマリー */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-mint-200/50 to-emerald-200/50 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Today&apos;s Progress
            </p>
            <p className="mt-2 text-4xl font-black text-slate-900">
              <span className="gradient-text-primary">{completedCount}</span>
              <span className="mx-1 text-slate-300">/</span>
              <span className="text-slate-600">{activeHabits.length}</span>
            </p>
          </div>
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-black shadow-lg transition-all",
            completedCount === activeHabits.length && activeHabits.length > 0
              ? "bg-gradient-to-br from-emerald-400 to-mint-500 text-white"
              : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"
          )}>
            {activeHabits.length > 0
              ? `${Math.round((completedCount / activeHabits.length) * 100)}%`
              : "-"}
          </div>
        </div>
        {completedCount === activeHabits.length && activeHabits.length > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-mint-50 px-4 py-3">
            <Star className="h-5 w-5 text-amber-500" />
            <p className="text-sm font-bold text-emerald-700">
              今日の習慣をすべて達成しました！
            </p>
          </div>
        )}
      </section>

      {/* ルール説明 */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-4 ring-1 ring-slate-200">
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
          ルール
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <Zap className="h-3 w-3" />
            2日に1回以上で継続
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-600">
            <AlertTriangle className="h-3 w-3" />
            3日以上空くとリセット
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            <Trophy className="h-3 w-3" />
            90日達成で殿堂入り
          </span>
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      )}

      {/* 習慣リスト */}
      {!loading && activeHabits.length === 0 && (
        <section className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100">
            <Sparkles className="h-8 w-8 text-violet-500" />
          </div>
          <p className="text-sm font-semibold text-slate-600">
            まだ習慣が登録されていません
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Habits画面から習慣を追加してください（最大3つ）
          </p>
        </section>
      )}

      {!loading && activeHabits.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-violet-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Active Habits
            </p>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-600">
              {activeHabits.length}/3
            </span>
          </div>
          {activeHabits.map((habit, index) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              index={index}
              onToggle={handleHabitCheck}
              loading={habitLoading[habit.id]}
            />
          ))}
        </section>
      )}

      {/* 殿堂入り */}
      {hallOfFameHabits.length > 0 && (
        <section className="space-y-3 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 ring-1 ring-amber-200">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Hall of Fame
            </p>
          </div>
          <div className="space-y-2">
            {hallOfFameHabits.map((habit) => (
              <div
                key={`hof-${habit.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-amber-200"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg">
                  <Star className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-bold text-amber-800">{habit.text}</span>
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
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    light: "from-violet-50 to-purple-50",
    accent: "violet",
    ring: "ring-violet-200",
    check: "from-violet-400 to-purple-500",
  },
  {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    light: "from-pink-50 to-rose-50",
    accent: "pink",
    ring: "ring-pink-200",
    check: "from-pink-400 to-rose-500",
  },
  {
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    light: "from-cyan-50 to-sky-50",
    accent: "sky",
    ring: "ring-sky-200",
    check: "from-cyan-400 to-sky-500",
  },
];

function HabitCard({
  habit,
  index,
  onToggle,
  loading,
}: {
  habit: Goal;
  index: number;
  onToggle: (goalId: string, nextChecked: boolean) => void;
  loading?: boolean;
}) {
  const checked = habit.checkedToday ?? false;
  const streak = habit.streak ?? 0;
  const progress = Math.min(90, streak);
  const daysSinceLastCheck = habit.daysSinceLastCheck ?? 0;
  const showWarning = !checked && daysSinceLastCheck === 2;
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-white p-5 shadow-lg transition-all",
        checked
          ? `ring-2 ${colors.ring}`
          : showWarning
          ? "ring-2 ring-rose-300 animate-pulse-warning"
          : "ring-1 ring-slate-200"
      )}
    >
      {/* 背景グラデーション */}
      {checked && (
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5",
          colors.light
        )} />
      )}

      {/* 完了バッジ */}
      {checked && (
        <div className={cn(
          "absolute -right-1 -top-1 rotate-12 rounded-full bg-gradient-to-r px-4 py-1.5 text-xs font-black text-white shadow-lg",
          colors.check
        )}>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            DONE
          </div>
        </div>
      )}

      {/* 警告バッジ */}
      {showWarning && (
        <div className="absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          <AlertTriangle className="h-3 w-3" />
          あと1日！
        </div>
      )}

      <div className="relative flex items-start gap-4">
        {/* チェックボタン */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onToggle(habit.id, !checked)}
          className={cn(
            "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold transition-all",
            checked
              ? `bg-gradient-to-br ${colors.check} text-white shadow-lg`
              : showWarning
              ? "bg-gradient-to-br from-rose-100 to-pink-100 text-rose-400 hover:from-rose-200 hover:to-pink-200"
              : "bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400",
            loading && "animate-pulse cursor-wait"
          )}
          aria-pressed={checked}
        >
          {loading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white" />
          ) : checked ? (
            "✓"
          ) : (
            "○"
          )}
        </button>

        {/* 習慣情報 */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-base font-bold text-slate-900">{habit.text}</p>
            <p className="text-xs font-medium text-slate-400">
              {formatDate(habit.startDate)} 開始
            </p>
          </div>

          {/* ストリーク */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Flame className={cn(
                  "h-4 w-4",
                  streak >= 7 ? "text-orange-500" : "text-slate-400"
                )} />
                <span className="text-xs font-bold text-slate-500">Progress</span>
              </div>
              <span className="text-sm font-black text-slate-700">
                {streak}
                <span className="text-xs font-medium text-slate-400">/90日</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  checked
                    ? `bg-gradient-to-r ${colors.check}`
                    : showWarning
                    ? "bg-gradient-to-r from-rose-400 to-pink-500"
                    : "bg-slate-300"
                )}
                style={{ width: `${(progress / 90) * 100}%` }}
              />
            </div>
          </div>

          {/* コメント表示 */}
          {habit.comment && (
            <div className={cn(
              "rounded-xl px-3 py-2",
              habit.isRestart
                ? "bg-sky-50 text-sky-700"
                : streak >= 7
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-50 text-slate-600"
            )}>
              <p className="text-xs font-semibold">{habit.comment}</p>
            </div>
          )}

          {/* 警告メッセージ */}
          {showWarning && (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <p className="text-xs font-bold text-rose-600">
                明日までにチェックしないとリセットされます！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
