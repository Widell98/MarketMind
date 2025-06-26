
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import StockCases from "./pages/StockCases";
import StockCaseDetail from "./pages/StockCaseDetail";
import AnalysisDetail from "./pages/AnalysisDetail";
import Learning from "./pages/Learning";
import PortfolioAdvisor from "./pages/PortfolioAdvisor";
import Watchlist from "./pages/Watchlist";
import SocialIndex from "./pages/SocialIndex";
import AdminStockCases from "./pages/AdminStockCases";
import MyStockCases from "./pages/MyStockCases";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/stock-cases" element={<StockCases />} />
              <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
              <Route path="/analyses/:id" element={<AnalysisDetail />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/social" element={<SocialIndex />} />
              <Route path="/admin/stock-cases" element={<AdminStockCases />} />
              <Route path="/my-stock-cases" element={<MyStockCases />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
