
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminStockCases from "./pages/AdminStockCases";
import StockCases from "./pages/StockCases";
import StockCaseDetail from "./pages/StockCaseDetail";
import Learning from "./pages/Learning";
import Watchlist from "./pages/Watchlist";
import PortfolioAdvisor from "./pages/PortfolioAdvisor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/stock-cases" element={<AdminStockCases />} />
              <Route path="/stock-cases" element={<StockCases />} />
              <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
