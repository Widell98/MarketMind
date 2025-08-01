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
import { useNavigate } from 'react-router-dom';
import { TrendingUp, PlusCircle, Filter, Sparkles, MessageCircle, Building2, Heart, DollarSign, Zap, Tag } from 'lucide-react';
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
  const categories = [{
    id: 'all',
    name: 'Alla Fall',
    count: stockCases.length,
    icon: Tag,
    color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    textColor: 'text-white'
  }, {
    id: 'Technology',
    name: 'Teknik',
    count: stockCases.filter(c => c.sector === 'Technology').length,
    icon: Zap,
    color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    textColor: 'text-white'
  }, {
    id: 'Healthcare',
    name: 'Hälsovård',
    count: stockCases.filter(c => c.sector === 'Healthcare').length,
    icon: Heart,
    color: 'bg-gradient-to-r from-rose-500 to-pink-500',
    textColor: 'text-white'
  }, {
    id: 'Finance',
    name: 'Finans',
    count: stockCases.filter(c => c.sector === 'Finance').length,
    icon: DollarSign,
    color: 'bg-gradient-to-r from-amber-500 to-orange-500',
    textColor: 'text-white'
  }, {
    id: 'Energy',
    name: 'Energi',
    count: stockCases.filter(c => c.sector === 'Energy').length,
    icon: Building2,
    color: 'bg-gradient-to-r from-violet-500 to-indigo-500',
    textColor: 'text-white'
  }];
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
  const getFilteredCases = () => {
    if (categoryFilter === 'all') return stockCases;
    return stockCases.filter(stockCase => stockCase.sector === categoryFilter);
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
          

          {/* Alla Fall Tab */}
          <TabsContent value="all" className="space-y-6">
            {/* Enhanced Category Filter */}
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Filtrera efter kategori
                </h3>
                <p className="text-sm text-muted-foreground">
                  Välj en kategori för att se relevanta aktiefall
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
                {categories.map(category => {
                const IconComponent = category.icon;
                const isActive = categoryFilter === category.id;
                return <button key={category.id} onClick={() => setCategoryFilter(category.id)} className={`
                        group relative overflow-hidden rounded-xl px-4 py-3 min-w-[120px]
                        transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                        ${isActive ? `${category.color} ${category.textColor} shadow-md scale-105` : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
                      `}>
                      {/* Gradient overlay for inactive state */}
                      {!isActive && <div className={`
                          absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300
                          ${category.color}
                        `} />}
                      
                      <div className="relative flex flex-col items-center gap-2">
                        <IconComponent className={`
                          w-5 h-5 transition-colors duration-300
                          ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}
                        `} />
                        
                        <div className="text-center">
                          <div className={`
                            text-sm font-medium transition-colors duration-300
                            ${isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
                          `}>
                            {category.name}
                          </div>
                          
                          <Badge variant={isActive ? "secondary" : "outline"} className={`
                              mt-1 text-xs transition-all duration-300
                              ${isActive ? 'bg-white/20 text-white border-white/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                            `}>
                            {category.count}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded-full" />}
                    </button>;
              })}
              </div>
            </div>

            {/* Stock Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCases().map(stockCase => <div key={stockCase.id} className="relative group">
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
                </div>)}
            </div>

            {getFilteredCases().length === 0 && <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Inga aktiefall hittades</h3>
                <p className="text-muted-foreground mb-6">
                  {categoryFilter === 'all' ? 'Var den första att skapa ett aktiefall!' : `Inga aktiefall hittades för kategorin ${categories.find(c => c.id === categoryFilter)?.name}.`}
                </p>
                {user && <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Skapa första aktiefallet
                  </Button>}
              </div>}
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

        {/* Create Stock Case Dialog */}
        <CreateStockCaseDialog isOpen={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleCreateSuccess} />
      </div>
    </Layout>;
};
export default StockCases;