
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ConversationalPortfolioAdvisor from '@/components/ConversationalPortfolioAdvisor';
import { useConversationalPortfolio } from '@/hooks/useConversationalPortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const PortfolioAdvisor = () => {
  const navigate = useNavigate();
  const { checkIfUserHasCompletedAdvisor } = useConversationalPortfolio();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdvisorStatus = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const hasCompleted = await checkIfUserHasCompletedAdvisor();
        if (hasCompleted) {
          // User has already completed the advisor, redirect to implementation
          navigate('/portfolio-implementation', { replace: true });
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking advisor status:', error);
        setIsChecking(false);
      }
    };

    checkAdvisorStatus();
  }, [user, checkIfUserHasCompletedAdvisor, navigate]);

  if (isChecking) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-gray-600">Kontrollerar din profil...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <ConversationalPortfolioAdvisor />
      </div>
    </Layout>
  );
};

export default PortfolioAdvisor;
