## Habit Tracker - 習慣形成アプリ

シンプルな習慣トラッカー。最大3つの習慣を登録し、90日達成で殿堂入りを目指すアプリです。

### Stack
- Next.js 16 / React 19（App Router）
- Tailwind CSS v4
- Firebase（Auth, Firestore）
- lucide-react（アイコン）

### Getting Started
```bash
cp .env.example .env.local  # Firebaseの値を入力
npm install
npm run dev   # http://localhost:3000
```

### ルール
- **達成条件**: 2日に1回以上チェックすれば継続
- **リセット条件**: 3日以上チェックしないと最初からカウントし直し
- **殿堂入り**: 90日連続達成で殿堂入り

### Features
- **習慣登録**: 最大3つまで習慣を登録可能
- **毎日チェック**: Today画面でワンタップチェック
- **ストリーク**: 連続日数をカウント（2日に1回でもOK）
- **殿堂入り**: 90日達成で殿堂入り
- **励ましコメント**: 200種類以上のコメントが達成時に表示
- **履歴画面**: 各習慣の統計情報と達成履歴を確認

### Screens
| 画面 | パス | 機能 |
|------|------|------|
| Today | `/today` | 今日の習慣チェック、進捗表示、警告表示 |
| History | `/history` | 習慣の統計、達成履歴、カレンダー表示 |
| Settings | `/settings` | 習慣の追加・編集・削除、アカウント管理 |

### Firebase Setup
1. Firebase Consoleで新規プロジェクトを作成
2. **Authentication → Sign-in method** で「Email / Password」を有効化
3. **Build → Firestore Database** を作成
4. ウェブアプリを登録して `.env.local` の `NEXT_PUBLIC_FIREBASE_*` を設定
5. Service Accountsで秘密鍵を発行し `FIREBASE_*` 環境変数を設定

### Structure
- `src/app/(mobile)/today` - 今日の習慣チェック画面
- `src/app/(mobile)/history` - 習慣の履歴・統計画面
- `src/app/(mobile)/settings` - 習慣の管理・アカウント設定
- `src/app/api/goals` - 習慣CRUD API
- `src/app/api/goals/check` - 習慣チェックAPI
- `src/lib/comments.ts` - 励ましコメント（200種類以上）
