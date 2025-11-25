// 名言風コメント集
// 連続日数に基づいて固定のコメントを表示（次の達成まで同じコメント）
// カテゴリ: streak（連続達成）, restart（再開）, hallOfFame（殿堂入り）, warning（警告）

export type CommentCategory = "streak" | "restart" | "hallOfFame" | "warning";

export type Comment = {
  text: string;
  category: CommentCategory;
  streak: number; // 特定の連続日数に固定
};

// 連続日数に応じた名言風コメント（各日数に1つの固定コメント）
const streakComments: Comment[] = [
  // Day 1: 始まりの日
  { streak: 1, text: "千里の道も一歩から。今日、あなたの旅が始まった。", category: "streak" },

  // Day 2: 継続の種
  { streak: 2, text: "昨日の自分を超えた。それが成長の証。", category: "streak" },

  // Day 3: 3日坊主を超えて
  { streak: 3, text: "3日続けた人だけが見える景色がある。あなたは今そこにいる。", category: "streak" },

  // Day 4
  { streak: 4, text: "習慣は意志より強い。4日目、その力を感じ始めているはず。", category: "streak" },

  // Day 5
  { streak: 5, text: "5日連続。小さな炎が確かな熱を持ち始めた。", category: "streak" },

  // Day 6
  { streak: 6, text: "1週間まであと1日。明日、最初の山を越える。", category: "streak" },

  // Day 7: 1週間達成
  { streak: 7, text: "7日達成。習慣の種が芽を出した。水をあげ続けよう。", category: "streak" },

  // Day 8-9
  { streak: 8, text: "1週間を超えた。もうこれは偶然じゃない、あなたの選択だ。", category: "streak" },
  { streak: 9, text: "9日目。二桁の扉が目の前にある。", category: "streak" },

  // Day 10: 二桁突入
  { streak: 10, text: "10日達成。10という数字には完成の意味がある。最初の完成形だ。", category: "streak" },

  // Day 11-13
  { streak: 11, text: "11日目。二桁の世界へようこそ。", category: "streak" },
  { streak: 12, text: "12日。1ダース。揃った感じがする日。", category: "streak" },
  { streak: 13, text: "13日目。不吉なんて迷信。続けている事実だけが真実。", category: "streak" },

  // Day 14: 2週間達成
  { streak: 14, text: "2週間。脳科学では習慣の神経回路ができ始める頃。体が覚え始めている。", category: "streak" },

  // Day 15-20
  { streak: 15, text: "15日。折り返し地点の折り返し。確実に前に進んでいる。", category: "streak" },
  { streak: 16, text: "16日目。毎日の選択が、毎日の自分を作っている。", category: "streak" },
  { streak: 17, text: "17日。平凡な日こそ、非凡な継続が光る。", category: "streak" },
  { streak: 18, text: "18日目。努力は必ず何かの形で返ってくる。", category: "streak" },
  { streak: 19, text: "19日。明日で20日。大台が見えてきた。", category: "streak" },
  { streak: 20, text: "20日達成。あなたは20回、自分との約束を守った。", category: "streak" },

  // Day 21: 3週間（習慣形成の目安）
  { streak: 21, text: "21日。心理学では習慣形成に必要な日数。あなたの中で何かが変わり始めている。", category: "streak" },

  // Day 22-29
  { streak: 22, text: "22日目。習慣が第二の天性になりつつある。", category: "streak" },
  { streak: 23, text: "23日。やらないと落ち着かない。それが習慣の証。", category: "streak" },
  { streak: 24, text: "24日目。丸1日×24回。時間を味方につけている。", category: "streak" },
  { streak: 25, text: "25日。四半分のような節目。殿堂入りまであと65日。", category: "streak" },
  { streak: 26, text: "26日目。一歩一歩、確実に頂上に近づいている。", category: "streak" },
  { streak: 27, text: "27日。明後日で1ヶ月。大きな山を越える準備はできた。", category: "streak" },
  { streak: 28, text: "28日。4週間達成。月が満ちるように、習慣も満ちてきた。", category: "streak" },
  { streak: 29, text: "29日目。明日、1ヶ月の壁を破る。", category: "streak" },

  // Day 30: 1ヶ月達成
  { streak: 30, text: "30日、1ヶ月達成。これはもう習慣じゃない。あなたの一部だ。", category: "streak" },

  // Day 31-44
  { streak: 31, text: "31日目。新しい月に入った。習慣は新しいステージへ。", category: "streak" },
  { streak: 32, text: "32日。過去の自分が今の自分を羨んでいる。", category: "streak" },
  { streak: 33, text: "33日目。ゾロ目の日。揃っている感覚を大切に。", category: "streak" },
  { streak: 34, text: "34日。継続は才能を超える。あなたが証明している。", category: "streak" },
  { streak: 35, text: "35日。5週間達成。5という数字は安定の象徴。", category: "streak" },
  { streak: 36, text: "36日目。6×6。完全数に近づいている。", category: "streak" },
  { streak: 37, text: "37日。習慣の力で、不可能が可能になっていく。", category: "streak" },
  { streak: 38, text: "38日目。毎日の積み重ねが、やがて山になる。", category: "streak" },
  { streak: 39, text: "39日。明日で40日。次の大台へ。", category: "streak" },
  { streak: 40, text: "40日達成。40日間、雨の日も風の日も続けた。本物だ。", category: "streak" },
  { streak: 41, text: "41日目。折り返しまであと4日。ゴールが見え始めた。", category: "streak" },
  { streak: 42, text: "42日。6週間達成。宇宙の答えは42という説もある。", category: "streak" },
  { streak: 43, text: "43日目。明後日、ついに折り返し地点。", category: "streak" },
  { streak: 44, text: "44日。ゾロ目。明日、旅の半分が終わる。", category: "streak" },

  // Day 45: 折り返し地点
  { streak: 45, text: "45日、折り返し地点。振り返れば45日、見上げれば45日。あなたはもう半分を歩いた。", category: "streak" },

  // Day 46-59
  { streak: 46, text: "46日目。後半戦の幕開け。ゴールに向かって走り出そう。", category: "streak" },
  { streak: 47, text: "47日。後半は前半より楽になる。習慣の力を信じて。", category: "streak" },
  { streak: 48, text: "48日目。残り42日。カウントダウンが始まった。", category: "streak" },
  { streak: 49, text: "49日。7の7乗。完全な数字。明日50日。", category: "streak" },
  { streak: 50, text: "50日達成。半世紀の半分。あなたの努力は歴史に刻まれている。", category: "streak" },
  { streak: 51, text: "51日目。50日を超えた。もう誰にも止められない。", category: "streak" },
  { streak: 52, text: "52日。1年は52週。あなたは52日を手に入れた。", category: "streak" },
  { streak: 53, text: "53日目。残り37日。ゴールラインが近づいてくる。", category: "streak" },
  { streak: 54, text: "54日。毎日の勝利が、人生の勝利になる。", category: "streak" },
  { streak: 55, text: "55日。ゾロ目。5の連続。連続の中の連続。", category: "streak" },
  { streak: 56, text: "56日目。8週間達成。2ヶ月まであと4日。", category: "streak" },
  { streak: 57, text: "57日。あと33日。1ヶ月と少しで殿堂入り。", category: "streak" },
  { streak: 58, text: "58日目。明後日で60日。2ヶ月の壁が目の前に。", category: "streak" },
  { streak: 59, text: "59日。明日、2ヶ月という偉業を達成する。", category: "streak" },

  // Day 60: 2ヶ月達成
  { streak: 60, text: "60日、2ヶ月達成。1時間の60分、1分の60秒。60は時を刻む数字。あなたは2ヶ月の時を刻んだ。", category: "streak" },

  // Day 61-69
  { streak: 61, text: "61日目。2ヶ月を超えた。残り1ヶ月を切った。", category: "streak" },
  { streak: 62, text: "62日。ここまで来たら、あとは惰性でもいける。習慣の力だ。", category: "streak" },
  { streak: 63, text: "63日目。9週間達成。あと4週間で殿堂入り。", category: "streak" },
  { streak: 64, text: "64日。8の8乗。完璧な立方体。完成が近い。", category: "streak" },
  { streak: 65, text: "65日。残り25日。最後の四分の一に突入。", category: "streak" },
  { streak: 66, text: "66日目。ゾロ目。6という数字は調和の象徴。", category: "streak" },
  { streak: 67, text: "67日。毎日が自信を積み上げている。", category: "streak" },
  { streak: 68, text: "68日目。明後日で70日。節目が迫る。", category: "streak" },
  { streak: 69, text: "69日。明日、70日という大台に到達する。", category: "streak" },

  // Day 70
  { streak: 70, text: "70日達成。古希という言葉がある。70は特別な数字。あなたの旅も特別だ。", category: "streak" },

  // Day 71-79
  { streak: 71, text: "71日目。残り19日。20日を切った。ラストスパートだ。", category: "streak" },
  { streak: 72, text: "72日。残り18日。もう指で数えられる。", category: "streak" },
  { streak: 73, text: "73日目。最後の直線に入った。ゴールが見える。", category: "streak" },
  { streak: 74, text: "74日。残り16日。2週間と少し。", category: "streak" },
  { streak: 75, text: "75日。四分の三を達成。殿堂入りまで残り15日。", category: "streak" },
  { streak: 76, text: "76日目。残り14日。あと2週間で伝説になる。", category: "streak" },
  { streak: 77, text: "77日。ラッキーセブンのゾロ目。幸運を味方に最後まで。", category: "streak" },
  { streak: 78, text: "78日目。残り12日。カウントダウンが加速する。", category: "streak" },
  { streak: 79, text: "79日。明日80日。いよいよクライマックス。", category: "streak" },

  // Day 80
  { streak: 80, text: "80日達成。傘寿という言葉がある。80は長寿の象徴。習慣も長寿だ。", category: "streak" },

  // Day 81-89: ラストスパート
  { streak: 81, text: "81日目。残り9日。一桁に突入。最後の坂を登れ。", category: "streak" },
  { streak: 82, text: "82日。残り8日。1週間と1日で殿堂入り。", category: "streak" },
  { streak: 83, text: "83日目。残り7日。ちょうど1週間で達成。", category: "streak" },
  { streak: 84, text: "84日。12週間達成。3ヶ月まであと6日。", category: "streak" },
  { streak: 85, text: "85日目。残り5日。片手で数えられる。", category: "streak" },
  { streak: 86, text: "86日。残り4日。あと少しで頂上だ。", category: "streak" },
  { streak: 87, text: "87日目。残り3日。最後の3日間を全力で。", category: "streak" },
  { streak: 88, text: "88日。末広がりの縁起の良い数字。残り2日。", category: "streak" },
  { streak: 89, text: "89日目。明日、90日。明日、あなたは伝説になる。", category: "streak" },

  // Day 90: 殿堂入り直前（実際は殿堂入りコメントが表示される）
  { streak: 90, text: "90日。この数字を見ることができるのは、選ばれた者だけ。", category: "streak" },
];

