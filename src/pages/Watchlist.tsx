
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, AlertCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';

const Watchlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Inloggning krävs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Du måste vara inloggad för att se dina sparade möjligheter.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Logga in
          </Button>
        </div>
      </Layout>
    );
  }

  // Mock data for saved opportunities
  const mockSavedOpportunities = [
    {
      id: '1',
      type: 'stock_case' as const,
      title: 'Tesla Long-term Growth Case',
      company_name: 'Tesla Inc.',
      description: 'Electric vehicle market leader with strong fundamentals',
      sector: 'Technology',
      performance_percentage: 15.2,
      created_at: '2024-01-15T10:00:00Z',
      ai_generated: false,
    },
    {
      id: '2',
      type: 'analysis' as const,
      title: 'Renewable Energy Sector Analysis',
      description: 'Deep dive into renewable energy investment opportunities',
      sector: 'Energy',
      created_at: '2024-01-10T14:30:00Z',
      ai_generated: true,
    },
  ];

  const handleRemoveOpportunity = (id: string) => {
  };

  const handleViewOpportunity = (opportunity: any) => {
    if (opportunity.type === 'stock_case') {
      navigate(`/stock-cases/${opportunity.id}`);
    } else if (opportunity.type === 'analysis') {
      navigate(`/analysis/${opportunity.id}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Sparade Möjligheter
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hantera dina sparade aktiefall och investeringsanalyser
            </p>
          </div>
        </div>

        {/* Saved Opportunities Section */}
        <SavedOpportunitiesSection 
          opportunities={mockSavedOpportunities}
          onRemove={handleRemoveOpportunity}
          onView={handleViewOpportunity}
          loading={false}
        />
      </div>
    </Layout>
  );
};

export default Watchlist;
