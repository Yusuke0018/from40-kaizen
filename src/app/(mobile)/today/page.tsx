"use client";

import Image from "next/image";
import { Camera, Droplets, Moon } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import { calcSleepHours, todayKey } from "@/lib/date";
import { storage } from "@/lib/firebase/client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
});

export default function TodayPage() {
  const { user } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [record, setRecord] = useState<DailyRecord>(createEmptyRecord(todayKey()));
  const [, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mealTime, setMealTime] = useState("");
  const [mealNote, setMealNote] = useState("");
  const [mealPhotoUrl, setMealPhotoUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    void refreshRecord(selectedDate);
  }, [user, selectedDate, refreshRecord]);

  const computedSleepHours = useMemo(
    () => calcSleepHours(record.date, record.sleepStart, record.sleepEnd),
    [record.date, record.sleepStart, record.sleepEnd]
  );

  async function handleSave() {
    if (!user) return;
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
    } catch (error) {
      console.error(error);
      setErrorMessage("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!user) return;
    setUploading(true);
    setUploadError(null);
    try {
      const storageRef = ref(
        storage,
        `users/${user.uid}/photos/${selectedDate}/${Date.now()}-${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setRecord((prev) => ({
        ...prev,
        photoUrls: [...prev.photoUrls, url],
      }));
      setMealPhotoUrl(url);
    } catch (error) {
      console.error(error);
      setUploadError("写真のアップロードに失敗しました。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddMeal() {
    if (!mealNote && !mealPhotoUrl) return;
    const time =
      mealTime ||
      new Date().toTimeString().slice(0, 5); // HH:MM
    setRecord((prev) => {
      const prevMeals = prev.meals ?? [];
      const newMeal = {
        id: `${Date.now()}-${prevMeals.length}`,
        time,
        note: mealNote,
        photoUrl: mealPhotoUrl,
      };
      const nextMeals = [...prevMeals, newMeal];
      const aggregatedNote = nextMeals
        .map((meal) =>
          meal.time ? `[${meal.time}] ${meal.note ?? ""}`.trim() : meal.note
        )
        .filter(Boolean)
        .join(" / ");
      return {
        ...prev,
        meals: nextMeals,
        mealsNote: aggregatedNote,
      };
    });
    setMealTime("");
    setMealNote("");
    setMealPhotoUrl(null);
    setUploadError(null);
  }

  return (
    <div className="space-y-6 pb-16 md:pb-10" id="record">
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
                void handleSave();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="体重 (kg)"
                  type="number"
                  value={record.weightKg ?? ""}
                  placeholder="65.2"
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      weightKg: value === "" ? null : Number(value),
                    }))
                  }
                />
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
            title="Nutrition"
            description="摂取時間・メモ・写真で食事を記録します。"
            icon={<Droplets className="h-4 w-4 text-sky-500" />}
            accent="amber"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
                <Field
                  label="摂取時間"
                  type="time"
                  value={mealTime}
                  placeholder=""
                  onChange={(value) => setMealTime(value)}
                />
                <Field
                  label="食事メモ"
                  as="textarea"
                  placeholder="例: オートミール＋ヨーグルト、間食なし"
                  value={mealNote}
                  onChange={(value) => setMealNote(value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handlePhotoUpload(file);
                  }}
                />
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                  {uploading
                    ? "写真アップロード中…"
                    : mealPhotoUrl
                    ? "写真を変更"
                    : "写真を追加"}
                </button>
                {mealPhotoUrl && (
                  <span className="text-xs text-slate-500">
                    写真を選択済み（保存すると食事に紐づきます）
                  </span>
                )}
                {uploadError && (
                  <p className="text-xs font-semibold text-red-500">
                    {uploadError}
                  </p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="水分量 (ml)"
                  type="number"
                  placeholder="1,600"
                  value={record.hydrationMl ?? ""}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      hydrationMl: value === "" ? null : Number(value),
                    }))
                  }
                />
                <Field
                  label="消費カロリー"
                  type="number"
                  placeholder="1,850"
                  value={record.calories ?? ""}
                  onChange={(value) =>
                    setRecord((prev) => ({
                      ...prev,
                      calories: value === "" ? null : Number(value),
                    }))
                  }
                />
              </div>
              <Button
                type="button"
                onClick={handleAddMeal}
                disabled={saving || (mealNote === "" && !mealPhotoUrl)}
              >
                食事を追加
              </Button>
              {(record.meals ?? []).length > 0 && (
                <div className="mt-2 space-y-2">
                  {(record.meals ?? []).map((meal) => (
                    <div
                      key={meal.id}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700"
                    >
                      {meal.photoUrl && (
                        <Image
                          src={meal.photoUrl}
                          alt={meal.note || "meal"}
                          width={64}
                          height={64}
                          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {meal.time || "時間未入力"}
                        </p>
                        <p className="mt-1 whitespace-pre-line text-xs">
                          {meal.note || "メモなし"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <MoodRange
                title="1日の体調"
                helper="夕方〜夜の状態"
                value={record.moodEvening ?? 3}
                tone="indigo"
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
                onChange={(value) =>
                  setRecord((prev) => ({
                    ...prev,
                    challenge: value,
                  }))
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSave()}
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
};

function Field({ label, placeholder, type, value, onChange, as }: FieldProps) {
  if (as === "textarea") {
    return (
      <label className="block text-left">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <textarea
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50"
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-50"
      />
    </label>
  );
}

function MoodRange({
  title,
  helper,
  value,
  onChange,
  tone = "mint",
}: {
  title: string;
  helper: string;
  value: number;
  onChange: (value: number) => void;
  tone?: "mint" | "sky" | "indigo" | "violet" | "rose";
}) {
  const toneContainer =
    tone === "sky"
      ? "border-sky-100"
      : tone === "indigo"
      ? "border-indigo-100"
      : tone === "violet"
      ? "border-violet-100"
      : tone === "rose"
      ? "border-rose-100"
      : "border-mint-100";

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
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn("mt-3 w-full", toneAccent)}
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

function StatTile({ label, value, unit, tone = "mint" }: StatTileProps) {
  const toneClasses =
    tone === "sky"
      ? "border-sky-100 bg-gradient-to-br from-sky-50 to-white"
      : tone === "indigo"
      ? "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white"
      : tone === "violet"
      ? "border-violet-100 bg-gradient-to-br from-violet-50 to-white"
      : tone === "rose"
      ? "border-rose-100 bg-gradient-to-br from-rose-50 to-white"
      : "border-mint-100 bg-gradient-to-br from-mint-50 to-white";

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
        "rounded-xl border p-4 shadow-sm transition-colors",
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-soft)]">
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
