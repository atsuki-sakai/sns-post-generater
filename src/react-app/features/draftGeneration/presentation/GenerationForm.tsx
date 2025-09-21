import { type FormEvent } from "react";
import type { DraftGenerationRequest } from "@shared/types/draft";
import { Button } from "@components/ui/Button";
import type { GenerationFormValues } from "../types";

export type GenerationFormProps = {
  values: GenerationFormValues;
  canSubmit: boolean;
  isSubmitting: boolean;
  onChange: (field: keyof GenerationFormValues, value: string) => void;
  onSubmit: (input: DraftGenerationRequest) => Promise<void>;
};

const asOptional = (value: string): string | undefined => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function GenerationForm({ values, canSubmit, isSubmitting, onChange, onSubmit }: GenerationFormProps) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) {
      return;
    }

    const payload: DraftGenerationRequest = {
      theme: values.theme.trim(),
      brandVoice: values.brandVoice.trim(),
      product: asOptional(values.product),
      imagePrompt: asOptional(values.imagePrompt),
      targetPersona: asOptional(values.targetPersona),
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="form" aria-label="instagram post generator">
      <div className="form-field">
        <label htmlFor="theme">テーマ</label>
        <input
          id="theme"
          name="theme"
          value={values.theme}
          onChange={(event) => onChange("theme", event.target.value)}
          placeholder="例: 春の新作スニーカー"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="brandVoice">ブランドトーン</label>
        <input
          id="brandVoice"
          name="brandVoice"
          value={values.brandVoice}
          onChange={(event) => onChange("brandVoice", event.target.value)}
          placeholder="例: 爽やかで親しみやすい"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="product">商品情報</label>
        <input
          id="product"
          name="product"
          value={values.product}
          onChange={(event) => onChange("product", event.target.value)}
          placeholder="例: AirFlex 2025 Edition"
        />
      </div>

      <div className="form-field">
        <label htmlFor="imagePrompt">画像プロンプト</label>
        <textarea
          id="imagePrompt"
          name="imagePrompt"
          value={values.imagePrompt}
          onChange={(event) => onChange("imagePrompt", event.target.value)}
          placeholder="例: 街を歩く若者がスニーカーを見せる"
          rows={3}
        />
      </div>

      <div className="form-field">
        <label htmlFor="targetPersona">ターゲットペルソナ</label>
        <input
          id="targetPersona"
          name="targetPersona"
          value={values.targetPersona}
          onChange={(event) => onChange("targetPersona", event.target.value)}
          placeholder="例: 20代のアクティブ層"
        />
      </div>

      <Button type="submit" disabled={!canSubmit || isSubmitting}>
        {isSubmitting ? "生成中..." : "ドラフト生成"}
      </Button>
    </form>
  );
}
