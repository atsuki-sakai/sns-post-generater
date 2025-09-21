import { useCallback, useMemo, useState } from "react";
import type { DraftGenerationRequest, DraftGenerationResponse } from "@/shared/contracts/draft";
import {
  type DraftGenerationViewModel,
  type GenerationFormValues,
  initialFormValues,
} from "../types";

function toRequestPayload(values: GenerationFormValues): DraftGenerationRequest {
  const trim = (value: string) => value.trim();
  const optional = (value: string) => {
    const trimmed = trim(value);
    return trimmed.length > 0 ? trimmed : undefined;
  };

  return {
    theme: trim(values.theme),
    brandVoice: trim(values.brandVoice),
    product: optional(values.product),
    imagePrompt: optional(values.imagePrompt),
    targetPersona: optional(values.targetPersona),
  };
}

export function useDraftGeneration(): {
  viewModel: DraftGenerationViewModel;
  handleFieldChange: (field: keyof GenerationFormValues, value: string) => void;
  submitDraft: (input?: DraftGenerationRequest) => Promise<void>;
  reset: () => void;
} {
  const [formValues, setFormValues] = useState<GenerationFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftGenerationViewModel["draft"]>(null);

  const canSubmit = useMemo(() => {
    return formValues.theme.trim().length > 0 && formValues.brandVoice.trim().length > 0;
  }, [formValues.theme, formValues.brandVoice]);

  const handleFieldChange = useCallback(
    (field: keyof GenerationFormValues, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const submitDraft = useCallback(
    async (input?: DraftGenerationRequest) => {
      if (isSubmitting) return;

      const payload = input ?? toRequestPayload(formValues);

      setIsSubmitting(true);
      setError(null);
      setDraft(null);

      try {
        const response = await fetch("/api/v1/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate draft: ${response.statusText}`);
        }

        const data = (await response.json()) as DraftGenerationResponse;
        setDraft(data.draft);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, isSubmitting]
  );

  const reset = useCallback(() => {
    setFormValues(initialFormValues);
    setError(null);
    setDraft(null);
  }, []);

  const viewModel: DraftGenerationViewModel = {
    formValues,
    canSubmit,
    isSubmitting,
    draft,
    error,
  };

  return {
    viewModel,
    handleFieldChange,
    submitDraft,
    reset,
  };
}
