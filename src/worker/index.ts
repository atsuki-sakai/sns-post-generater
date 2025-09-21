/**
 * @fileoverview エントリーポイント - Cloudflare Worker メインモジュール
 * 
 * クリーンアーキテクチャにおけるComposition Root（合成根）の実装。
 * アプリケーション全体の依存関係を解決し、HTTPハンドラーを構築する。
 * 
 * 設計原則：
 * - 合成根パターン：依存関係の構築を一箇所に集約
 * - 最上位層：フレームワーク固有のエントリーポイント
 * - 責務分離：アプリケーション構築とワークフロー構築を分離
 * - 設定の隠蔽：環境固有の詳細をファクトリーに委譲
 */

import { createApp } from "./app";
import { createDraftGenerationWorkflow } from "./workflow";

/**
 * Cloudflare Worker のデフォルトエクスポート
 * 
 * Cloudflare Workers ランタイムによって呼び出されるメインハンドラー。
 * 依存性注入パターンにより、環境バインディングからワークフローを構築し、
 * HTTPアプリケーションを初期化する。
 * 
 * アーキテクチャ構成：
 * 1. ワークフローファクトリーの注入
 * 2. Honoアプリケーションの構築
 * 3. リクエスト処理の委譲
 */
const app = createApp((env) => createDraftGenerationWorkflow(env));

export default app;
