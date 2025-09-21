import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { DraftGenerationRequest } from "@/shared/contracts/draft";
import { GenerationForm } from "../GenerationForm";

describe("GenerationForm", () => {
  const baseValues: DraftGenerationRequest = {
    theme: "",
    brandVoice: "",
    product: "",
    imagePrompt: "",
    targetPersona: "",
  };

  it("disables submit button until required fields are filled", async () => {
    const user = userEvent.setup();

    const Harness = () => {
      const [values, setValues] = useState(baseValues);
      const canSubmit = values.theme.trim().length > 0 && values.brandVoice.trim().length > 0;

      return (
        <GenerationForm
          values={values}
          canSubmit={canSubmit}
          isSubmitting={false}
          onChange={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
          onSubmit={async () => undefined}
        />
      );
    };

    render(<Harness />);

    const submitButton = screen.getByRole("button", { name: "ドラフト生成" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("テーマ"), " 春の新作 ");
    await user.type(screen.getByLabelText("ブランドトーン"), " 爽やか ");

    expect(submitButton).not.toBeDisabled();
  });

  it("submits trimmed field values", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn(async (input: DraftGenerationRequest) => input);

    const Harness = () => {
      const [values, setValues] = useState(baseValues);
      const canSubmit = values.theme.trim().length > 0 && values.brandVoice.trim().length > 0;

      return (
        <GenerationForm
          values={values}
          canSubmit={canSubmit}
          isSubmitting={false}
          onChange={(field, value) => setValues((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmit}
        />
      );
    };

    render(<Harness />);

    await user.type(screen.getByLabelText("テーマ"), " 春の新作スニーカー ");
    await user.type(screen.getByLabelText("ブランドトーン"), " 親しみやすい ");
    await user.type(screen.getByLabelText("商品情報"), " AirFlex 2025 Edition ");
    await user.type(screen.getByLabelText("画像プロンプト"), " 街を歩く若者がスニーカーを見せる ");
    await user.type(screen.getByLabelText("ターゲットペルソナ"), " 20代のアクティブ層 ");

    await user.click(screen.getByRole("button", { name: "ドラフト生成" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      theme: "春の新作スニーカー",
      brandVoice: "親しみやすい",
      product: "AirFlex 2025 Edition",
      imagePrompt: "街を歩く若者がスニーカーを見せる",
      targetPersona: "20代のアクティブ層",
    });
  });
});
