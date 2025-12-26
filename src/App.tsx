import { useEffect, Suspense, lazy } from "react"; // VIKTIG: Saknades
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"; // VIKTIG: useNavigate saknades
import { supabase } from "@/integrations/supabase/client"; // VIKTIG: Måste finnas med
import { logger } from "@/utils/logger";

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

// Lazy load heavy routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const StockCases = lazy(() => import("./pages/StockCases"));
const StockCaseDetail = lazy(() => import("./pages/StockCaseDetail"));
const AnalysisDetail = lazy(() => import("./pages/AnalysisDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PortfolioImplementation = lazy(() => import("./pages/PortfolioImplementation"));
const PortfolioAdvisor = lazy(() => import("./pages/PortfolioAdvisor"));
const AdminPredictionMarkets = lazy(() => import("./pages/AdminPredictionMarkets"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Learning = lazy(() => import("./pages/Learning"));
const SocialIndex = lazy(() => import("./pages/SocialIndex"));
const AdminStockCases = lazy(() => import("./pages/AdminStockCases"));
const AdvancedFeatures = lazy(() => import("./pages/AdvancedFeatures"));
const Discover = lazy(() => import("./pages/Discover"));
const DiscoverNews = lazy(() => import("./pages/DiscoverNews"));
const MarketAnalyses = lazy(() => import("./pages/MarketAnalyses"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const PredictionMarketsDemo = lazy(() => import("./pages/PredictionMarketsDemo"));
const PredictionMarketDetail = lazy(() => import("./pages/PredictionMarketDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Här är den korrigerade komponenten
const AuthEventHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log("Auth event:", event);
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
                      
                      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /><p className="text-sm text-muted-foreground">Laddar...</p></div></div>}>
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
                      </Suspense>
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
