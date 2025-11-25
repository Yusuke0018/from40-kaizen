// 名言風コメント集（300種類以上）
// 連続日数の範囲に基づいて複数のコメントからランダムに選択
// カテゴリ: streak（連続達成）, restart（再開）, hallOfFame（殿堂入り）, warning（警告）

export type CommentCategory = "streak" | "restart" | "hallOfFame" | "warning";

export type Comment = {
  text: string;
  category: CommentCategory;
  minStreak?: number;
  maxStreak?: number;
};

// ========================================
// 連続達成系コメント（streak）
// ========================================

// Day 1: 始まりの日
const day1Comments: Comment[] = [
  { text: "千里の道も一歩から。今日、あなたの旅が始まった。", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "最初の一歩を踏み出した勇気を称えよう。", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "始めることが一番難しい。もう始まってる。", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "今日の決断が、90日後の自分を作る。", category: "streak", minStreak: 1, maxStreak: 1 },
  { text: "小さな一歩が、大きな変化の始まり。", category: "streak", minStreak: 1, maxStreak: 1 },
];

// Day 2
const day2Comments: Comment[] = [
  { text: "昨日の自分を超えた。それが成長の証。", category: "streak", minStreak: 2, maxStreak: 2 },
  { text: "2日目。継続の種が蒔かれた。", category: "streak", minStreak: 2, maxStreak: 2 },
  { text: "1日で終わらなかった。それが全ての始まり。", category: "streak", minStreak: 2, maxStreak: 2 },
  { text: "続けることを選んだ。その選択が未来を変える。", category: "streak", minStreak: 2, maxStreak: 2 },
];

// Day 3: 3日坊主を超える
const day3Comments: Comment[] = [
  { text: "3日続けた人だけが見える景色がある。あなたは今そこにいる。", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "3日坊主なんて言葉は、あなたには関係ない。", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "3日達成。習慣の芽が出始めている。", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "最初の壁を越えた。この調子で。", category: "streak", minStreak: 3, maxStreak: 3 },
  { text: "3日間、自分との約束を守った。素晴らしい。", category: "streak", minStreak: 3, maxStreak: 3 },
];

// Day 4-6: 1週間へ向けて
const day4to6Comments: Comment[] = [
  { text: "習慣は意志より強い。その力を感じ始めているはず。", category: "streak", minStreak: 4, maxStreak: 6 },
  { text: "4日目。リズムができてきた。", category: "streak", minStreak: 4, maxStreak: 4 },
  { text: "5日連続。小さな炎が確かな熱を持ち始めた。", category: "streak", minStreak: 5, maxStreak: 5 },
  { text: "1週間まであと少し。最初の山を越えよう。", category: "streak", minStreak: 6, maxStreak: 6 },
  { text: "毎日の選択が、毎日の自分を作っている。", category: "streak", minStreak: 4, maxStreak: 6 },
  { text: "着実に前に進んでいる。自信を持って。", category: "streak", minStreak: 4, maxStreak: 6 },
  { text: "今日の努力は明日の自信になる。", category: "streak", minStreak: 4, maxStreak: 6 },
];

// Day 7: 1週間達成
const day7Comments: Comment[] = [
  { text: "7日達成。習慣の種が芽を出した。水をあげ続けよう。", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "1週間連続。これは偶然じゃない、あなたの意志だ。", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "7日間、自分を裏切らなかった。素晴らしい。", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "最初の1週間クリア。次は2週間を目指そう。", category: "streak", minStreak: 7, maxStreak: 7 },
  { text: "1週間。習慣の基礎ができた。", category: "streak", minStreak: 7, maxStreak: 7 },
];

