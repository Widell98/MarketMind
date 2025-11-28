
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
import ResetProfileConfirmDialog from '@/components/ResetProfileConfirmDialog';
import SavedPortfoliosSection from '@/components/SavedPortfoliosSection';

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
  const [showResetDialog, setShowResetDialog] = useState(false);

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
    if (!user) {
      toast({
        title: 'Fel',
        description: 'Du måste vara inloggad för att återställa din profil',
        variant: 'destructive'
      });
      return;
    }

    try {
      await supabase.from('user_holdings').delete().eq('user_id', user.id).eq('holding_type', 'recommendation');

      const success = await clearRiskProfile();
      if (success) {
        toast({
          title: 'Profil återställd',
          description: 'Din riskprofil och AI-rekommendationer har raderats.'
        });
        refetchRiskProfile();
        navigate('/portfolio-advisor');
      }
    } catch (error) {
      console.error('Error resetting profile:', error);
      toast({
        title: 'Fel',
        description: 'Ett oväntat fel uppstod. Försök igen senare.',
        variant: 'destructive'
      });
    } finally {
      setShowResetDialog(false);
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
        <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6 lg:py-8">
          <div className="space-y-4 sm:space-y-6">
            <Tabs defaultValue={isAdmin ? "content" : "riskprofile"} className="w-full">
              <TabsList
                className={`grid w-full ${
                  isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'
                } gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 mb-3 sm:mb-4 md:mb-6 lg:mb-8 bg-muted/20 border border-border/30 rounded-md sm:rounded-lg md:rounded-xl p-0.5 sm:p-1 md:p-1.5 lg:p-2 shadow-sm backdrop-blur-sm`}
              >
                {isAdmin && (
                  <TabsTrigger value="content" className="rounded-md font-medium text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                    Innehåll
                  </TabsTrigger>
                )}
                <TabsTrigger value="riskprofile" className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 rounded-md font-medium text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Riskprofil</span>
                  <span className="xs:hidden">Risk</span>
                </TabsTrigger>
                <TabsTrigger value="sharing-activity" className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 rounded-md font-medium text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Delning & aktivitet</span>
                  <span className="sm:hidden">Delning</span>
                </TabsTrigger>
                <TabsTrigger value="membership" className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 rounded-md font-medium text-[10px] xs:text-xs sm:text-sm px-1.5 xs:px-2 sm:px-3 py-1.5 sm:py-2">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Medlemskap</span>
                  <span className="sm:hidden">Medlem</span>
                </TabsTrigger>
              </TabsList>

            {isAdmin && (
              <TabsContent value="content" className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* Stock Cases */}
                <Card className="border rounded-lg sm:rounded-xl shadow-sm">
                  <CardHeader className="pb-3 sm:pb-4 md:pb-6 p-3 sm:p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-semibold">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <span className="break-words">Mina Inlägg</span>
                      </CardTitle>
                      <Button
                        onClick={() => setIsCreateCaseDialogOpen(true)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Nytt case
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    {stockCasesLoading ? (
                      <div className="text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Laddar cases...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
                <Card className="border rounded-lg sm:rounded-xl shadow-sm">
                  <CardHeader className="pb-3 sm:pb-4 md:pb-6 p-3 sm:p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-semibold">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <span className="break-words">Mina Analyser</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <UserAnalysesSection compact={false} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="riskprofile" className="space-y-4 sm:space-y-6 md:space-y-8">
              <ResetProfileConfirmDialog
                isOpen={showResetDialog}
                onClose={() => setShowResetDialog(false)}
                onConfirm={handleResetRiskProfile}
              />
              <InvestmentProfileSummary
                riskProfile={riskProfile}
                loading={riskProfileLoading}
                showActions
                onReset={() => setShowResetDialog(true)}
              />
              <SavedPortfoliosSection />
              <UserInvestmentAnalysis />
            </TabsContent>

            <TabsContent value="sharing-activity" className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-3 sm:gap-4 md:gap-6 xl:gap-8 items-start">
                <ExportSharingSection />
                <ActivitySection />
              </div>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4 sm:space-y-6 md:space-y-8">
              <MembershipSection />

              <Card className="border-destructive/40 rounded-lg sm:rounded-xl">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-destructive text-sm sm:text-base md:text-lg">
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="break-words">Radera konto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 md:p-6 pt-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Detta tar bort ditt konto permanent tillsammans med din profil och relaterad data. Åtgärden kan inte ångras.
                  </p>
                  <Button
                    variant="destructive"
                    className="rounded-lg w-full sm:w-auto text-xs sm:text-sm"
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
