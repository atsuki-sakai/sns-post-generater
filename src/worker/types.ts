/**
 * @fileoverview 型定義 - Cloudflare Worker 環境型
 * 
 * クリーンアーキテクチャにおける技術的境界の型定義。
 * Cloudflare Workers固有のランタイム環境とキューシステムの型を提供。
 * 
 * 設計原則：
 * - 境界の明確化：外部システム（CF）とアプリケーションの境界を型で表現
 * - 型安全性：ランタイム環境への型付きアクセスを提供
 * - 拡張性：新しいキューペイロードやバインディングの追加を容易に
 * - ドキュメント化：型定義自体がシステム仕様として機能
 */

/**
 * ワーカーキューペイロード
 * 
 * Cloudflare Queuesで処理される非同期タスクのペイロード型。
 * 画像生成などの時間のかかる処理をバックグラウンドで実行するために使用。
 */
export type WorkerQueuePayload = {
  /** タスクの種類：現在は画像生成のみサポート */
  type: "generate_image";
  /** 画像を生成する対象のドラフトID */
  draftId: string;
  /** 画像生成用のプロンプト文字列 */
  prompt: string;
};

/**
 * Cloudflare Worker バインディング型
 * 
 * Cloudflare Workers環境で利用可能なリソースの型定義。
 * 基本的なEnv型を拡張し、プロジェクト固有のバインディングを追加。
 * 
 * バインディング構成：
 * - KV: ドラフト永続化用のKey-Valueストレージ
 * - IMAGE_QUEUE: 画像生成の非同期処理用キュー（オプション）
 */
export type WorkerBindings = Env & {
  /** KVNamespace：ドラフトデータの永続化に使用 */
  KV: KVNamespace;
  /** Queue：画像生成タスクの非同期処理（開発環境では未定義の場合あり） */
  IMAGE_QUEUE?: Queue<WorkerQueuePayload>;
};
