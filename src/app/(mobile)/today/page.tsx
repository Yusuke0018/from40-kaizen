import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  Camera,
  Coffee,
  Droplets,
  HeartPulse,
  Moon,
} from "lucide-react";

const quickStats = [
  {
    label: "今週の平均睡眠",
    value: "7時間42分",
    helper: "+18分 vs 先週",
  },
  { label: "気分スコア", value: "4.2 / 5", helper: "安定しています" },
  { label: "歩数", value: "8,950歩", helper: "目標まであと1,050" },
];

const missions = [
  { id: 1, title: "22:30就寝チャレンジ", note: "5/7達成", checked: true },
  { id: 2, title: "13時以降カフェインなし", note: "あと2日", checked: false },
  { id: 3, title: "朝の散歩10分", note: "天気◎", checked: true },
];

const experiments = [
  "砂糖リセット3週目",
  "夜スクリーンオフ30分前",
  "朝の白湯",
];

export default function TodayPage() {
  return (
    <div className="space-y-6 pb-16" id="record">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-200/50 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          EXPERIMENT FOCUS
        </p>
        <h2 className="pt-2 text-2xl font-semibold text-slate-900">
          生活リズム×栄養カイゼン
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          睡眠と血糖コントロールを中心に、刺激物を控えて体調の変化を観察します。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {experiments.map((item) => (
            <span
              key={item}
              className="rounded-full border border-mint-200/80 bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">今日のスナップショット</h3>
          <button className="text-sm font-semibold text-mint-600">更新</button>
        </div>
        <div className="grid gap-3">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-mint-100/60"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm text-slate-500">{stat.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-mint-100/80 bg-gradient-to-br from-mint-50 to-white p-5 shadow-inner shadow-mint-100/60">
        <h3 className="text-lg font-semibold text-slate-900">
          朝のチェックイン
        </h3>
        <p className="text-sm text-slate-500">
          目覚めてすぐに入力する基本データです。
        </p>
        <form className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="体重 (kg)" type="number" placeholder="65.2" />
            <Field label="睡眠時間" type="text" placeholder="7時間45分" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="就寝時刻" type="time" />
            <Field label="起床時刻" type="time" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="睡眠時平均心拍"
              type="number"
              placeholder="54 bpm"
            />
            <Field label="起床時の体調" type="text" placeholder="ややだるい" />
          </div>
          <MoodRange title="気分" helper="今日はどれくらい晴れていますか？" />
          <MoodRange title="眠気" helper="午前中の眠気レベル" />
          <button
            className="w-full rounded-full bg-mint-500 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/60"
            type="button"
          >
            朝の記録を保存
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-sky-100/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-sky-500" />
          <h3 className="text-lg font-semibold">水分＆食事メモ</h3>
        </div>
        <p className="text-sm text-slate-500">
          食事内容や気付きを写真つきで残します。
        </p>
        <div className="mt-4 grid gap-3">
          <Field
            label="食事メモ"
            as="textarea"
            placeholder="例: 朝はオートミールとギリシャヨーグルト、間食なし"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="水分量 (ml)" type="number" placeholder="1,600" />
            <Field label="消費カロリー" type="number" placeholder="1,850" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip icon={Coffee}>カフェイン0杯</Chip>
            <Chip icon={Activity}>軽い運動 25分</Chip>
            <Chip icon={HeartPulse}>ストレス 2/5</Chip>
          </div>
          <button
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-mint-300 bg-mint-50/80 py-4 text-sm font-semibold text-mint-600"
            type="button"
          >
            <Camera className="h-4 w-4" />
            食事写真を追加
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-100/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-mint-500" />
          <div>
            <h3 className="text-lg font-semibold">夜の振り返り</h3>
            <p className="text-sm text-slate-500">
              1日の体調と学びをまとめます。
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <MoodRange title="1日の体調" helper="夕方〜夜の状態" />
          <MoodRange title="気分" helper="総合的な満足度" />
          <Field
            label="ハイライト"
            as="textarea"
            placeholder="例: ミッション達成、集中力高め"
          />
          <Field
            label="課題・気付き"
            as="textarea"
            placeholder="例: 夕方に甘いもの欲求、寝る前スマホ触ってしまった"
          />
          <button
            className="w-full rounded-full bg-sky-400 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/60"
            type="button"
          >
            1日の記録を保存
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100/70 bg-gradient-to-br from-sky-50 to-white p-5 shadow-inner shadow-sky-100/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">週間ミッション</h3>
            <p className="text-sm text-slate-500">
              ルーティン強化のための小さな約束。
            </p>
          </div>
          <button className="text-xs font-semibold text-sky-600">
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

type FieldProps =
  | {
      label: string;
      placeholder?: string;
      type?: string;
      as?: "input";
    }
  | {
      label: string;
      placeholder?: string;
      as: "textarea";
    };

function Field(props: FieldProps) {
  const { label, placeholder } = props;
  if (props.as === "textarea") {
    return (
      <label className="space-y-2 text-left">
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
          {label}
        </span>
        <textarea placeholder={placeholder} />
      </label>
    );
  }
  return (
    <label className="space-y-2 text-left">
      <span className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
      <input type={props.type ?? "text"} placeholder={placeholder} />
    </label>
  );
}

function MoodRange({
  title,
  helper,
}: {
  title: string;
  helper: string;
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
        <span className="text-sm font-semibold text-mint-600">3 / 5</span>
      </div>
      <input
        type="range"
        min="1"
        max="5"
        defaultValue="3"
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
  children: ReactNode;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint-100/80 px-3 py-1 text-xs font-medium text-mint-700">
      <Icon className="h-4 w-4" />
      {children}
    </span>
  );
}
