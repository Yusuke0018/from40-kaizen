"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import { Dumbbell, LogOut, Pencil, Trash2, User } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [goalText, setGoalText] = useState("");
  const [goalStartDate, setGoalStartDate] = useState(isoToday());
  const [goalEndDate, setGoalEndDate] = useState(isoTodayPlusDays(89)); // 90日習慣
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
      setGoalError("目標の取得に失敗しました。時間をおいて再度お試しください。");
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
    if (!editingGoalId && activeGoals.length >= 2) {
      setGoalError("習慣は最大2つまでです。1つ完了させてから追加してください。");
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
            endDate: goalEndDate,
          }
        : {
            text: goalText.trim(),
            startDate: goalStartDate,
            endDate: goalEndDate,
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
      setGoalError("習慣の保存に失敗しました。入力内容と期間を確認してください。");
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
    setGoalEndDate(goal.endDate);
  }

  function resetForm() {
    setEditingGoalId(null);
    setGoalText("");
    setGoalStartDate(isoToday());
    setGoalEndDate(isoTodayPlusDays(89));
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
    <div className="space-y-8 pb-10">
      <section>
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900">
          Habits
        </h2>

        {/* アカウント情報カード */}
        <div className="relative mb-6 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
          <div className="absolute -mr-10 -mt-10 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10">
              <User className="h-6 w-6 text-mint-300" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Account
              </p>
              <p className="text-sm font-medium text-white">{user?.email}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 習慣設定 */}
      <SettingsGroup title="Habits" icon={<Dumbbell className="h-4 w-4" />}>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">
              習慣化したいことを最大2つまで登録し、毎日チェックします。
            </p>
            <p className="text-[0.7rem] text-slate-400">
              90日間チェックできたら殿堂入り。デフォルトで90日間の期間をセットします。
            </p>
          </div>

          <div className="space-y-3 rounded-lg border-2 border-slate-900 bg-slate-50/60 p-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                習慣内容
              </span>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50"
                rows={3}
                placeholder="例: 毎晩ストレッチを5分やる"
                value={goalText}
                onChange={(event) => setGoalText(event.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  開始日
                </span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-mint-500 focus:ring-2 focus:ring-mint-50"
                  value={goalStartDate}
                  onChange={(event) => setGoalStartDate(event.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  終了日
                </span>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-mint-500 focus:ring-2 focus:ring-mint-50"
                  value={goalEndDate}
                  onChange={(event) => setGoalEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-bold text-slate-600 hover:border-mint-300 hover:text-mint-700"
                  onClick={() => {
                    const start = isoToday();
                    setGoalStartDate(start);
                    setGoalEndDate(isoTodayPlusDays(89));
                  }}
                >
                  今日から90日
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-bold text-slate-600 hover:border-mint-300 hover:text-mint-700"
                  onClick={() => {
                    const start = isoToday();
                    setGoalStartDate(start);
                    setGoalEndDate(isoTodayPlusMonths(1));
                  }}
                >
                  今日から1ヶ月（短期）
                </button>
              </div>
              <p className="text-[0.7rem] font-medium text-slate-500">
                期間: {formatDate(goalStartDate)} 〜 {formatDate(goalEndDate)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleSaveHabit()}
              disabled={savingGoal || !goalText.trim()}
              className="mt-1 w-full rounded-lg bg-mint-600 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-mint-700 disabled:opacity-60"
            >
              {savingGoal
                ? "保存中…"
                : editingGoalId
                ? "習慣を更新"
                : "習慣を追加"}
            </button>
            {editingGoalId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                キャンセル
              </button>
            )}
          </div>

          {goalError && (
            <p className="text-xs font-semibold text-rose-500">{goalError}</p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-500">
                進行中の習慣
              </p>
              <p className="font-semibold text-slate-400">
                {loadingGoals ? "読み込み中…" : `${activeGoals.length}/2 件`}
              </p>
            </div>
            {activeGoals.length === 0 && !loadingGoals && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-white/80 p-3 text-center text-[0.75rem] text-slate-500">
                まだ習慣はありません。
              </p>
            )}
            <div className="space-y-2">
              {activeGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="space-y-1 rounded-lg border-2 border-slate-900 bg-white p-3 text-xs text-slate-700 shadow-[var(--shadow-soft)]"
                >
                  <p className="font-semibold">{goal.text}</p>
                  <p className="text-[0.7rem] text-slate-400">
                    期間: {formatDate(goal.startDate)} 〜{" "}
                    {formatDate(goal.endDate)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(goal)}
                      className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[0.65rem] font-bold text-slate-600 hover:border-mint-300 hover:text-mint-700"
                    >
                      <Pencil className="h-3 w-3" /> 編集
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteHabit(goal.id)}
                      className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[0.65rem] font-bold text-rose-600 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" /> 削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {hallOfFameGoals.length > 0 && (
              <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-amber-600">
                  殿堂入り
                </p>
                <div className="space-y-1">
                  {hallOfFameGoals.map((goal) => (
                    <div
                      key={`hof-${goal.id}`}
                      className="rounded-lg border border-amber-200 bg-white/80 p-2 text-[0.8rem] font-semibold text-amber-800"
                    >
                      {goal.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SettingsGroup>

      <button
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        {signingOut ? "サインアウト中…" : "サインアウト"}
      </button>

      <p className="pt-6 text-center text-[0.65rem] font-bold uppercase tracking-widest text-slate-300">
        日々是悠々 v0.1.0
      </p>
    </div>
  );
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className="text-slate-400">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      </div>
      <div className="overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[var(--shadow-soft)]">
        {children}
      </div>
    </section>
  );
}

function isoToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoTodayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoTodayPlusMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(input: string | undefined | null) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}