// 再開系（restart）- 中断後に再開した時
const restartComments: Comment[] = [
  { streak: 1, text: "倒れても立ち上がる。それが本当の強さ。今日から再スタート。", category: "restart" },
  { streak: 2, text: "過去は変えられない。でも未来は今から作れる。2日目。", category: "restart" },
  { streak: 3, text: "何度でもやり直せる。それが人生の素晴らしさ。3日達成。", category: "restart" },
];

// 殿堂入り系（hallOfFame）
const hallOfFameComments: Comment[] = [
  { streak: 90, text: "90日達成。あなたは習慣を超え、習慣になった。殿堂入りおめでとう。", category: "hallOfFame" },
];

// 警告系（warning）- 中断しそうな時（2日空いている）
const warningComments: Comment[] = [
  { streak: 0, text: "今日チェックしないと、積み上げた日々がリセットされる。あと1日だけ。", category: "warning" },
];

// 全コメントをエクスポート
export const allComments: Comment[] = [
  ...streakComments,
  ...restartComments,
  ...hallOfFameComments,
  ...warningComments,
];

// 汎用の名言（特定の日数に該当しない場合のフォールバック）
const fallbackComments: Record<string, string> = {
  low: "毎日の小さな選択が、大きな変化を生む。",
  mid: "継続は力なり。今日もその力を手に入れた。",
  high: "頂上はもうすぐそこ。最後まで歩み続けよう。",
};

