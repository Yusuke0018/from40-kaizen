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
  sleepiness: 3,
  hydrationMl: null,
  calories: null,
  steps: null,
  mealsNote: "",
  meals: [],
  emotionNote: "",
  highlight: "",
  challenge: "",
  journal: "",
  photoUrls: [],
  healthCheck: false,
  workCheck: false,
  familyCheck: false,
  tradeOffs: [],
  missNext: [],
  tomorrowAction: "",
  verdict: null,
});

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
  const [canEditMorning, setCanEditMorning] = useState(true);
  const [canEditEvening, setCanEditEvening] = useState(true);

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
      return {
        ...createEmptyRecord(date),
        ...data,
        date,
        photoUrls: data.photoUrls ?? [],
        meals: (data as DailyRecord).meals ?? [],
        tradeOffs: (data as DailyRecord).tradeOffs ?? [],
        missNext: (data as DailyRecord).missNext ?? [],
        healthCheck: data.healthCheck ?? false,
        workCheck: data.workCheck ?? false,
        familyCheck: data.familyCheck ?? false,
        tomorrowAction: data.tomorrowAction ?? "",
        verdict: data.verdict ?? null,
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
        setRecord(data ?? createEmptyRecord(date));
        const isNew = !data;
        setCanEditMorning(isNew);
        setCanEditEvening(isNew);
      } catch (err) {
        console.error(err);
        setErrorMessage("既存データの取得に失敗しました。");
        setRecord(createEmptyRecord(date));
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
      const res = await fetch("/api/goals", {
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
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void refreshRecord(selectedDate);
  }, [user, selectedDate, refreshRecord]);

  useEffect(() => {
    if (!user) return;
    void loadGoals();
  }, [user, loadGoals]);

  const computedSleepHours = useMemo(
    () => calcSleepHours(record.date, record.sleepStart, record.sleepEnd),
    [record.date, record.sleepStart, record.sleepEnd]
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
        sleepHours: computedSleepHours ?? record.sleepHours,
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

  return (
    <div className="space-y-6 pb-16 md:pb-10" id="record">
      {/* 現在有効な目標 */}
      {goals.length > 0 && (
        <section className="rounded-xl border-2 border-slate-900 bg-rose-50/80 p-4 shadow-[var(--shadow-soft)]">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-rose-500">
            Current Goals
          </p>
          <div className="mt-2 space-y-2">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="space-y-1 rounded-lg border-2 border-slate-900 bg-white/90 p-3 text-xs text-rose-900"
              >
                <p className="font-semibold">{goal.text}</p>
                <p className="text-[0.7rem] text-rose-500">
                  期間: {formatGoalDate(goal.startDate)} 〜{" "}
                  {formatGoalDate(goal.endDate)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {goalsError && (
        <section className="text-xs">
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 font-semibold text-rose-600">
            {goalsError}
          </p>
        </section>
      )}
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

      {/* スナップショット */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="SLEEP"
          value={computedSleepHours ? `${computedSleepHours}h` : "--"}
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
                  <Field
                    label="就寝時刻"
                    type="time"
                    value={record.sleepStart ?? ""}
                    disabled={!canEditMorning}
                    onChange={(value) =>
                      setRecord((prev) => ({
                        ...prev,
                        sleepStart: value,
                      }))
                    }
                  />
                  <Field
                    label="起床時刻"
                    type="time"
                    value={record.sleepEnd ?? ""}
                    disabled={!canEditMorning}
                    onChange={(value) =>
                      setRecord((prev) => ({
                        ...prev,
                        sleepEnd: value,
                      }))
                    }
                  />
                </div>
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
                    H / W / F チェック
                  </p>
                  <p className="text-[0.7rem] text-slate-400">タップで○×</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <PillToggle
                    label="H"
                    description="運動・ストレッチ"
                    active={record.healthCheck}
                    disabled={!canEditEvening}
                    onClick={() =>
                      setRecord((prev) => ({
                        ...prev,
                        healthCheck: !prev.healthCheck,
                      }))
                    }
                  />
                  <PillToggle
                    label="W"
                    description="未来の一手"
                    active={record.workCheck}
                    disabled={!canEditEvening}
                    onClick={() =>
                      setRecord((prev) => ({
                        ...prev,
                        workCheck: !prev.workCheck,
                      }))
                    }
                  />
                  <PillToggle
                    label="F"
                    description="家族への一手"
                    active={record.familyCheck}
                    disabled={!canEditEvening}
                    onClick={() =>
                      setRecord((prev) => ({
                        ...prev,
                        familyCheck: !prev.familyCheck,
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
                    <div key={`to-${index}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        maxLength={50}
                        disabled={!canEditEvening}
                        onChange={(event) => {
                          const next = [...record.tradeOffs];
                          next[index] = event.target.value;
                          setRecord((prev) => ({ ...prev, tradeOffs: next }));
                        }}
                        placeholder="捨てたもの → 取ったもの"
                        className={cn(
                          "flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50",
                          !canEditEvening && "cursor-default bg-slate-100 text-slate-400"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...record.tradeOffs];
                          next.splice(index, 1);
                          setRecord((prev) => ({ ...prev, tradeOffs: next }));
                        }}
                        disabled={!canEditEvening}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRecord((prev) => ({
                      ...prev,
                      tradeOffs: [...prev.tradeOffs, ""],
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

              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  判定（任意）
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "optimal", label: "◎ 最適" },
                    { value: "good", label: "○ まぁ良い" },
                    { value: "compromise", label: "× ごまかし" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!canEditEvening}
                      onClick={() =>
                        setRecord((prev) => ({
                          ...prev,
                          verdict:
                            prev.verdict === option.value
                              ? null
                              : (option.value as DailyRecord["verdict"]),
                        }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-bold transition-all",
                        record.verdict === option.value
                          ? "border-slate-900 bg-white text-slate-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                        !canEditEvening && "cursor-default opacity-60"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-[0.7rem] text-slate-500">
                  メイン対象が一つ / メインの質7点以上 / 何を捨てたか明確、の3条件で判定。
                </p>
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
        "flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-center text-xs font-bold shadow-sm transition-all",
        active
          ? "border-slate-900 bg-white text-slate-900"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
        disabled && "cursor-default opacity-60"
      )}
    >
      <span className="text-base">{active ? "○" : "×"}</span>
      <div className="mt-1">
        <span className="text-sm">{label}</span>
        <p className="mt-1 text-[0.65rem] font-medium text-slate-400">
          {description}
        </p>
      </div>
    </button>
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
