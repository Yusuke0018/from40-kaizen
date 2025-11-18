const filters = ["7日", "14日", "30日", "90日"];

const records = [
  {
    date: "6/12 (水)",
    mood: 4.5,
    condition: "安定",
    steps: "10,240歩",
    sleep: "7時間50分",
    highlight: "朝散歩＋ノンカフェインデー",
  },
  {
    date: "6/11 (火)",
    mood: 3.8,
    condition: "眠気あり",
    steps: "7,210歩",
    sleep: "6時間20分",
    highlight: "夜に甘いもの欲求",
  },
  {
    date: "6/10 (月)",
    mood: 4.2,
    condition: "好調",
    steps: "12,050歩",
    sleep: "8時間05分",
    highlight: "砂糖リセット継続",
  },
];

const correlations = [
  {
    label: "睡眠 × 気分",
    value: "+0.63",
    desc: "睡眠が長いほど気分スコアが高い傾向",
  },
  {
    label: "カフェイン量 × 眠気",
    value: "-0.38",
    desc: "午後のカフェインを控えると眠気が減少",
  },
];

export default function HistoryPage() {
  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-3xl border border-sky-100/70 bg-gradient-to-r from-sky-50 to-mint-50 p-5 shadow-inner shadow-sky-100/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              REVIEW MODE
            </p>
            <h2 className="text-xl font-semibold">過去の記録を俯瞰</h2>
          </div>
          <button className="text-xs font-semibold text-sky-600">CSVへ</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter, index) => (
            <button
              key={filter}
              className={`rounded-full px-4 py-1 text-sm font-semibold ${
                index === 0
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-200/60"
                  : "border border-white/60 bg-white/80 text-slate-500 shadow-sm"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">ダイジェスト</h3>
          <span className="text-xs font-semibold text-mint-600">Week 24</span>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-100/70">
          <p className="text-sm text-slate-500">
            今週の平均睡眠は <strong className="text-mint-700">7時間42分</strong>、
            気分スコアは <strong className="text-mint-700">4.1</strong> でした。
            午後のカフェイン制限が安定しています。
          </p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-mint-50/80 px-4 py-2">
              <span className="font-semibold text-slate-600">ミッション達成率</span>
              <span className="text-mint-700">78%</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-sky-50/80 px-4 py-2">
              <span className="font-semibold text-slate-600">
                アラート日 (睡眠{"<"}5h)
              </span>
              <span className="text-sky-700">1日</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">タイムライン</h3>
          <button className="text-xs font-semibold text-slate-500">
            すべて見る
          </button>
        </div>
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.date}
              className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-lg shadow-slate-100/80"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {record.date}
                  </p>
                  <p className="text-xs text-slate-400">{record.condition}</p>
                </div>
                <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-700">
                  Mood {record.mood}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  睡眠 {record.sleep}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {record.steps}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{record.highlight}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-200/60">
        <h3 className="text-lg font-semibold">関連性のヒント</h3>
        <p className="text-sm text-slate-500">
          CSVでの分析前に、気になる相関をピックアップ。
        </p>
        <div className="mt-4 space-y-3">
          {correlations.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100/70 bg-slate-50/70 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.label}
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-2xl font-semibold text-slate-900">
                  {item.value}
                </span>
                <span className="text-xs font-semibold text-mint-600">
                  Positive
                </span>
              </div>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
