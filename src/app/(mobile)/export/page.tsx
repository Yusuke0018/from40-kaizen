const fields = [
  "date",
  "weight_kg",
  "sleep_start",
  "sleep_end",
  "sleep_hours",
  "avg_sleep_hr",
  "mood",
  "day_condition",
  "steps",
  "calories",
  "hydration_ml",
  "journal",
  "meals_text",
  "photo_urls",
];

const preview = [
  {
    date: "2024-06-12",
    weight: "65.2",
    sleep: "22:45-06:30",
    mood: "4.5",
    steps: "10240",
    highlight: "ノンカフェイン達成 / 朝散歩",
  },
  {
    date: "2024-06-11",
    weight: "65.5",
    sleep: "23:15-05:35",
    mood: "3.8",
    steps: "7210",
    highlight: "夕方に眠気アラート",
  },
];

export default function ExportPage() {
  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-3xl border border-mint-100/80 bg-gradient-to-r from-mint-50 to-sky-50 p-5 shadow-inner shadow-mint-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          CSV EXPORT
        </p>
        <h2 className="text-xl font-semibold">AIが読みやすい形式で出力</h2>
        <p className="text-sm text-slate-500">
          期間と列を指定して、1日1行のシンプルなCSVをダウンロードできます。
        </p>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-sky-100/80">
        <form className="space-y-4 text-sm">
          <div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                期間
              </span>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" defaultValue="2024-05-30" />
                <input type="date" defaultValue="2024-06-12" />
              </div>
            </label>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              列を選択
            </span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {fields.map((field, idx) => (
                <label
                  key={field}
                  className="flex items-center gap-2 rounded-2xl border border-slate-100/70 bg-slate-50/60 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    defaultChecked={idx < 6}
                    className="h-4 w-4 rounded border-mint-400 text-mint-500"
                  />
                  <span className="text-xs font-medium text-slate-600">
                    {field}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100/80 bg-slate-50/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              オプション
            </p>
            <div className="mt-3 space-y-2 text-slate-600">
              <label className="flex items-center justify-between">
                <span>写真URLを含める</span>
                <input type="checkbox" className="h-4 w-8 rounded-full" />
              </label>
              <label className="flex items-center justify-between">
                <span>空欄の日も出力</span>
                <input type="checkbox" className="h-4 w-8 rounded-full" />
              </label>
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-full bg-mint-500 py-3 text-sm font-semibold text-white shadow-lg shadow-mint-300/70"
          >
            CSVをダウンロード
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-mint-100/70">
        <div className="flex items-center justify-between text-sm">
          <div>
            <h3 className="text-lg font-semibold">プレビュー</h3>
            <p className="text-slate-500">エクスポートの一部を確認できます。</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">2 / 14</span>
        </div>
        <div className="mt-4 space-y-3 text-xs text-slate-600">
          {preview.map((row) => (
            <div
              key={row.date}
              className="rounded-2xl border border-slate-100/80 bg-slate-50/60 p-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-700">{row.date}</p>
                <p className="text-mint-600">Mood {row.mood}</p>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <span>体重: {row.weight}kg</span>
                <span>歩数: {row.steps}</span>
                <span>睡眠: {row.sleep}</span>
              </div>
              <p className="mt-2 text-slate-500">{row.highlight}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
