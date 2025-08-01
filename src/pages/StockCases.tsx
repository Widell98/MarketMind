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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, PlusCircle, Sparkles, MessageCircle, Users } from 'lucide-react';
const StockCases = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    stockCases,
    loading,
    refetch
  } = useStockCases();
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
                  <StockCaseCard stockCase={stockCase} onViewDetails={handleViewDetails} onDelete={handleDelete} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDiscussWithAI(stockCase)} className="bg-white/90 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Diskutera med AI
                    </Button>
                    {user && (
                      <Button variant="outline" size="sm" onClick={() => navigate('/portfolio-implementation')} className="bg-white/90 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300">
                        Lägg till i portfölj
                      </Button>
                    )}
                  </div>
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
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Följer-flöde</h3>
              <p className="text-muted-foreground mb-6">
                Här kommer innehåll från profiler du följer att visas
              </p>
              {!user && (
                <Button asChild>
                  <Link to="/auth">
                    Logga in för att följa andra
                  </Link>
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Stock Case Dialog */}
        <CreateStockCaseDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreateSuccess} />
      </div>
    </Layout>;
};
export default StockCases;