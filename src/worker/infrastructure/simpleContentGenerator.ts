/**
 * @fileoverview インフラストラクチャ層 - シンプルコンテンツ生成器
 * 
 * クリーンアーキテクチャにおけるインフラストラクチャ層の実装。
 * ContentGeneratorポートの基本的な実装として、
 * ルールベースでコンテンツを生成する。
 * 
 * 設計原則：
 * - プロトタイプ実装：AI統合前のシンプルなフォールバック実装
 * - テンプレート生成：事前定義されたルールに基づくコンテンツ生成
 * - 拡張性：将来的にLangChain/OpenAI実装に置き換え可能
 * - 予測可能性：テスト時に一貫した結果を提供
 */

import type {
  ContentGenerationInput,
  ContentGenerator,
  GeneratedContent,
} from "../workflows/draftGenerationWorkflow";

/**
 * シンプルコンテンツ生成器
 * 
 * ContentGeneratorポートのルールベース実装。
 * AI統合前のプロトタイプやテスト用途に使用する。
 * 
 * 生成戦略：
 * - キャプション：テンプレートベースの文章構築
 * - ハッシュタグ：入力パラメータからの自動抽出
 * - 代替テキスト：シンプルな定型文生成
 * 
 * 将来の拡張：
 * - LangChainContentGenerator への置き換え
 * - プロンプトテンプレートの外部化
 * - ブランドボイス別の生成ルール
 */
export class SimpleContentGenerator implements ContentGenerator {
  /**
   * コンテンツ生成の実行
   * 
   * 入力パラメータからInstagram投稿用のコンテンツを生成する。
   * ルールベースのアプローチにより、予測可能な結果を提供。
   * 
   * @param input コンテンツ生成に必要な入力パラメータ
   * @returns 生成されたキャプション、ハッシュタグ、代替テキスト
   */
  async generate(input: ContentGenerationInput): Promise<GeneratedContent> {
    const caption = this.buildCaption(input);
    const hashtags = this.buildHashtags(input);
    const altText = this.buildAltText(input);

    return { caption, hashtags, altText };
  }

  /**
   * キャプション生成
   * 
   * テンプレートベースでキャプションを構築する。
   * ブランドボイスとターゲットペルソナを組み込んだ文章を生成。
   * 
   * @param input コンテンツ生成の入力パラメータ
   * @returns 構築されたキャプション文字列
   */
  private buildCaption(input: ContentGenerationInput): string {
    const persona = input.targetPersona ? `#${input.targetPersona}` : "";
    const product = input.product ? ` ${input.product}` : "";
    return `${input.theme}${product}を${input.brandVoice}トーンで紹介。${persona}`.trim();
  }

  /**
   * ハッシュタグ生成
   * 
   * 入力パラメータからハッシュタグを自動抽出・生成する。
   * 重複除去とInstagram標準タグの自動追加を行う。
   * 
   * @param input コンテンツ生成の入力パラメータ
   * @returns 重複なしのハッシュタグ配列
   */
  private buildHashtags(input: ContentGenerationInput): string[] {
    const tags = new Set<string>();
    
    // テーマからハッシュタグを生成（スペース除去・小文字化）
    tags.add(input.theme.replaceAll(/\s+/g, "").toLowerCase());
    
    // 商品名からハッシュタグを生成（存在する場合）
    if (input.product) {
      tags.add(input.product.replaceAll(/\s+/g, "").toLowerCase());
    }
    
    // プラットフォーム標準タグの追加
    tags.add("instagram");
    
    return Array.from(tags);
  }

  /**
   * 代替テキスト生成
   * 
   * 画像アクセシビリティのための代替テキストを生成する。
   * シンプルなテンプレートベースの実装。
   * 
   * @param input コンテンツ生成の入力パラメータ
   * @returns 画像の代替テキスト
   */
  private buildAltText(input: ContentGenerationInput): string {
    return `${input.theme}を表現する画像`;
  }
}
