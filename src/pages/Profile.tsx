
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import EditProfileDialog from "@/components/EditProfileDialog";
import MembershipSection from '@/components/MembershipSection';
import AccountSettings from '@/components/AccountSettings';
import ActivitySection from '@/components/ActivitySection';
import EnhancedProfileHeader from '@/components/EnhancedProfileHeader';
import ProfileContentGrid from '@/components/ProfileContentGrid';
import { useEnhancedUserStats } from '@/hooks/useEnhancedUserStats';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [stockCases, setStockCases] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const { stats: userStats, loading: statsLoading } = useEnhancedUserStats();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle navigation state for setting active tab
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          setProfileData(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to load profile data',
            variant: 'destructive',
          });
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const fetchUserContent = async () => {
      if (!user) return;

      try {
        setContentLoading(true);

        // Fetch user's stock cases
        const { data: stockCasesData } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        // Fetch user's analyses
        const { data: analysesData } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        setStockCases(stockCasesData || []);
        setAnalyses(analysesData || []);

      } catch (error) {
        console.error('Error fetching user content:', error);
        toast({
          title: 'Error',
          description: 'Failed to load content',
          variant: 'destructive',
        });
      } finally {
        setContentLoading(false);
      }
    };

    if (user) {
      fetchUserContent();
    }
  }, [user]);

  const handleNameChange = (newName: string) => {
    setProfileData((old: any) => ({ ...old, display_name: newName }));
    toast({
      title: 'Name Updated',
      description: `Your display name has been changed to "${newName}"`,
      variant: 'default',
    });
  };

  if (loading || profileLoading || roleLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-finance-navy" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <EditProfileDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentName={profileData?.display_name || ""}
          userId={user?.id}
          onSaved={handleNameChange}
        />

        {/* Enhanced Profile Header */}
        <div className="mb-8">
          <EnhancedProfileHeader
            profileData={profileData}
            isOwnProfile={true}
            onEditClick={() => setEditOpen(true)}
            userStats={userStats}
          />
        </div>

        {/* Quick Actions for Admin */}
        {isAdmin && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => navigate('/admin/stock-cases')}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Admin: Hantera Cases
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/stock-cases')}
                size="sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Visa alla aktiecases
              </Button>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Innehåll</TabsTrigger>
            <TabsTrigger value="membership">Medlemskap</TabsTrigger>
            <TabsTrigger value="settings">Inställningar</TabsTrigger>
            <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="mt-6">
            <ProfileContentGrid
              stockCases={stockCases}
              analyses={analyses}
              isLoading={contentLoading}
            />
          </TabsContent>
          
          <TabsContent value="membership">
            <MembershipSection />
          </TabsContent>

          <TabsContent value="settings">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="activity">
            <ActivitySection />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfilePage;
