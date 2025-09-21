/**
 * @fileoverview ワークフロー層 - 依存性注入ファクトリー
 * 
 * クリーンアーキテクチャにおける依存性注入（DI）コンテナーの実装。
 * 各層の具体的な実装クラスを組み立て、適切な依存関係でワークフローを構築する。
 * 
 * 設計原則：
 * - ファクトリーパターン：複雑なオブジェクト構築ロジックをカプセル化
 * - 依存性注入：各層間の疎結合を実現
 * - 設定の集約：全ての実装選択を一箇所で管理
 * - テスタビリティ：テスト時には異なる実装を注入可能
 */

import { DraftGenerationWorkflow } from "./workflows/draftGenerationWorkflow";
import { SimpleContentGenerator } from "./infrastructure/simpleContentGenerator";
import { QueueImageScheduler } from "./infrastructure/queueImageScheduler";
import { CreateDraftUseCase } from "./usecases/createDraftUseCase";
import { KvDraftRepository } from "./infrastructure/kvDraftRepository";
import { UuidProvider } from "./infrastructure/uuidProvider";
import { SystemClock } from "./infrastructure/systemClock";
import type { WorkerBindings } from "./types";

/**
 * ドラフト生成ワークフローファクトリー
 * 
 * Cloudflare Worker環境からドラフト生成ワークフローを構築する。
 * 各層の具体的な実装を選択し、適切な依存関係で接続する。
 * 
 * 依存関係の構築順序：
 * 1. インフラ層：リポジトリ、プロバイダー、スケジューラー
 * 2. ユースケース層：ビジネスロジック
 * 3. ワークフロー層：オーケストレーション
 * 
 * 実装選択：
 * - Repository: KvDraftRepository（Cloudflare KV）
 * - ContentGenerator: SimpleContentGenerator（ルールベース）
 * - ImageScheduler: QueueImageScheduler（Cloudflare Queues）
 * 
 * @param env Cloudflare Worker バインディング環境
 * @returns 設定済みのドラフト生成ワークフロー
 */
export function createDraftGenerationWorkflow(env: WorkerBindings): DraftGenerationWorkflow {
  // インフラストラクチャ層の具象クラス構築
  const repository = new KvDraftRepository(env.KV);
  const idProvider = new UuidProvider();
  const clock = new SystemClock();
  
  // ユースケース層の構築（インフラ層への依存を注入）
  const useCase = new CreateDraftUseCase(repository, idProvider, clock);
  
  // ワークフロー層の外部サービス依存関係
  const contentGenerator = new SimpleContentGenerator();
  const imageScheduler = new QueueImageScheduler(env.IMAGE_QUEUE);

  // ワークフロー層の構築（全ての依存関係を注入）
  return new DraftGenerationWorkflow(contentGenerator, imageScheduler, useCase);
}
