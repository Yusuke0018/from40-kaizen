"use client";

import { Moon } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import type { Goal } from "@/types/goal";
import { calcSleepHours, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const createEmptyRecord = (date: string): DailyRecord => ({
  date,
  weightKg: null,
  sleepStart: null,
  sleepEnd: null,
  sleepHours: null,
  avgSleepHr: null,
  hrv: null,
  wakeCondition: 3,
  moodMorning: 3,
  moodEvening: 3,
  concentrationEvening: 3,
  sleepiness: 3,
  calories: null,
  steps: null,
  mealsNote: "",
  meals: [],
  emotionNote: "",
  highlight: "",
  challenge: "",
  journal: "",
  photoUrls: [],
  phoneAway: false,
  gratitudeShared: false,
  tradeOffs: [],
  missNext: [],
  tomorrowAction: "",
});

function normalizeTradeOffs(
  input?: DailyRecord["tradeOffs"] | (string | { give?: string; gain?: string })[]
): DailyRecord["tradeOffs"] {
  if (!input) return [];
  return input.map((item) => {
    if (typeof item === "string") {
      return { give: item, gain: "" };
    }
    return {
      give: item.give ?? "",
      gain: item.gain ?? "",
    };
  });
}

function previousDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function resolveSleepHours(record: DailyRecord) {
  if (record.sleepHours !== null && record.sleepHours !== undefined) {
    return record.sleepHours;
  }
  return calcSleepHours(record.date, record.sleepStart, record.sleepEnd);
}

function splitSleepDuration(hours: number | null | undefined) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) {
    return { hours: "", minutes: "" };
  }
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = Math.max(0, totalMinutes - h * 60);
  return { hours: String(h), minutes: String(m) };
}

function mergeSleepDuration(hours: string, minutes: string) {
  const hasHours = hours.trim() !== "";
  const hasMinutes = minutes.trim() !== "";
  if (!hasHours && !hasMinutes) return null;

  const h = Number(hours);
  const m = Number(minutes);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const clampedMinutes = Math.min(Math.max(m, 0), 59);
  const safeHours = Math.max(h, 0);

  return Number((safeHours + clampedMinutes / 60).toFixed(2));
}

