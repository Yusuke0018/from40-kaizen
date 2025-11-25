"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { History } from "lucide-react";

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
          currentWeekChecks?: number;
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
                  currentWeekChecks:
                    data.currentWeekChecks ?? habit.currentWeekChecks,
                }
              : habit
          )
        );
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
    <div className="space-y-6 pb-16">
      {/* ヘッダー */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Today&apos;s Habits
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          毎日チェックして習慣を形成しましょう
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-400">
          {formatDate(todayKey())}
        </p>
      </section>

      {/* 進捗サマリー */}
      <section className="rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-mint-50 via-sky-50 to-violet-50 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Today&apos;s Progress
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {completedCount} / {activeHabits.length}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-mint-500 bg-white text-2xl font-black text-mint-600">
            {activeHabits.length > 0
              ? `${Math.round((completedCount / activeHabits.length) * 100)}%`
              : "-"}
          </div>
        </div>
        {completedCount === activeHabits.length && activeHabits.length > 0 && (
          <p className="mt-3 rounded-lg bg-mint-100 px-3 py-2 text-center text-sm font-bold text-mint-700">
            今日の習慣をすべて達成しました！
          </p>
        )}
      </section>

      {/* エラー表示 */}
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}

      {/* ローディング */}
      {loading && (
        <p className="text-center text-sm font-medium text-slate-400">
          読み込み中...
        </p>
      )}

      {/* 習慣リスト */}
      {!loading && activeHabits.length === 0 && (
        <section className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">
            まだ習慣が登録されていません
          </p>
          <p className="mt-2 text-xs text-slate-400">
            設定画面から習慣を追加してください（最大3つ）
          </p>
        </section>
      )}

      {!loading && activeHabits.length > 0 && (
        <section className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Active Habits ({activeHabits.length}/3)
          </p>
          {activeHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={handleHabitCheck}
              loading={habitLoading[habit.id]}
            />
          ))}
        </section>
      )}

      {/* 殿堂入り */}
      {hallOfFameHabits.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Hall of Fame
          </p>
          <div className="space-y-2">
            {hallOfFameHabits.map((habit) => (
              <div
                key={`hof-${habit.id}`}
                className="rounded-xl border border-amber-200 bg-white/80 p-4 text-sm font-semibold text-amber-800"
              >
                {habit.text}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
  loading,
}: {
  habit: Goal;
  onToggle: (goalId: string, nextChecked: boolean) => void;
  loading?: boolean;
}) {
  const checked = habit.checkedToday ?? false;
  const streak = habit.streak ?? 0;
  const progress = Math.min(90, streak);
  const isWeekly = habit.frequency === "weekly";
  const weeklyTarget = habit.weeklyTarget ?? 2;
  const currentWeekChecks = habit.currentWeekChecks ?? 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 bg-white p-5 shadow-lg transition-all",
        checked ? "border-mint-500 bg-mint-50/30" : "border-slate-900"
      )}
    >
      {checked && (
        <div className="absolute right-3 top-3 rotate-6 rounded-full border-2 border-mint-600 bg-mint-100 px-3 py-1 text-xs font-black text-mint-700 shadow-sm">
          DONE
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* チェックボタン */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onToggle(habit.id, !checked)}
          className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-3 text-2xl font-extrabold transition-all",
            checked
              ? "border-mint-500 bg-mint-100 text-mint-700 shadow-inner"
              : "border-slate-300 bg-white text-slate-300 hover:border-mint-400 hover:text-mint-500",
            loading && "animate-pulse cursor-wait"
          )}
          aria-pressed={checked}
        >
          {loading ? "..." : checked ? "✓" : "○"}
        </button>

        {/* 習慣情報 */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <p className="text-base font-bold text-slate-900">{habit.text}</p>
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
              {isWeekly ? `週${weeklyTarget}回` : "毎日"}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-400">
            {formatDate(habit.startDate)} 〜 {formatDate(habit.endDate)}
          </p>

          {/* 週間習慣の今週進捗 */}
          {isWeekly && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">今週:</span>
              <div className="flex gap-1">
                {Array.from({ length: weeklyTarget }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-4 rounded-full",
                      i < currentWeekChecks ? "bg-mint-500" : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-600">
                {currentWeekChecks}/{weeklyTarget}
              </span>
              {currentWeekChecks >= weeklyTarget && (
                <span className="text-xs font-bold text-mint-600">達成!</span>
              )}
            </div>
          )}

          {/* ストリーク */}
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  checked || (isWeekly && currentWeekChecks >= weeklyTarget)
                    ? "bg-mint-500"
                    : "bg-slate-300"
                )}
                style={{ width: `${(progress / 90) * 100}%` }}
              />
            </div>
            <span className="text-sm font-black text-slate-700">
              {streak}
              <span className="text-xs font-medium text-slate-400">/90</span>
            </span>
          </div>

          {/* モチベーションメッセージ */}
          {streak >= 7 && (
            <p className="text-xs font-semibold text-mint-600">
              {streak >= 90
                ? "殿堂入り達成！"
                : streak >= 30
                ? `あと${90 - streak}日で殿堂入り！`
                : isWeekly
                ? `${Math.floor(streak / 7)}週連続達成！この調子！`
                : `${streak}日連続！この調子で続けましょう`}
            </p>
          )}

          {/* 履歴リンク */}
          <Link
            href={`/habit/${habit.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-mint-600"
          >
            <History className="h-3 w-3" />
            履歴を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
