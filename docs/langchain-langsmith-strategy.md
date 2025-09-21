# LangChain・LangSmith統合戦略

## LangChain設計
- **RunnableSequence構成**: `PromptTemplate` → `ChatModel` → `StructuredOutputParser` の流れで厳格JSON出力を保証。
- **チェーン分割**:
  - `captionChain`: キャプション・ハッシュタグ・AltText生成。
  - `reviewHeuristicsChain`: 生成結果に対する自己評価（hook_strength など）を算出し、LangSmith評価にフィード。
  - `personaChain`: ターゲットペルソナに応じた文体変換を行い再フォーマット。
- **Lazy初期化**: `LazyAIClient` でモデルインスタンスを遅延生成し、コールドスタート時のオーバーヘッドを削減。
- **モデル切り替え**: `GenerationService` は `modelProvider` オプションを受け取り、`gpt-4o`, `gpt-5-mini`, Workers AI等を選択可能。

## プロンプト管理
- `core/langchain/prompts/templates.ts` にベースプロンプト、`personas.ts` にブランド別拡張を定義。
- `PromptService` がKVキャッシュを利用し、頻繁なテンプレート構築を回避。
- Few-shot例はLangSmith Datasetからロードし、環境毎に差し替え。

## LangSmith活用
- **トレース**: `traceable` デコレータでワークフロー単位のトレースを自動送信。`project_name` を `instagram-generator` とし、`user_id` にブランドIDを設定。
- **評価**: `langsmith/evaluation` を利用した自動採点。メトリクス例: `hook_strength`, `cta_presence`, `brand_alignment`。
- **データセット管理**: 人手レビュー後の承認結果をLangSmith Datasetに同期し、リグレッションテストに活用。
- **アラート**: LangSmithのWebhookで品質スコアが閾値未満の場合、Opsチャンネルへ通知。

## 性能最適化
- **トークンコスト制御**: 入力プロンプトを正規化（不要な空白削除、ブランドガイドラインを要約）してトークン数を削減。
- **バッチ処理**: `processBatch` を用い、複数ドラフトの生成を並列化。LangSmithの`client.createRunBatch`で計測を統合。
- **結果キャッシュ**: 同一テーマ・ブランド・期間で再生成する場合はKVにキャッシュし、LangSmithに`cached: true`タグを付与。

## フィードバックループ
1. 生成結果をLangSmithに送信（トレースID取得）。
2. レビュアーの評価をUIで収集し、LangSmith Datasetに紐付け。
3. `evaluationRunner` が定期的に再評価を実行し、スコア低下時にプロンプト更新を促す。
4. 更新されたプロンプトはGitで管理し、LangSmithにバージョンタグを付与。

## エラー処理
- モデル側の一時的エラーは `retryWithBackoff` で最大3回再試行。LangSmithには `status: retrying` を記録。
- JSONパース失敗時は `validationChain` でレスポンスを再構築し、最終的に失敗なら人手レビューに回す。

## ガバナンス
- APIキーはWrangler Secretsで管理し、`Env` からのみ参照。
- モデル更新時はLangSmithのComparison機能で旧モデルと性能比較を実行。
- プロンプト変更はPull Requestでレビューし、LangSmithで事前にA/B評価を実施。
