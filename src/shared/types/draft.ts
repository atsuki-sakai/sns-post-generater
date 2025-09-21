/**
 * @fileoverview ドラフト生成ワークフローの共有コントラクト型定義
 *
 * これらのDTOはフロントエンドとワーカー間のAPI境界を記述します。
 * 共有モジュールに配置することで、両端の仕様の乖離を防ぎます。
 */

/**
 * ドラフト生成エンドポイントが受け取るペイロード
 * ワーカーワークフローのDraftGenerationInputと対応
 */
export type DraftGenerationRequest = {
  theme: string;
  brandVoice: string;
  product?: string;
  imagePrompt?: string;
  targetPersona?: string;
};

/**
 * バックエンドから返される生成されたドラフトの概要
 * ワーカーユースケースのCreateDraftResultと一致
 */
export type DraftSummary = {
  id: string;
  status: "draft";
  caption: string;
  hashtags: string[];
  altText: string;
  createdAt: string;
};

/**
 * ドラフト生成エンドポイントのHTTPレスポンス形状
 */
export type DraftGenerationResponse = {
  id: string;
  draft: DraftSummary;
};
