
import React from 'react';
import Layout from '@/components/Layout';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { useAuth } from '@/contexts/AuthContext';

const PortfolioAdvisor = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Du måste vara inloggad för att komma åt portföljrådgivaren.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Snabb riskprofil</h1>
            <p className="text-muted-foreground">
              Besvara några korta frågor så skickar vi dig direkt till AI-chatten för att fortsätta rådgivningen.
            </p>
          </div>
          <ConversationalPortfolioAdvisor />
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
