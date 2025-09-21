import "./App.css";
import { DraftGenerationFeature } from "./features/draftGeneration";
import { Toaster } from "@components/ui/sonner";

function App() {
  return (
    <>
      <DraftGenerationFeature />
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;
