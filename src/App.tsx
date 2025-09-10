
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import StockCases from "./pages/StockCases";
import StockCaseDetail from "./pages/StockCaseDetail";
import AnalysisDetail from "./pages/AnalysisDetail";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PortfolioImplementation from "./pages/PortfolioImplementation";
import PortfolioAdvisor from "./pages/PortfolioAdvisor";
import AIChat from "./pages/AIChat";
import Learning from "./pages/Learning";
import SocialIndex from "./pages/SocialIndex";
import AdminStockCases from "./pages/AdminStockCases";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import Discover from "./pages/Discover";
import MarketAnalyses from "./pages/MarketAnalyses";
import Watchlist from "./pages/Watchlist";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/stock-cases" element={<StockCases />} />
                    <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
                    <Route path="/analysis/:id" element={<AnalysisDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/portfolio-implementation" element={<PortfolioImplementation />} />
                    <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/social" element={<SocialIndex />} />
                    <Route path="/admin/stock-cases" element={<AdminStockCases />} />
                    <Route path="/advanced-features" element={<AdvancedFeatures />} />
                    <Route path="/discover" element={<Discover />} />
                    {/* Legacy routes for backwards compatibility */}
                    <Route path="/discover-opportunities" element={<Discover />} />
                    <Route path="/market-analyses" element={<Discover />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
