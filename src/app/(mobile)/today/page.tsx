"use client";

import Image from "next/image";
import {
  Activity,
  Camera,
  Coffee,
  Droplets,
  HeartPulse,
  Moon,
} from "lucide-react";
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
    } catch (error) {
      console.error(error);
      setUploadError("写真のアップロードに失敗しました。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const missions = [
    { id: 1, title: "22:30就寝チャレンジ", note: "5/7達成", checked: true },
    { id: 2, title: "13時以降カフェインなし", note: "あと2日", checked: false },
    { id: 3, title: "朝の散歩10分", note: "天気◎", checked: true },
  ];

  return (
    <div className="space-y-6 pb-16 md:pb-10" id="record">
      {/* 入力コンテキスト */}
      <section className="rounded-3xl border border-slate-900/5 bg-slate-950/90 p-5 text-slate-100 shadow-lg shadow-slate-900/40 backdrop-blur md:flex md:items-center md:justify-between md:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-mint-300">
              EXPERIMENT FOCUS
            </p>
            <h2 className="pt-2 text-2xl font-semibold text-white">
              生活リズム×栄養カイゼン
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              max={todayKey()}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(todayKey())}
              className="text-xs font-semibold text-mint-300"
            >
              今日
            </button>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-200">
          左側のカードは
          <span className="font-semibold text-mint-200">「入力エリア」</span>
          、下の白いカードは
          <span className="font-semibold text-sky-200">「結果とログ」</span>
          です。朝・夜で分けて、感情やHRVも一緒に記録しましょう。
        </p>
        {statusMessage && (
          <p className="pt-3 text-sm font-semibold text-mint-300">
            {statusMessage}
          </p>
        )}
        {errorMessage && (
          <p className="pt-3 text-sm font-semibold text-red-300">{errorMessage}</p>
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
          <h3 className="text-lg font-semibold">水分＆食事メモ</h3>
        </div>
        <p className="text-sm text-slate-500">食事内容や気付きを写真つきで残します。</p>
        <div className="mt-4 grid gap-3">
          <Field
            label="食事メモ"
            as="textarea"
            placeholder="例: 朝はオートミールとギリシャヨーグルト、間食なし"
            value={record.mealsNote}
            onChange={(value) =>
              setRecord((prev) => ({
                ...prev,
                mealsNote: value,
              }))
            }
          />
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
          <div className="flex flex-wrap gap-2 text-[0.75rem]">
            <Chip icon={Coffee}>
              カフェイン {record.mealsNote.includes("カフェイン") ? "有り" : "0杯"}
            </Chip>
            <Chip icon={Activity}>
              歩数 {record.steps ? record.steps.toLocaleString() : "未入力"}
            </Chip>
            <Chip icon={HeartPulse}>
              HRV {record.hrv != null ? `${record.hrv}ms` : "未入力"}
            </Chip>
          </div>
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
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-mint-300 bg-mint-50/80 py-4 text-sm font-semibold text-mint-600"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
            {uploading ? "アップロード中…" : "食事写真を追加"}
          </button>
          {uploadError && (
            <p className="text-sm font-semibold text-red-500">{uploadError}</p>
          )}
          {record.photoUrls.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {record.photoUrls.map((url) => (
                <Image
                  key={url}
                  src={url}
                  alt="meal"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl object-cover shadow"
                />
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

      <section className="rounded-3xl border border-sky-100/70 bg-gradient-to-br from-sky-50 to-white p-5 shadow-inner shadow-sky-100/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">週間ミッション</h3>
            <p className="text-sm text-slate-500">ルーティン強化のための小さな約束。</p>
          </div>
          <button className="text-xs font-semibold text-sky-600" type="button">
            編集する
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {missions.map((mission) => (
            <label
              key={mission.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <input
                type="checkbox"
                defaultChecked={mission.checked}
                className="h-5 w-5 rounded-full border-mint-400 text-mint-500"
              />
              <div>
                <p>{mission.title}</p>
                <span className="text-xs font-medium text-slate-400">
                  {mission.note}
                </span>
              </div>
            </label>
          ))}
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
        min="1"
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

function Chip({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint-100/80 px-3 py-1 text-xs font-medium text-mint-700">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}