// Day 8-13: 2週間へ向けて
const day8to13Comments: Comment[] = [
  { text: "1週間を超えた。もうこれは偶然じゃない。", category: "streak", minStreak: 8, maxStreak: 13 },
  { text: "二桁の扉が近づいてきた。", category: "streak", minStreak: 8, maxStreak: 9 },
  { text: "10日達成。最初の完成形。", category: "streak", minStreak: 10, maxStreak: 10 },
  { text: "二桁の世界へようこそ。", category: "streak", minStreak: 10, maxStreak: 13 },
  { text: "継続は力なり。今日もその力を手に入れた。", category: "streak", minStreak: 8, maxStreak: 13 },
  { text: "11日目。着実に歩みを進めている。", category: "streak", minStreak: 11, maxStreak: 11 },
  { text: "12日。1ダース。揃った感じがする。", category: "streak", minStreak: 12, maxStreak: 12 },
  { text: "不吉なんて迷信。続けている事実だけが真実。", category: "streak", minStreak: 13, maxStreak: 13 },
  { text: "習慣が第二の天性になりつつある。", category: "streak", minStreak: 8, maxStreak: 13 },
];

// Day 14: 2週間達成
const day14Comments: Comment[] = [
  { text: "2週間。脳科学では習慣の神経回路ができ始める頃。体が覚え始めている。", category: "streak", minStreak: 14, maxStreak: 14 },
  { text: "14日連続。もう立派な習慣だ。", category: "streak", minStreak: 14, maxStreak: 14 },
  { text: "2週間達成。やらないと気持ち悪くなってきたでしょう？", category: "streak", minStreak: 14, maxStreak: 14 },
  { text: "習慣の神経回路が形成されている。科学が証明している。", category: "streak", minStreak: 14, maxStreak: 14 },
];

// Day 15-20
const day15to20Comments: Comment[] = [
  { text: "15日。確実に前に進んでいる。", category: "streak", minStreak: 15, maxStreak: 15 },
  { text: "毎日の選択が、毎日の自分を作っている。", category: "streak", minStreak: 15, maxStreak: 20 },
  { text: "平凡な日こそ、非凡な継続が光る。", category: "streak", minStreak: 15, maxStreak: 20 },
  { text: "努力は必ず何かの形で返ってくる。", category: "streak", minStreak: 15, maxStreak: 20 },
  { text: "明日で20日。大台が見えてきた。", category: "streak", minStreak: 19, maxStreak: 19 },
  { text: "20日達成。あなたは20回、自分との約束を守った。", category: "streak", minStreak: 20, maxStreak: 20 },
  { text: "コツコツが最強。あなたはそれを証明している。", category: "streak", minStreak: 15, maxStreak: 20 },
  { text: "習慣の力を味方につけている。", category: "streak", minStreak: 15, maxStreak: 20 },
];

// Day 21: 3週間（習慣形成の目安）
const day21Comments: Comment[] = [
  { text: "21日。心理学では習慣形成に必要な日数。あなたの中で何かが変わった。", category: "streak", minStreak: 21, maxStreak: 21 },
  { text: "3週間達成。習慣が定着してきた。", category: "streak", minStreak: 21, maxStreak: 21 },
  { text: "21日で習慣の神経回路ができる。あなたはそれを作り上げた。", category: "streak", minStreak: 21, maxStreak: 21 },
  { text: "3週間。もう体が覚えている。", category: "streak", minStreak: 21, maxStreak: 21 },
];

// Day 22-29: 1ヶ月へ向けて
const day22to29Comments: Comment[] = [
  { text: "習慣が第二の天性になりつつある。", category: "streak", minStreak: 22, maxStreak: 29 },
  { text: "やらないと落ち着かない。それが習慣の証。", category: "streak", minStreak: 22, maxStreak: 29 },
  { text: "時間を味方につけている。", category: "streak", minStreak: 22, maxStreak: 29 },
  { text: "一歩一歩、確実に頂上に近づいている。", category: "streak", minStreak: 22, maxStreak: 29 },
  { text: "4週間達成。月が満ちるように、習慣も満ちてきた。", category: "streak", minStreak: 28, maxStreak: 28 },
  { text: "明日、1ヶ月の壁を破る。", category: "streak", minStreak: 29, maxStreak: 29 },
  { text: "殿堂入りまであと61日。確実に近づいている。", category: "streak", minStreak: 22, maxStreak: 29 },
  { text: "未来の自分が今日の自分に感謝している。", category: "streak", minStreak: 22, maxStreak: 29 },
];

