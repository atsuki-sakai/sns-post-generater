# ワークフローとキュー設計

## 主要ワークフロー
### 1. 生成ワークフロー（`createDraft`）
1. リクエスト受信: `/api/v1/generate`。
2. `validateRequest` ミドルウェアでZod検証。
3. `GenerationWorkflow` がLangChainチェーンを実行し、キャプション・ハッシュタグ・AltTextを生成。
4. 画像生成リクエストをQueueへ送信（非同期）。同時にダミープレビューURLを返却するか、簡易プレースホルダを返す。
5. KVにドラフト保存、LangSmithへトレース送信。
6. レスポンス: `draftId`, 生成テキスト、初期ステータス`draft`。

### 2. レビュー・承認ワークフロー（`approveDraft`）
1. UIが `/review/:id` でドラフトを取得し、編集後 `/review/:id/approve` を呼ぶ。
2. `ReviewWorkflow` がKVから最新ドラフトを取得し、レビューコメントをD1に記録。
3. 状態を `approved` に更新、 `PUBLISH_QUEUE` に `{ id, action: 'publish', requestedAt }` を送信。
4. LangSmithにレビューイベントをトレース（手動入力はDatasetに送る）。

### 3. 公開ワークフロー（`publishDraft`）
1. Queueコンシューマ（`queues/handlers.ts`）がメッセージバッチを受信。
2. `publishWorkflow` がKVからドラフトを取得、ステータスを `publishing` に。
3. 画像生成が未完了なら再キューイング、完了済みならMeta API `media` → `media_publish`。
4. 結果をD1 `publish_logs` に記録。成功時は `status: published`、失敗時は `failed` 更新。
5. 失敗原因に応じて `retryWithBackoff` を利用し再試行か人手アラート。

## キュー設計
### Cloudflare Queues
- **生産者**: `/review/:id/approve`、スケジュールバッチ、再試行オペレーション。
- **コンシューマ**: `/infrastructure/queues/handlers.ts` デフォルトエクスポートで `{ queue(batch, env) }`。
- **メッセージ形式**:
```
{
  "id": "draft-uuid",
  "action": "publish" | "retry" | "generate_image",
  "attempt": 1,
  "requestedAt": "2025-01-01T00:00:00Z"
}
```
- **デッドレター**: 連続失敗時は `FAILED_QUEUE` に送信、オペレーターへ通知。

### 非同期画像生成
- `IMAGE_QUEUE` を別途定義し、重い画像生成処理をWorkers AIまたは外部APIに委譲。
- コンシューマは別Workerまたは同一コードベース内の `queues/imageHandler.ts`。
- 画像完成後にR2へアップロードし、ドラフトに `imageUrl` を追記。

## スケジューラ
- Cloudflare Cron Triggersで未公開ドラフトのリマインダー送信、定時投稿のキュー投入。
- `scheduler.ts` はスケジュール用のエントリポイントを提供し、`publishWorkflow` を再利用。

## エラーハンドリング
- Queue処理内で例外発生時は `retryWithBackoff` + `attempt` インクリメント。
- Meta APIのレート制限 (`429`) では `msg.retry({ delaySeconds: backoff })` 相当のロジックを実装。
- 処理失敗ログをD1とLangSmithに記録し、失敗パターンを分析。

## 状態遷移図
```
 draft --(approve)--> approved --(queue)--> publishing --(success)--> published
                                                └--(error)--> failed -> retry queue
```
- `failed` 状態のドラフトはUIに表示し、再承認or再生成を選択可能に。

## 可観測性
- 各ワークフローの開始/終了をLangSmithの`traceable`でラップし、`workflow.name`、`duration_ms`、`status`を記録。
- Workers Analytics Engineに `queue_latency_ms` や `publish_attempts` をカスタムメトリクスとして送信。

## スループット最適化
- `processBatch` ユーティリティでQueueメッセージを5件ずつ並列処理し、外部APIの同時接続数を制御。
- KVアクセスはまとめて `batchGet` パターン（`Promise.all`）を活用。
- 画像生成とテキスト生成を並列に進め、最初のレスポンス時間を最小化。
