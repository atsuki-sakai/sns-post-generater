# ドメインモデルとデータストア

## ドメインモデル
### InstagramPost
- `id`: string — KVキーおよびD1主キーと揃える。
- `caption`: string — 125〜2200文字制約。
- `hashtags`: string[] — 最大25個、重複排除。
- `altText`: string — 1000文字以内。
- `status`: `'draft' | 'approved' | 'publishing' | 'published' | 'failed'`。
- `metadata`: `{ theme, brandVoice, targetPersona, createdAt, updatedAt?, publishedAt? }`。
- `metrics`: `{ generationTimeMs, llmTokensUsed, imageGenerationTimeMs }` — LangSmith or Analytics Engineから転記。

### ReviewFeedback
- `draftId`: string。
- `reviewerId`: string。
- `comments`: string。
- `tags`: string[]（例: "tone", "cta"）。
- `resolution`: `'pending' | 'accepted' | 'rework'`。
- `createdAt`: string。

### PublishLog
- `id`: string。
- `draftId`: string。
- `attempt`: number。
- `status`: `'success' | 'retrying' | 'failed'`。
- `meta`: `{ creationId?, publishId?, errorCode?, httpStatus?, retryAfter? }`。
- `timestamp`: string。

## データストア利用方針
### Workers KV
- 役割: ドラフトの短期保存、冪等性キー、レート制限カウンタ。
- キーパターン: `draft:{draftId}`, `ratelimit:{clientId}:{window}`, `idempotency:{hash}`。
- TTL: ドラフトは7日、冪等性キーは24時間、レート制限キーはウィンドウサイズに合わせる。
- データ構造: JSON文字列。Zodスキーマでシリアライズ前後の検証。

### R2
- 役割: 生成画像のバイナリ保管。投稿直前まで保持。
- バケット構造: `drafts/{draftId}/{variant}.png`、`published/{publishId}.png`。
- アクセス: 署名付きURL or Public bucket（要CDN設定）。
- メタデータ: `Content-Type`, `x-image-generator`（Workers AI / Stable Diffusionなど）、`expires`。

### D1 Database
- 役割: 永続監査ログ、レビューフィードバック、公開履歴。
- テーブル設計:
```
CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  caption TEXT NOT NULL,
  hashtags TEXT NOT NULL, -- JSON文字列
  alt_text TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata TEXT NOT NULL,
  metrics TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE review_feedback (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  comments TEXT,
  tags TEXT,
  resolution TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES drafts(id)
);

CREATE TABLE publish_logs (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  meta TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES drafts(id)
);
```
- インデックス: `status`、`created_at`、`draft_id`。Queue再実行や監査レポート用。

### メタデータ共有
- `worker-configuration.d.ts` に `Bindings` として KV/R2/D1/Queue/Secrets を定義。
- `shared/types` でドメインモデル用TypeScript型を定義し、APIレスポンス・UIで共通利用。

## データ整合性
- KVのドラフト更新時はETagやバージョン番号を保持し、同時編集を検出。
- D1の`publish_logs`で投稿成功を記録後、KVの`status`を`published`に変更しR2のファイルも`published/`へコピー。
- Queueメッセージに`attempt`や`expectedStatus`を含めて冪等性を担保。

## バックアップ・保持方針
- KV/R2のドラフトは発行から7日で自動削除。公開済み画像は必要に応じてR2ライフサイクルポリシーでアーカイブ。
- D1は監査要件に合わせて90日 or 1年保存。エクスポートには `wrangler d1 execute` + `COPY` を利用。

## データアクセス層
- `/infrastructure/storage/kv.ts`: `DraftStore` クラスで `save`, `get`, `updateStatus`, `listPending` を提供。
- `/infrastructure/storage/d1.ts`: `AuditRepository` でレビュー・公開ログをCRUD。
- `/infrastructure/storage/r2.ts`: `MediaRepository` でアップロード、署名URL発行、ライフサイクル管理。
- これらは `Env` を受け取り、テスト時はモック実装に差し替え。

## キャッシュ戦略
- LangChainプロンプトやペルソナ設定はKVにメモ化（`SmartCache` パターン）。
- Meta API結果の短期キャッシュを用意し、重複投稿を防ぐ。
- UIで必要な一覧データはD1ビューを作成し、簡易表示を高速化。
