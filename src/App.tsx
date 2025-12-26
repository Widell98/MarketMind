import { useEffect } from "react"; // VIKTIG: Saknades
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; // VIKTIG: useNavigate saknades
import { supabase } from "@/integrations/supabase/client"; // VIKTIG: Måste finnas med

import PredictionMarketsDemo from "./pages/PredictionMarketsDemo";
import PredictionMarketDetail from "./pages/PredictionMarketDetail";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatSessionsProvider } from "@/contexts/ChatSessionsContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DailyChangeDataProvider } from "@/contexts/DailyChangeDataContext";
import { ExchangeRatesProvider } from "@/contexts/ExchangeRatesContext";
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
import AdminPredictionMarkets from "./pages/AdminPredictionMarkets";
import AIChat from "./pages/AIChat";
import Learning from "./pages/Learning";
import SocialIndex from "./pages/SocialIndex";
import AdminStockCases from "./pages/AdminStockCases";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import Discover from "./pages/Discover";
import DiscoverNews from "./pages/DiscoverNews";
import MarketAnalyses from "./pages/MarketAnalyses";
import Watchlist from "./pages/Watchlist";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

// Här är den korrigerade komponenten
const AuthEventHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event); // Bra för felsökning
      if (event === 'PASSWORD_RECOVERY') {
        // Oavsett var användaren landar, skicka dem till rätt sida
        navigate('/auth/reset-password'); 
      }
    });
    
    // Städa upp lyssnaren när komponenten tas bort
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null; // Denna komponent ska inte rendera något synligt
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <LanguageProvider>
          <AuthProvider>
            <ExchangeRatesProvider>
              <DailyChangeDataProvider>
                <ChatSessionsProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <ErrorBoundary>
                    <BrowserRouter>
                      <Analytics />
                      
                      {/* Lyssnaren placeras här, innan Routes */}
                      <AuthEventHandler />
                      
                      <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/stock-cases" element={<StockCases />} />
                    <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
                    <Route path="/analysis/:id" element={<AnalysisDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/auth" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/portfolio-implementation" element={<PortfolioImplementation />} />
                    <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
                    <Route path="/ai-chat" element={<AIChat />} />
                    <Route path="/ai-chatt" element={<AIChat />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/social" element={<SocialIndex />} />
                    <Route path="/admin/stock-cases" element={<AdminStockCases />} />
                    <Route path="/admin/markets" element={<AdminPredictionMarkets />} />
                    <Route path="/advanced-features" element={<AdvancedFeatures />} />
                    <Route path="/discover" element={<Discover />} />
                    <Route path="/news" element={<DiscoverNews />} />
                    <Route path="/predictions" element={<PredictionMarketsDemo />} />
                    <Route path="/predictions/:slug" element={<PredictionMarketDetail />} />
                    <Route path="/discover/news" element={<Navigate to="/news" replace />} />
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
                </ChatSessionsProvider>
              </DailyChangeDataProvider>
            </ExchangeRatesProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
