
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { CreateStockCaseDialog } from '@/components/CreateStockCaseDialog';
import StockCaseCard from '@/components/StockCaseCard';
import AIWeeklyPicks from '@/components/AIWeeklyPicks';
import { useStockCases } from '@/hooks/useStockCases';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  PlusCircle, 
  Filter, 
  Sparkles,
  MessageCircle
} from 'lucide-react';

const StockCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { stockCases, loading, refetchStockCases } = useStockCases(false, categoryFilter);

  const categories = [
    { id: 'all', name: 'Alla Fall', count: stockCases.length },
    { id: 'Technology', name: 'Teknik', count: stockCases.filter(c => c.sector === 'Technology').length },
    { id: 'Healthcare', name: 'Hälsovård', count: stockCases.filter(c => c.sector === 'Healthcare').length },
    { id: 'Finance', name: 'Finans', count: stockCases.filter(c => c.sector === 'Finance').length },
    { id: 'Energy', name: 'Energi', count: stockCases.filter(c => c.sector === 'Energy').length },
  ];

  const handleViewDetails = (id: string) => {
    navigate(`/stock-cases/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      // Implementation for delete
      refetchStockCases();
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
    navigate('/ai-chat', { state: { contextData } });
  };

  const getFilteredCases = () => {
    if (categoryFilter === 'all') return stockCases;
    return stockCases.filter(stockCase => stockCase.sector === categoryFilter);
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Aktiefall</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Aktiefall
            </h1>
          </div>
          {user && (
            <CreateStockCaseDialog onSuccess={refetchStockCases}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Nytt Aktiefall
              </Button>
            </CreateStockCaseDialog>
          )}
        </div>

        {/* AI Weekly Picks Section */}
        <AIWeeklyPicks />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Alla Fall</span>
            </TabsTrigger>
            
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Trending</span>
            </TabsTrigger>
          </TabsList>

          {/* Alla Fall Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.id ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(category.id)}
                  className="flex items-center gap-2"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-1">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Stock Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCases().map(stockCase => (
                <div key={stockCase.id} className="relative group">
                  <StockCaseCard
                    stockCase={stockCase}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiscussWithAI(stockCase)}
                      className="bg-white/90 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {getFilteredCases().length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga aktiefall hittades</h3>
                <p className="text-muted-foreground mb-6">
                  {categoryFilter === 'all' 
                    ? 'Var den första att skapa ett aktiefall!'
                    : `Inga aktiefall hittades för kategorin ${categories.find(c => c.id === categoryFilter)?.name}.`
                  }
                </p>
                {user && (
                  <CreateStockCaseDialog onSuccess={refetchStockCases}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Skapa första aktiefallet
                    </Button>
                  </CreateStockCaseDialog>
                )}
              </div>
            )}
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trending Aktiefall</h3>
              <p className="text-muted-foreground">
                Här kommer trending aktiefall att visas baserat på popularitet och engagemang.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StockCases;
