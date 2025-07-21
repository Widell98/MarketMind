
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
import PortfolioImplementation from "./pages/PortfolioImplementation";
import Watchlist from "./pages/Watchlist";
import SocialIndex from "./pages/SocialIndex";
import AdminStockCases from "./pages/AdminStockCases";
import MyStockCases from "./pages/MyStockCases";
import AIChat from "./pages/AIChat";
import NotFound from "./pages/NotFound";

// Create the query client outside the component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/stock-cases" element={<StockCases />} />
              <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
              <Route path="/analyses/:id" element={<AnalysisDetail />} />
              <Route path="/analysis/:id" element={<AnalysisDetail />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
              <Route path="/portfolio-implementation" element={<PortfolioImplementation />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/social" element={<SocialIndex />} />
              <Route path="/admin/stock-cases" element={<AdminStockCases />} />
              <Route path="/my-stock-cases" element={<MyStockCases />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
