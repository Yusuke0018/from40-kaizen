const reminders = [
  {
    title: "朝のルーティン",
    time: "06:30",
    desc: "起床後10分以内に記録を促す",
    active: true,
  },
  {
    title: "夜の振り返り",
    time: "21:45",
    desc: "寝る前の振り返りをリマインド",
    active: true,
  },
];

const experiments = [
  {
    name: "砂糖リセット",
    status: "Day 12 / 30",
    note: "甘いものを日中控える",
  },
  {
    name: "夜スクリーンオフ",
    status: "Week 2",
    note: "就寝30分前に画面オフ",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-16">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-mint-200/70">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          SETTINGS
        </p>
        <h2 className="text-xl font-semibold">習慣・データ管理</h2>
        <p className="text-sm text-slate-500">
          Firebaseで認証＆同期され、複数端末から同じ体験でアクセスできます。
        </p>
      </section>

      <section className="rounded-3xl border border-mint-100/70 bg-mint-50/80 p-5 shadow-inner shadow-mint-100/70">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">リマインダー</h3>
          <button className="text-xs font-semibold text-mint-600">追加</button>
        </div>
        <div className="mt-4 space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.title}
              className="flex items-start justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{reminder.title}</p>
                <p className="text-xs text-slate-500">{reminder.desc}</p>
              </div>
              <div className="text-right text-sm font-semibold text-mint-600">
                {reminder.time}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-lg shadow-sky-100/70">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">実験タグ</h3>
            <p className="text-sm text-slate-500">
              CSVにも同じタグが出力されます。
            </p>
          </div>
          <button className="text-xs font-semibold text-sky-600">編集</button>
        </div>
        <div className="mt-4 space-y-3">
          {experiments.map((experiment) => (
            <div
              key={experiment.name}
              className="rounded-2xl border border-slate-100/80 bg-slate-50/70 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {experiment.name}
                </p>
                <span className="text-xs font-semibold text-mint-600">
                  {experiment.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{experiment.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-mint-100/70">
        <h3 className="text-lg font-semibold">データ連携予定</h3>
        <p className="text-sm text-slate-500">
          Apple HealthKit / Google Fit との連携、Firebase Storageの写真保管、CSV自動生成のスケジュール設定などをここで管理予定です。
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">
            HealthKitシンク: 睡眠・心拍・歩数を自動取得
          </li>
          <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">
            Firebase Storage: 写真の最適化＆暗号化ストア
          </li>
          <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-3">
            週次サマリー: Vercel CronでAIサマリーを生成
          </li>
        </ul>
      </section>
    </div>
  );
}