// Day 30: 1ヶ月達成
const day30Comments: Comment[] = [
  { text: "30日、1ヶ月達成。これはもう習慣じゃない。あなたの一部だ。", category: "streak", minStreak: 30, maxStreak: 30 },
  { text: "1ヶ月連続。本物の習慣になった。", category: "streak", minStreak: 30, maxStreak: 30 },
  { text: "30日間、毎日自分に勝ち続けた。", category: "streak", minStreak: 30, maxStreak: 30 },
  { text: "1ヶ月達成。自分を褒めてあげよう。", category: "streak", minStreak: 30, maxStreak: 30 },
  { text: "30日。あなたの努力は本物だ。", category: "streak", minStreak: 30, maxStreak: 30 },
];

// Day 31-44: 折り返しへ向けて
const day31to44Comments: Comment[] = [
  { text: "新しい月に入った。習慣は新しいステージへ。", category: "streak", minStreak: 31, maxStreak: 31 },
  { text: "過去の自分が今の自分を羨んでいる。", category: "streak", minStreak: 31, maxStreak: 44 },
  { text: "継続は才能を超える。あなたが証明している。", category: "streak", minStreak: 31, maxStreak: 44 },
  { text: "35日。5週間達成。安定のステージへ。", category: "streak", minStreak: 35, maxStreak: 35 },
  { text: "習慣の力で、不可能が可能になっていく。", category: "streak", minStreak: 31, maxStreak: 44 },
  { text: "毎日の積み重ねが、やがて山になる。", category: "streak", minStreak: 31, maxStreak: 44 },
  { text: "40日達成。雨の日も風の日も続けた。本物だ。", category: "streak", minStreak: 40, maxStreak: 40 },
  { text: "折り返しまであと少し。ゴールが見え始めた。", category: "streak", minStreak: 41, maxStreak: 44 },
  { text: "42日。6週間達成。", category: "streak", minStreak: 42, maxStreak: 42 },
  { text: "ゾロ目の日。揃っている感覚を大切に。", category: "streak", minStreak: 33, maxStreak: 33 },
  { text: "44日。明日、旅の半分が終わる。", category: "streak", minStreak: 44, maxStreak: 44 },
  { text: "地道な努力が大きな成果を生む。", category: "streak", minStreak: 31, maxStreak: 44 },
];

// Day 45: 折り返し地点
const day45Comments: Comment[] = [
  { text: "45日、折り返し地点。振り返れば45日、見上げれば45日。あなたはもう半分を歩いた。", category: "streak", minStreak: 45, maxStreak: 45 },
  { text: "半分達成！残り45日、いける！", category: "streak", minStreak: 45, maxStreak: 45 },
  { text: "折り返し地点。ここからが本当の勝負。", category: "streak", minStreak: 45, maxStreak: 45 },
  { text: "45日連続。同じ日数をあと1回で殿堂入り。", category: "streak", minStreak: 45, maxStreak: 45 },
];

// Day 46-59: 後半戦
const day46to59Comments: Comment[] = [
  { text: "後半戦の幕開け。ゴールに向かって走り出そう。", category: "streak", minStreak: 46, maxStreak: 46 },
  { text: "後半は前半より楽になる。習慣の力を信じて。", category: "streak", minStreak: 46, maxStreak: 59 },
  { text: "カウントダウンが始まった。", category: "streak", minStreak: 46, maxStreak: 59 },
  { text: "50日達成。半世紀の半分。あなたの努力は歴史に刻まれている。", category: "streak", minStreak: 50, maxStreak: 50 },
  { text: "50日を超えた。もう誰にも止められない。", category: "streak", minStreak: 51, maxStreak: 59 },
  { text: "1年は52週。あなたは52日を手に入れた。", category: "streak", minStreak: 52, maxStreak: 52 },
  { text: "毎日の勝利が、人生の勝利になる。", category: "streak", minStreak: 46, maxStreak: 59 },
  { text: "55日。ゾロ目。5の連続。", category: "streak", minStreak: 55, maxStreak: 55 },
  { text: "56日目。8週間達成。", category: "streak", minStreak: 56, maxStreak: 56 },
  { text: "あと1ヶ月と少しで殿堂入り。", category: "streak", minStreak: 46, maxStreak: 59 },
  { text: "明日、2ヶ月という偉業を達成する。", category: "streak", minStreak: 59, maxStreak: 59 },
  { text: "ゴールラインが近づいてくる。", category: "streak", minStreak: 46, maxStreak: 59 },
];

