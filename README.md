# Training Tracker (PWA)

トレーナー作成のプログラムに沿って日々のトレーニングを記録し、結果を LINE で共有する
個人用 PWA。データは端末内（IndexedDB）に保存され、GitHub Pages に自動デプロイされる。

- 本番: https://herzleben.github.io/training-tracker/
- リポジトリ: https://github.com/HerzLeben/training-tracker（public）

## 開発

```bash
npm install
npm run dev        # ローカル開発サーバ
npm run build      # 型チェック + 本番ビルド（dist/）
```

ロジックの簡易テスト:

```bash
./node_modules/.bin/esbuild scripts/verify-logic.ts --bundle --platform=node --format=esm \
  --outfile=/tmp/verify-logic.mjs && node /tmp/verify-logic.mjs
```

デプロイ: `main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）が自動公開。

## フォルダ構成

```
src/
  pages/        画面（Today / Progress / Body / Settings）
  components/   UI 部品（TodayMenu, MenuItemRow, DayDetail, ...）
  engine/       セッション組み立て（session.ts）
  lib/          純ロジック（adherence, history, share, plan, csv, date, number, styles）
  db/           Dexie スキーマ・CRUD（db.ts / repo.ts）・React フック（hooks.ts）
  data/         初期データ（プログラムのサンプル/初期投入）
  types/        ドメイン型
scripts/        ロジック検証（verify-logic.ts）・アイコン生成（gen-icons.mjs）
docs/           運用メモ（バックアップ手順など）
public/         PWA アイコン・favicon
```

## ドキュメント

- 改修要件の記入先: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- バックアップ手順: [docs/BACKUP.md](docs/BACKUP.md)

## バックアップと復元

詳細は [docs/BACKUP.md](docs/BACKUP.md)。要点:

- **データ**（トレ記録・体組成）は端末内。プライバシー保護のため公開リポジトリには保存しない。
  端末で Settings → Data → Backup JSON を実行し、Google Drive 等に保存する。
- **コード**の復元ポイントは Git タグ（例 `stable-2026-07-03`）。`git checkout <tag>` で戻せる。