// コメント取得関数（連続日数に基づいて固定のコメントを返す）
export function getComment(options: {
  streak: number;
  isRestart?: boolean;
  isMilestone?: boolean; // 後方互換性のため残す（使用しない）
  isHallOfFame?: boolean;
  isWarning?: boolean;
}): string {
  const { streak, isRestart, isHallOfFame, isWarning } = options;

  // 殿堂入り
  if (isHallOfFame) {
    return hallOfFameComments[0].text;
  }

  // 警告（2日空いている）
  if (isWarning) {
    return warningComments[0].text;
  }

  // 再開時（連続日数が少なく、restartフラグがある場合）
  if (isRestart && streak <= 3) {
    const restartComment = restartComments.find((c) => c.streak === streak);
    if (restartComment) {
      return restartComment.text;
    }
  }

  // 連続日数に対応するコメントを探す
  const exactMatch = streakComments.find((c) => c.streak === streak);
  if (exactMatch) {
    return exactMatch.text;
  }

  // 90日を超えた場合
  if (streak > 90) {
    return "殿堂入りを果たした後も続けている。あなたは習慣のマスターだ。";
  }

  // フォールバック（該当する日数のコメントがない場合）
  if (streak <= 10) {
    return fallbackComments.low;
  } else if (streak <= 60) {
    return fallbackComments.mid;
  } else {
    return fallbackComments.high;
  }
}

// コメント総数を取得
export function getCommentCount(): number {
  return allComments.length;
}
