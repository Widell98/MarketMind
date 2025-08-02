
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

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateCaseDialogOpen, setIsCreateCaseDialogOpen] = useState(false);
  const [isEditCaseDialogOpen, setIsEditCaseDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);
  
  const { stats } = useEnhancedUserStats();
  const { savedItems, removeOpportunity } = useSavedOpportunities();
  const { stockCases, loading: stockCasesLoading, refetch } = useStockCases();
  const { deleteStockCase } = useStockCaseOperations();

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

  const handleProfileSaved = () => {
    // Optionally refresh user data or show success message
    window.location.reload(); // Simple refresh to get updated profile data
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
            profileData={user}
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
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="w-5 h-5 mr-2 text-blue-600" />
                    Snabbåtgärder
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setIsCreateCaseDialogOpen(true)}
                    className="w-full justify-between bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
                    className="w-full justify-between bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Översikt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {stats.stockCasesCount}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">Stock Cases</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        {stats.analysesCount}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">Analyser</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-white dark:bg-gray-900 shadow-lg">
                  <TabsTrigger value="content" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                    Innehåll
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
                    Aktivitet
                  </TabsTrigger>
                  <TabsTrigger value="saved" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                    Sparade
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-8">
                  {/* Stock Cases */}
                  <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                          Mina Stock Cases
                        </CardTitle>
                        <Button 
                          onClick={() => setIsCreateCaseDialogOpen(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nytt case
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {stockCasesLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Laddar cases...</p>
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
                              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Inga cases än</h3>
                              <p className="text-gray-500 dark:text-gray-400 mb-4">Skapa ditt första aktiecase och dela dina investeringsidéer.</p>
                              <Button 
                                onClick={() => setIsCreateCaseDialogOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700"
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
                  <Card className="shadow-lg border-0 bg-white dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="w-6 h-6 text-green-600" />
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
                
                <TabsContent value="saved" className="space-y-8">
                  <SavedOpportunitiesSection 
                    opportunities={transformedOpportunities}
                    onRemove={removeOpportunity}
                    onView={handleViewOpportunity}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      
      <EditProfileDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentName={user?.email || ''}
        userId={user?.id || ''}
        profileData={user}
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
