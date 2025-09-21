import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app";
import type { DraftGenerationWorkflow } from "../workflows/draftGenerationWorkflow";
import type { WorkerBindings } from "../types";

describe("POST /api/v1/generate", () => {
  const env = { KV: { put: vi.fn() } } as unknown as WorkerBindings;
  let workflow: { run: ReturnType<typeof vi.fn> };
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    workflow = { run: vi.fn() };
    app = createApp(() => workflow as unknown as DraftGenerationWorkflow);
  });

  // 異常系: 必須フィールドが欠けているリクエストに対し400を返すことを検証する
  it("returns 400 when required fields are missing", async () => {
    const response = await app.fetch(
      new Request("http://localhost/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandVoice: "kind" }),
      }),
      env,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ error: { message: expect.stringContaining("theme") } });
    expect(workflow.run).not.toHaveBeenCalled();
  });

  // 正常系: ワークフローへ委譲しドラフトIDを返却するAPIレスポンスを検証する
  it("delegates to workflow and returns draft id", async () => {
    workflow.run.mockResolvedValue({
      id: "draft-123",
      status: "draft",
      caption: "caption",
      hashtags: ["sneakers"],
      altText: "alt",
      createdAt: "2025-01-01T00:00:00.000Z",
    });

    const response = await app.fetch(
      new Request("http://localhost/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "春の新作スニーカー",
          brandVoice: "爽やかで親しみやすい",
          imagePrompt: "街を歩く若者",
        }),
      }),
      env,
    );

    expect(response.status).toBe(201);
    expect(workflow.run).toHaveBeenCalledWith({
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      imagePrompt: "街を歩く若者",
    });

    const body = await response.json();
    expect(body).toEqual({
      id: "draft-123",
      draft: {
        id: "draft-123",
        status: "draft",
        caption: "caption",
        hashtags: ["sneakers"],
        altText: "alt",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    });
  });
});
