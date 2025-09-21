/**
 * @fileoverview アプリケーション層 - HTTPアダプター
 * 
 * クリーンアーキテクチャにおけるアプリケーション層（インターフェース層）の実装。
 * HTTP通信をワークフロー層への呼び出しに変換するアダプターとして機能する。
 * 
 * 設計原則：
 * - インターフェース適応：HTTPリクエストをドメインオブジェクトに変換
 * - エラーハンドリング：技術的例外をHTTPエラーレスポンスに変換
 * - バリデーション：入力データの検証と型安全性の確保
 * - 責務分離：HTTP固有のロジックのみを担当、ビジネスロジックは委譲
 */

import { Hono } from "hono";
import type { Context } from "hono";
import type { DraftGenerationWorkflow, DraftGenerationInput } from "./workflows/draftGenerationWorkflow";
import type { WorkerBindings } from "./types";
import type { DraftGenerationResponse } from "@/shared/contracts/draft";

/**
 * ワークフローファクトリー関数の型定義
 * 
 * 依存性注入パターンによりワークフローを構築する関数。
 * Cloudflare環境のバインディングから必要な依存関係を解決し、
 * 設定されたワークフローインスタンスを返す。
 */
export type WorkflowFactory = (env: WorkerBindings) => DraftGenerationWorkflow;

/**
 * Honoアプリケーションの作成
 * 
 * HTTPルーティングとリクエスト処理を設定する。
 * ファクトリーパターンにより依存性注入を実現し、
 * テスタビリティと設定の柔軟性を確保。
 * 
 * @param factory ワークフロー構築のためのファクトリー関数
 * @returns 設定済みのHonoアプリケーションインスタンス
 */
export function createApp(factory: WorkflowFactory) {
  const app = new Hono<{ Bindings: WorkerBindings }>();

  /**
   * ヘルスチェックエンドポイント
   * アプリケーションの稼働状態を確認するためのシンプルなエンドポイント
   */
  app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

  /**
   * ドラフト生成エンドポイント
   * 
   * Instagram投稿ドラフトの生成を処理するメインエンドポイント。
   * 処理フロー：
   * 1. リクエストボディのパース・バリデーション
   * 2. ワークフローファクトリーによる依存関係解決
   * 3. ワークフロー実行
   * 4. レスポンス生成・エラーハンドリング
   */
  app.post("/api/v1/generate", async (c) => {
    // リクエストボディの読み取りとバリデーション
    const body = await readJson(c);
    if (body.error) {
      return c.json(body.error, 400);
    }

    try {
      // 依存関係の解決とワークフロー実行
      const workflow = factory(c.env);
      const result = await workflow.run(body.value);
      const responseBody: DraftGenerationResponse = { id: result.id, draft: result };
      
      // 成功レスポンスの生成
      return c.json(responseBody, 201);
    } catch (error) {
      // エラーレスポンスの生成
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.json({ error: { message } }, 400);
    }
  });

  return app;
}

/**
 * JSONリード処理の結果型
 * 
 * 成功時は値を、失敗時はエラーオブジェクトを返すユニオン型。
 * 型安全なエラーハンドリングを実現する。
 */
type ReadResult = { value: DraftGenerationInput; error?: never } | { value?: never; error: { error: { message: string } } };

/**
 * リクエストボディのJSON読み取り・バリデーション
 * 
 * HTTPリクエストからJSONを読み取り、ドメインオブジェクトに変換する。
 * 型安全性とバリデーションを統合した処理。
 * 
 * @param c Honoのコンテキストオブジェクト
 * @returns パースされた入力データまたはエラー情報
 */
async function readJson(c: Context<{ Bindings: WorkerBindings }>): Promise<ReadResult> {
  try {
    // JSONペイロードの読み取り
    const payload = await c.req.json();
    
    // ドメインオブジェクトへの変換・バリデーション
    const parsed = validateDraftGenerationInput(payload);
    if (!parsed.ok) {
      return { error: { error: { message: parsed.error } } };
    }
    
    return { value: parsed.value };
  } catch {
    // JSONパースエラーのハンドリング
    return { error: { error: { message: "Invalid JSON payload" } } };
  }
}

/**
 * バリデーション結果の型定義
 * 
 * 成功時は値を、失敗時はエラーメッセージを返すディスクリミネートユニオン。
 */
type ValidationResult =
  | { ok: true; value: DraftGenerationInput }
  | { ok: false; error: string };

/**
 * ドラフト生成入力データのバリデーション
 * 
 * 受信したJSONデータをDraftGenerationInputに変換する。
 * 必須フィールドの存在確認と型検証を実施。
 * 
 * @param raw バリデーション対象の生データ
 * @returns バリデーション済みデータまたはエラー情報
 */
function validateDraftGenerationInput(raw: unknown): ValidationResult {
  // 基本的な型チェック
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Payload must be an object" };
  }

  const payload = raw as Record<string, unknown>;
  
  // 必須フィールドのバリデーション
  const theme = ensureString(payload.theme, "theme");
  const brandVoice = ensureString(payload.brandVoice, "brandVoice");

  if (!theme.ok) return theme;
  if (!brandVoice.ok) return brandVoice;

  // バリデーション済みオブジェクトの構築
  const value: DraftGenerationInput = {
    theme: theme.value,
    brandVoice: brandVoice.value,
    product: asOptionalString(payload.product),
    imagePrompt: asOptionalString(payload.imagePrompt),
    targetPersona: asOptionalString(payload.targetPersona),
  };

  return { ok: true, value };
}

/**
 * 文字列バリデーション結果の型定義
 */
type StringResult = { ok: true; value: string } | { ok: false; error: string };

/**
 * 必須文字列フィールドのバリデーション
 * 
 * 文字列型かつ空文字列でないことを確認する。
 * トリミング処理も同時に実行。
 * 
 * @param value バリデーション対象の値
 * @param field フィールド名（エラーメッセージ用）
 * @returns バリデーション済み文字列またはエラー情報
 */
function ensureString(value: unknown, field: string): StringResult {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${field} must be a non-empty string` };
  }
  return { ok: true, value: value.trim() };
}

/**
 * オプション文字列フィールドの処理
 * 
 * 有効な文字列の場合はトリミング済み文字列を、
 * そうでなければundefinedを返す。
 * 
 * @param value 処理対象の値
 * @returns トリミング済み文字列またはundefined
 */
function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return undefined;
}
