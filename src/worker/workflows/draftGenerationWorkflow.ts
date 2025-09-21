/**
 * @fileoverview ワークフロー層 - ドラフト生成ワークフロー
 * 
 * クリーンアーキテクチャにおけるワークフロー層（アプリケーションサービス層）の実装。
 * 複数のユースケースと外部サービスを組み合わせて、複雑なビジネスプロセスを実現する。
 * 
 * 設計原則：
 * - オーケストレーション：複数のサービス・ユースケースの調整役
 * - 非同期処理の管理：画像生成などの時間のかかる処理をキューイング
 * - トランザクション境界：複数の操作の一貫性を保証
 * - エラーハンドリング：部分的な失敗への対応策を提供
 */

import type { CreateDraftUseCase, CreateDraftInput } from "../usecases/createDraftUseCase";
import type { DraftGenerationRequest, DraftSummary } from "@/shared/contracts/draft";

/**
 * コンテンツ生成の入力データ
 * 
 * AIコンテンツ生成サービスへの入力パラメータ。
 * ユーザーが指定した投稿の要求事項を表現。
 */
export type ContentGenerationInput = {
  theme: string;
  brandVoice: string;
  product?: string;
  targetPersona?: string;
};

/**
 * AI生成されたコンテンツ
 * 
 * AIサービスから返却される生成済みコンテンツ。
 * 投稿に必要な文字情報を全て含む。
 */
export type GeneratedContent = {
  caption: string;
  hashtags: string[];
  altText: string;
};

/**
 * コンテンツ生成サービスポート
 * 
 * AIコンテンツ生成機能への抽象インターフェイス。
 * 実装は LangChain/OpenAI等の具体的サービスによって提供される。
 */
export type ContentGenerator = {
  generate(input: ContentGenerationInput): Promise<GeneratedContent>;
};

/**
 * 画像スケジューラポート
 * 
 * 画像生成の非同期処理をキューイングする機能への抽象インターフェイス。
 * Cloudflare Queues等の実装によって非同期画像生成を実現。
 */
export type ImageScheduler = {
  schedule(input: { draftId: string; prompt: string }): Promise<{ imageJobId: string }>;
};

/**
 * ドラフト生成ワークフローの入力データ
 * 
 * HTTPエンドポイントから受け取る最初の入力データ。
 * 共有契約に定義された DraftGenerationRequest のエイリアス。
 */
export type DraftGenerationInput = DraftGenerationRequest;

/**
 * ドラフト生成ワークフロー
 * 
 * Instagram投稿ドラフトの生成プロセス全体を調整する。
 * 実行フロー：
 * 1. AIによるテキストコンテンツ生成
 * 2. ドラフトエンティティの作成・永続化
 * 3. 画像生成ジョブのキューイング（非同期）
 * 
 * 非同期処理戦略：
 * - テキスト生成は同期（即座にユーザーに結果を返すため）
 * - 画像生成は非同期（時間がかかるためキューで処理）
 */
export class DraftGenerationWorkflow {
  constructor(
    private readonly contentGenerator: ContentGenerator,
    private readonly imageScheduler: ImageScheduler,
    private readonly createDraft: CreateDraftUseCase
  ) {}

  /**
   * ドラフト生成ワークフローの実行
   * 
   * Instagram投稿ドラフトの完全な生成プロセスを実行する。
   * このメソッドが全体のオーケストレーションを担当し、
   * 複数のサービスを適切な順序で呼び出す。
   * 
   * 実行ステップ：
   * 1. AIによるテキストコンテンツ生成（同期）
   * 2. 生成されたコンテンツでドラフトエンティティを作成
   * 3. ドラフトの永続化
   * 4. 画像生成ジョブのスケジューリング（非同期）
   * 
   * @param input ユーザーが指定した投稿の要求事項
   * @returns 作成されたドラフトの情報（画像生成は非同期で進行中）
   * @throws コンテンツ生成失敗、ドラフト作成失敗、スケジューリング失敗
   */
  async run(input: DraftGenerationInput): Promise<DraftSummary> {
    // ステップ1: AIによるテキストコンテンツ生成
    const generated = await this.contentGenerator.generate({
      theme: input.theme,
      brandVoice: input.brandVoice,
      product: input.product,
      targetPersona: input.targetPersona,
    });

    // ステップ2: ドラフトデータの構築
    const draftInput: CreateDraftInput = {
      theme: input.theme,
      brandVoice: input.brandVoice,
      product: input.product,
      imagePrompt: input.imagePrompt,
      targetPersona: input.targetPersona,
      caption: generated.caption,
      hashtags: generated.hashtags,
      altText: generated.altText,
    };

    // ステップ3: ドラフトエンティティの作成・永続化
    const draft = await this.createDraft.execute(draftInput);

    // ステップ4: 画像生成の非同期スケジューリング
    const prompt = input.imagePrompt?.trim() || input.theme; // フォールバック戦略
    await this.imageScheduler.schedule({ draftId: draft.id, prompt });

    // 画像生成は非同期で進行中、テキストコンテンツのみ即座に返却
    return draft;
  }
}
