// 励ましコメント集（200種類以上）
// カテゴリ: streak（連続達成）, restart（再開）, milestone（マイルストーン）, general（一般）, hallOfFame（殿堂入り）

export type CommentCategory =
  | "streak"
  | "restart"
  | "milestone"
  | "general"
  | "hallOfFame"
  | "warning";

export type Comment = {
  text: string;
  category: CommentCategory;
  minStreak?: number;
  maxStreak?: number;
};

// 連続達成系（streak）
const streakComments: Comment[] = [
  // 初期（1-5日）
  { text: "最初の一歩を踏み出した！この調子！", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "始めることが一番難しい。もう始まってる！", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "今日の自分を褒めてあげよう", category: "streak", minStreak: 1, maxStreak: 2 },
  { text: "小さな一歩が大きな変化を生む", category: "streak", minStreak: 1, maxStreak: 3 },
  { text: "継続は力なり、始まったね", category: "streak", minStreak: 2, maxStreak: 3 },
  { text: "2日連続！リズムができてきた", category: "streak", minStreak: 2, maxStreak: 2 },
  { text: "3日坊主なんて言わせない！", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "3日続いた！もう習慣の芽が出てる", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "4日目突入！素晴らしいペース", category: "streak", minStreak: 4, maxStreak: 4 },
  { text: "5日達成！最初の壁を越えた", category: "streak", minStreak: 5, maxStreak: 5 },

  // 1週間前後（6-10日）
  { text: "6日目！もうすぐ1週間だ", category: "streak", minStreak: 6, maxStreak: 6 },
  { text: "1週間達成！習慣の基礎ができた", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "7日連続！自分を誇りに思おう", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "8日目！1週間を超えた強者", category: "streak", minStreak: 8, maxStreak: 8 },
  { text: "9日目！二桁まであと少し", category: "streak", minStreak: 9, maxStreak: 9 },
  { text: "10日達成！二桁の大台に乗った！", category: "streak", minStreak: 10, maxStreak: 10 },

  // 2週間前後（11-20日）
  { text: "11日目！着実に積み上げてる", category: "streak", minStreak: 11, maxStreak: 13 },
  { text: "2週間達成！もう立派な習慣だ", category: "streak", minStreak: 14, maxStreak: 14 },
  { text: "14日連続！脳が習慣を認識し始めた", category: "streak", minStreak: 14, maxStreak: 14 },
  { text: "15日目！折り返し地点の3分の1", category: "streak", minStreak: 15, maxStreak: 15 },
  { text: "このペースなら殿堂入り確実！", category: "streak", minStreak: 15, maxStreak: 20 },
  { text: "18日目！もうすぐ3週間", category: "streak", minStreak: 18, maxStreak: 18 },
  { text: "20日達成！素晴らしい継続力", category: "streak", minStreak: 20, maxStreak: 20 },

  // 3週間〜1ヶ月（21-30日）
  { text: "3週間達成！習慣が定着してきた", category: "streak", minStreak: 21, maxStreak: 21 },
  { text: "21日で習慣の神経回路ができる", category: "streak", minStreak: 21, maxStreak: 21 },
  { text: "25日目！4分の1を大きく超えた", category: "streak", minStreak: 25, maxStreak: 25 },
  { text: "もうやらないと気持ち悪くなってきた？", category: "streak", minStreak: 25, maxStreak: 35 },
  { text: "28日目！もうすぐ1ヶ月", category: "streak", minStreak: 28, maxStreak: 28 },
  { text: "30日達成！1ヶ月続けた自分を祝福しよう", category: "streak", minStreak: 30, maxStreak: 30 },
  { text: "1ヶ月連続！本物の習慣になった", category: "streak", minStreak: 30, maxStreak: 30 },

  // 1ヶ月超え（31-45日）
  { text: "31日目！新しい月に突入", category: "streak", minStreak: 31, maxStreak: 31 },
  { text: "35日目！5週間達成", category: "streak", minStreak: 35, maxStreak: 35 },
  { text: "40日目！折り返し地点が見えてきた", category: "streak", minStreak: 40, maxStreak: 40 },
  { text: "42日目！6週間達成", category: "streak", minStreak: 42, maxStreak: 42 },
  { text: "45日目！ちょうど半分！", category: "streak", minStreak: 45, maxStreak: 45 },
  { text: "半分達成！残り45日、いける！", category: "streak", minStreak: 45, maxStreak: 45 },

  // 後半戦（46-60日）
  { text: "後半戦スタート！ゴールが見える", category: "streak", minStreak: 46, maxStreak: 50 },
  { text: "50日達成！大台突破", category: "streak", minStreak: 50, maxStreak: 50 },
  { text: "50日連続は本当にすごいこと", category: "streak", minStreak: 50, maxStreak: 50 },
  { text: "55日目！残り35日", category: "streak", minStreak: 55, maxStreak: 55 },
  { text: "56日目！8週間達成", category: "streak", minStreak: 56, maxStreak: 56 },
  { text: "60日達成！2ヶ月連続！", category: "streak", minStreak: 60, maxStreak: 60 },
  { text: "2ヶ月間継続、あなたは本物だ", category: "streak", minStreak: 60, maxStreak: 60 },

  // 終盤戦（61-80日）
  { text: "残り1ヶ月を切った！", category: "streak", minStreak: 61, maxStreak: 65 },
  { text: "63日目！9週間達成", category: "streak", minStreak: 63, maxStreak: 63 },
  { text: "65日目！残り25日", category: "streak", minStreak: 65, maxStreak: 65 },
  { text: "70日達成！殿堂入りまであと20日", category: "streak", minStreak: 70, maxStreak: 70 },
  { text: "70日連続！ここまで来たらいける", category: "streak", minStreak: 70, maxStreak: 70 },
  { text: "75日目！残り15日", category: "streak", minStreak: 75, maxStreak: 75 },
  { text: "77日目！11週間達成", category: "streak", minStreak: 77, maxStreak: 77 },
  { text: "80日達成！カウントダウン開始", category: "streak", minStreak: 80, maxStreak: 80 },

  // ラストスパート（81-89日）
  { text: "残り10日を切った！最後まで駆け抜けろ", category: "streak", minStreak: 81, maxStreak: 85 },
  { text: "84日目！12週間達成、3ヶ月目", category: "streak", minStreak: 84, maxStreak: 84 },
  { text: "85日目！残りあと5日", category: "streak", minStreak: 85, maxStreak: 85 },
  { text: "86日目！殿堂入りが目前", category: "streak", minStreak: 86, maxStreak: 86 },
  { text: "87日目！あと3日で伝説になる", category: "streak", minStreak: 87, maxStreak: 87 },
  { text: "88日目！末広がりの縁起良い数字", category: "streak", minStreak: 88, maxStreak: 88 },
  { text: "89日目！明日、歴史が変わる", category: "streak", minStreak: 89, maxStreak: 89 },

  // 一般的な連続達成コメント
  { text: "今日もよく頑張った！", category: "streak" },
  { text: "素晴らしい！継続できてる", category: "streak" },
  { text: "この調子で続けよう", category: "streak" },
  { text: "毎日の積み重ねが大きな力になる", category: "streak" },
  { text: "自分との約束を守れてる", category: "streak" },
  { text: "未来の自分が今日の自分に感謝する", category: "streak" },
  { text: "習慣が人生を変える", category: "streak" },
  { text: "今日の努力は明日の自信になる", category: "streak" },
  { text: "コツコツが最強", category: "streak" },
  { text: "あなたは思っているより強い", category: "streak" },
  { text: "今日も一歩前進！", category: "streak" },
  { text: "チェックできた自分を褒めよう", category: "streak" },
  { text: "やると決めたことをやれてる", category: "streak" },
  { text: "習慣の力を味方につけてる", category: "streak" },
  { text: "この習慣があなたを変える", category: "streak" },
];

