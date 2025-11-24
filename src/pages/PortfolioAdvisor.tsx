
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

const PortfolioAdvisor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) return;

    navigate('/profile?tab=riskprofile', { replace: true });
  }, [user, navigate]);

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
          <div className="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold mb-4">Riskprofil flyttad</h1>
            <p className="text-muted-foreground mb-4">
              Vi har flyttat riskprofilen till din profil. Du kommer strax att dirigeras om till
              fliken för riskprofil så att du kan uppdatera dina inställningar där.
            </p>
            <button
              className="rounded-xl px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition"
              onClick={() => navigate('/profile?tab=riskprofile')}
            >
              Gå till riskprofil
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
