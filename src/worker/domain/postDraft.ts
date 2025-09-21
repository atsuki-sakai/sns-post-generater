/**
 * @fileoverview ドメイン層 - PostDraft アグリゲート
 * 
 * クリーンアーキテクチャにおけるドメイン層の中核となるアグリゲートルート。
 * ビジネスルールとドメインロジックを集約し、外部の技術的詳細に依存しない純粋なビジネスロジックを実装。
 * 
 * 設計原則：
 * - 不変性の保証：プロパティは読み取り専用
 * - ビジネス不変条件の保護：バリデーションをコンストラクタで実施
 * - 外部依存の排除：インフラストラクチャ層への依存を持たない
 * - エンティティの一意性：IDによる識別
 */

/**
 * 時計インターフェース
 * DI（依存性注入）を通じてテスタビリティを確保するためのポート
 */
export type DraftClock = {
  now(): Date;
};

/**
 * 投稿コンテンツのバリューオブジェクト
 * AIによって生成される投稿の内容を表現
 */
export type DraftContent = {
  caption?: string;
  hashtags?: string[];
  altText?: string;
};

/**
 * ドラフトのプロパティ
 * アグリゲート内部の状態を表現する構造体
 */
export type DraftProps = {
  id?: string;
  theme: string;
  brandVoice: string;
  product?: string;
  imagePrompt?: string;
  targetPersona?: string;
  status: "draft";
  createdAt: string;
} & DraftContent;

/**
 * ドラフト作成時の入力データ
 * 外部からの入力を受け取るための型定義
 */
type CreateDraftInput = {
  theme: string;
  brandVoice: string;
  product?: string;
  imagePrompt?: string;
  targetPersona?: string;
} & DraftContent;

/**
 * PostDraft アグリゲートルート
 * 
 * Instagram投稿のドラフトを表現するドメインエンティティ。
 * ビジネスルール：
 * - テーマとブランドボイスは必須
 * - ハッシュタグは最大25個まで
 * - 作成時刻の記録
 * - 不変性の保証
 */
export class PostDraft {
  // プライベートコンストラクタによりインスタンス化を制御
  private constructor(private readonly props: DraftProps) {}

  /**
   * ファクトリメソッド：ドラフトを生成
   * 
   * ビジネスルールを適用してドラフトインスタンスを生成する。
   * ドメイン不変条件：
   * - テーマは必須かつ空文字列不可
   * - ブランドボイスは必須かつ空文字列不可
   * - ハッシュタグは最大25個まで（Instagram仕様による制約）
   * 
   * @param input ドラフト作成に必要な入力データ
   * @param clock 時刻取得のための依存性注入されたサービス
   * @returns 不変条件を満たすPostDraftインスタンス
   * @throws エラー ビジネスルールに違反する場合
   */
  static create(input: CreateDraftInput, clock: DraftClock): PostDraft {
    // 入力値の正規化（トリム処理）
    const trimmedTheme = input.theme?.trim();
    const trimmedVoice = input.brandVoice?.trim();

    // ビジネス不変条件の検証
    if (!trimmedTheme) {
      throw new Error("theme must be a non-empty string");
    }
    if (!trimmedVoice) {
      throw new Error("brandVoice must be a non-empty string");
    }

    // ハッシュタグの正規化と検証
    const hashtags = input.hashtags?.map((tag) => tag.trim()).filter(Boolean);

    // Instagram仕様による制約：ハッシュタグは最大25個
    if (hashtags && hashtags.length > 25) {
      throw new Error("hashtags must be 25 items or fewer");
    }

    // 不変条件を満たすインスタンスを生成
    return new PostDraft({
      id: undefined, // IDは後でユースケース層で割り当て
      theme: trimmedTheme,
      brandVoice: trimmedVoice,
      product: input.product?.trim() ?? "",
      imagePrompt: input.imagePrompt?.trim() ?? "",
      targetPersona: input.targetPersona?.trim() ?? "",
      caption: input.caption?.trim(),
      hashtags,
      altText: input.altText?.trim(),
      status: "draft", // 初期状態は常にドラフト
      createdAt: clock.now().toISOString(), // 作成時刻の記録
    });
  }

  /**
   * ID割り当てメソッド
   * 
   * ユースケース層でIDプロバイダーから取得したIDを割り当てる。
   * 不変性を保つため新しいインスタンスを返す。
   * 
   * @param id ユニークな識別子
   * @returns IDが割り当てられた新しいPostDraftインスタンス
   */
  assignId(id: string): PostDraft {
    return new PostDraft({ ...this.props, id });
  }

  /**
   * JSON形式での状態出力
   * 
   * 永続化やAPI応答のためのシリアライゼーション。
   * 
   * @returns ドラフトのプロパティをJSON形式で返す
   */
  toJSON(): DraftProps {
    return { ...this.props };
  }

  // === ゲッターメソッド群 ===
  // 不変性を保ちながらプロパティへの読み取り専用アクセスを提供

  /**
   * ドラフトの一意識別子
   */
  get id(): string | undefined {
    return this.props.id;
  }

  /**
   * 投稿のテーマ（必須項目）
   */
  get theme(): string {
    return this.props.theme;
  }

  /**
   * ブランドボイス（必須項目）
   */
  get brandVoice(): string {
    return this.props.brandVoice;
  }

  /**
   * 紹介する商品・サービス名（オプション）
   */
  get product(): string | undefined {
    return this.props.product;
  }

  /**
   * 画像生成用プロンプト（オプション）
   */
  get imagePrompt(): string | undefined {
    return this.props.imagePrompt;
  }

  /**
   * ターゲットペルソナ（オプション）
   */
  get targetPersona(): string | undefined {
    return this.props.targetPersona;
  }

  /**
   * AIが生成したキャプション
   */
  get caption(): string | undefined {
    return this.props.caption;
  }

  /**
   * AIが生成したハッシュタグリスト（最大25個）
   */
  get hashtags(): string[] | undefined {
    return this.props.hashtags;
  }

  /**
   * AIが生成した画像の代替テキスト
   */
  get altText(): string | undefined {
    return this.props.altText;
  }

  /**
   * ドラフトの状態（現在は"draft"のみ）
   */
  get status(): "draft" {
    return this.props.status;
  }

  /**
   * ドラフト作成日時（ISO 8601形式）
   */
  get createdAt(): string {
    return this.props.createdAt;
  }
}
