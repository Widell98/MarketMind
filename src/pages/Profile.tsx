
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExportSharingSection from '@/components/ExportSharingSection';
import { TrendingUp, FileText, Plus, Brain, CreditCard, Share2, Trash2, Loader2 } from 'lucide-react';
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
import UserInvestmentAnalysis from '@/components/UserInvestmentAnalysis';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import InvestmentProfileSummary from '@/components/InvestmentProfileSummary';
import { useRiskProfile } from '@/hooks/useRiskProfile';

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateCaseDialogOpen, setIsCreateCaseDialogOpen] = useState(false);
  const [isEditCaseDialogOpen, setIsEditCaseDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { stats } = useEnhancedUserStats();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { savedItems, removeOpportunity } = useSavedOpportunities();
  const { stockCases, loading: stockCasesLoading, refetch } = useStockCases();
  const { deleteStockCase } = useStockCaseOperations();
  const { toast } = useToast();
  const { riskProfile, loading: riskProfileLoading, clearRiskProfile, refetch: refetchRiskProfile } = useRiskProfile();

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

  if (loading || profileLoading || roleLoading) {
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

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-profile', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Konto raderat',
        description: 'Ditt konto har raderats permanent.'
      });

      await signOut();
      navigate('/auth?account-deleted=true');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Raderingen misslyckades',
        description: error?.message || 'Kunde inte radera ditt konto. Försök igen.',
        variant: 'destructive'
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountDialogOpen(false);
    }
  };

  const handleResetRiskProfile = async () => {
    if (!user?.id) return;

    await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');

    const success = await clearRiskProfile();
    if (success) {
      refetchRiskProfile();
    }
  };

  return (
    <Layout>
      <div className="min-h-0 bg-background">
        {/* Clean Profile Header */}
        <div className="bg-card border-b">
          <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
            <EnhancedProfileHeader 
              profileData={profileData || user}
              isOwnProfile={true}
              onEditClick={() => setIsEditDialogOpen(true)}
              userStats={stats}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
          <div className="space-y-6">
            <Tabs defaultValue={isAdmin ? "content" : "riskprofile"} className="w-full">
              <TabsList
                className={`grid w-full ${
                  isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
                } gap-2 md:gap-3 mb-8 bg-muted/20 border border-border/30 rounded-xl p-1 md:p-2 shadow-sm backdrop-blur-sm`}
              >
                {isAdmin && (
                  <TabsTrigger value="content" className="rounded-lg font-medium">
                    Innehåll
                  </TabsTrigger>
                )}
                <TabsTrigger value="riskprofile" className="flex items-center gap-2 rounded-lg font-medium">
                  <Brain className="w-4 h-4" />
                  Riskprofil
                </TabsTrigger>
                <TabsTrigger value="sharing-activity" className="flex items-center gap-2 rounded-lg font-medium">
                  <Share2 className="w-4 h-4" />
                  Delning & aktivitet
                </TabsTrigger>
                <TabsTrigger value="membership" className="flex items-center gap-2 rounded-lg font-medium">
                  <CreditCard className="w-4 h-4" />
                  Medlemskap
                </TabsTrigger>
              </TabsList>

            {isAdmin && (
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
                      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
            )}

            <TabsContent value="riskprofile" className="space-y-8">
              <InvestmentProfileSummary
                riskProfile={riskProfile}
                loading={riskProfileLoading}
                showActions
                onReset={handleResetRiskProfile}
              />
              <UserInvestmentAnalysis />
            </TabsContent>

            <TabsContent value="sharing-activity" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-8 items-start">
                <ExportSharingSection />
                <ActivitySection />
              </div>
            </TabsContent>

            <TabsContent value="membership" className="space-y-8">
              <MembershipSection />

              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Radera konto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Detta tar bort ditt konto permanent tillsammans med din profil och relaterad data. Åtgärden kan inte ångras.
                  </p>
                  <Button
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => setIsDeleteAccountDialogOpen(true)}
                  >
                    Radera mitt konto
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

      {isAdmin && (
        <>
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
        </>
      )}

      <AlertDialog open={isDeleteAccountDialogOpen} onOpenChange={(open) => !isDeletingAccount && setIsDeleteAccountDialogOpen(open)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Radera konto</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Detta kommer att radera ditt konto permanent och logga ut dig från plattformen. Fortsätt endast om du är säker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg" disabled={isDeletingAccount}>
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg flex items-center"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Raderar...
                </>
              ) : (
                'Radera konto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Profile;
