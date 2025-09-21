import type { DraftGenerationRequest, DraftSummary } from "@/shared/contracts/draft";

export type GenerationFormValues = {
  theme: string;
  brandVoice: string;
  product: string;
  imagePrompt: string;
  targetPersona: string;
};

export const initialFormValues: GenerationFormValues = {
  theme: "",
  brandVoice: "",
  product: "",
  imagePrompt: "",
  targetPersona: "",
};

export type DraftGenerationViewModel = {
  formValues: GenerationFormValues;
  canSubmit: boolean;
  isSubmitting: boolean;
  draft: DraftSummary | null;
  error: string | null;
};

export type DraftGenerationSubmitHandler = (input: DraftGenerationRequest) => Promise<void>;
