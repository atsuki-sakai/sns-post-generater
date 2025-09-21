/**
 * @fileoverview インフラストラクチャ層 - Cloudflare KV ドラフトリポジトリ
 * 
 * クリーンアーキテクチャにおけるインフラストラクチャ層の実装。
 * ユースケース層で定義されたポート（DraftRepository）を、
 * Cloudflare KVストレージを使って具体的に実装する。
 * 
 * 設計原則：
 * - アダプターパターン：外部技術をドメインポートに適応
 * - 技術詳細の隠蔽：KV固有の操作をリポジトリインターフェイスの背後に隠蔽
 * - エラーハンドリング：インフラ固有のエラーをドメインエラーに変換
 * - 設定可能性：TTLなどの運用パラメータを注入可能
 */

import type { DraftRepository } from "../usecases/createDraftUseCase";
import type { PostDraft } from "../domain/postDraft";

/**
 * デフォルトのTTL設定（7日間）
 * 
 * ドラフトは一時的なデータであり、レビュー完了後は不要になるため、
 * 適切な期限を設定してストレージを効率的に利用する。
 */
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Cloudflare KV ドラフトリポジトリ
 * 
 * DraftRepositoryポートのCloudflare KV実装。
 * ドラフトエンティティをKVストレージに永続化する責務を持つ。
 * 
 * 技術的詳細：
 * - JSONシリアライゼーション：ドメインオブジェクトをKV形式に変換
 * - TTL管理：自動的なデータ削除によるストレージ効率化
 * - キー戦略：draft:${id}によるコンフリクト回避
 */
export class KvDraftRepository implements DraftRepository {
  constructor(
    private readonly kv: KVNamespace, 
    private readonly ttlSeconds: number = DEFAULT_TTL_SECONDS
  ) {}

  /**
   * ドラフトの永続化
   * 
   * ドメインエンティティをKVストレージに保存する。
   * IDが未設定の場合はエラーとし、データ整合性を保護する。
   * 
   * @param draft 永続化するドラフトエンティティ
   * @throws ID未設定の場合のエラー
   * @throws KVストレージへの書き込みエラー
   */
  async save(draft: PostDraft): Promise<void> {
    // ドメインエンティティからJSONへの変換
    const json = draft.toJSON();
    
    // 前提条件の検証：IDは必須
    if (!json.id) {
      throw new Error("Draft must have an id before persisting");
    }

    // KVストレージへの永続化（TTL付き）
    await this.kv.put(`draft:${json.id}`, JSON.stringify(json), {
      expirationTtl: this.ttlSeconds,
    });
  }
}