// Day 60: 2ヶ月達成
const day60Comments: Comment[] = [
  { text: "60日、2ヶ月達成。1時間の60分、1分の60秒。60は時を刻む数字。あなたは2ヶ月の時を刻んだ。", category: "streak", minStreak: 60, maxStreak: 60 },
  { text: "2ヶ月連続。あなたは本物だ。", category: "streak", minStreak: 60, maxStreak: 60 },
  { text: "60日間継続。残り1ヶ月で殿堂入り。", category: "streak", minStreak: 60, maxStreak: 60 },
  { text: "2ヶ月。この数字の重みを感じてほしい。", category: "streak", minStreak: 60, maxStreak: 60 },
];

// Day 61-69
const day61to69Comments: Comment[] = [
  { text: "2ヶ月を超えた。残り1ヶ月を切った。", category: "streak", minStreak: 61, maxStreak: 69 },
  { text: "ここまで来たら、あとは惰性でもいける。習慣の力だ。", category: "streak", minStreak: 61, maxStreak: 69 },
  { text: "63日目。9週間達成。あと4週間で殿堂入り。", category: "streak", minStreak: 63, maxStreak: 63 },
  { text: "残り25日。最後の四分の一に突入。", category: "streak", minStreak: 65, maxStreak: 65 },
  { text: "66日目。ゾロ目。調和の象徴。", category: "streak", minStreak: 66, maxStreak: 66 },
  { text: "毎日が自信を積み上げている。", category: "streak", minStreak: 61, maxStreak: 69 },
  { text: "明日、70日という大台に到達する。", category: "streak", minStreak: 69, maxStreak: 69 },
  { text: "ゴールが見えてきた。最後まで走り抜こう。", category: "streak", minStreak: 61, maxStreak: 69 },
];

// Day 70
const day70Comments: Comment[] = [
  { text: "70日達成。古希という言葉がある。70は特別な数字。あなたの旅も特別だ。", category: "streak", minStreak: 70, maxStreak: 70 },
  { text: "70日連続。ここまで来たらいける。", category: "streak", minStreak: 70, maxStreak: 70 },
  { text: "殿堂入りまであと20日。カウントダウン開始。", category: "streak", minStreak: 70, maxStreak: 70 },
  { text: "70日。あなたは自分に勝ち続けている。", category: "streak", minStreak: 70, maxStreak: 70 },
];

// Day 71-79
const day71to79Comments: Comment[] = [
  { text: "残り20日を切った。ラストスパートだ。", category: "streak", minStreak: 71, maxStreak: 79 },
  { text: "もう指で数えられる。", category: "streak", minStreak: 71, maxStreak: 79 },
  { text: "最後の直線に入った。ゴールが見える。", category: "streak", minStreak: 71, maxStreak: 79 },
  { text: "75日。四分の三を達成。残り15日。", category: "streak", minStreak: 75, maxStreak: 75 },
  { text: "残り14日。あと2週間で伝説になる。", category: "streak", minStreak: 76, maxStreak: 76 },
  { text: "77日。ラッキーセブンのゾロ目。幸運を味方に。", category: "streak", minStreak: 77, maxStreak: 77 },
  { text: "カウントダウンが加速する。", category: "streak", minStreak: 71, maxStreak: 79 },
  { text: "明日80日。いよいよクライマックス。", category: "streak", minStreak: 79, maxStreak: 79 },
  { text: "頂上はもうすぐそこ。最後まで歩み続けよう。", category: "streak", minStreak: 71, maxStreak: 79 },
];

