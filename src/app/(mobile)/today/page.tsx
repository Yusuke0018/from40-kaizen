"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { Goal } from "@/types/goal";
import type { UserLevel } from "@/lib/level-system";
import { cn } from "@/lib/utils";
import { AlertTriangle, Sparkles, Trophy, Zap, Star, Flame, Moon, ChevronLeft, ChevronRight, Check, Crown, TrendingUp } from "lucide-react";
import { getCachedGoals, setCachedGoals, getCachedUserLevel, setCachedUserLevel } from "@/lib/cache-store";

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

type LevelUpInfo = {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  newTitleEn: string;
  isMilestone?: boolean;
  phase?: string;
};

type LevelDownInfo = {
  oldLevel: number;
  newLevel: number;
  newTitle: string;
  newTitleEn: string;
};

// 節目レベルのフェーズ情報
const MILESTONE_INFO: Record<number, { emoji: string; message: string; color: string }> = {
  10: { emoji: "🎉", message: "最初の壁突破！", color: "from-amber-400 to-orange-500" },
  20: { emoji: "⚔️", message: "中級者の仲間入り！", color: "from-cyan-400 to-blue-500" },
  30: { emoji: "👑", message: "人間界の頂点！", color: "from-purple-400 to-pink-500" },
  40: { emoji: "☀️", message: "神話級の存在！", color: "from-amber-300 to-red-500" },
  50: { emoji: "🌟", message: "ご機嫌の極み！", color: "from-yellow-300 via-amber-400 to-orange-500" },
};

