/**
 * @fileoverview インフラストラクチャ層 - UUID生成プロバイダー
 * 
 * クリーンアーキテクチャにおけるインフラストラクチャ層の実装。
 * ユースケース層で定義されたIdProviderポートの具体的実装として、
 * Web標準のCrypto APIを使用してUUIDを生成する。
 * 
 * 設計原則：
 * - アダプターパターン：Web APIをドメインポートに適応
 * - 依存性逆転：ユースケース層が定義したインターフェイスを実装
 * - テスタビリティ：テスト時には予測可能なIDを返す実装に置き換え可能
 * - プラットフォーム依存：Cloudflare Workers/ブラウザ環境に特化
 */

import type { IdProvider } from "../usecases/createDraftUseCase";

/**
 * UUID生成プロバイダー
 * 
 * IdProviderポートのWeb標準Crypto API実装。
 * RFC 4122準拠のUUIDv4を生成し、ドメインエンティティの
 * ユニークな識別子として提供する。
 * 
 * 技術的詳細：
 * - crypto.randomUUID()を使用：暗号学的に安全な乱数生成
 * - UUIDv4形式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - コリジョン耐性：2^122の組み合わせで実質的にユニーク
 * - プラットフォーム要件：Web標準対応環境（CF Workers, モダンブラウザ）
 */
export class UuidProvider implements IdProvider {
  /**
   * 新しいUUIDの生成
   * 
   * Web標準のCrypto APIを使用してRFC 4122準拠の
   * UUIDv4を生成する。生成されるIDは暗号学的に安全で、
   * グローバルにユニークであることが保証される。
   * 
   * @returns RFC 4122準拠のUUIDv4文字列
   */
  next(): string {
    return crypto.randomUUID();
  }
}