// 再開系（restart）
const restartComments: Comment[] = [
  { text: "戻ってきてくれてありがとう！", category: "restart" },
  { text: "再スタートを切れる人は強い", category: "restart" },
  { text: "失敗は成功のもと、また始めよう", category: "restart" },
  { text: "諦めなければ負けじゃない", category: "restart" },
  { text: "何度でもやり直せる、それが習慣づくり", category: "restart" },
  { text: "中断しても戻ってこれたのが偉い", category: "restart" },
  { text: "完璧じゃなくていい、続けることが大事", category: "restart" },
  { text: "今日からまた新しいスタート", category: "restart" },
  { text: "リセットは悪いことじゃない", category: "restart" },
  { text: "また挑戦する気持ちが素晴らしい", category: "restart" },
  { text: "転んでも立ち上がる、それが成長", category: "restart" },
  { text: "前回の経験が今回に活きる", category: "restart" },
  { text: "今度こそ殿堂入りを目指そう", category: "restart" },
  { text: "過去は変えられないけど未来は変えられる", category: "restart" },
  { text: "やめなければいつかは達成できる", category: "restart" },
  { text: "再チャレンジする勇気に拍手", category: "restart" },
  { text: "一度休んで、また走り出す", category: "restart" },
  { text: "休憩も戦略のうち、さあ再開だ", category: "restart" },
  { text: "新しい気持ちで頑張ろう", category: "restart" },
  { text: "何回目でも最初の一歩は尊い", category: "restart" },
  { text: "また会えて嬉しい！一緒に頑張ろう", category: "restart" },
  { text: "中断を乗り越えて戻ってきた強さ", category: "restart" },
  { text: "ここから90日、やってやろう", category: "restart" },
  { text: "過去の自分より今日の自分", category: "restart" },
  { text: "再挑戦は敗北じゃない、成長だ", category: "restart" },
];

