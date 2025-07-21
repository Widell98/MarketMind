import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import Profile from '@/pages/Profile';
import PortfolioAdvisor from '@/pages/PortfolioAdvisor';
import PortfolioImplementation from '@/pages/PortfolioImplementation';
import Learning from '@/pages/Learning';
import AIChat from '@/pages/AIChat';
import StockCaseDetail from '@/pages/StockCaseDetail';
import MyStockCases from '@/pages/MyStockCases';
import AdminStockCases from '@/pages/AdminStockCases';
import AnalysisDetail from '@/pages/AnalysisDetail';
import SocialIndex from '@/pages/SocialIndex';
import Watchlist from '@/pages/Watchlist';
import AdvancedFeatures from '@/pages/AdvancedFeatures';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';

import DiscoverOpportunities from '@/pages/DiscoverOpportunities';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/portfolio-advisor" element={<PortfolioAdvisor />} />
            <Route path="/portfolio-implementation" element={<PortfolioImplementation />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/stock-cases" element={<DiscoverOpportunities />} />
            <Route path="/stock-cases/:id" element={<StockCaseDetail />} />
            <Route path="/my-stock-cases" element={<MyStockCases />} />
            <Route path="/admin/stock-cases" element={<AdminStockCases />} />
            <Route path="/analysis/:id" element={<AnalysisDetail />} />
            <Route path="/social" element={<SocialIndex />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/advanced-features" element={<AdvancedFeatures />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
