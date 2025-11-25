"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal, FrequencyType } from "@/types/goal";
import { LogOut, Pencil, Plus, Trash2, User, History } from "lucide-react";
import Link from "next/link";

const MAX_HABITS = 3;

export default function SettingsPage() {
  const { user, signOut } = useAuthContext();
  const [signingOut, setSigningOut] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const [goalText, setGoalText] = useState("");
  const [goalStartDate, setGoalStartDate] = useState(isoToday());
  const [goalEndDate, setGoalEndDate] = useState(isoTodayPlusDays(89));
  const [goalFrequency, setGoalFrequency] = useState<FrequencyType>("daily");
  const [goalWeeklyTarget, setGoalWeeklyTarget] = useState(2);
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
      const baseBody = {
        text: goalText.trim(),
        startDate: goalStartDate,
        endDate: goalEndDate,
        frequency: goalFrequency,
        ...(goalFrequency === "weekly" && { weeklyTarget: goalWeeklyTarget }),
      };
      const body = editingGoalId
        ? { id: editingGoalId, ...baseBody }
        : baseBody;

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
    setGoalEndDate(goal.endDate);
    setGoalFrequency(goal.frequency ?? "daily");
    setGoalWeeklyTarget(goal.weeklyTarget ?? 2);
  }

  function resetForm() {
    setEditingGoalId(null);
    setGoalText("");
    setGoalStartDate(isoToday());
    setGoalEndDate(isoTodayPlusDays(89));
    setGoalFrequency("daily");
    setGoalWeeklyTarget(2);
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
    <div className="space-y-8 pb-16">
      {/* ヘッダー */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Settings
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          習慣の管理とアカウント設定
        </p>
      </section>

      {/* アカウント情報 */}
      <section className="rounded-2xl border-2 border-slate-900 bg-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <User className="h-6 w-6 text-mint-300" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account
            </p>
            <p className="text-sm font-medium text-white">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* 習慣管理 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              My Habits
            </h3>
            <p className="text-xs text-slate-400">
              最大{MAX_HABITS}つまで登録できます
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {activeGoals.length}/{MAX_HABITS}
          </span>
        </div>

        {/* 習慣追加フォーム */}
        <div className="rounded-2xl border-2 border-slate-900 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-mint-600" />
            <p className="text-sm font-bold text-slate-700">
              {editingGoalId ? "習慣を編集" : "新しい習慣を追加"}
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                習慣内容
              </span>
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-0"
                rows={2}
                placeholder="例: 毎朝10分ストレッチをする"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
              />
            </label>

            {/* 頻度設定 */}
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                頻度
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGoalFrequency("daily")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                    goalFrequency === "daily"
                      ? "border-mint-500 bg-mint-50 text-mint-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-mint-300"
                  }`}
                >
                  毎日
                </button>
                <button
                  type="button"
                  onClick={() => setGoalFrequency("weekly")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                    goalFrequency === "weekly"
                      ? "border-mint-500 bg-mint-50 text-mint-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-mint-300"
                  }`}
                >
                  週N回
                </button>
              </div>
              {goalFrequency === "weekly" && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    週に
                  </span>
                  <select
                    value={goalWeeklyTarget}
                    onChange={(e) =>
                      setGoalWeeklyTarget(Number(e.target.value))
                    }
                    className="rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 focus:border-mint-500 focus:ring-0"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm font-medium text-slate-600">
                    回達成で継続
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  開始日
                </span>
                <input
                  type="date"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-mint-500 focus:ring-0"
                  value={goalStartDate}
                  onChange={(e) => setGoalStartDate(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  終了日
                </span>
                <input
                  type="date"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-mint-500 focus:ring-0"
                  value={goalEndDate}
                  onChange={(e) => setGoalEndDate(e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-mint-400 hover:text-mint-600"
                onClick={() => {
                  setGoalStartDate(isoToday());
                  setGoalEndDate(isoTodayPlusDays(89));
                }}
              >
                今日から90日
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-mint-400 hover:text-mint-600"
                onClick={() => {
                  setGoalStartDate(isoToday());
                  setGoalEndDate(isoTodayPlusDays(29));
                }}
              >
                今日から30日
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleSaveHabit()}
                disabled={savingGoal || !goalText.trim()}
                className="flex-1 rounded-xl bg-mint-600 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-mint-700 disabled:opacity-50"
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
                  className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {goalError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            {goalError}
          </p>
        )}

        {/* 習慣リスト */}
        {loadingGoals && (
          <p className="text-center text-sm font-medium text-slate-400">
            読み込み中...
          </p>
        )}

        {!loadingGoals && activeGoals.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
            <p className="text-sm font-semibold text-slate-500">
              習慣がまだありません
            </p>
            <p className="mt-1 text-xs text-slate-400">
              上のフォームから追加してください
            </p>
          </div>
        )}

        {activeGoals.length > 0 && (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-2xl border-2 border-slate-900 bg-white p-4 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{goal.text}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(goal.startDate)} 〜 {formatDate(goal.endDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                    {goal.frequency === "weekly"
                      ? `週${goal.weeklyTarget}回`
                      : "毎日"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-mint-500"
                      style={{
                        width: `${(Math.min(90, goal.streak ?? 0) / 90) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    {goal.streak ?? 0}/90
                  </span>
                </div>
                {goal.frequency === "weekly" &&
                  goal.currentWeekChecks !== undefined && (
                    <p className="mt-2 text-xs text-slate-500">
                      今週: {goal.currentWeekChecks}/{goal.weeklyTarget}回達成
                    </p>
                  )}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/habit/${goal.id}`}
                    className="flex items-center gap-1 rounded-lg border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-bold text-mint-600 hover:bg-mint-100"
                  >
                    <History className="h-3 w-3" /> 履歴
                  </Link>
                  <button
                    type="button"
                    onClick={() => startEdit(goal)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-mint-400 hover:text-mint-600"
                  >
                    <Pencil className="h-3 w-3" /> 編集
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteHabit(goal.id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3 w-3" /> 削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 殿堂入り */}
        {hallOfFameGoals.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Hall of Fame
            </p>
            <div className="space-y-2">
              {hallOfFameGoals.map((goal) => (
                <div
                  key={`hof-${goal.id}`}
                  className="rounded-xl border border-amber-200 bg-white/80 p-3 text-sm font-semibold text-amber-800"
                >
                  {goal.text}
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 active:scale-[0.98]"
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

function isoTodayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
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
