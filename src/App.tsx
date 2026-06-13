import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Index from "./pages/Index";

// Admin, Studio-Portal & Legal-Seiten lazy laden – halten das Initial-Bundle klein.
const Admin = lazy(() => import("./pages/Admin"));
const ForStudios = lazy(() => import("./pages/ForStudios"));
const Pitch = lazy(() => import("./pages/Pitch"));
const OnePager = lazy(() => import("./pages/OnePager"));
const StudioPortal = lazy(() => import("./pages/StudioPortal"));
const StudioImpressum = lazy(() => import("./pages/StudioImpressum"));
const StudioDatenschutz = lazy(() => import("./pages/StudioDatenschutz"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fuer-studios" element={<ForStudios />} />
            <Route path="/fuer-kuechenstudios" element={<Navigate to="/fuer-studios" replace />} />
            <Route path="/pitch" element={<Pitch />} />
            <Route path="/onepager" element={<OnePager />} />
            <Route path="/s/:slug" element={<StudioPortal />} />
            <Route path="/s/:slug/check" element={<Index />} />
            <Route path="/s/:slug/impressum" element={<StudioImpressum />} />
            <Route path="/s/:slug/datenschutz" element={<StudioDatenschutz />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