// マイルストーン系（milestone）
const milestoneComments: Comment[] = [
  { text: "🎉 記念すべき達成！おめでとう！", category: "milestone" },
  { text: "🏆 マイルストーン達成！", category: "milestone" },
  { text: "⭐ 新しいステージに到達！", category: "milestone" },
  { text: "🎊 すごい！大きな節目を迎えた", category: "milestone" },
  { text: "🌟 輝かしい達成！", category: "milestone" },
  { text: "✨ 特別な日だ！よく頑張った", category: "milestone" },
  { text: "🎯 目標の一つをクリア！", category: "milestone" },
  { text: "🏅 金メダル級の努力！", category: "milestone" },
  { text: "🚀 新しい高みへ！", category: "milestone" },
  { text: "💪 この調子で次のマイルストーンへ", category: "milestone" },
  { text: "🌈 努力が実を結んだ瞬間", category: "milestone" },
  { text: "🔥 燃えてる！この勢いで", category: "milestone" },
  { text: "👑 習慣の王者への道", category: "milestone" },
  { text: "💎 価値ある達成だ", category: "milestone" },
  { text: "🎖️ 勲章ものの継続力", category: "milestone" },
];

// 一般系（general）
const generalComments: Comment[] = [
  { text: "今日も素敵な一日になりますように", category: "general" },
  { text: "小さなことからコツコツと", category: "general" },
  { text: "一日一日を大切に", category: "general" },
  { text: "自分を信じて進もう", category: "general" },
  { text: "今日の頑張りは明日への投資", category: "general" },
  { text: "できることを、できる時に", category: "general" },
  { text: "焦らず、でも止まらず", category: "general" },
  { text: "習慣は第二の天性となる", category: "general" },
  { text: "毎日の選択が人生を作る", category: "general" },
  { text: "今この瞬間を大切に", category: "general" },
  { text: "自分のペースで大丈夫", category: "general" },
  { text: "完璧を目指さず、継続を目指す", category: "general" },
  { text: "今日できることを今日やる", category: "general" },
  { text: "習慣が変われば人生が変わる", category: "general" },
  { text: "未来は今日の習慣で作られる", category: "general" },
  { text: "千里の道も一歩から", category: "general" },
  { text: "塵も積もれば山となる", category: "general" },
  { text: "継続こそ最強のスキル", category: "general" },
  { text: "今日も自分を超えていこう", category: "general" },
  { text: "習慣の力を信じよう", category: "general" },
  { text: "小さな勝利を積み重ねよう", category: "general" },
  { text: "今日のあなたは昨日より成長してる", category: "general" },
  { text: "努力は裏切らない", category: "general" },
  { text: "一歩一歩、確実に前へ", category: "general" },
  { text: "今日も新しい自分に出会える", category: "general" },
  { text: "習慣は最高の味方", category: "general" },
  { text: "日々の積み重ねが奇跡を生む", category: "general" },
  { text: "今日という日を最高の日に", category: "general" },
  { text: "自分との約束を守り続けよう", category: "general" },
  { text: "継続する力は最大の才能", category: "general" },
  { text: "毎日少しずつ、それが一番強い", category: "general" },
  { text: "今日の一歩が未来を変える", category: "general" },
  { text: "やると決めたことをやる、それだけ", category: "general" },
  { text: "習慣は人生の基盤", category: "general" },
  { text: "コツコツが最短距離", category: "general" },
  { text: "今日も一つ、成長の証", category: "general" },
  { text: "地道な努力が大きな成果を生む", category: "general" },
  { text: "今日の自分に花丸をあげよう", category: "general" },
  { text: "習慣づくりは自分づくり", category: "general" },
  { text: "毎日の小さな決断が人生を決める", category: "general" },
];