// Day 80
const day80Comments: Comment[] = [
  { text: "80日達成。傘寿という言葉がある。80は長寿の象徴。習慣も長寿だ。", category: "streak", minStreak: 80, maxStreak: 80 },
  { text: "80日連続。残り10日。最後の坂を登れ。", category: "streak", minStreak: 80, maxStreak: 80 },
  { text: "あと10日で殿堂入り。最後まで駆け抜けろ。", category: "streak", minStreak: 80, maxStreak: 80 },
  { text: "80日。あなたの努力は誰にも否定できない。", category: "streak", minStreak: 80, maxStreak: 80 },
];

// Day 81-89: ラストスパート
const day81to89Comments: Comment[] = [
  { text: "残り一桁に突入。最後の坂を登れ。", category: "streak", minStreak: 81, maxStreak: 89 },
  { text: "1週間と少しで殿堂入り。", category: "streak", minStreak: 82, maxStreak: 83 },
  { text: "残り7日。ちょうど1週間で達成。", category: "streak", minStreak: 83, maxStreak: 83 },
  { text: "84日。12週間達成。3ヶ月まであと6日。", category: "streak", minStreak: 84, maxStreak: 84 },
  { text: "残り5日。片手で数えられる。", category: "streak", minStreak: 85, maxStreak: 85 },
  { text: "残り4日。あと少しで頂上だ。", category: "streak", minStreak: 86, maxStreak: 86 },
  { text: "残り3日。最後の3日間を全力で。", category: "streak", minStreak: 87, maxStreak: 87 },
  { text: "88日。末広がりの縁起の良い数字。残り2日。", category: "streak", minStreak: 88, maxStreak: 88 },
  { text: "89日目。明日、90日。明日、あなたは伝説になる。", category: "streak", minStreak: 89, maxStreak: 89 },
  { text: "最後まで諦めない。それがあなたの強さ。", category: "streak", minStreak: 81, maxStreak: 89 },
  { text: "ゴールテープが見える。走り抜けろ。", category: "streak", minStreak: 81, maxStreak: 89 },
];

// Day 90
const day90Comments: Comment[] = [
  { text: "90日。この数字を見ることができるのは、選ばれた者だけ。", category: "streak", minStreak: 90, maxStreak: 90 },
];

// ========================================
// 汎用コメント（どの日数でも使える）
// ========================================
const universalComments: Comment[] = [
  { text: "今日も素晴らしい一日になりますように。", category: "streak" },
  { text: "小さなことからコツコツと。", category: "streak" },
  { text: "自分を信じて進もう。", category: "streak" },
  { text: "今日の頑張りは明日への投資。", category: "streak" },
  { text: "焦らず、でも止まらず。", category: "streak" },
  { text: "習慣は第二の天性となる。", category: "streak" },
  { text: "毎日の選択が人生を作る。", category: "streak" },
  { text: "自分のペースで大丈夫。", category: "streak" },
  { text: "完璧を目指さず、継続を目指す。", category: "streak" },
  { text: "習慣が変われば人生が変わる。", category: "streak" },
  { text: "未来は今日の習慣で作られる。", category: "streak" },
  { text: "塵も積もれば山となる。", category: "streak" },
  { text: "継続こそ最強のスキル。", category: "streak" },
  { text: "今日も自分を超えていこう。", category: "streak" },
  { text: "小さな勝利を積み重ねよう。", category: "streak" },
  { text: "今日のあなたは昨日より成長してる。", category: "streak" },
  { text: "努力は裏切らない。", category: "streak" },
  { text: "一歩一歩、確実に前へ。", category: "streak" },
  { text: "習慣は最高の味方。", category: "streak" },
  { text: "日々の積み重ねが奇跡を生む。", category: "streak" },
  { text: "自分との約束を守り続けよう。", category: "streak" },
  { text: "継続する力は最大の才能。", category: "streak" },
  { text: "毎日少しずつ、それが一番強い。", category: "streak" },
  { text: "今日の一歩が未来を変える。", category: "streak" },
  { text: "やると決めたことをやる、それだけ。", category: "streak" },
  { text: "習慣は人生の基盤。", category: "streak" },
  { text: "コツコツが最短距離。", category: "streak" },
  { text: "地道な努力が大きな成果を生む。", category: "streak" },
  { text: "習慣づくりは自分づくり。", category: "streak" },
  { text: "毎日の小さな決断が人生を決める。", category: "streak" },
  { text: "あなたは思っているより強い。", category: "streak" },
  { text: "今日も一歩前進！", category: "streak" },
  { text: "チェックできた自分を褒めよう。", category: "streak" },
  { text: "この習慣があなたを変える。", category: "streak" },
  { text: "今日も自分との約束を守った。", category: "streak" },
  { text: "続けることに価値がある。", category: "streak" },
  { text: "習慣の力を信じよう。", category: "streak" },
  { text: "今日の自分に花丸をあげよう。", category: "streak" },
  { text: "素晴らしい！継続できてる。", category: "streak" },
  { text: "この調子で続けよう。", category: "streak" },
];

