## Progress Log

**Latest update:** 2025-11-25
**Focus:** 習慣形成に特化したシンプルなアプリへリファクタリング

### Done
- 習慣形成アプリとしてシンプル化
  - 睡眠、食事、気分などの記録機能を削除
  - daily-record関連のAPI・型・スキーマを削除
  - export/history画面を削除
- 習慣機能を最大3つまでに拡張（従来2つ→3つ）
- Today画面を習慣チェック専用UIに刷新
- Settings画面を習慣管理に特化
- ナビゲーションをToday/Settingsの2画面に簡素化
- READMEを更新

### Structure
- `/today` - 習慣の毎日チェック（進捗表示、ストリーク、殿堂入り）
- `/settings` - 習慣の追加・編集・削除、アカウント管理
- `/api/goals` - 習慣CRUD（最大3つ制限）
- `/api/goals/check` - 習慣チェックとストリーク計算

### Next up
1. Firestoreセキュリティルール更新
2. オフライン対応（IndexedDB）
3. 通知リマインダー機能
4. テスト追加
