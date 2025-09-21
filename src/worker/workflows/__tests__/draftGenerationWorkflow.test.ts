import { describe, expect, it, vi } from "vitest";
import { DraftGenerationWorkflow } from "../draftGenerationWorkflow";

describe("DraftGenerationWorkflow", () => {
  // 正常系: ワークフローがコンテンツ生成と画像ジョブ予約を経てドラフト作成まで行う流れを検証する
  it("runs content generation and schedules image job before creating draft", async () => {
    const contentGenerator = {
      generate: vi.fn().mockResolvedValue({
        caption: "最高の履き心地を体験しよう",
        hashtags: ["sneakers", "spring"],
        altText: "街でスニーカーを見せる若者",
      }),
    };

    const imageScheduler = {
      schedule: vi.fn().mockResolvedValue({ imageJobId: "job-789" }),
    };

    const createDraftUseCase = {
      execute: vi.fn().mockResolvedValue({ id: "draft-123", status: "draft" }),
    };

    const workflow = new DraftGenerationWorkflow(
      contentGenerator,
      imageScheduler,
      createDraftUseCase
    );

    const result = await workflow.run({
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      product: "AirFlex",
      imagePrompt: "街で歩く若者",
      targetPersona: "20代のアクティブ層",
    });

    expect(contentGenerator.generate).toHaveBeenCalledWith({
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      product: "AirFlex",
      targetPersona: "20代のアクティブ層",
    });
    expect(imageScheduler.schedule).toHaveBeenCalledWith({
      prompt: "街で歩く若者",
      draftId: "draft-123",
    });
    expect(createDraftUseCase.execute).toHaveBeenCalledWith({
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      product: "AirFlex",
      imagePrompt: "街で歩く若者",
      targetPersona: "20代のアクティブ層",
      caption: "最高の履き心地を体験しよう",
      hashtags: ["sneakers", "spring"],
      altText: "街でスニーカーを見せる若者",
    });
    expect(result).toEqual({ id: "draft-123", status: "draft" });
  });
});
