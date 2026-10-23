import { BrowserRouter } from "react-router-dom";
import { StoreProvider } from "@/store";
import { ErrorBoundary } from "@/components/ui";
import { AppRoutes, ScrollToTop } from "@/routes";
import { catalogApi } from "@/features/products";
import { cartApi } from "@/features/cart";
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider catalogApi={catalogApi} cartApi={cartApi}>
          <ScrollToTop />
          <AppRoutes />
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
