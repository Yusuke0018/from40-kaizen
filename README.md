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
npm install
npm run dev   # http://localhost:3000
npm run lint
```

`src/app/(mobile)` に Today / History / Export / Settings のスマホ向け画面を集約し、`docs/PROGRESS.md` で進捗と次タスクをメモしています。別端末で再開するときはこのファイルか Issue に最新状況を残してください。

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