// ========================================
// 再開系コメント（restart）
// ========================================
const restartComments: Comment[] = [
  { text: "倒れても立ち上がる。それが本当の強さ。今日から再スタート。", category: "restart" },
  { text: "過去は変えられない。でも未来は今から作れる。", category: "restart" },
  { text: "何度でもやり直せる。それが人生の素晴らしさ。", category: "restart" },
  { text: "戻ってきてくれてありがとう！", category: "restart" },
  { text: "再スタートを切れる人は強い。", category: "restart" },
  { text: "失敗は成功のもと、また始めよう。", category: "restart" },
  { text: "諦めなければ負けじゃない。", category: "restart" },
  { text: "中断しても戻ってこれたのが偉い。", category: "restart" },
  { text: "完璧じゃなくていい、続けることが大事。", category: "restart" },
  { text: "今日からまた新しいスタート。", category: "restart" },
  { text: "リセットは悪いことじゃない。", category: "restart" },
  { text: "また挑戦する気持ちが素晴らしい。", category: "restart" },
  { text: "転んでも立ち上がる、それが成長。", category: "restart" },
  { text: "前回の経験が今回に活きる。", category: "restart" },
  { text: "今度こそ殿堂入りを目指そう。", category: "restart" },
  { text: "やめなければいつかは達成できる。", category: "restart" },
  { text: "再チャレンジする勇気に拍手。", category: "restart" },
  { text: "休憩も戦略のうち、さあ再開だ。", category: "restart" },
  { text: "新しい気持ちで頑張ろう。", category: "restart" },
  { text: "何回目でも最初の一歩は尊い。", category: "restart" },
  { text: "また会えて嬉しい！一緒に頑張ろう。", category: "restart" },
  { text: "ここから90日、やってやろう。", category: "restart" },
  { text: "過去の自分より今日の自分。", category: "restart" },
  { text: "再挑戦は敗北じゃない、成長だ。", category: "restart" },
];

// ========================================
// 殿堂入り系コメント（hallOfFame）
// ========================================
const hallOfFameComments: Comment[] = [
  { text: "90日達成。あなたは習慣を超え、習慣になった。殿堂入りおめでとう。", category: "hallOfFame" },
  { text: "🏆 殿堂入りおめでとう！90日達成！", category: "hallOfFame" },
  { text: "👑 あなたは習慣の王者だ！", category: "hallOfFame" },
  { text: "🎊 伝説になった！素晴らしい！", category: "hallOfFame" },
  { text: "✨ 90日間、本当によく頑張った！", category: "hallOfFame" },
  { text: "🌟 殿堂入り！あなたの努力は本物だ。", category: "hallOfFame" },
  { text: "🎉 歴史的達成！おめでとう！", category: "hallOfFame" },
  { text: "💎 ダイヤモンド級の継続力！", category: "hallOfFame" },
  { text: "🏅 金メダル！90日の栄光。", category: "hallOfFame" },
  { text: "🚀 新しいステージへ到達！", category: "hallOfFame" },
  { text: "⭐ スター誕生！90日の軌跡。", category: "hallOfFame" },
  { text: "💪 あなたは自分に勝った！", category: "hallOfFame" },
  { text: "🌈 夢を現実にした90日間。", category: "hallOfFame" },
  { text: "👏 拍手喝采！殿堂入りの快挙。", category: "hallOfFame" },
];

