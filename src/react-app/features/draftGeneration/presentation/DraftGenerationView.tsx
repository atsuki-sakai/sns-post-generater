import type { DraftGenerationRequest } from "@/shared/contracts/draft";
import type { DraftGenerationViewModel, GenerationFormValues } from "../types";
import { DraftSummaryCard } from "./DraftSummaryCard";
import { ErrorBanner } from "./ErrorBanner";
import { GenerationForm } from "./GenerationForm";

export type DraftGenerationViewProps = {
  viewModel: DraftGenerationViewModel;
  onFieldChange: (field: keyof GenerationFormValues, value: string) => void;
  onSubmit: (input: DraftGenerationRequest) => Promise<void>;
};

export function DraftGenerationView({ viewModel, onFieldChange, onSubmit }: DraftGenerationViewProps) {
  return (
    <main className="app">
      <section className="card">
        <h1>Instagram投稿ドラフト生成</h1>
        <GenerationForm
          values={viewModel.formValues}
          canSubmit={viewModel.canSubmit}
          isSubmitting={viewModel.isSubmitting}
          onChange={onFieldChange}
          onSubmit={onSubmit}
        />

        {viewModel.draft && <DraftSummaryCard draft={viewModel.draft} />}
        {viewModel.error && <ErrorBanner message={viewModel.error} />}
      </section>
    </main>
  );
}
