# 運用・監視・テスト戦略

## 開発フロー
- `npm install` / `pnpm install` で依存同期。
- `npm run dev` でVite + Wrangler開発サーバ起動。`npm run dev:queue` でMiniflare Queueコンシューマ。
- `npm run lint`, `npm run build`, `npm run check` をコミット前に実行。CIでも同一コマンドを走査。
- PRではLangSmithトレースやcurlログなど手動検証結果を添付。

## テストレイヤ
- **ユニットテスト**: Vitest + ts-node。`core/langchain` や `workflows` の純粋ロジックを対象。
- **インテグレーションテスト**: MiniflareでHonoルータとQueueを実行し、KV/R2/D1のスタブを利用。
- **E2Eテスト**: React UIからの操作をPlaywrightで自動化、Queueの結果検証。
- **負荷テスト**: k6やArtilleryで `/generate` を対象にスループット検証。

## 監視
- **LangSmith**: 生成処理の成功率、評価スコア、トークン消費量。異常検知時はOpsチャンネルに通知。
- **Workers Analytics Engine**: リクエスト数、レイテンシ、エラー率をダッシュボード化。
- **Queues Metrics**: `pending_messages`, `dead_letter_count` を定期確認。
- **Meta API**: レート制限の使用量をCloudWatchや独自モニタで監視。

## アラート
- 失敗率 > 1% またはQueue遅延>5分でPagerDuty/Slack通知。
- LangSmith評価スコアが閾値未満のとき自動通知。
- Meta API 429/5xx多発時は自動的にレート制限を強化する。

## デプロイ
- mainブランチマージ時にGitHub Actionsで `wrangler deploy --env production`。
- Staging環境は `wrangler deploy --env staging`。Secretsも環境別に管理。
- デプロイログをLangSmith Run Metadataに記録し、バージョン追跡。

## ロールバック
- `wrangler versions list` で過去バージョンを確認し、`wrangler rollback` で即座に復旧。
- プロンプト変更はGitタグで管理。LangSmithのRunから復旧可能。

## ランブック
- Queue滞留時の対応、Meta API障害時の切り戻し、Secrets再発行手順を標準化。
- 重大障害発生時のコミュニケーションフロー（Ops → Marketing → Stakeholders）。

## 監査・レポート
- 月次でD1の `publish_logs` をエクスポートし、KPIを算出。
- LangSmithのComparisonsでモデル・プロンプト更新効果を報告。

## セキュリティレビュー
- 四半期ごとにアクセス権・Secrets・Wrangler設定を棚卸し。
- ESLint/TSルール、依存パッケージのバージョンアップを定期的に実施。
