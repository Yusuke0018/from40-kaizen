## Progress Log

**Latest update:** 2024-06-12  
**Focus:** Firebase連携・メールリンク認証・日次データ保存/CSV出力までのMVP完了

### Done
- Firebase SDK (client/admin)＋メールリンク認証（SignInカード、AuthGate）を実装。メールアドレスのみでログイン可能。
- Firestoreコレクション `users/{uid}/records/{date}` を想定した API (`/api/records`, `/api/records/export`) を実装し、TodayフォームとHistory/Export画面を実データ連携。
- 写真はFirebase Storageへ直接アップロード→ダウンロードURLを記録に保持。
- CSVエクスポートは列選択＋期間指定に対応し、Snake caseヘッダーでAI分析に渡しやすい形式に整形。
- README/.env.example/Settings画面を更新し、環境変数・ログイン/サインアウト手順を明記。

### Next up
1. Firestoreセキュリティルール：`users/{uid}` 配下のみ本人が読み書き可、Storageも同様のpath制限を設定する。
2. オフラインキャッシュ：IndexedDB（例えば `idb-keyval`）を使って Today入力の一時保存と再送機構を実装。
3. リマインダー・実験タグを Firestore に保存し、Settings から編集→Today画面に反映できるようにする。
4. テスト/CI：APIルートの型テストやE2E（Playwright）で一連の記録〜CSVダウンロードを自動確認。
5. Analytics/AI連携：CSVをOpenAI/Geminiへ渡すためのプリセットプロンプトUIと、Historyの相関可視化をチャートに拡張。

### Notes for context switching
- 仕様・カラー・フローのメモは `docs/` 以下に集約していく。途中で作業を止める際は `docs/PROGRESS.md` の Done / Next up を更新。
- UIコンポーネントは `src/components/` に追加し、Storybook導入予定。追加コンポーネントの利用例は `app/(mobile)` 以下の画面で確認できる。
- 端末幅は `max-w-md` をベースにし、実機テスト時は 430px 前後で見ると想定デザインに近い。
