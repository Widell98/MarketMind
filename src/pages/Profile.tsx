
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, FileText, Plus, ArrowRight } from 'lucide-react';
import UserStockCasesSection from '@/components/UserStockCasesSection';
import UserAnalysesSection from '@/components/UserAnalysesSection';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import EnhancedProfileHeader from '@/components/EnhancedProfileHeader';
import MembershipSection from '@/components/MembershipSection';
import ActivitySection from '@/components/ActivitySection';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-navy"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <EnhancedProfileHeader />
            <MembershipSection />
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Snabbåtgärder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/my-stock-cases')}
                  className="w-full justify-between"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Hantera mina cases
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <Button 
                  onClick={() => navigate('/market-analyses')}
                  className="w-full justify-between"
                  variant="outline"
                >
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Skapa analys
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            <ActivitySection />
            <UserStockCasesSection compact={true} />
            <UserAnalysesSection compact={true} />
            <SavedOpportunitiesSection />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
