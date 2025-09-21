/**
 * @fileoverview インフラストラクチャ層 - Cloudflare Queues 画像スケジューラ
 * 
 * クリーンアーキテクチャにおけるインフラストラクチャ層の実装。
 * ワークフロー層で定義されたImageSchedulerポートの具体的実装として、
 * Cloudflare Queuesを使用して画像生成タスクを非同期処理する。
 * 
 * 設計原則：
 * - アダプターパターン：Cloudflare Queues APIをドメインポートに適応
 * - 非同期処理：時間のかかる画像生成をバックグラウンドで実行
 * - 堅牢性：キューが利用できない環境でも動作（開発時等）
 * - スケーラビリティ：メッセージキューによる負荷分散対応
 */

import type { ImageScheduler } from "../workflows/draftGenerationWorkflow";

/**
 * Cloudflare Queuesバインディングの型定義
 * 
 * 画像生成タスク用のキューバインディング。
 * 開発環境では未定義の場合があるためオプショナル型として定義。
 */
type QueueBinding = Queue<{ type: "generate_image"; draftId: string; prompt: string }> | undefined;

/**
 * Cloudflare Queues 画像スケジューラ
 * 
 * ImageSchedulerポートのCloudflare Queues実装。
 * 画像生成タスクを非同期キューにスケジューリングし、
 * バックグラウンドワーカーでの処理を可能にする。
 * 
 * 非同期処理戦略：
 * - メッセージキューイング：画像生成リクエストをキューに送信
 * - 負荷分散：複数のワーカーで画像生成処理を分散
 * - 障害耐性：キュー未設定時もエラーを出さずに動作
 * - ジョブ追跡：生成されたジョブIDで進捗追跡可能
 */
export class QueueImageScheduler implements ImageScheduler {
  /**
   * コンストラクタ
   * 
   * @param queue Cloudflare Queuesバインディング（開発環境では未定義の場合あり）
   */
  constructor(private readonly queue: QueueBinding) {}

  /**
   * 画像生成タスクのスケジューリング
   * 
   * 画像生成リクエストをCloudflare Queuesに送信し、
   * バックグラウンドワーカーでの非同期処理をスケジューリングする。
   * 
   * 処理フロー：
   * 1. キューが利用可能かチェック
   * 2. 画像生成メッセージをキューに送信
   * 3. ジョブIDを生成して返却
   * 
   * 堅牢性の考慮：
   * - キュー未設定時もエラーを発生させない（開発環境対応）
   * - ジョブIDは常に生成（進捗追跡のため）
   * 
   * @param input 画像生成に必要なパラメータ
   * @returns 生成されたジョブID
   */
  async schedule(input: { draftId: string; prompt: string }): Promise<{ imageJobId: string }> {
    // キューが設定されている場合のみメッセージを送信
    if (this.queue) {
      await this.queue.send({ type: "generate_image", draftId: input.draftId, prompt: input.prompt });
    }

    // ジョブIDを生成して返却（キューの有無に関わらず）
    return { imageJobId: `${input.draftId}-image` };
  }
}