export default function TodayPage() {
  const { user } = useAuthContext();

  // グローバルキャッシュから初期値を取得（localStorage + メモリ）
  const initialGoals = getCachedGoals() as GoalWithYesterday[] | null;
  const initialLevel = getCachedUserLevel();

  const [goals, setGoals] = useState<GoalWithYesterday[]>(initialGoals ?? []);
  const [loading, setLoading] = useState(initialGoals === null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<"today" | "yesterday">("today");
  const [userLevel, setUserLevel] = useState<UserLevel | null>(initialLevel);
  const [levelUp, setLevelUp] = useState<LevelUpInfo | null>(null);
  const [levelDown, setLevelDown] = useState<LevelDownInfo | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [pointsLost, setPointsLost] = useState<number | null>(null);

  // 処理中のhabitIdを追跡（再レンダリングを防ぐためRef使用）
  const processingRef = useRef<Set<string>>(new Set());

  const currentDateKey = selectedDate === "today" ? todayKey() : yesterdayKey();

  useEffect(() => {
    if (!user) return;

    // キャッシュが有効な場合はスキップ
    if (initialGoals !== null) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const token = await user.getIdToken();
        const today = todayKey();
        // 両方のAPIを並列で呼び出し
        const [goalsRes, levelRes] = await Promise.all([
          fetch(`/api/goals?date=${today}&includeYesterday=true`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/user/level", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (goalsRes.ok) {
          const data = (await goalsRes.json()) as GoalWithYesterday[];
          setGoals(data);
          setCachedGoals(data);
        } else {
          setError("習慣の取得に失敗しました。");
        }

        if (levelRes.ok) {
          const data = (await levelRes.json()) as UserLevel;
          setUserLevel(data);
          setCachedUserLevel(data);
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

  const handleHabitCheck = useCallback(
    (goalId: string, nextChecked: boolean, dateKey: string) => {
      if (!user) return;
      // 処理中なら無視
      if (processingRef.current.has(goalId)) return;
      processingRef.current.add(goalId);

      setError(null);

      const isToday = dateKey === todayKey();
      const checkField = isToday ? "checkedToday" : "checkedYesterday";

      // 楽観的更新：即座にUIを更新（ストリークも更新）
      let previousState: GoalWithYesterday | null = null;
      setGoals((prev) => {
        const updated = prev.map((habit) => {
          if (habit.id === goalId) {
            previousState = habit;
            const currentStreak = habit.streak ?? 0;
            return {
              ...habit,
              [checkField]: nextChecked,
              // ストリークも楽観的に更新
              streak: nextChecked ? currentStreak + 1 : Math.max(0, currentStreak - 1),
            };
          }
          return habit;
        });
        // キャッシュも更新
        setCachedGoals(updated);
        return updated;
      });

      // ポイント表示も即座に（楽観的）
      if (nextChecked) {
        setPointsEarned(1);
        setTimeout(() => setPointsEarned(null), 2000);
      }

      // APIはバックグラウンドで実行（await しない）
      (async () => {
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
            pointsEarned?: number;
            pointsLost?: number;
            levelUp?: LevelUpInfo | null;
            levelDown?: LevelDownInfo | null;
            level?: UserLevel | null;
          };

          // サーバーからの正確なデータで更新
          setGoals((prev) => {
            const updated = prev.map((habit) =>
              habit.id === goalId
                ? {
                    ...habit,
                    [checkField]: nextChecked,
                    streak: data.streak ?? habit.streak ?? 0,
                    hallOfFameAt: data.hallOfFameAt ?? habit.hallOfFameAt ?? null,
                    isHallOfFame: Boolean(data.hallOfFameAt ?? habit.hallOfFameAt),
                  }
                : habit
            );
            setCachedGoals(updated);
            return updated;
          });

          // レベル情報更新
          if (data.level) {
            setUserLevel(data.level);
            setCachedUserLevel(data.level);
          }

          // レベルアップ演出
          if (data.levelUp) {
            setLevelUp(data.levelUp);
          }

          // チェックOFF時の処理
          if (!nextChecked && data.levelDown) {
            setLevelDown(data.levelDown);
          }
        } catch (err) {
          console.error(err);
          // エラー時は元に戻す
          if (previousState) {
            setGoals((prev) => {
              const updated = prev.map((habit) =>
                habit.id === goalId ? previousState! : habit
              );
              setCachedGoals(updated);
              return updated;
            });
          }
          setError("チェックの更新に失敗しました。");
        } finally {
          processingRef.current.delete(goalId);
        }
      })();
    },
    [user]
  );

  const activeHabits = goals.filter((g) => !g.isHallOfFame);
  const hallOfFameHabits = goals.filter((g) => g.isHallOfFame);
  const isToday = selectedDate === "today";
  const completedCount = activeHabits.filter((h) =>
    isToday ? h.checkedToday : h.checkedYesterday
  ).length;

  return (
    <div className="space-y-5 pb-20">
      {/* Level Up Modal */}
      {levelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-fade-in"
            onClick={() => setLevelUp(null)}
          />
          {/* 節目レベルの特別演出 */}
          {levelUp.isMilestone && MILESTONE_INFO[levelUp.newLevel] && (
            <>
              {/* 花火エフェクト */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-10 left-10 w-4 h-4 rounded-full bg-yellow-400 animate-firework-1" />
                <div className="absolute top-20 right-16 w-3 h-3 rounded-full bg-pink-400 animate-firework-2" />
                <div className="absolute top-32 left-1/4 w-5 h-5 rounded-full bg-cyan-400 animate-firework-3" />
                <div className="absolute bottom-40 right-10 w-4 h-4 rounded-full bg-amber-400 animate-firework-1" />
                <div className="absolute bottom-32 left-16 w-3 h-3 rounded-full bg-purple-400 animate-firework-2" />
                <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-emerald-400 animate-firework-3" />
              </div>
              {/* 光の放射エフェクト */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-80 h-80 rounded-full bg-gradient-to-r from-amber-400/0 via-yellow-400/30 to-amber-400/0 animate-spin-slow" />
              </div>
            </>
          )}
          <div className="relative animate-popup-in">
            <div className={cn(
              "glass-card relative overflow-hidden rounded-3xl p-8 shadow-2xl",
              levelUp.isMilestone ? "shadow-amber-500/50" : "shadow-amber-500/30"
            )}>
              {/* Particle effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className={cn(
                  "absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl animate-pulse-soft",
                  levelUp.isMilestone
                    ? `bg-gradient-to-br ${MILESTONE_INFO[levelUp.newLevel]?.color || "from-amber-400/40 to-yellow-400/40"} opacity-60`
                    : "bg-gradient-to-br from-amber-400/40 to-yellow-400/40"
                )} />
                <div className={cn(
                  "absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-2xl animate-pulse-soft",
                  levelUp.isMilestone
                    ? `bg-gradient-to-br ${MILESTONE_INFO[levelUp.newLevel]?.color || "from-orange-400/30 to-amber-400/30"} opacity-50`
                    : "bg-gradient-to-br from-orange-400/30 to-amber-400/30"
                )} />
                <div className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full blur-3xl",
                  levelUp.isMilestone ? "animate-glow-strong" : "animate-glow",
                  levelUp.isMilestone
                    ? `bg-gradient-to-br ${MILESTONE_INFO[levelUp.newLevel]?.color || "from-yellow-300/20 to-amber-300/20"} opacity-40`
                    : "bg-gradient-to-br from-yellow-300/20 to-amber-300/20"
                )} />
              </div>

              <div className="relative flex flex-col items-center text-center">
                {/* Milestone Badge */}
                {levelUp.isMilestone && MILESTONE_INFO[levelUp.newLevel] && (
                  <div className="mb-2 animate-bounce-slow">
                    <span className="text-4xl">{MILESTONE_INFO[levelUp.newLevel].emoji}</span>
                  </div>
                )}

                {/* Crown/Icon */}
                <div className={cn(
                  "mb-4 flex items-center justify-center rounded-2xl shadow-xl animate-bounce-in",
                  levelUp.isMilestone ? "h-24 w-24" : "h-20 w-20",
                  levelUp.isMilestone && MILESTONE_INFO[levelUp.newLevel]
                    ? `bg-gradient-to-br ${MILESTONE_INFO[levelUp.newLevel].color} shadow-current/40`
                    : "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 shadow-amber-500/40"
                )}>
                  <Crown className={cn(
                    "text-white",
                    levelUp.isMilestone ? "h-12 w-12" : "h-10 w-10"
                  )} />
                </div>

                {/* Level Up Text */}
                <p className={cn(
                  "mb-1 font-bold uppercase tracking-[0.3em] animate-fade-in",
                  levelUp.isMilestone ? "text-sm text-amber-500" : "text-xs text-amber-600"
                )}>
                  {levelUp.isMilestone ? "🎊 MILESTONE REACHED! 🎊" : "Level Up!"}
                </p>

                {/* Milestone Message */}
                {levelUp.isMilestone && MILESTONE_INFO[levelUp.newLevel] && (
                  <p className="mb-2 text-lg font-bold text-slate-700 animate-fade-in">
                    {MILESTONE_INFO[levelUp.newLevel].message}
                  </p>
                )}

                {/* Phase Badge */}
                {levelUp.phase && (
                  <div className="mb-2 rounded-full bg-slate-100 px-3 py-1">
                    <p className="text-xs font-semibold text-slate-500">{levelUp.phase}</p>
                  </div>
                )}

                {/* Level Numbers */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-400">LV.{levelUp.oldLevel}</span>
                  <TrendingUp className={cn(
                    levelUp.isMilestone ? "h-8 w-8 text-amber-400" : "h-6 w-6 text-amber-500"
                  )} />
                  <span className={cn(
                    "font-black gradient-text-gold",
                    levelUp.isMilestone ? "text-5xl" : "text-4xl"
                  )}>LV.{levelUp.newLevel}</span>
                </div>

                {/* New Title */}
                <div className={cn(
                  "mb-2 rounded-full px-6 py-2",
                  levelUp.isMilestone
                    ? `bg-gradient-to-r ${MILESTONE_INFO[levelUp.newLevel]?.color || "from-amber-100 to-yellow-100"} bg-opacity-20`
                    : "bg-gradient-to-r from-amber-100 to-yellow-100"
                )}>
                  <p className={cn(
                    "font-bold",
                    levelUp.isMilestone ? "text-xl text-white drop-shadow-md" : "text-lg text-amber-800"
                  )}>{levelUp.newTitle}</p>
                </div>
                <p className="text-sm font-medium text-slate-500">{levelUp.newTitleEn}</p>

                {/* Close hint */}
                <p className="mt-6 text-xs text-slate-400">
                  タップして閉じる
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Down Modal */}
      {levelDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in"
            onClick={() => setLevelDown(null)}
          />
          <div className="relative animate-popup-in">
            <div className="glass-card relative overflow-hidden rounded-3xl p-8 shadow-2xl shadow-slate-500/30">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-slate-400/20 to-slate-500/20 blur-3xl" />

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-xl animate-bounce-in">
                  <TrendingUp className="h-10 w-10 text-white rotate-180" />
                </div>

                <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                  Level Down
                </p>

                <div className="mb-3 flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-500">LV.{levelDown.oldLevel}</span>
                  <TrendingUp className="h-6 w-6 text-slate-400 rotate-180" />
                  <span className="text-4xl font-black text-slate-600">LV.{levelDown.newLevel}</span>
                </div>

                <div className="mb-2 rounded-full bg-slate-100 px-6 py-2">
                  <p className="text-lg font-bold text-slate-700">{levelDown.newTitle}</p>
                </div>
                <p className="text-sm font-medium text-slate-400">{levelDown.newTitleEn}</p>

                <p className="mt-4 text-xs text-slate-400">
                  タップして閉じる
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Points Earned Toast */}
      {pointsEarned && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 animate-popup-in">
          <div className="glass-card rounded-full px-4 py-2 shadow-lg">
            <p className="text-sm font-bold text-amber-600">
              +{pointsEarned} pt
            </p>
          </div>
        </div>
      )}

      {/* Points Lost Toast */}
      {pointsLost && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 animate-popup-in">
          <div className="glass-card rounded-full px-4 py-2 shadow-lg border border-slate-200">
            <p className="text-sm font-bold text-slate-500">
              -{pointsLost} pt
            </p>
          </div>
        </div>
      )}

      {/* Level Card */}
      {userLevel && (
        <section className="glass-card relative overflow-hidden rounded-2xl p-5">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-amber-400/15 to-yellow-400/15 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-orange-400/10 to-amber-400/10 blur-xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                    Level {userLevel.level}
                  </p>
                  <p className="text-lg font-bold text-slate-800">{userLevel.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black gradient-text-gold">{userLevel.totalPoints}</p>
                <p className="text-[0.65rem] font-semibold text-slate-400">TOTAL PT</p>
              </div>
            </div>

            {/* Progress to next level */}
            {userLevel.level < 50 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-500">Next Level</span>
                  <span className="font-bold text-amber-600">{userLevel.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${userLevel.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>
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
}: {
  habit: GoalWithYesterday;
  index: number;
  isToday: boolean;
  currentDateKey: string;
  onToggle: (goalId: string, nextChecked: boolean, dateKey: string) => void;
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
        {/* Check Button - 即座に反応 */}
        <button
          type="button"
          onClick={() => onToggle(habit.id, !checked, currentDateKey)}
          className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-all active:scale-95",
            checked
              ? `bg-gradient-to-br ${colors.gradient} text-white shadow-lg`
              : showWarning
              ? "bg-rose-100 text-rose-400 hover:bg-rose-200"
              : "glass text-slate-300 hover:bg-white/80 hover:text-slate-400"
          )}
          aria-pressed={checked}
        >
          {checked ? (
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