function formatSleepDuration(hours: number | null | undefined) {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return "--";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes - h * 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function TodayPage() {
  const { user } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [record, setRecord] = useState<DailyRecord>(createEmptyRecord(todayKey()));
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [habitLoading, setHabitLoading] = useState<Record<string, boolean>>({});
  const [canEditMorning, setCanEditMorning] = useState(true);
  const [canEditEvening, setCanEditEvening] = useState(true);
  const [carryoverAction, setCarryoverAction] = useState<{
    date: string;
    action: string;
  } | null>(null);
  const [carryoverError, setCarryoverError] = useState<string | null>(null);
  const [carryoverLoading, setCarryoverLoading] = useState(false);
  const [sleepHoursInput, setSleepHoursInput] = useState("");
  const [sleepMinutesInput, setSleepMinutesInput] = useState("");

  const fetchRecord = useCallback(
    async (date: string) => {
      if (!user) return null;
      const token = await user.getIdToken();
      const res = await fetch(`/api/records?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load record");
      const data = (await res.json()) as DailyRecord;
      const normalizedSleepHours =
        data.sleepHours ?? calcSleepHours(date, data.sleepStart, data.sleepEnd);
      return {
        ...createEmptyRecord(date),
        ...data,
        date,
        sleepHours: normalizedSleepHours,
        photoUrls: data.photoUrls ?? [],
        meals: (data as DailyRecord).meals ?? [],
        tradeOffs: normalizeTradeOffs((data as DailyRecord).tradeOffs),
        missNext: (data as DailyRecord).missNext ?? [],
        concentrationEvening: data.concentrationEvening ?? 3,
        phoneAway: data.phoneAway ?? false,
        gratitudeShared: data.gratitudeShared ?? false,
        tomorrowAction: data.tomorrowAction ?? "",
      };
    },
    [user]
  );

  const refreshRecord = useCallback(
    async (date: string) => {
      if (!user) return;
      setLoading(true);
      setStatusMessage(null);
      setErrorMessage(null);
      try {
        const data = await fetchRecord(date);
        const nextRecord = data ?? createEmptyRecord(date);
        const durationParts = splitSleepDuration(resolveSleepHours(nextRecord));
        setSleepHoursInput(durationParts.hours);
        setSleepMinutesInput(durationParts.minutes);
        setRecord(nextRecord);
        const isNew = !data;
        setCanEditMorning(isNew);
        setCanEditEvening(isNew);
      } catch (err) {
        console.error(err);
        setErrorMessage("既存データの取得に失敗しました。");
        setRecord(createEmptyRecord(date));
        setSleepHoursInput("");
        setSleepMinutesInput("");
      } finally {
        setLoading(false);
      }
    },
    [user, fetchRecord]
  );

  const loadGoals = useCallback(async () => {
    if (!user) return;
    setGoalsError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/goals?date=${selectedDate}&limit=2`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load goals");
      }
      const data = (await res.json()) as Goal[];
      setGoals(data);
    } catch (error) {
      console.error(error);
      setGoalsError("目標の取得に失敗しました。時間をおいて再度お試しください。");
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user) return;
    void refreshRecord(selectedDate);
  }, [user, selectedDate, refreshRecord]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  }, [user, loadGoals]);

  const loadCarryoverAction = useCallback(
    async (date: string) => {
      if (!user) return;
      const prevDate = previousDateKey(date);
      setCarryoverAction(null);
      setCarryoverLoading(true);
      setCarryoverError(null);
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/records?date=${prevDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          setCarryoverAction({ date: prevDate, action: "" });
          return;
        }
        if (!res.ok) throw new Error("Failed to load previous action");
        const data = (await res.json()) as DailyRecord;
        setCarryoverAction({
          date: prevDate,
          action: data.tomorrowAction ?? "",
        });
      } catch (err) {
        console.error(err);
        setCarryoverError("前日の明日の一手を取得できませんでした。");
      } finally {
        setCarryoverLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    void loadCarryoverAction(selectedDate);
  }, [user, selectedDate, loadCarryoverAction]);

  const resolvedSleepHours = useMemo(() => resolveSleepHours(record), [record]);

  const sleepDurationDisplay = useMemo(
    () => formatSleepDuration(resolvedSleepHours),
    [resolvedSleepHours]
  );

  const updateSleepDuration = useCallback(
    (hours: string, minutes: string) => {
      setSleepHoursInput(hours);
      setSleepMinutesInput(minutes);
      setRecord((prev) => ({
        ...prev,
        sleepHours: mergeSleepDuration(hours, minutes),
        sleepStart: null,
        sleepEnd: null,
      }));
    },
    []
  );

  const handleSleepHoursChange = useCallback(
    (value: string) => {
      if (value === "") {
        updateSleepDuration("", sleepMinutesInput);
        return;
      }
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      const sanitized = Math.max(0, Math.floor(numeric)).toString();
      updateSleepDuration(sanitized, sleepMinutesInput);
    },
    [sleepMinutesInput, updateSleepDuration]
  );

  const handleSleepMinutesChange = useCallback(
    (value: string) => {
      if (value === "") {
        updateSleepDuration(sleepHoursInput, "");
        return;
      }
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return;
      const sanitized = Math.min(Math.max(numeric, 0), 59).toString();
      updateSleepDuration(sleepHoursInput, sanitized);
    },
    [sleepHoursInput, updateSleepDuration]
  );

  async function saveRecord() {
    if (!user) return false;
    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const token = await user.getIdToken();
      const payload = {
        ...record,
        sleepHours: resolvedSleepHours,
        date: selectedDate,
      };
      const res = await fetch("/api/records", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatusMessage("保存しました");
      return true;
    } catch (error) {
      console.error(error);
      setErrorMessage("保存に失敗しました。もう一度お試しください。");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMorning() {
    const ok = await saveRecord();
    if (ok) {
      setCanEditMorning(false);
    }
  }

  async function handleSaveEvening() {
    const ok = await saveRecord();
    if (ok) {
      setCanEditEvening(false);
    }
  }

  const handleHabitCheck = useCallback(
    async (goalId: string, nextChecked: boolean) => {
      if (!user) return;
      if (habitLoading[goalId]) return;
      setGoalsError(null);
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
            date: selectedDate,
            checked: nextChecked,
          }),
        });
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = (await res.json()) as {
          streak?: number;
          hallOfFameAt?: string | null;
        };
        setGoals((prev) =>
          prev.map((habit) =>
            habit.id === goalId
              ? {
                  ...habit,
                  checkedToday: nextChecked,
                  streak: data.streak ?? habit.streak ?? 0,
                  hallOfFameAt: data.hallOfFameAt ?? habit.hallOfFameAt ?? null,
                  isHallOfFame: Boolean(
                    data.hallOfFameAt ?? habit.hallOfFameAt
                  ),
                }
              : habit
          )
        );
      } catch (error) {
        console.error(error);
        setGoalsError("習慣のチェック更新に失敗しました。");
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
    [user, selectedDate, habitLoading]
  );

  return (
    <div className="space-y-6 pb-16 md:pb-10" id="record">
      {/* 習慣 */}
      <section className="rounded-xl border-2 border-slate-900 bg-rose-50/80 p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-rose-500">
              Habits (max 2)
            </p>
            <p className="text-[0.75rem] text-rose-500">
              毎日チェックして 90 日で殿堂入り
            </p>
          </div>
          <span className="rounded-full bg-white px-2 py-1 text-[0.7rem] font-bold text-rose-600">
            {formatGoalDate(selectedDate)}
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {(() => {
            const activeHabits = goals.filter((g) => !g.isHallOfFame).slice(0, 2);
            const hallOfFameHabits = goals.filter((g) => g.isHallOfFame);
            if (activeHabits.length === 0 && hallOfFameHabits.length === 0) {
              return (
                <p className="rounded-lg border border-dashed border-rose-100 bg-white/80 p-3 text-[0.8rem] text-rose-500">
                  まだ習慣がありません。設定画面から追加してください。
                </p>
              );
            }
            return (
              <>
                {activeHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onToggle={handleHabitCheck}
                    loading={habitLoading[habit.id]}
                    disabled={habit.isHallOfFame}
                  />
                ))}
                {hallOfFameHabits.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-amber-600">
                      殿堂入り
                    </p>
                    <div className="grid gap-2">
                      {hallOfFameHabits.map((habit) => (
                        <div
                          key={`hof-${habit.id}`}
                          className="rounded-lg border border-amber-200 bg-white/80 p-3 text-[0.8rem] font-semibold text-amber-800"
                        >
                          {habit.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        {goalsError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
            {goalsError}
          </p>
        )}
      </section>
      {/* ヘッダー */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Today Overview
          </h2>
          <p className="text-sm font-medium text-slate-500">
            今日のコンディションと実験ログを記録します。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            max={todayKey()}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
          />
          <button
            type="button"
            onClick={() => setSelectedDate(todayKey())}
            className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            今日
          </button>
        </div>
      </section>

      {(statusMessage || errorMessage) && (
        <section className="text-xs">
          {statusMessage && (
            <p className="rounded-lg border border-mint-200 bg-mint-50 px-3 py-2 font-semibold text-mint-700">
              {statusMessage}
            </p>
          )}
          {errorMessage && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-600">
              {errorMessage}
            </p>
          )}
        </section>
      )}

      <section className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-gradient-to-r from-amber-50 via-mint-50 to-sky-50 p-4 shadow-lg shadow-mint-900/10">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-amber-200 blur-3xl" />
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-mint-200 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em] text-slate-600">
              Yesterday&apos;s TMR
            </p>
            {carryoverAction?.date && (
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold text-white shadow-sm">
                {carryoverAction.date}
              </span>
            )}
          </div>
          {carryoverLoading ? (
            <p className="text-sm font-semibold text-slate-600">
              前日の「明日の一手」を読み込み中です…
            </p>
          ) : carryoverError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {carryoverError}
            </p>
          ) : carryoverAction && carryoverAction.action.trim() !== "" ? (
            <div className="flex items-start gap-3">
              <div className="mt-1 h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-mint-500 text-slate-900 shadow-md ring-2 ring-white">
                <div className="flex h-full w-full items-center justify-center font-mono text-sm font-extrabold">
                  ★
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {carryoverAction.action}
                </p>
                <p className="text-[0.75rem] font-medium text-slate-600">
                  前日に立てた「明日の一手」です。朝イチで実行しましょう。
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
              前日は「明日の一手」が未登録です。今夜の振り返りで1つだけ決めてみましょう。
            </p>
          )}
        </div>
      </section>

      {/* スナップショット */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="SLEEP"
          value={sleepDurationDisplay}
          tone="indigo"
        />
        <StatTile
          label="MORNING MOOD"
          value={record.moodMorning ?? "-"}
          unit="/ 5"
          tone="mint"
        />
        <StatTile label="HRV" value={record.hrv ?? "--"} unit="ms" tone="violet" />
        <StatTile
          label="STEPS"
          value={record.steps?.toLocaleString() ?? "--"}
          tone="sky"
        />
      </section>

      {/* 入力カード群 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左カラム：朝 + 食事 */}
        <div className="space-y-6">
          <SectionCard title="Morning Log" accent="mint">
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSaveMorning();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="体重 (kg)"
                  type="number"
                  value={record.weightKg ?? ""}
                  placeholder="65.2"
                  disabled={!canEditMorning}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      weightKg: value === "" ? null : Number(value),
                    }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCanEditMorning((prev) => !prev)}
                  className="text-[0.7rem] font-semibold text-slate-500 underline-offset-2 hover:text-mint-700"
                >
                  {canEditMorning ? "編集モード: ON" : "編集"}
                </button>
              </div>

              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  睡眠
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-left">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      睡眠時間 (時間)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="7"
                      value={sleepHoursInput}
                      disabled={!canEditMorning}
                      onChange={(event) =>
                        handleSleepHoursChange(event.target.value)
                      }
                      className={cn(
                        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50",
                        !canEditMorning && "cursor-default bg-slate-50 text-slate-400"
                      )}
                    />
                  </label>
                  <label className="block text-left">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                      睡眠時間 (分)
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      step="1"
                      inputMode="numeric"
                      placeholder="30"
                      value={sleepMinutesInput}
                      disabled={!canEditMorning}
                      onChange={(event) =>
                        handleSleepMinutesChange(event.target.value)
                      }
                      className={cn(
                        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50",
                        !canEditMorning && "cursor-default bg-slate-50 text-slate-400"
                      )}
                    />
                  </label>
                </div>
                <p className="text-[0.75rem] text-slate-500">
                  何時間・何分の形式で入力してください（例: 7時間30分なら「7」と「30」）。
                </p>
                <Field
                  label="睡眠時平均心拍"
                  type="number"
                  placeholder="54"
                  value={record.avgSleepHr ?? ""}
                  disabled={!canEditMorning}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      avgSleepHr: value === "" ? null : Number(value),
                    }))
                  }
                />
                <Field
                  label="睡眠時平均HRV (ms)"
                  type="number"
                  placeholder="65"
                  value={record.hrv ?? ""}
                  disabled={!canEditMorning}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      hrv: value === "" ? null : Number(value),
                    }))
                  }
                />
              </div>

              <MoodRange
                title="起床時の体調"
                helper="起きた直後の体調スコア"
                value={record.wakeCondition ?? 3}
                tone="sky"
                readOnly={!canEditMorning}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    wakeCondition: value,
                  }))
                }
              />
              <MoodRange
                title="朝の気分"
                helper="今日はどれくらい晴れていますか？"
                value={record.moodMorning ?? 3}
                tone="mint"
                readOnly={!canEditMorning}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    moodMorning: value,
                  }))
                }
              />
              <MoodRange
                title="眠気"
                helper="午前中の眠気レベル"
                value={record.sleepiness ?? 3}
                tone="rose"
                readOnly={!canEditMorning}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    sleepiness: value,
                  }))
                }
              />
              <Button type="submit" disabled={saving}>
                {saving ? "保存中…" : "朝の記録を保存"}
              </Button>
            </form>
          </SectionCard>

          <SectionCard
            title="AIカロリー・評価メモ"
            description="ChatGPT などで算出した結果を控えておきます。"
            accent="amber"
          >
            <div className="space-y-4">
              <Field
                label="AI算出カロリー (kcal)"
                type="number"
                placeholder="例: 1850"
                value={record.calories ?? ""}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    calories: value === "" ? null : Number(value),
                  }))
                }
              />
              <Field
                label="AI評価メモ"
                as="textarea"
                placeholder="例: タンパク質不足 / 炭水化物過多、改善案など"
                value={record.journal}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    journal: value,
                  }))
                }
              />
              <p className="text-[0.75rem] text-slate-500">
                ChatGPT などの診断結果を貼っておく欄です。保存すると他の記録と同じく Firestore に残ります。
              </p>
              <Button
                type="button"
                onClick={() => void saveRecord()}
                disabled={saving}
              >
                {saving ? "保存中…" : "AIメモを保存"}
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* 右カラム：夜 */}
        <div className="space-y-6">
          <SectionCard
            title="Evening Log"
            description="1日の体調と感情をまとめます。"
            icon={<Moon className="h-4 w-4 text-slate-500" />}
            accent="indigo"
          >
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCanEditEvening((prev) => !prev)}
                  className="text-[0.7rem] font-semibold text-slate-500 underline-offset-2 hover:text-mint-700"
                >
                  {canEditEvening ? "編集モード: ON" : "編集"}
                </button>
              </div>
              <MoodRange
                title="1日の体調"
                helper="夕方〜夜の状態"
                value={record.moodEvening ?? 3}
                tone="indigo"
                readOnly={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    moodEvening: value,
                  }))
                }
              />
              <MoodRange
                title="集中力"
                helper="夕方〜夜の集中度 (0-5)"
                value={record.concentrationEvening ?? 3}
                tone="violet"
                readOnly={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    concentrationEvening: value,
                  }))
                }
              />
              <Field
                label="1日の歩数"
                type="number"
                placeholder="8,000"
                value={record.steps ?? ""}
                disabled={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    steps: value === "" ? null : Number(value),
                  }))
                }
              />
              <Field
                label="今日の感情メモ"
                as="textarea"
                placeholder="例: 午前は穏やか、夕方はやや不安"
                value={record.emotionNote}
                disabled={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    emotionNote: value,
                  }))
                }
              />
              <Field
                label="ハイライト"
                as="textarea"
                placeholder="例: ミッション達成、集中力高め"
                value={record.highlight}
                disabled={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    highlight: value,
                  }))
                }
              />
              <Field
                label="課題・気付き"
                as="textarea"
                placeholder="例: 夕方に甘いもの欲求、寝る前スマホ触ってしまった"
                value={record.challenge}
                disabled={!canEditEvening}
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    challenge: value,
                  }))
                }
              />
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    夜のチェック
                  </p>
                  <p className="text-[0.7rem] text-slate-400">タップで○×</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <PillToggle
                    label="スマホ"
                    description="寝る前に手放した"
                    active={record.phoneAway}
                    disabled={!canEditEvening}
                    onClick={() =>
                      setRecord((prev) => ({
                        ...prev,
                        phoneAway: !prev.phoneAway,
                      }))
                    }
                  />
                  <PillToggle
                    label="感謝"
                    description="誰かに伝えた"
                    active={record.gratitudeShared}
                    disabled={!canEditEvening}
                    onClick={() =>
                      setRecord((prev) => ({
                        ...prev,
                        gratitudeShared: !prev.gratitudeShared,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    今日のトレードオフ【TO】
                  </p>
                  <p className="text-[0.7rem] text-indigo-500">「捨てた → 取った」</p>
                </div>
                {record.tradeOffs.length === 0 && (
                  <p className="text-[0.75rem] text-slate-500">
                    例: 寝る前スマホ30分 → 子どもと風呂
                  </p>
                )}
                <div className="space-y-2">
                  {record.tradeOffs.map((item, index) => (
                    <div
                      key={`to-${index}`}
                      className="grid gap-2 rounded-lg border border-indigo-100 bg-white/80 p-3 sm:grid-cols-2"
                    >
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-indigo-500">
                          捨てた
                        </p>
                        <input
                          type="text"
                          value={item.give}
                          maxLength={50}
                          disabled={!canEditEvening}
                          onChange={(event) => {
                            const next = [...record.tradeOffs];
                            next[index] = { ...next[index], give: event.target.value };
                            setRecord((prev) => ({ ...prev, tradeOffs: next }));
                          }}
                          placeholder="何を手放した？"
                          className={cn(
                            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50",
                            !canEditEvening && "cursor-default bg-slate-100 text-slate-400"
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-600">
                          取った
                        </p>
                        <input
                          type="text"
                          value={item.gain}
                          maxLength={50}
                          disabled={!canEditEvening}
                          onChange={(event) => {
                            const next = [...record.tradeOffs];
                            next[index] = { ...next[index], gain: event.target.value };
                            setRecord((prev) => ({ ...prev, tradeOffs: next }));
                          }}
                          placeholder="何を得た？"
                          className={cn(
                            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50",
                            !canEditEvening && "cursor-default bg-slate-100 text-slate-400"
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...record.tradeOffs];
                            next.splice(index, 1);
                            setRecord((prev) => ({ ...prev, tradeOffs: next }));
                          }}
                          disabled={!canEditEvening}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          このトレードオフを削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRecord((prev) => ({
                      ...prev,
                      tradeOffs: [...prev.tradeOffs, { give: "", gain: "" }],
                    }))
                  }
                  disabled={!canEditEvening}
                  className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  TO を追加
                </button>
              </div>

              <div className="space-y-3 rounded-lg border border-rose-100 bg-rose-50/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
                    しくじり【MISS】＋修正【NEXT】
                  </p>
                  <p className="text-[0.7rem] text-rose-500">事実と明日の行動セット</p>
                </div>
                {record.missNext.length === 0 && (
                  <p className="text-[0.75rem] text-slate-500">
                    例: MISS「昼休みスマホで潰れた」 / NEXT「昼休みに外を10分歩く」
                  </p>
                )}
                <div className="space-y-2">
                  {record.missNext.map((item, index) => (
                    <div
                      key={`mn-${index}`}
                      className="grid gap-2 rounded-lg border border-rose-100 bg-white/70 p-3 sm:grid-cols-2"
                    >
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-rose-500">
                          MISS
                        </p>
                        <input
                          type="text"
                          value={item.miss}
                          maxLength={80}
                          disabled={!canEditEvening}
                          onChange={(event) => {
                            const next = [...record.missNext];
                            next[index] = { ...next[index], miss: event.target.value };
                            setRecord((prev) => ({ ...prev, missNext: next }));
                          }}
                          placeholder="事実のみを書く"
                          className={cn(
                            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-rose-300 focus:ring-2 focus:ring-rose-50",
                            !canEditEvening && "cursor-default bg-slate-100 text-slate-400"
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-600">
                          NEXT
                        </p>
                        <input
                          type="text"
                          value={item.next}
                          maxLength={80}
                          disabled={!canEditEvening}
                          onChange={(event) => {
                            const next = [...record.missNext];
                            next[index] = { ...next[index], next: event.target.value };
                            setRecord((prev) => ({ ...prev, missNext: next }));
                          }}
                          placeholder="明日の具体的行動"
                          className={cn(
                            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50",
                            !canEditEvening && "cursor-default bg-slate-100 text-slate-400"
                          )}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...record.missNext];
                            next.splice(index, 1);
                            setRecord((prev) => ({ ...prev, missNext: next }));
                          }}
                          disabled={!canEditEvening}
                          className="w-full rounded-lg border border-rose-200 bg-white px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          このセットを削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRecord((prev) => ({
                      ...prev,
                      missNext: [...prev.missNext, { miss: "", next: "" }],
                    }))
                  }
                  disabled={!canEditEvening}
                  className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  MISS / NEXT を追加
                </button>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    明日の一手【TMR】
                  </p>
                  <p className="text-[0.7rem] text-slate-400">5〜15分で終わる行動</p>
                </div>
                <Field
                  label="◯◯を△分だけやる"
                  placeholder="例: 歯磨き中スクワット2セット"
                  value={record.tomorrowAction}
                  disabled={!canEditEvening}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      tomorrowAction: value,
                    }))
                  }
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveEvening()}
                disabled={saving}
              >
                {saving ? "保存中…" : "1日の記録を保存"}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value: string | number | null;
  onChange: (value: string) => void;
  as?: "textarea";
  disabled?: boolean;
};

