import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';
import CreateStockCaseDialog from '@/components/CreateStockCaseDialog';
import StockCaseCard from '@/components/StockCaseCard';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import { useStockCases } from '@/hooks/useStockCases';
import { useFollowingStockCases } from '@/hooks/useFollowingStockCases';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useSaveStockCaseToPortfolio } from '@/hooks/useSaveStockCaseToPortfolio';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp, PlusCircle, Sparkles, MessageCircle, Users, UserPlus, UserMinus, Bookmark } from 'lucide-react';
const StockCases = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    stockCases,
    loading,
    refetch
  } = useStockCases();
  const {
    followingStockCases,
    loading: followingLoading
  } = useFollowingStockCases();
  const { followUser, unfollowUser, isFollowing } = useUserFollows();
  const { saveToPortfolio, saving } = useSaveStockCaseToPortfolio();
  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };
  const handleDelete = async (id: string) => {
    try {
      // Implementation for delete
      refetch();
    } catch (error) {
      console.error('Error deleting stock case:', error);
    }
  };
  const handleDiscussWithAI = (stockCase: any) => {
    const contextData = {
      type: 'stock_case',
      id: stockCase.id,
      title: stockCase.title,
      data: stockCase
    };
    navigate('/ai-chat', {
      state: {
        contextData
      }
    });
  };
  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    refetch();
  };
  if (loading) {
    return <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Aktiefall</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb />
        
        {/* AI Weekly Picks Section - moved to top */}
        <AIWeeklyPicks />

        {/* Header - moved below AI Weekly Picks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Aktiefall
            </h1>
          </div>
          {user && <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nytt Aktiefall
            </Button>}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted p-1 rounded-xl h-auto">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Upptäck
            </TabsTrigger>
            <TabsTrigger 
              value="following" 
              className="flex items-center gap-2 rounded-lg py-3 px-4 font-medium transition-all duration-200 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm"
            >
              <Users className="w-4 h-4" />
              Följer
            </TabsTrigger>
          </TabsList>

          {/* Upptäck Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Stock Cases Feed */}
            <div className="space-y-4">
              {stockCases.map(stockCase => (
                <div key={stockCase.id} className="relative group">
                  <Card className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {stockCase.user_id ? 'U' : 'AI'}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stockCase.sector && (
                            <Badge variant="secondary">
                              {stockCase.sector}
                            </Badge>
                          )}
                          {stockCase.user_id && user && stockCase.user_id !== user.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => isFollowing(stockCase.user_id) ? unfollowUser(stockCase.user_id) : followUser(stockCase.user_id)}
                              className={cn(
                                "flex items-center gap-1",
                                isFollowing(stockCase.user_id) 
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                  : "text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {isFollowing(stockCase.user_id) ? (
                                <>
                                  <UserMinus className="w-4 h-4" />
                                  Sluta följa
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-4 h-4" />
                                  Följ
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 text-foreground">
                        {stockCase.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {stockCase.company_name}
                      </p>
                      {stockCase.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {stockCase.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {stockCase.target_price && (
                            <span>Målkurs: {stockCase.target_price} kr</span>
                          )}
                          {stockCase.performance_percentage && (
                            <span className={stockCase.performance_percentage > 0 ? 'text-green-600' : 'text-red-600'}>
                              {stockCase.performance_percentage > 0 ? '+' : ''}{stockCase.performance_percentage}%
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDiscussWithAI(stockCase)}
                            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Diskutera med AI
                          </Button>
                          {user && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveToPortfolio(stockCase)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                            >
                              <Bookmark className="w-4 h-4 mr-1" />
                              {saving ? 'Sparar...' : 'Spara till portfölj'}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(stockCase.id)}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            Visa detaljer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {stockCases.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga aktiefall hittades</h3>
                <p className="text-muted-foreground mb-6">
                  Var den första att skapa ett aktiefall!
                </p>
                {user && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Skapa första aktiefallet
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Följer Tab */}
          <TabsContent value="following" className="space-y-6">
            {followingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                      <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : followingStockCases.length > 0 ? (
              <div className="space-y-4">
                {followingStockCases.map(stockCase => (
                  <div key={stockCase.id} className="relative group">
                    <Card className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {stockCase.profile?.display_name?.[0] || stockCase.profile?.username?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {stockCase.profile?.display_name || stockCase.profile?.username || 'Okänd användare'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                              </p>
                            </div>
                          </div>
                          {stockCase.sector && (
                            <Badge variant="secondary">
                              {stockCase.sector}
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 text-foreground">
                          {stockCase.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {stockCase.company_name}
                        </p>
                        {stockCase.description && (
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                            {stockCase.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {stockCase.target_price && (
                              <span>Målkurs: {stockCase.target_price} kr</span>
                            )}
                            {stockCase.performance_percentage && (
                              <span className={stockCase.performance_percentage > 0 ? 'text-green-600' : 'text-red-600'}>
                                {stockCase.performance_percentage > 0 ? '+' : ''}{stockCase.performance_percentage}%
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDiscussWithAI(stockCase)}
                              className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Diskutera med AI
                            </Button>
                            {user && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => saveToPortfolio(stockCase)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                              >
                                <Bookmark className="w-4 h-4 mr-1" />
                                {saving ? 'Sparar...' : 'Spara till portfölj'}
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewDetails(stockCase.id)}
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                            >
                              Visa detaljer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga aktiefall från följda användare</h3>
                <p className="text-muted-foreground mb-6">
                  {!user 
                    ? "Logga in för att följa andra användare och se deras aktiefall"
                    : "Du följer inga användare ännu, eller så har de du följer inte publicerat några aktiefall"
                  }
                </p>
                {!user ? (
                  <Button asChild>
                    <Link to="/auth">
                      Logga in
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link to="/stock-cases" onClick={() => setActiveTab('all')}>
                      Upptäck användare att följa
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Stock Case Dialog */}
        <CreateStockCaseDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreateSuccess} />
      </div>
    </Layout>;
};
export default StockCases;