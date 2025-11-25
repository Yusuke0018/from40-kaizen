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
    <div className="space-y-6 pb-16">
      {/* ヘッダー */}
      <section>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          History
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          習慣の記録と統計を確認しましょう
        </p>
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

      {/* 習慣がない場合 */}
      {!loading && goals.length === 0 && (
        <section className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">
            まだ習慣が登録されていません
          </p>
          <p className="mt-2 text-xs text-slate-400">
            設定画面から習慣を追加してください
          </p>
        </section>
      )}

      {/* 習慣リスト */}
      {!loading &&
        goals.map((goal) => (
          <GoalHistoryCard
            key={goal.id}
            goal={goal}
            expanded={expandedGoalId === goal.id}
            onToggle={() => toggleExpand(goal.id)}
          />
        ))}

      {/* 凡例 */}
      {!loading && goals.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
            ルール説明
          </p>
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              <span className="font-bold text-mint-600">達成</span>: 2日に1回以上チェックすれば継続
            </p>
            <p>
              <span className="font-bold text-rose-600">リセット</span>: 3日以上空くと最初からカウント
            </p>
            <p>
              <span className="font-bold text-amber-600">殿堂入り</span>: 90日達成で殿堂入り
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function GoalHistoryCard({
  goal,
  expanded,
  onToggle,
}: {
  goal: GoalWithHistory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const stats = goal.stats;
  const checks = goal.checks || [];
  const progress = Math.min(90, stats?.progressToHallOfFame ?? 0);

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-white shadow-lg transition-all",
        goal.isHallOfFame ? "border-amber-400" : "border-slate-900"
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
              <Trophy className="h-5 w-5 text-amber-500" />
            )}
            <h3 className="text-base font-bold text-slate-900">{goal.text}</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatDate(goal.startDate)} 〜 {formatDate(goal.endDate)}
          </p>

          {/* 進捗バー */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  goal.isHallOfFame ? "bg-amber-500" : "bg-mint-500"
                )}
                style={{ width: `${(progress / 90) * 100}%` }}
              />
            </div>
            <span className="text-sm font-black text-slate-700">
              {progress}
              <span className="text-xs font-medium text-slate-400">/90</span>
            </span>
          </div>
        </div>
        <div className="ml-4">
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
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
              icon={<Flame className="h-4 w-4 text-orange-500" />}
              label="現在の連続"
              value={`${stats?.currentStreak ?? 0}日`}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-mint-600" />}
              label="最長連続"
              value={`${stats?.longestStreak ?? 0}日`}
            />
            <StatCard
              icon={<Calendar className="h-4 w-4 text-blue-500" />}
              label="総チェック"
              value={`${stats?.totalChecks ?? 0}回`}
            />
            <StatCard
              icon={<Target className="h-4 w-4 text-purple-500" />}
              label="達成率"
              value={`${stats?.completionRate ?? 0}%`}
            />
            <StatCard
              icon={<RotateCcw className="h-4 w-4 text-rose-500" />}
              label="リスタート"
              value={`${stats?.restartCount ?? 0}回`}
            />
            <StatCard
              icon={<Clock className="h-4 w-4 text-slate-500" />}
              label="平均間隔"
              value={`${stats?.averageInterval ?? 0}日`}
            />
          </div>

          {/* 追加情報 */}
          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
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
              <div className="flex justify-between text-xs">
                <span className="text-amber-600">殿堂入り日</span>
                <span className="font-bold text-amber-700">
                  {formatFullDate(goal.hallOfFameAt)}
                </span>
              </div>
            )}
          </div>

          {/* カレンダー表示 */}
          {checks.length > 0 && (
            <div className="mt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                最近のチェック履歴
              </p>
              <CheckCalendar checks={checks} />
            </div>
          )}

          {/* モチベーションメッセージ */}
          {goal.comment && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-mint-50 to-sky-50 p-4">
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
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-1 text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

function CheckCalendar({ checks }: { checks: CheckRecord[] }) {
  // 最近30日分を表示
  const today = new Date();
  const days: { date: string; checked: boolean }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    const dateKey = `${year}-${month}-${day}`;
    const checked = checks.some((c) => c.date === dateKey);
    days.push({ date: dateKey, checked });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((day) => (
        <div
          key={day.date}
          className={cn(
            "h-6 w-6 rounded-md text-center text-[0.6rem] font-bold leading-6 transition-colors",
            day.checked
              ? "bg-mint-500 text-white"
              : "bg-slate-100 text-slate-400"
          )}
          title={day.date}
        >
          {parseInt(day.date.split("-")[2], 10)}
        </div>
      ))}
    </div>
  );
}
