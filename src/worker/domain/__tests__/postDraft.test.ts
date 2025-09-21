import { describe, expect, it } from "vitest";
import { PostDraft } from "../postDraft";

describe("PostDraft", () => {
  // 正常系: 必須項目を満たす入力からドラフトが生成されることを検証する
  it("creates a draft with required properties", () => {
    const now = new Date("2025-01-01T00:00:00.000Z");
    const draft = PostDraft.create(
      {
        theme: " 春の新作スニーカー ",
        brandVoice: " 爽やかで親しみやすい ",
        product: "AirFlex",
        imagePrompt: "街で歩く若者",
        targetPersona: "20代のアクティブ層",
      },
      { now: () => now }
    );

    expect(draft.theme).toBe("春の新作スニーカー");
    expect(draft.brandVoice).toBe("爽やかで親しみやすい");
    expect(draft.product).toBe("AirFlex");
    expect(draft.imagePrompt).toBe("街で歩く若者");
    expect(draft.targetPersona).toBe("20代のアクティブ層");
    expect(draft.status).toBe("draft");
    expect(draft.createdAt).toEqual(now.toISOString());
  });

  // 異常系: 必須項目が欠落した入力でエラーが発生することを検証する
  it("throws when required fields are missing", () => {
    expect(() =>
      PostDraft.create(
        {
          theme: "",
          brandVoice: "",
        },
        { now: () => new Date() }
      )
    ).toThrowError(/theme/);
  });
});