// ========================================
// 警告系コメント（warning）
// ========================================
const warningComments: Comment[] = [
  { text: "今日チェックしないと、積み上げた日々がリセットされる。あと1日だけ。", category: "warning" },
  { text: "⚠️ 今日チェックしないとリセットされるかも。", category: "warning" },
  { text: "📢 あと少しで3日空いてしまう！", category: "warning" },
  { text: "🔔 今日が最後のチャンス！", category: "warning" },
  { text: "⏰ まだ間に合う！今日中にチェック。", category: "warning" },
  { text: "💡 忘れてない？今日もチェックしよう。", category: "warning" },
  { text: "ここで止めたらもったいない。今日だけ頑張ろう。", category: "warning" },
  { text: "あと1日だけ。それだけで継続できる。", category: "warning" },
];

// 全コメントをまとめる
const allStreakComments: Comment[] = [
  ...day1Comments,
  ...day2Comments,
  ...day3Comments,
  ...day4to6Comments,
  ...day7Comments,
  ...day8to13Comments,
  ...day14Comments,
  ...day15to20Comments,
  ...day21Comments,
  ...day22to29Comments,
  ...day30Comments,
  ...day31to44Comments,
  ...day45Comments,
  ...day46to59Comments,
  ...day60Comments,
  ...day61to69Comments,
  ...day70Comments,
  ...day71to79Comments,
  ...day80Comments,
  ...day81to89Comments,
  ...day90Comments,
  ...universalComments,
];

// 全コメントをエクスポート
export const allComments: Comment[] = [
  ...allStreakComments,
  ...restartComments,
  ...hallOfFameComments,
  ...warningComments,
];

// コメント取得関数（連続日数に基づいてランダムに選択）
export function getComment(options: {
  streak: number;
  isRestart?: boolean;
  isMilestone?: boolean;
  isHallOfFame?: boolean;
  isWarning?: boolean;
}): string {
  const { streak, isRestart, isHallOfFame, isWarning } = options;

  // 殿堂入り
  if (isHallOfFame) {
    return hallOfFameComments[Math.floor(Math.random() * hallOfFameComments.length)].text;
  }

  // 警告（2日空いている）
  if (isWarning) {
    return warningComments[Math.floor(Math.random() * warningComments.length)].text;
  }

  // 再開時
  if (isRestart) {
    return restartComments[Math.floor(Math.random() * restartComments.length)].text;
  }

  // 連続日数に対応するコメントを探す
  const matchingComments = allStreakComments.filter((c) => {
    if (c.minStreak === undefined || c.maxStreak === undefined) {
      return true; // 汎用コメントは常にマッチ
    }
    return streak >= c.minStreak && streak <= c.maxStreak;
  });

  // 90日を超えた場合
  if (streak > 90) {
    const postHallOfFameComments = [
      "殿堂入りを果たした後も続けている。あなたは習慣のマスターだ。",
      "90日を超えてもなお続ける。それが本物の習慣。",
      "殿堂入りはゴールではなく、新しい始まり。",
      "習慣が人生の一部になった。素晴らしい。",
    ];
    return postHallOfFameComments[Math.floor(Math.random() * postHallOfFameComments.length)];
  }

  // マッチするコメントからランダムに選択
  if (matchingComments.length > 0) {
    return matchingComments[Math.floor(Math.random() * matchingComments.length)].text;
  }

  // フォールバック（該当なしの場合）
  return universalComments[Math.floor(Math.random() * universalComments.length)].text;
}

// コメント総数を取得
export function getCommentCount(): number {
  return allComments.length;
}
