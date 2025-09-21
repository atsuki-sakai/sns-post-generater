# モジュールアーキテクチャ

## ディレクトリ構成
```
/src
  /worker
    app.ts                # Honoアプリ初期化・HTTPアダプター
    index.ts              # Cloudflare Worker エントリーポイント
    workflow.ts           # ワークフロー組み立てファクトリ
    types.ts              # Bindings定義（KV, Queueなど）
    /domain
      postDraft.ts        # ドメインエンティティ（アグリゲート）
      __tests__/
    /usecases
      createDraftUseCase.ts
      __tests__/
    /workflows
      draftGenerationWorkflow.ts
      __tests__/
    /infrastructure
      kvDraftRepository.ts
      simpleContentGenerator.ts
      queueImageScheduler.ts
      systemClock.ts
      uuidProvider.ts
    /__tests__
      generateRoute.test.ts
```

## 責務分離とSOLID適用
- **Single Responsibility Principle**: `domain/` はエンティティ、`usecases/` はユースケース、`workflows/` はオーケストレーション、`infrastructure/` は外部サービス適応に限定する。
- **Open/Closed Principle**: 新しいAPIは `createApp` にルータを追加し、ユースケース／インフラを差し替えるだけで拡張できる。
- **Liskov Substitution Principle**: `ContentGenerator` や `ImageScheduler` はインターフェイスで差し替え可能な契約を定義。
- **Interface Segregation Principle**: ドメインごとに小さなポート（Repository、IdProvider等）に分割し、不要な依存を排除。
- **Dependency Inversion Principle**: Honoルートはユースケースインターフェイスに依存し、具体実装は `workflow.ts` で注入する。

## 主要モジュールの役割
- **app.ts**: HTTPアダプター。入力検証・レスポンス生成を担い、Workflowに委譲。
- **workflow.ts**: ユースケースとインフラ実装を組み合わせて `DraftGenerationWorkflow` を生成。
- **domain/**: `PostDraft` アグリゲートとバリューオブジェクトを保持。
- **usecases/**: `CreateDraftUseCase` がドメインルールと永続化を指揮。
- **workflows/**: 時間のかかる処理（AI生成、画像ジョブ投入）を統合し、ユースケースへ橋渡し。
- **infrastructure/**: KVリポジトリ、キュー連携、ID生成、時計などCloudflare特化のアダプター。

## 依存関係の流れ
```
HTTP Adapter (app.ts) ──> Workflow ──> UseCase ──> Domain
                                     └─> Infrastructure Adapters
```
- ワークフローがアプリケーションサービスとしてドメインルールを主導し、インフラ依存をアダプター経由で呼び出す。
- 逆方向（インフラ→ドメイン）の依存を禁止し、依存方向を一方向に保つことで循環依存を回避。

## テスト戦略とモジュール
- **ユニットテスト**: `domain/postDraft`、`usecases/createDraftUseCase`、`workflows/draftGenerationWorkflow` をスタブ依存で検証。
- **インテグレーションテスト**: `app.ts` を `createApp` 経由で起動し、Workflowをモック化してHTTP層を確認。
- **契約テスト**: React側のフォーム送信テストでAPI契約（ペイロード構造）を保証。

## バージョニング指針
- HTTP APIは `/api/v1` として名前空間化。後続バージョンは `createApp` に別ルータを追加する。
- ワークフローの主要ポート（Generator/Scheduler/Repository）はバージョン管理されたインターフェイスとして維持。
- スキーマの破壊的変更は `domain` レイヤのファクトリにバージョン検証を追加し、UI側にフィードバックする。

## コード生成・ドキュメンテーション
- 今後ZodやOpenAPIを導入する際は `app.ts` のバリデーション層に統合し、型情報をReactへ共有する。
- `docs/` へユースケース図・シーケンス図を追加し、LangSmith連携やキュー設計の詳細を更新する計画。
