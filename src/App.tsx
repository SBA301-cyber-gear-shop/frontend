import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "@/store";
import { ErrorBoundary } from "@/components/ui";
import { AppRoutes, ScrollToTop } from "@/routes";
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <ScrollToTop />
          <AppRoutes />
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
