"use client";

import Image from "next/image";
import { Camera, Droplets, Moon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import type { DailyRecord } from "@/types/daily-record";
import { calcSleepHours, todayKey } from "@/lib/date";
import { storage } from "@/lib/firebase/client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const createEmptyRecord = (date: string): DailyRecord => ({
  date,
  weightKg: null,
  sleepStart: null,
  sleepEnd: null,
  sleepHours: null,
  avgSleepHr: null,
  hrv: null,
  wakeCondition: "",
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
  const [loading, setLoading] = useState(true);
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

  const quickStats = [
    {
      label: "睡眠時間",
      value: computedSleepHours ? `${computedSleepHours}h` : "未入力",
      helper:
        record.sleepStart && record.sleepEnd
          ? `${record.sleepStart} – ${record.sleepEnd}`
          : "就寝/起床を入力",
    },
    {
      label: "気分スコア",
      value: `${record.moodMorning ?? 3} / 5`,
      helper: "朝の気分",
    },
    {
      label: "HRV",
      value: record.hrv != null ? `${record.hrv}ms` : "未入力",
      helper: "朝一番のHRV",
    },
    {
      label: "歩数",
      value: record.steps ? `${record.steps.toLocaleString()}歩` : "未入力",
      helper: "記録を追加しましょう",
    },
  ];

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
      {/* 入力コンテキスト */}
      <section className="rounded-3xl border border-mint-100/70 bg-gradient-to-r from-mint-100 via-sky-50 to-white p-5 text-slate-900 shadow-lg shadow-mint-200/40 backdrop-blur md:flex md:items-center md:justify-between md:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint-600">
              EXPERIMENT FOCUS
            </p>
            <h2 className="pt-2 text-2xl font-semibold text-slate-900">
              生活リズム×栄養カイゼン
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              max={todayKey()}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-full border border-mint-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className="text-xs font-semibold text-mint-700"
            >
              今日
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          左側のカードは
          <span className="font-semibold text-mint-700">「入力エリア」</span>
          、下の白いカードは
          <span className="font-semibold text-sky-700">「結果とログ」</span>
          です。朝・夜で分けて、感情やHRVも一緒に記録しましょう。
        </p>
        {statusMessage && (
          <p className="pt-3 text-sm font-semibold text-mint-700">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <p className="pt-3 text-sm font-semibold text-red-500">{errorMessage}</p>
        )}
      </section>

      {/* 結果サマリー */}
      <section className="space-y-3 md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] md:gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            今日のスナップショット
          </h3>
          <button
            className="text-sm font-semibold text-mint-600"
            onClick={() => void refreshRecord(selectedDate)}
            disabled={loading}
          >
            {loading ? "更新中…" : "再読込"}
          </button>
        </div>
        <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-900/5 bg-white p-4 shadow-sm shadow-slate-200/70"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.helper}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 入力：朝のチェックイン */}
      <section className="rounded-3xl border border-mint-100/80 bg-gradient-to-br from-mint-50 to-white p-5 shadow-inner shadow-mint-100/60">
        <h3 className="text-lg font-semibold text-slate-900">朝のチェックイン</h3>
        <p className="text-sm text-slate-500">目覚めてすぐに入力する基本データです。</p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
            <Field
              label="歩数"
              type="number"
              value={record.steps ?? ""}
              placeholder="8,000"
              onChange={(value) =>
                setRecord((prev) => ({
                  ...prev,
                  steps: value === "" ? null : Number(value),
                }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="grid gap-3 sm:grid-cols-2">
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
              label="起床時の体調"
              type="text"
              placeholder="ややだるい"
              value={record.wakeCondition ?? ""}
              onChange={(value) =>
                setRecord((prev) => ({
                  ...prev,
                  wakeCondition: value,
                }))
              }
            />
          </div>
          <Field
            label="起床時HRV (ms)"
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
          <MoodRange
            title="気分"
            helper="今日はどれくらい晴れていますか？"
            value={record.moodMorning ?? 3}
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
            onChange={(value) =>
              setRecord((prev) => ({
                ...prev,
                sleepiness: value,
              }))
            }
          />
          <button
            className="w-full rounded-full bg-mint-500 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/60 disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving ? "保存中…" : "朝の記録を保存"}
          </button>
        </form>
      </section>

      {/* 入力：水分＆食事メモ */}
      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-sky-100/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-500" />
          <h3 className="text-lg font-semibold">今日の食事ログ</h3>
        </div>
        <p className="text-sm text-slate-500">
          摂取時間・メモ・写真をセットで、1日に何回でも追加できます。
        </p>
        <div className="mt-4 space-y-4">
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
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm disabled:opacity-60"
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
              <p className="text-xs font-semibold text-red-500">{uploadError}</p>
            )}
          </div>
          <button
            className="w-full rounded-full bg-sky-400 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200/70 disabled:opacity-60"
            type="button"
            onClick={handleAddMeal}
            disabled={saving || (mealNote === "" && !mealPhotoUrl)}
          >
            食事を追加
          </button>
          {(record.meals ?? []).length > 0 && (
            <div className="mt-3 space-y-2">
              {(record.meals ?? []).map((meal) => (
                <div
                  key={meal.id}
                  className="flex gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/80 p-3 text-xs text-slate-700"
                >
                  {meal.photoUrl && (
                    <Image
                      src={meal.photoUrl}
                      alt={meal.note || "meal"}
                      width={64}
                      height={64}
                      className="h-16 w-16 flex-shrink-0 rounded-xl object-cover shadow-sm"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {meal.time || "時間未入力"}
                    </p>
                    <p className="mt-1 text-xs whitespace-pre-line">
                      {meal.note || "メモなし"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 入力：夜の振り返り */}
      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-mint-100/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-mint-500" />
          <div>
            <h3 className="text-lg font-semibold">夜の振り返り</h3>
            <p className="text-sm text-slate-500">1日の体調と学びをまとめます。</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <MoodRange
            title="1日の体調"
            helper="夕方〜夜の状態"
            value={record.moodEvening ?? 3}
            onChange={(value) =>
              setRecord((prev) => ({
                ...prev,
                moodEvening: value,
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
          <button
            className="w-full rounded-full bg-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/60 disabled:opacity-70"
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "保存中…" : "1日の記録を保存"}
          </button>
        </div>
      </section>

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
      <label className="space-y-2 text-left">
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <textarea
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="space-y-2 text-left">
      <span className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <input
        type={type ?? "text"}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MoodRange({
  title,
  helper,
  value,
  onChange,
}: {
  title: string;
  helper: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-mint-100/70 bg-white/70 p-4">
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint-500">
            {title}
          </p>
          <p className="text-[0.75rem] text-slate-500">{helper}</p>
        </div>
        <span className="text-sm font-semibold text-mint-600">{value} / 5</span>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-mint-500"
      />
      <div className="mt-1 flex justify-between text-[0.65rem] text-slate-400">
        <span>低い</span>
        <span>高い</span>
      </div>
    </div>
  );
}