function Field({
  label,
  placeholder,
  type,
  value,
  onChange,
  as,
  disabled,
}: FieldProps) {
  if (as === "textarea") {
    return (
      <label className="block text-left">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <textarea
          placeholder={placeholder}
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50",
            disabled && "cursor-default bg-slate-50 text-slate-400"
          )}
        />
      </label>
    );
  }

  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type ?? "text"}
        placeholder={placeholder}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50",
          disabled && "cursor-default bg-slate-50 text-slate-400"
        )}
      />
    </label>
  );
}

function PillToggle({
  label,
  description,
  active,
  onClick,
  disabled,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-center text-xs font-bold shadow-md transition-all",
        active
          ? "border-slate-900 bg-mint-100 text-slate-900 ring-2 ring-mint-400"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
        disabled && "cursor-default opacity-60"
      )}
    >
      <span className={cn("text-2xl", active ? "text-mint-700" : "text-slate-400")}>
        {active ? "◎" : "×"}
      </span>
      <div className="mt-1">
        <span className="text-sm">{label}</span>
        <p className="mt-1 text-[0.65rem] font-medium text-slate-400">
          {description}
        </p>
      </div>
    </button>
  );
}

function HabitCard({
  habit,
  onToggle,
  loading,
  disabled,
}: {
  habit: Goal;
  onToggle: (goalId: string, nextChecked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isHallOfFame = habit.isHallOfFame || Boolean(habit.hallOfFameAt);
  const checked = habit.checkedToday ?? false;
  const streak = habit.streak ?? 0;
  const progress = Math.min(90, streak);
  return (
    <div className="relative flex items-center gap-3 rounded-lg border-2 border-slate-900 bg-white/90 p-3 shadow-[var(--shadow-soft)]">
      {checked && (
        <div className="absolute right-2 top-2 rotate-6 rounded-full border-2 border-mint-600 bg-mint-50 px-2.5 py-1 text-[0.7rem] font-black text-mint-700 shadow-sm">
          <span aria-hidden="true">完</span>
          <span className="sr-only">今日の習慣を完了</span>
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{habit.text}</p>
          {isHallOfFame && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">
              殿堂入り
            </span>
          )}
        </div>
        <p className="text-[0.7rem] text-slate-500">
          期間: {formatGoalDate(habit.startDate)} 〜 {formatGoalDate(habit.endDate)}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[0.75rem] text-slate-600">
          <div className="flex-1 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-mint-500"
              style={{ width: `${(progress / 90) * 100}%` }}
            />
          </div>
          <span className="font-bold">{progress}/90</span>
          <span className="text-[0.65rem] text-slate-400">streak</span>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled || isHallOfFame || loading}
        onClick={() => onToggle(habit.id, !checked)}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-extrabold transition-all",
          checked
            ? "border-mint-500 bg-mint-100 text-mint-700 shadow-sm"
            : "border-slate-200 bg-white text-slate-300 hover:border-slate-300",
          (disabled || isHallOfFame || loading) && "cursor-default opacity-60",
          loading && "animate-pulse"
        )}
        aria-pressed={checked}
      >
        {loading ? "…" : checked ? "◎" : "○"}
      </button>
    </div>
  );
}

