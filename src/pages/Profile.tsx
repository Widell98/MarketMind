
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
import CreateAnalysisDialog from '@/components/CreateAnalysisDialog';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import EnhancedStockCaseCard from '@/components/EnhancedStockCaseCard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEnhancedUserStats } from '@/hooks/useEnhancedUserStats';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { supabase } from '@/integrations/supabase/client';
import UserInvestmentAnalysis from '@/components/UserInvestmentAnalysis';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import { Brain } from 'lucide-react';

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateCaseDialogOpen, setIsCreateCaseDialogOpen] = useState(false);
  const [isEditCaseDialogOpen, setIsEditCaseDialogOpen] = useState(false);
  const [isCreateAnalysisDialogOpen, setIsCreateAnalysisDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const { stats } = useEnhancedUserStats();
  const { savedItems, removeOpportunity } = useSavedOpportunities();
  const { stockCases, loading: stockCasesLoading, refetch } = useStockCases();
  const { deleteStockCase } = useStockCaseOperations();
  const { riskProfile } = useRiskProfile();

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
      <div className="min-h-screen bg-background">
        {/* Clean Profile Header */}
        <div className="bg-card border-b">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <EnhancedProfileHeader 
              profileData={profileData || user}
              isOwnProfile={true}
              onEditClick={() => setIsEditDialogOpen(true)}
              userStats={stats}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              <MembershipSection />
              
              {/* Quick Actions Card */}
              <Card className="border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-medium">
                    <Plus className="w-5 h-5 mr-2 text-primary" />
                    Snabbåtgärder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setIsCreateCaseDialogOpen(true)}
                    className="w-full justify-between bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
                    size="sm"
                  >
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Skapa nytt case
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    onClick={() => setIsCreateAnalysisDialogOpen(true)}
                    variant="outline"
                    className="w-full justify-between border rounded-lg hover:bg-muted/50 font-medium"
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
              <Card className="border rounded-xl shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg font-medium">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    Översikt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="text-2xl font-semibold text-foreground">
                        {stats.stockCasesCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Stock Cases</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="text-2xl font-semibold text-foreground">
                        {stats.analysesCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Analyser</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="xl:col-span-3">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/20 border border-border/30 rounded-xl p-1 shadow-sm backdrop-blur-sm">
                  <TabsTrigger value="content" className="rounded-lg font-medium">
                    Innehåll
                  </TabsTrigger>
                  <TabsTrigger value="riskprofile" className="flex items-center gap-2 rounded-lg font-medium">
                    <Brain className="w-4 h-4" />
                    Riskprofil
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-lg font-medium">
                    Aktivitet
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-8">
                  {/* Stock Cases */}
                  <Card className="border rounded-xl shadow-sm">
                    <CardHeader className="pb-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                          </div>
                          Mina Inlägg
                        </CardTitle>
                        <Button 
                          onClick={() => setIsCreateCaseDialogOpen(true)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nytt case
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stockCasesLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-sm text-muted-foreground">Laddar cases...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                            <div className="col-span-full text-center py-16">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <TrendingUp className="w-8 h-8 text-primary" />
                              </div>
                              <h3 className="text-xl font-semibold text-foreground mb-3">Inga cases än</h3>
                              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Skapa ditt första aktiecase och dela dina investeringsidéer med communityn.</p>
                              <Button 
                                onClick={() => setIsCreateCaseDialogOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
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
                  <Card className="border rounded-xl shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        Mina Analyser
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UserAnalysesSection compact={false} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="riskprofile" className="space-y-8">
                  <UserInvestmentAnalysis />
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

      <CreateAnalysisDialog 
        isOpen={isCreateAnalysisDialogOpen}
        onClose={() => setIsCreateAnalysisDialogOpen(false)}
      />

      <AlertDialog open={!!caseToDelete} onOpenChange={() => setCaseToDelete(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Ta bort aktiecase</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Är du säker på att du vill ta bort detta aktiecase? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => caseToDelete && handleDeleteCase(caseToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Profile;
