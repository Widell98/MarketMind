
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, FileText, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import UserAnalysesSection from '@/components/UserAnalysesSection';
import SavedOpportunitiesSection from '@/components/SavedOpportunitiesSection';
import EnhancedProfileHeader from '@/components/EnhancedProfileHeader';
import MembershipSection from '@/components/MembershipSection';
import ActivitySection from '@/components/ActivitySection';
import EditProfileDialog from '@/components/EditProfileDialog';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';
import EditStockCaseDialog from '@/components/EditStockCaseDialog';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import EnhancedStockCaseCard from '@/components/EnhancedStockCaseCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEnhancedUserStats } from '@/hooks/useEnhancedUserStats';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateCaseDialogOpen, setIsCreateCaseDialogOpen] = useState(false);
  const [isEditCaseDialogOpen, setIsEditCaseDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const { stats } = useEnhancedUserStats();
  const { savedItems, removeOpportunity } = useSavedOpportunities();
  const { stockCases, loading: stockCasesLoading, refetch } = useStockCases();
  const { deleteStockCase } = useStockCaseOperations();

  // Fetch profile data
  React.useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;
      
      try {
        setProfileLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user data if profile fetch fails
        setProfileData(user);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading || profileLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleViewOpportunity = (opportunity: any) => {
    if (opportunity.item_type === 'stock_case') {
      navigate(`/stock-cases/${opportunity.item_id}`);
    } else if (opportunity.item_type === 'analysis') {
      navigate(`/analyses/${opportunity.item_id}`);
    }
  };

  // Transform saved items to match the expected format
  const transformedOpportunities = savedItems.map(item => ({
    id: item.id,
    type: item.item_type,
    title: item.stock_cases?.title || item.analyses?.title || 'Unknown',
    description: item.stock_cases?.description || item.analyses?.content?.substring(0, 150) || '',
    company_name: item.stock_cases?.company_name || '',
    sector: item.stock_cases?.sector || '',
    created_at: item.created_at,
    ai_generated: item.analyses?.ai_generated || false
  }));

  const handleProfileSaved = async () => {
    // Refresh profile data after save
    if (user?.id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfileData(data);
      }
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      await deleteStockCase(caseId);
      refetch();
      setCaseToDelete(null);
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const handleEditCase = (stockCase: any) => {
    setCaseToEdit(stockCase);
    setIsEditCaseDialogOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Profile Header */}
        <div className="pb-8">
          <EnhancedProfileHeader 
            profileData={profileData || user}
            isOwnProfile={true}
            onEditClick={() => setIsEditDialogOpen(true)}
            userStats={stats}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <MembershipSection />
              
              {/* Quick Actions Card */}
              <Card className="border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="w-5 h-5 mr-2 text-primary" />
                    Snabbåtgärder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setIsCreateCaseDialogOpen(true)}
                    className="w-full justify-between"
                    size="sm"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Skapa nytt case
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    onClick={() => navigate('/market-analyses')}
                    variant="outline"
                    className="w-full justify-between"
                    size="sm"
                  >
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Skapa analys
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <Card className="border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    Översikt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xl font-bold text-foreground">
                        {stats.stockCasesCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Stock Cases</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xl font-bold text-foreground">
                        {stats.analysesCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Analyser</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-background border">
                  <TabsTrigger value="content">
                    Innehåll
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    Aktivitet
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-8">
                  {/* Stock Cases */}
                  <Card className="border">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <TrendingUp className="w-6 h-6 text-primary" />
                          Mina Stock Cases
                        </CardTitle>
                        <Button 
                          onClick={() => setIsCreateCaseDialogOpen(true)}
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nytt case
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stockCasesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <p className="text-sm text-muted-foreground">Laddar cases...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stockCases.filter(c => c.user_id === user.id).map((stockCase) => (
                            <EnhancedStockCaseCard 
                              key={stockCase.id} 
                              stockCase={stockCase}
                              onViewDetails={() => navigate(`/stock-cases/${stockCase.id}`)}
                              onDelete={() => setCaseToDelete(stockCase.id)}
                              onEdit={handleEditCase}
                            />
                          ))}
                          {stockCases.filter(c => c.user_id === user.id).length === 0 && (
                            <div className="col-span-full text-center py-8">
                              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-foreground mb-2">Inga cases än</h3>
                              <p className="text-muted-foreground mb-4">Skapa ditt första aktiecase och dela dina investeringsidéer.</p>
                              <Button 
                                onClick={() => setIsCreateCaseDialogOpen(true)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Skapa första case
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Analyses */}
                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="w-6 h-6 text-primary" />
                        Mina Analyser
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserAnalysesSection compact={false} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity" className="space-y-8">
                  <ActivitySection />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <EditProfileDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentName={profileData?.display_name || profileData?.username || user?.email || ''}
        userId={user?.id || ''}
        profileData={profileData || user}
        onSaved={handleProfileSaved}
      />

      <CreateStockCaseDialog 
        isOpen={isCreateCaseDialogOpen}
        onClose={() => setIsCreateCaseDialogOpen(false)}
        onSuccess={() => {
          setIsCreateCaseDialogOpen(false);
          refetch();
        }}
      />

      <EditStockCaseDialog 
        isOpen={isEditCaseDialogOpen}
        onClose={() => {
          setIsEditCaseDialogOpen(false);
          setCaseToEdit(null);
        }}
        onSuccess={() => {
          setIsEditCaseDialogOpen(false);
          setCaseToEdit(null);
          refetch();
        }}
        stockCase={caseToEdit}
      />

      <AlertDialog open={!!caseToDelete} onOpenChange={() => setCaseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort aktiecase</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort detta aktiecase? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => caseToDelete && handleDeleteCase(caseToDelete)}>
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Profile;