function MoodRange({
  title,
  helper,
  value,
  onChange,
  tone = "mint",
  readOnly = false,
}: {
  title: string;
  helper: string;
  value: number;
  onChange: (value: number) => void;
  tone?: "mint" | "sky" | "indigo" | "violet" | "rose";
  readOnly?: boolean;
}) {
  const toneContainer =
    tone === "sky"
      ? "border-2 border-slate-900"
      : tone === "indigo"
      ? "border-2 border-slate-900"
      : tone === "violet"
      ? "border-2 border-slate-900"
      : tone === "rose"
      ? "border-2 border-slate-900"
      : "border-2 border-slate-900";

  const toneTitle =
    tone === "sky"
      ? "text-sky-700"
      : tone === "indigo"
      ? "text-indigo-700"
      : tone === "violet"
      ? "text-violet-700"
      : tone === "rose"
      ? "text-rose-700"
      : "text-mint-700";

  const toneValue =
    tone === "sky"
      ? "text-sky-700"
      : tone === "indigo"
      ? "text-indigo-700"
      : tone === "violet"
      ? "text-violet-700"
      : tone === "rose"
      ? "text-rose-700"
      : "text-mint-700";

  const toneAccent =
    tone === "sky"
      ? "accent-sky-500"
      : tone === "indigo"
      ? "accent-indigo-500"
      : tone === "violet"
      ? "accent-violet-500"
      : tone === "rose"
      ? "accent-rose-500"
      : "accent-mint-500";

  return (
    <div
      className={cn(
        "rounded-lg border bg-white/95 p-4 shadow-[var(--shadow-soft)]",
        toneContainer
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.24em]",
              toneTitle
            )}
          >
            {title}
          </p>
          <p className="text-[0.75rem] text-slate-500">{helper}</p>
        </div>
        <span className={cn("text-sm font-semibold", toneValue)}>
          {value} / 5
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        value={value}
        disabled={readOnly}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "mt-3 w-full",
          toneAccent,
          readOnly && "cursor-default opacity-60"
        )}
      />
      <div className="mt-1 flex justify-between text-[0.65rem] text-slate-400">
        <span>低い</span>
        <span>高い</span>
      </div>
    </div>
  );
}

