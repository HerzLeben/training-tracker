# バックアップと復元

## データ（あなたのトレーニング記録・体組成）

データは各端末の **IndexedDB** に保存される。**アプリ更新では消えない**が、機種変更・
端末初期化・ブラウザのデータ削除では失われる。GitHub リポジトリは公開のため、
**個人データはここには保存しない**。

### 手動バックアップ（推奨: 週1回）
1. iPhone でアプリを開く
2. **Settings → Data → Backup JSON (save / share)**
3. 共有シートで **Google Drive**（または「ファイルに保存」）を選ぶ
   - Drive に `training-backup` フォルダを作って貯めると整理しやすい
   - ファイル名は `training-backup-YYYY-MM-DD.json`

### 復元
- **Settings → Data → Import JSON (restore)** で保存した `.json` を選ぶ（同じ日付は上書き）
- CSV（体組成）は **Import body metrics (CSV)** から取り込み可能

### 補足
- マイグレーションは「追加のみ」方針（`src/db/db.ts` 参照）。今後の更新で
  menus / metrics / workouts のデータを削除しない。
- 起動時に `navigator.storage.persist()` を要求し、OS の自動削除を避けている。

## コード（このリポジトリ）

- 各デプロイは 1 コミット。安定版には Git タグを付ける（例 `stable-2026-07-03`）。
- 復元: `git checkout stable-2026-07-03`（コードを戻す）。データには影響しない。
- タグ一覧: `git tag -l`
