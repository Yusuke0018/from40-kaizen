"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { LogOut, Pencil, Plus, Trash2, User, ListChecks, Trophy, Star, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_HABITS = 3;

const CARD_COLORS = [
  {
    gradient: "from-violet-500 via-purple-500 to-indigo-500",
    light: "from-violet-50 to-purple-50",
    ring: "ring-violet-200",
    progress: "from-violet-400 to-purple-500",
  },
  {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    light: "from-pink-50 to-rose-50",
    ring: "ring-pink-200",
    progress: "from-pink-400 to-rose-500",
  },
  {
    gradient: "from-cyan-500 via-sky-500 to-blue-500",
    light: "from-cyan-50 to-sky-50",
    ring: "ring-sky-200",
    progress: "from-cyan-400 to-sky-500",
  },
];

export default function SettingsPage() {
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [goalText, setGoalText] = useState("");
  const [goalStartDate, setGoalStartDate] = useState(isoToday());
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const activeGoals = useMemo(
    () => goals.filter((goal) => !goal.isHallOfFame),
    [goals]
  );
  const hallOfFameGoals = useMemo(
    () => goals.filter((goal) => goal.isHallOfFame),
    [goals]
  );

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setLoadingGoals(true);
    setGoalError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${isoToday()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as Goal[];
      setGoals(data);
    } catch (error) {
      console.error(error);
      setGoalError("習慣の取得に失敗しました。");
    } finally {
      setLoadingGoals(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  }, [user, loadGoals]);

  async function handleSaveHabit() {
    if (!user) return;
    if (!goalText.trim()) return;
    if (!editingGoalId && activeGoals.length >= MAX_HABITS) {
      setGoalError(`習慣は最大${MAX_HABITS}つまでです。`);
      return;
    }

    setSavingGoal(true);
    setGoalError(null);
    try {
      const token = await user.getIdToken();
      const method = editingGoalId ? "PUT" : "POST";
      const body = editingGoalId
        ? {
            id: editingGoalId,
            text: goalText.trim(),
            startDate: goalStartDate,
          }
        : {
            text: goalText.trim(),
            startDate: goalStartDate,
          };

      const res = await fetch("/api/goals", {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Failed to save habit");
      }
      resetForm();
      await loadGoals();
    } catch (error) {
      console.error(error);
      setGoalError("習慣の保存に失敗しました。");
    } finally {
      setSavingGoal(false);
    }
  }

  async function handleDeleteHabit(goalId: string) {
    if (!user) return;
    setGoalError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?id=${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to delete habit");
      }
      if (editingGoalId === goalId) {
        resetForm();
      }
      await loadGoals();
    } catch (error) {
      console.error(error);
      setGoalError("習慣の削除に失敗しました。");
    }
  }

  function startEdit(goal: Goal) {
    setEditingGoalId(goal.id);
    setGoalText(goal.text);
    setGoalStartDate(goal.startDate);
  }

  function resetForm() {
    setEditingGoalId(null);
    setGoalText("");
    setGoalStartDate(isoToday());
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ヘッダー */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-6 text-white shadow-xl">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-yellow-400/20 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-yellow-200" />
            <h2 className="text-2xl font-extrabold tracking-tight">
              Habits
            </h2>
          </div>
          <p className="mt-2 text-sm font-medium text-white/80">
            習慣の管理とアカウント設定
          </p>
        </div>
      </section>

      {/* アカウント情報 */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-xl">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* 習慣管理 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-pink-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              My Habits
            </h3>
          </div>
          <span className="rounded-full bg-gradient-to-r from-pink-100 to-rose-100 px-3 py-1 text-xs font-bold text-pink-600">
            {activeGoals.length}/{MAX_HABITS}
          </span>
        </div>

        {/* 習慣追加フォーム */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className={cn(
            "flex items-center gap-2 p-4",
            editingGoalId
              ? "bg-gradient-to-r from-amber-50 to-orange-50"
              : "bg-gradient-to-r from-emerald-50 to-mint-50"
          )}>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
              editingGoalId
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-emerald-400 to-mint-500"
            )}>
              {editingGoalId ? (
                <Pencil className="h-4 w-4 text-white" />
              ) : (
                <Plus className="h-4 w-4 text-white" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-700">
              {editingGoalId ? "習慣を編集" : "新しい習慣を追加"}
            </p>
          </div>

          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3 w-3" />
                習慣内容
              </span>
              <textarea
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-pink-400 focus:bg-white focus:ring-0"
                rows={2}
                placeholder="例: 毎朝10分ストレッチをする"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Calendar className="h-3 w-3" />
                開始日
              </span>
              <input
                type="date"
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-pink-400 focus:bg-white focus:ring-0"
                value={goalStartDate}
                onChange={(e) => setGoalStartDate(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-slate-600">
                <span className="font-bold text-amber-600">終了日</span>は90日達成して殿堂入りした時に自動設定されます
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
              onClick={() => {
                setGoalStartDate(isoToday());
              }}
            >
              <Calendar className="h-3 w-3" />
              今日から開始
            </button>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleSaveHabit()}
                disabled={savingGoal || !goalText.trim()}
                className={cn(
                  "flex-1 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50",
                  editingGoalId
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-mint-500"
                )}
              >
                {savingGoal
                  ? "保存中..."
                  : editingGoalId
                  ? "更新する"
                  : "追加する"}
              </button>
              {editingGoalId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {goalError && (
          <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-600">{goalError}</p>
          </div>
        )}

        {/* ローディング */}
        {loadingGoals && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
          </div>
        )}

        {/* 習慣リスト */}
        {!loadingGoals && activeGoals.length === 0 && (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100">
              <ListChecks className="h-8 w-8 text-pink-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              習慣がまだありません
            </p>
            <p className="mt-1 text-xs text-slate-400">
              上のフォームから追加してください
            </p>
          </div>
        )}

        {activeGoals.length > 0 && (
          <div className="space-y-3">
            {activeGoals.map((goal, index) => {
              const colors = CARD_COLORS[index % CARD_COLORS.length];
              const progress = Math.min(90, goal.streak ?? 0);
              return (
                <div
                  key={goal.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{goal.text}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(goal.startDate)} 開始
                        </p>
                      </div>
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-white shadow-md",
                        colors.progress
                      )}>
                        {progress}
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Progress</span>
                        <span className="text-xs font-bold text-slate-600">
                          {progress}/90日
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r transition-all",
                            colors.progress
                          )}
                          style={{
                            width: `${(progress / 90) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(goal)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
                      >
                        <Pencil className="h-3.5 w-3.5" /> 編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteHabit(goal.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-4 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> 削除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 殿堂入り */}
        {hallOfFameGoals.length > 0 && (
          <div className="space-y-3 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 ring-1 ring-amber-200">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
                Hall of Fame
              </p>
            </div>
            <div className="space-y-2">
              {hallOfFameGoals.map((goal) => (
                <div
                  key={`hof-${goal.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-amber-200"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800">
                      {goal.text}
                    </p>
                    {goal.hallOfFameAt && (
                      <p className="mt-0.5 text-xs text-amber-600">
                        殿堂入り: {formatDate(goal.hallOfFameAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* サインアウト */}
      <button
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-100 to-pink-100 p-4 text-sm font-bold text-rose-600 shadow-sm transition-all hover:from-rose-200 hover:to-pink-200 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "サインアウト中..." : "サインアウト"}
      </button>

      <p className="pt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-300">
        Habit Tracker v1.0
      </p>
    </div>
  );
}

function isoToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(input: string | undefined | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}
