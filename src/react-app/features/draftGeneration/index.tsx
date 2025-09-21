import { DraftGenerationView } from "./presentation/DraftGenerationView";
import { useDraftGeneration } from "./application/useDraftGeneration";

export function DraftGenerationFeature() {
  const { viewModel, handleFieldChange, submitDraft } = useDraftGeneration();

  return (
    <DraftGenerationView
      viewModel={viewModel}
      onFieldChange={handleFieldChange}
      onSubmit={submitDraft}
    />
  );
}
