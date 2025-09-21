import { describe, expect, it, vi } from "vitest";
import { CreateDraftUseCase } from "../createDraftUseCase";
import { PostDraft } from "../../domain/postDraft";

describe("CreateDraftUseCase", () => {
  // 正常系: ドラフトを保存し採番されたID付きで返却するユースケースの挙動を検証する
  it("persists a new draft and returns it with id", async () => {
    const repository = {
      save: vi.fn().mockResolvedValue(void 0),
    };
    const idProvider = { next: vi.fn().mockReturnValue("draft-123") };
    const clock = { now: () => new Date("2025-01-01T00:00:00.000Z") };

    const useCase = new CreateDraftUseCase(repository, idProvider, clock);

    const result = await useCase.execute({
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      product: "AirFlex",
      imagePrompt: "街で歩く若者",
      targetPersona: "20代のアクティブ層",
      caption: "最高の履き心地を体験しよう",
      hashtags: ["sneakers", "spring"],
      altText: "街でスニーカーを見せる若者",
    });

    expect(idProvider.next).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledTimes(1);
    const savedDraft = repository.save.mock.calls[0][0] as PostDraft;
    expect(savedDraft.id).toBe("draft-123");
    expect(savedDraft.caption).toBe("最高の履き心地を体験しよう");
    expect(savedDraft.hashtags).toEqual(["sneakers", "spring"]);
    expect(result.id).toBe("draft-123");
    expect(result.caption).toBe("最高の履き心地を体験しよう");
  });
});
