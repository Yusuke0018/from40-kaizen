## Progress Log

**Latest update:** 2024-06-12  
**Focus:** モバイル特化UIの初期土台と画面フローのサンプル実装

### Done
- Next.js 16 + Tailwind v4 プロジェクトを初期化し、App Router / src ディレクトリ構成を採用。
- グローバルテーマにミントグリーン＆スカイブルーのトーン、Manropeフォント、円形フォームスタイルを設定。
- `(mobile)` ルートグループを作成し、スマホ幅に最適化した共通シェル（トップメッセージ、ボトムタブ、FAB）を構築。
- `today`, `history`, `export`, `settings` の4画面モックを作成。フォーム要素・タスクチップ・CSV設定UIなど実装イメージを配置。
- READMEとこのファイルを整備し、次に取り組むべき項目を共有可能な形で残した。

### Next up
1. Firebase設定（Auth / Firestore / Storage）の導入と環境変数テンプレート作成。
2. `today` 画面のフォーム送信をServer Actionsまたはクライアントミューテーションに接続し、ローカルキャッシュ（IndexedDB）方針を固める。
3. CSVエンドポイント（Next.js Route）でモックデータを返し、UIからダウンロードできるようにする。
4. 「実験タグ」やミッションをFirestoreコレクションで管理→UIのチェック状態を同期。
5. 写真アップロードフロー：Firebase Storageの署名付きURL or クライアントSDKで仮アップロード→Firestoreにメタ情報保存。

### Notes for context switching
- 仕様・カラー・フローのメモは `docs/` 以下に集約していく。途中で作業を止める際は `docs/PROGRESS.md` の Done / Next up を更新。
- UIコンポーネントは `src/components/` に追加し、Storybook導入予定。追加コンポーネントの利用例は `app/(mobile)` 以下の画面で確認できる。
- 端末幅は `max-w-md` をベースにし、実機テスト時は 430px 前後で見ると想定デザインに近い。
