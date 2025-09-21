/**
 * @fileoverview ユースケース層 - ドラフト作成ユースケース
 * 
 * クリーンアーキテクチャにおけるユースケース層の実装。
 * アプリケーション固有のビジネスルールを管理し、ドメイン層とインフラ層を調整する。
 * 
 * 設計原則：
 * - 単一責務：ドラフト作成のワークフローのみを担当
 * - 依存性逆転：抽象インターフェイス（ポート）を通じてインフラ層に依存
 * - フレームワーク非依存：技術的詳細に依存しない純粋なビジネスロジック
 * - テスタビリティ：依存性注入によりモックテスト可能
 */

import { PostDraft, type DraftClock } from "../domain/postDraft";
import type { DraftSummary } from "@/shared/contracts/draft";

/**
 * ドラフトリポジトリポート
 * 
 * 永続化機能への抽象インターフェイス。
 * インフラ層の具体実装（KvDraftRepository等）を隠蔽し、テスタビリティを確保。
 */
export type DraftRepository = {
  save(draft: PostDraft): Promise<void>;
};

/**
 * ID生成プロバイダーポート
 * 
 * ユニークID生成機能への抽象インターフェイス。
 * UUID等の具体的な実装を隠蔽し、テスト時には予測可能なIDを注入可能。
 */
export type IdProvider = {
  next(): string;
};

/**
 * ドラフト作成の入力データ
 * 
 * 外部（ワークフロー層）からの入力を受け取るDTO。
 * この時点でAIによるコンテンツ生成は完了している前提。
 */
export type CreateDraftInput = {
  theme: string;
  brandVoice: string;
  product?: string;
  imagePrompt?: string;
  targetPersona?: string;
  caption: string;
  hashtags: string[];
  altText: string;
};

/**
 * ドラフト作成ユースケース
 * 
 * Instagram投稿ドラフトの作成ワークフローを管理する。
 * 以下の処理を調整：
 * 1. ドメインエンティティの生成
 * 2. ID割り当て
 * 3. 永続化
 * 4. 結果の返却
 */
export class CreateDraftUseCase {
  constructor(
    private readonly repository: DraftRepository,
    private readonly idProvider: IdProvider,
    private readonly clock: DraftClock
  ) {}

  /**
   * ドラフト作成の実行
   * 
   * ドラフト作成のワークフローを実行する。
   * ビジネスロジックの実行順序：
   * 1. ドメインエンティティの生成（ビジネスルール適用）
   * 2. ユニークIDの割り当て
   * 3. 永続化（リポジトリ経由）
   * 4. DTOの生成と返却
   * 
   * @param input AIが生成したコンテンツを含む入力データ
   * @returns 永続化されたドラフトの情報
   * @throws ドメインエンティティの生成時にビジネスルール違反があった場合
   */
  async execute(input: CreateDraftInput): Promise<DraftSummary> {
    // ドメインエンティティの生成（ビジネスルール適用）
    const draft = PostDraft.create(input, this.clock).assignId(this.idProvider.next());
    
    // 永続化（インフラ層への委譲）
    await this.repository.save(draft);

    // DTOの生成と返却
    const json = draft.toJSON();
    return {
      id: json.id!, // この時点でIDは必ず存在
      status: json.status,
      caption: json.caption ?? "",
      hashtags: json.hashtags ?? [],
      altText: json.altText ?? "",
      createdAt: json.createdAt,
    };
  }
}
