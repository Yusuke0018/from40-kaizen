## 40 Chronicle

モバイル特化で生活データを記録し、FirebaseとCSVエクスポートを通じてAI分析につなげるためのアプリです。Next.js (App Router) + TypeScript + Tailwind CSS v4 をベースにし、Vercelデプロイを想定しています。

### Stack
- Next.js 16 / React 19（App Router, Server Actions）
- Tailwind CSS v4（カラートークンにミントグリーン＆スカイブルー）
- `next/font` (Manrope, Geist Mono)
- Firebase（Auth, Firestore, Storage）※次タスクで導入予定
- lucide-react（軽量アイコンセット）

### Getting Started
```bash
cp .env.example .env.local  # Firebaseの値を入力
npm install
npm run dev   # http://localhost:3000
npm run lint
```

`src/app/(mobile)` に Today / History / Export / Settings のスマホ向け画面を集約し、`docs/PROGRESS.md` で進捗と次タスクをメモしています。別端末で再開するときはこのファイルか Issue に最新状況を残してください。

### Firebase Setup
1. Firebase Consoleで新規プロジェクトを作成し、**Authentication → Sign-in method** で「Email link（パスワードなし）」を有効化。認証ドメインに `localhost` と Vercelドメインを追加。
2. **Build → Firestore Database** と **Storage** を作成（リージョンは `asia-northeast1` など扱いやすい場所を推奨）。
3. ウェブアプリを登録して表示される SDK 設定を `.env.local` の `NEXT_PUBLIC_FIREBASE_*` にコピペ。
4. **Service Accounts → Firebase Admin SDK** で新しい秘密鍵を発行し、`FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY` に設定。`PRIVATE_KEY` は `\n` を含めたまま引用符付きで保存。
5. Firebase Auth の Action URL として `NEXT_PUBLIC_APP_URL` を `http://localhost:3000`（開発時）や本番ドメインに合わせる。
6. Security Rules は以下をベースにする（必要に応じて拡張）:
   ```plaintext
   match /databases/{database}/documents {
     match /users/{userId}/records/{recordId} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
     }
   }

   match /b/{bucket}/o {
     match /users/{userId}/photos/{allPaths=**} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
     }
   }
   ```

### Authentication Flow
- `/signin` またはアプリ起動時に表示されるフォームに自分のメールを入力 → Firebase Auth がログインリンクを送信。
- メール内のリンクを開くと自動的にサインイン（ローカルストレージにアドレスを保持）。1ユーザー想定なのでユーザー管理は不要。
- Settings画面からサインアウト可能。

### CSV Export
- `Export` 画面で期間と列を選択 → `CSVをダウンロード` で `/api/records/export` を叩き、Snake caseヘッダーの1日1行CSVを生成。
- 画像URLやメモも `|` 区切りで同一セルに格納し、AIに渡しやすい構造。

### Structure
- `src/app/(mobile)/layout.tsx` … モバイル共通シェル（グラデーションヘッダー、ボトムタブ、FAB）
- `src/app/(mobile)/today` … 朝/夜フォーム、食事・睡眠等の記録UI
- `src/app/(mobile)/history` … タイムラインとコリレーションヒント
- `src/app/(mobile)/export` … 期間/列選択→CSVダウンロード設定
- `src/app/(mobile)/settings` … 実験タグ、リマインダー、連携予定
- `src/components/layout` … レイアウト用コンポーネント
- `docs/PROGRESS.md` … 進捗ログとNextアクション

### Design System
- カラー: Mint (#A3E4D7, #47BCA8) / Sky (#7EC8E3, #1E8EC2) を軸に白ベースのカードUI
- タイポグラフィ: Manrope (400-700) をメインに、モノスペースでGeist Mono
- レイアウト: `max-w-md` の1カラム、ボトムタブ＋浮遊アクションボタン、余白広め＆ラウンドコーナー
- コンポーネント: フォームは円形フィールド、カードは半透明のガラス調

### Roadmap
フェーズ分解とタスクの詳細は `docs/PROGRESS.md` を参照。Firebase設定 → フォーム送信 → CSV API → 写真アップロード → HealthKit/Fit連携の順で拡張予定です。
