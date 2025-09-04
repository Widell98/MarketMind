
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PortfolioAdvisor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      try {
        // Check if user has an existing risk profile
        const { data: riskProfile } = await supabase
          .from('user_risk_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        // If user already has a risk profile, redirect to implementation
        if (riskProfile) {
          console.log('User already has risk profile, redirecting to implementation');
          navigate('/portfolio-implementation', { replace: true });
          return;
        }

        // Also check if user has any portfolios
        const { data: portfolios } = await supabase
          .from('user_portfolios')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (portfolios && portfolios.length > 0) {
          console.log('User already has portfolios, redirecting to implementation');
          navigate('/portfolio-implementation', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking existing profile:', error);
      }
    };

    checkExistingProfile();
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
          <ConversationalPortfolioAdvisor />
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
