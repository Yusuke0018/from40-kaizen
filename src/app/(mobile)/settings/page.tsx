"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { LogOut, Pencil, Plus, Trash2, User, ListChecks, Trophy, Star, Sparkles, Calendar, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_HABITS = 3;

const CARD_COLORS = [
  {
    gradient: "from-cyan-500 to-teal-500",
    light: "from-cyan-50 to-teal-50",
    ring: "ring-cyan-200/50",
    progress: "from-cyan-400 to-teal-500",
  },
  {
    gradient: "from-emerald-500 to-green-500",
    light: "from-emerald-50 to-green-50",
    ring: "ring-emerald-200/50",
    progress: "from-emerald-400 to-green-500",
  },
  {
    gradient: "from-sky-500 to-blue-500",
    light: "from-sky-50 to-blue-50",
    ring: "ring-sky-200/50",
    progress: "from-sky-400 to-blue-500",
  },
];

// モジュールレベルのキャッシュ
let cachedSettingsGoals: Goal[] | null = null;
let settingsCacheDate: string | null = null;

export default function SettingsPage() {
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const today = isoToday();
  const hasValidCache = cachedSettingsGoals !== null && settingsCacheDate === today;

  const [goals, setGoals] = useState<Goal[]>(hasValidCache ? cachedSettingsGoals! : []);
  const [loadingGoals, setLoadingGoals] = useState(!hasValidCache);
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

  const loadGoals = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    // キャッシュが有効でforceRefreshでない場合はスキップ
    if (!forceRefresh && cachedSettingsGoals !== null && settingsCacheDate === today) {
      setLoadingGoals(false);
      return;
    }

    setLoadingGoals(true);
    setGoalError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as Goal[];
      setGoals(data);
      // キャッシュを更新
      cachedSettingsGoals = data;
      settingsCacheDate = today;
    } catch (error) {
      console.error(error);
      setGoalError("習慣の取得に失敗しました。");
    } finally {
      setLoadingGoals(false);
    }
  }, [user, today]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
      await loadGoals(true);
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
      await loadGoals(true);
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
    <div className="space-y-5 pb-20">
      {/* Header */}
      <section className="glass-card relative overflow-hidden rounded-2xl p-5">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-400/20 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 blur-xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
              <ListChecks className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Habits</h2>
              <p className="text-xs text-slate-500">習慣の管理とアカウント設定</p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Info */}
      <section className="glass-dark relative overflow-hidden rounded-2xl p-4 text-white">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-cyan-500/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Account
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Habit Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              My Habits
            </h3>
          </div>
          <span className="rounded-md bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-700">
            {activeGoals.length}/{MAX_HABITS}
          </span>
        </div>

        {/* Add/Edit Form */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className={cn(
            "flex items-center gap-2 p-4",
            editingGoalId
              ? "bg-amber-50/50"
              : "bg-gradient-to-r from-teal-50/50 to-emerald-50/50"
          )}>
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              editingGoalId
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-teal-400 to-emerald-500"
            )}>
              {editingGoalId ? (
                <Pencil className="h-3.5 w-3.5 text-white" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-white" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {editingGoalId ? "習慣を編集" : "新しい習慣を追加"}
            </p>
          </div>

          <div className="space-y-4 p-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <Sparkles className="h-3 w-3" />
                習慣内容
              </span>
              <textarea
                className="w-full rounded-xl bg-white/80 backdrop-blur-sm"
                rows={2}
                placeholder="例: 毎朝10分ストレッチをする"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <Calendar className="h-3 w-3" />
                開始日
              </span>
              <input
                type="date"
                className="w-full rounded-xl bg-white/80 backdrop-blur-sm"
                value={goalStartDate}
                onChange={(e) => setGoalStartDate(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-2 rounded-lg bg-amber-50/80 p-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-amber-600">終了日</span>は90日達成して殿堂入りした時に自動設定されます
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-200"
              onClick={() => {
                setGoalStartDate(isoToday());
              }}
            >
              <Calendar className="h-3 w-3" />
              今日から開始
            </button>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleSaveHabit()}
                disabled={savingGoal || !goalText.trim()}
                className={cn(
                  "flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50",
                  editingGoalId
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-teal-500 to-emerald-500"
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
                  className="glass rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-white/80"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {goalError && (
          <div className="glass-card rounded-xl border border-rose-200/50 bg-rose-50/50 px-4 py-3">
            <p className="text-sm font-medium text-rose-600">{goalError}</p>
          </div>
        )}

        {/* Loading */}
        {loadingGoals && (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-cyan-500" />
          </div>
        )}

        {/* Empty State */}
        {!loadingGoals && activeGoals.length === 0 && (
          <div className="glass-card rounded-2xl border-2 border-dashed border-slate-200/50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100">
              <ListChecks className="h-7 w-7 text-cyan-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              習慣がまだありません
            </p>
            <p className="mt-1 text-xs text-slate-400">
              上のフォームから追加してください
            </p>
          </div>
        )}

        {/* Habit List */}
        {activeGoals.length > 0 && (
          <div className="space-y-3">
            {activeGoals.map((goal, index) => {
              const colors = CARD_COLORS[index % CARD_COLORS.length];
              const progress = Math.min(90, goal.streak ?? 0);
              return (
                <div
                  key={goal.id}
                  className="glass-card overflow-hidden rounded-2xl"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{goal.text}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDate(goal.startDate)} 開始
                        </p>
                      </div>
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                        colors.gradient
                      )}>
                        {progress}
                      </div>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.65rem] font-semibold text-slate-500">Progress</span>
                        <span className="text-xs font-bold text-slate-600">
                          {progress}/90日
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100/80">
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

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(goal)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-200"
                      >
                        <Pencil className="h-3 w-3" /> 編集
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteHabit(goal.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100"
                      >
                        <Trash2 className="h-3 w-3" /> 削除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hall of Fame */}
        {hallOfFameGoals.length > 0 && (
          <div className="glass-card space-y-3 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Hall of Fame
              </p>
            </div>
            <div className="space-y-2">
              {hallOfFameGoals.map((goal) => (
                <div
                  key={`hof-${goal.id}`}
                  className="flex items-center gap-3 rounded-xl bg-white/60 p-3 backdrop-blur-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
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

      {/* Sign Out */}
      <button
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="glass-card flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50/50 p-3.5 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-100/50 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "サインアウト中..." : "サインアウト"}
      </button>

      <p className="pt-4 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-slate-300">
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