type StatTileProps = {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "mint" | "sky" | "indigo" | "violet" | "rose";
};

// 以前のアップロードUIを除去したため、関連ヘルパーは不要になりました。

function StatTile({ label, value, unit, tone = "mint" }: StatTileProps) {
  const toneClasses =
    tone === "sky"
      ? "border-2 border-slate-900 bg-gradient-to-br from-sky-50 to-white"
      : tone === "indigo"
      ? "border-2 border-slate-900 bg-gradient-to-br from-indigo-50 to-white"
      : tone === "violet"
      ? "border-2 border-slate-900 bg-gradient-to-br from-violet-50 to-white"
      : tone === "rose"
      ? "border-2 border-slate-900 bg-gradient-to-br from-rose-50 to-white"
      : "border-2 border-slate-900 bg-gradient-to-br from-mint-50 to-white";

  const valueColor =
    tone === "sky"
      ? "text-sky-800"
      : tone === "indigo"
      ? "text-indigo-800"
      : tone === "violet"
      ? "text-violet-800"
      : tone === "rose"
      ? "text-rose-800"
      : "text-mint-800";

  return (
    <div
      className={cn(
        "rounded-xl p-4 shadow-sm transition-colors",
        toneClasses
      )}
    >
      <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={cn("font-mono text-2xl font-extrabold", valueColor)}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-bold text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: "mint" | "sky" | "indigo" | "violet" | "rose" | "amber";
};

function SectionCard({
  title,
  description,
  icon,
  children,
  accent = "mint",
}: SectionCardProps) {
  const headerAccent =
    accent === "sky"
      ? "border-sky-100 bg-gradient-to-r from-sky-50/80 to-blue-50/80"
      : accent === "indigo"
      ? "border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-violet-50/80"
      : accent === "violet"
      ? "border-violet-100 bg-gradient-to-r from-violet-50/80 to-rose-50/80"
      : accent === "rose"
      ? "border-rose-100 bg-gradient-to-r from-rose-50/80 to-amber-50/80"
      : accent === "amber"
      ? "border-amber-100 bg-gradient-to-r from-amber-50/80 to-rose-50/80"
      : "border-mint-100 bg-gradient-to-r from-mint-50/80 to-sky-50/80";

  return (
    <section className="overflow-hidden rounded-xl border-2 border-slate-900 bg-white shadow-[var(--shadow-soft)]">
      <div className={cn("border-b px-5 py-3", headerAccent)}>
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {title}
            </h3>
            {description && (
              <p className="text-xs font-medium text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base =
    "w-full py-3 rounded-lg text-sm font-bold transition-all active:translate-y-[1px] disabled:opacity-60";
  const variantClass =
    variant === "primary"
      ? "bg-mint-600 text-white hover:bg-mint-700 shadow-sm"
      : "border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 bg-white";
  return (
    <button className={cn(base, variantClass, className)} {...props} />
  );
}

function formatGoalDate(input: string | null | undefined) {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}
