import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "../App";
import type { DraftGenerationRequest, DraftGenerationResponse } from "@/shared/types/draft";

declare global {
  interface Window {
    fetch: typeof fetch;
  }
}

describe("App", () => {
  const responseBody: DraftGenerationResponse = {
    id: "draft-123",
    draft: {
      id: "draft-123",
      status: "draft",
      caption: "最高の履き心地を体験しよう",
      hashtags: ["sneakers", "spring"],
      altText: "街でスニーカーを見せる若者",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.spyOn(window, "fetch").mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 正常系: フォーム入力を送信したときに期待どおりのAPIリクエストが発行されることを検証する
  it("submits post generation request with form values", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("テーマ"), "春の新作スニーカー");
    await user.type(screen.getByLabelText("ブランドトーン"), "爽やかで親しみやすい");
    await user.type(screen.getByLabelText("商品情報"), "AirFlex 2025 Edition");
    await user.type(screen.getByLabelText("画像プロンプト"), "街を歩く若者がスニーカーを見せる");
    await user.type(screen.getByLabelText("ターゲットペルソナ"), "20代のアクティブ層");

    await user.click(screen.getByRole("button", { name: "ドラフト生成" }));

    const requestBody: DraftGenerationRequest = {
      theme: "春の新作スニーカー",
      brandVoice: "爽やかで親しみやすい",
      product: "AirFlex 2025 Edition",
      imagePrompt: "街を歩く若者がスニーカーを見せる",
      targetPersona: "20代のアクティブ層",
    };

    expect(window.fetch).toHaveBeenCalledWith(
      "/api/v1/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
    );
    await screen.findByText(/ドラフトID: draft-123/);
  });

  // 正常系: APIから返却されたドラフト情報が画面に反映されることを検証する
  it("renders returned draft summary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("テーマ"), "春の新作スニーカー");
    await user.type(screen.getByLabelText("ブランドトーン"), "爽やかで親しみやすい");
    await user.click(screen.getByRole("button", { name: "ドラフト生成" }));

    expect(await screen.findByText(/ドラフトID: draft-123/)).toBeInTheDocument();
    expect(screen.getByText("最高の履き心地を体験しよう")).toBeInTheDocument();
    expect(screen.getByText("#sneakers #spring")).toBeInTheDocument();
  });
});