// 殿堂入り系（hallOfFame）
const hallOfFameComments: Comment[] = [
  { text: "🏆 殿堂入りおめでとう！90日達成！", category: "hallOfFame" },
  { text: "👑 あなたは習慣の王者だ！", category: "hallOfFame" },
  { text: "🎊 伝説になった！素晴らしい！", category: "hallOfFame" },
  { text: "✨ 90日間、本当によく頑張った！", category: "hallOfFame" },
  { text: "🌟 殿堂入り！あなたの努力は本物だ", category: "hallOfFame" },
  { text: "🎉 歴史的達成！おめでとう！", category: "hallOfFame" },
  { text: "💎 ダイヤモンド級の継続力！", category: "hallOfFame" },
  { text: "🏅 金メダル！90日の栄光", category: "hallOfFame" },
  { text: "🚀 新しいステージへ到達！", category: "hallOfFame" },
  { text: "🔥 燃え尽きない炎の持ち主！", category: "hallOfFame" },
  { text: "⭐ スター誕生！90日の軌跡", category: "hallOfFame" },
  { text: "🎖️ 最高の名誉、殿堂入り！", category: "hallOfFame" },
  { text: "💪 あなたは自分に勝った！", category: "hallOfFame" },
  { text: "🌈 夢を現実にした90日間", category: "hallOfFame" },
  { text: "👏 拍手喝采！殿堂入りの快挙", category: "hallOfFame" },
];

// 警告系（warning）- 中断しそうな時
const warningComments: Comment[] = [
  { text: "⚠️ 今日チェックしないとリセットされるかも", category: "warning" },
  { text: "📢 あと少しで3日空いてしまう！", category: "warning" },
  { text: "🔔 今日が最後のチャンス！", category: "warning" },
  { text: "⏰ まだ間に合う！今日中にチェック", category: "warning" },
  { text: "💡 忘れてない？今日もチェックしよう", category: "warning" },
];

// 全コメントをエクスポート
export const allComments: Comment[] = [
  ...streakComments,
  ...restartComments,
  ...milestoneComments,
  ...generalComments,
  ...hallOfFameComments,
  ...warningComments,
];

// コメント取得関数
export function getComment(options: {
  streak: number;
  isRestart?: boolean;
  isMilestone?: boolean;
  isHallOfFame?: boolean;
  isWarning?: boolean;
}): string {
  const { streak, isRestart, isMilestone, isHallOfFame, isWarning } = options;

  // 殿堂入り
  if (isHallOfFame) {
    const comments = hallOfFameComments;
    return comments[Math.floor(Math.random() * comments.length)].text;
  }

  // 警告
  if (isWarning) {
    const comments = warningComments;
    return comments[Math.floor(Math.random() * comments.length)].text;
  }

  // 再開
  if (isRestart) {
    const comments = restartComments;
    return comments[Math.floor(Math.random() * comments.length)].text;
  }

  // マイルストーン（7, 14, 21, 30, 45, 60, 90日など）
  const milestones = [7, 14, 21, 30, 45, 50, 60, 70, 80, 90];
  if (isMilestone || milestones.includes(streak)) {
    // マイルストーン専用コメント + 該当するストリークコメント
    const milestoneSpecific = streakComments.filter(
      (c) =>
        c.minStreak !== undefined &&
        c.maxStreak !== undefined &&
        streak >= c.minStreak &&
        streak <= c.maxStreak
    );
    const combined = [...milestoneComments, ...milestoneSpecific];
    if (combined.length > 0) {
      return combined[Math.floor(Math.random() * combined.length)].text;
    }
  }

  // ストリークに応じたコメント
  const streakSpecific = streakComments.filter(
    (c) =>
      c.minStreak !== undefined &&
      c.maxStreak !== undefined &&
      streak >= c.minStreak &&
      streak <= c.maxStreak
  );

  if (streakSpecific.length > 0) {
    return streakSpecific[Math.floor(Math.random() * streakSpecific.length)]
      .text;
  }

  // 一般的なストリークコメント
  const generalStreak = streakComments.filter(
    (c) => c.minStreak === undefined
  );
  const combined = [...generalStreak, ...generalComments];
  return combined[Math.floor(Math.random() * combined.length)].text;
}

// コメント総数を取得
export function getCommentCount(): number {
  return allComments.length;
}
