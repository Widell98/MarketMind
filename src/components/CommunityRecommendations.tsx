
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Brain,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Trash2,
  Filter,
  Tag,
  SortAsc,
  MessageCircle,
  ShoppingCart,
  User,
  ChevronRight,
} from 'lucide-react';
import { useCommunityRecommendations, CommunityRecommendation } from '@/hooks/useCommunityRecommendations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { usePersistentDialogOpenState } from '@/hooks/usePersistentDialogOpenState';
import { ADD_HOLDING_DIALOG_STORAGE_KEY } from '@/constants/storageKeys';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

declare global {
  interface Window {
    refreshCommunityRecommendations?: () => void;
  }
}

interface SelectedStock {
  name: string;
  symbol: string;
  sector: string;
  market: string;
  currency: string;
}

interface SelectedRecommendation extends CommunityRecommendation {
  stockInfo: SelectedStock;
}

const CommunityRecommendations: React.FC = () => {
  const { recommendations, loading, refetch } = useCommunityRecommendations();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { addHolding } = useUserHoldings();
  const {
    isOpen: isAddHoldingOpen,
    open: openAddHoldingDialog,
    close: closeAddHoldingDialog,
  } = usePersistentDialogOpenState(ADD_HOLDING_DIALOG_STORAGE_KEY, 'community-recommendations');
  const [selectedRecommendation, setSelectedRecommendation] = useState<SelectedRecommendation | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [recommendationToDelete, setRecommendationToDelete] = useState<CommunityRecommendation | null>(null);
  const [isDeletingRecommendation, setIsDeletingRecommendation] = useState(false);
  const [aiFilter, setAiFilter] = useState<'all' | 'ai' | 'community'>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sector'>('recent');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  // Expose refetch function globally so SaveOpportunityButton can use it
  useEffect(() => {
    window.refreshCommunityRecommendations = refetch;
    return () => {
      delete window.refreshCommunityRecommendations;
    };
  }, [refetch]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!container) return;
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (!firstChild) return;

      const gap = 16;
      const childWidth = firstChild.clientWidth + gap;
      const index = Math.round(container.scrollLeft / childWidth);
      setCarouselIndex(Math.min(filteredRecommendations.length - 1, Math.max(0, index)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [filteredRecommendations.length]);

  const handleViewItem = (recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      navigate(`/stock-cases/${recommendation.stock_case.id}`);
    } else if (recommendation.analysis) {
      navigate(`/analysis/${recommendation.analysis.id}`);
    }
  };

  const handleAddToPortfolio = async (recommendation: CommunityRecommendation, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }

    const stockName = recommendation.stock_case
      ? recommendation.stock_case.company_name
      : recommendation.analysis?.title || '';

    const stockSymbol = recommendation.stock_case
      ? recommendation.stock_case.title
      : (recommendation.analysis?.title || stockName).toUpperCase().substring(0, 4);

    const sector = recommendation.stock_case
      ? recommendation.stock_case.sector || 'Okänd'
      : 'Analys';

    setSelectedRecommendation({
      ...recommendation,
      stockInfo: {
        name: stockName,
        symbol: stockSymbol,
        sector,
        market: 'Stockholm',
        currency: 'SEK'
      }
    });
    openAddHoldingDialog();
  };

  const handleAddHolding = async (
    holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await addHolding(holdingData);
      
      toast({
        title: "Tillagt till portfölj!",
        description: `${holdingData.name} har lagts till i din portfölj som en Community-rekommendation`,
        variant: "default"
      });
      
      closeAddHoldingDialog();
      setSelectedRecommendation(null);
      return true;
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till i portföljen. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleDiscussWithAI = (recommendation: CommunityRecommendation, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    let contextData: Record<string, unknown> = {};
    if (recommendation.stock_case) {
      contextData = {
        type: 'stock_case',
        id: recommendation.stock_case.id,
        title: recommendation.stock_case.title,
        data: recommendation.stock_case
      };
    } else if (recommendation.analysis) {
      contextData = {
        type: 'analysis',
        id: recommendation.analysis.id,
        title: recommendation.analysis.title,
        data: recommendation.analysis
      };
    }

    navigate('/ai-chatt', { state: { contextData } });
  };

  const handleDeleteRecommendationRequest = (
    recommendation: CommunityRecommendation,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att ta bort rekommendationer",
        variant: "destructive"
      });
      return;
    }

    setRecommendationToDelete(recommendation);
  };

  const handleCancelDeleteRecommendation = () => {
    if (isDeletingRecommendation) return;
    setRecommendationToDelete(null);
  };

  const handleConfirmDeleteRecommendation = async () => {
    if (!recommendationToDelete || !user) return;

    setIsDeletingRecommendation(true);

    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('id', recommendationToDelete.id);

      if (error) throw error;

      toast({
        title: "Rekommendation borttagen",
        description: "Rekommendationen har tagits bort från din lista."
      });

      setRecommendationToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort rekommendationen. Försök igen senare.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingRecommendation(false);
    }
  };


  const getItemTitle = useCallback((recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      return recommendation.stock_case.company_name;
    }
    return recommendation.analysis?.title || 'Analys';
  }, []);

  const getItemDescription = useCallback((recommendation: CommunityRecommendation) => {
    if (recommendation.stock_case) {
      return recommendation.stock_case.description || recommendation.stock_case.title;
    }
    return recommendation.analysis?.content?.substring(0, 100) + '...' || '';
  }, []);

  const getCreatorInfo = useCallback((recommendation: CommunityRecommendation) => {
    const profile = recommendation.stock_case?.profiles || recommendation.analysis?.profiles;
    if (!profile) return null;

    return profile.display_name || profile.username;
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d sedan`;
    if (hours > 0) return `${hours}h sedan`;
    if (minutes > 0) return `${minutes}m sedan`;
    return 'Nyss sparad';
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const allSectors = useMemo(() => {
    const sectors = recommendations
      .map((rec) => rec.stock_case?.sector)
      .filter((sector): sector is string => Boolean(sector));
    return Array.from(new Set(sectors));
  }, [recommendations]);

  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    recommendations.forEach((rec) => {
      rec.tags?.forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return stats;
  }, [recommendations]);

  const filteredRecommendations = useMemo(() => {
    const base = recommendations.filter((rec) => {
      const matchesAI =
        aiFilter === 'all' ? true : aiFilter === 'ai' ? isAIGenerated(rec) : !isAIGenerated(rec);
      const matchesSector = selectedSector === 'all' ? true : rec.stock_case?.sector === selectedSector;
      const matchesTag = selectedTag === 'all' ? true : rec.tags?.includes(selectedTag);
      return matchesAI && matchesSector && matchesTag;
    });

    return [...base].sort((a, b) => {
      if (sortBy === 'name') {
        return getItemTitle(a).localeCompare(getItemTitle(b));
      }
      if (sortBy === 'sector') {
        return (a.stock_case?.sector || '').localeCompare(b.stock_case?.sector || '');
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [aiFilter, getItemTitle, recommendations, selectedSector, selectedTag, sortBy]);

  const topTags = useMemo(() => {
    return Object.entries(tagStats)
      .sort(([, aCount], [, bCount]) => bCount - aCount)
      .slice(0, 6);
  }, [tagStats]);

  const isAIGenerated = (recommendation: CommunityRecommendation) => {
    return recommendation.stock_case?.ai_generated || recommendation.analysis?.ai_generated;
  };

  const scrollToSlide = (index: number) => {
    if (!filteredRecommendations.length) return;

    const container = carouselRef.current;
    if (!container) return;

    const clampedIndex = Math.min(Math.max(index, 0), filteredRecommendations.length - 1);
    const target = container.children[clampedIndex] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      setCarouselIndex(clampedIndex);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community-rekommenderade Innehav
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4 animate-pulse" />
              <span>Laddar community-rekommendationer...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Community-rekommenderade Innehav
          </CardTitle>
          <CardDescription>
            Dina sparade stock-cases och analyser från communityn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga sparade rekommendationer</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Utforska stock-cases och analyser från communityn och spara intressanta innehåll för att se det här.
            </p>
            
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Hitta inspiration på /stock-cases
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Spara intressanta cases och analyser för att bygga din investeringsstrategi
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/stock-cases')} 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="w-4 h-4" />
                Utforska Stock Cases
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <CardTitle className="text-xl font-semibold flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span>Community-rekommenderade Innehav</span>
            {recommendations.length > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full">
                {recommendations.length} rekommendationer
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed text-center sm:text-left">
            Dina sparade stock-cases och analyser från communityn
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium justify-center sm:justify-start">
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {filteredRecommendations.length} sparade
            </Badge>
            <span className="hidden sm:inline text-muted-foreground">Community-rekommendationer</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-end gap-1 bg-muted/40 rounded-xl p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-lg"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-lg"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/stock-cases')}
              className="w-full sm:w-auto rounded-xl font-semibold shadow-sm text-sm sm:text-base"
            >
              Hitta fler
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>

          <div className="hidden lg:flex flex-wrap items-center gap-3 mb-6 border border-border/40 rounded-2xl p-4 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Filter className="w-4 h-4" /> Avancerade filter
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {([
                ['all', 'Alla'],
                ['ai', 'AI-genererade'],
                ['community', 'Community'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  variant={aiFilter === value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setAiFilter(value)}
                  className="rounded-full"
                >
                  {label}
                </Button>
              ))}
              {allSectors.length > 0 && (
                <div className="flex items-center gap-2 pl-2 border-l border-border/40 ml-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedSector === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedSector('all')}
                    className="rounded-full"
                  >
                    Alla sektorer
                  </Button>
                  {allSectors.map((sector) => (
                    <Button
                      key={sector}
                      variant={selectedSector === sector ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedSector(sector)}
                      className="rounded-full"
                    >
                      {sector}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {topTags.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-border/40 ml-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Taggar</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedTag === 'all' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTag('all')}
                    className="rounded-full"
                  >
                    Alla taggar
                  </Button>
                  {topTags.map(([tag]) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}
                      className="rounded-full"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            <SortAsc className="w-4 h-4" /> Sortera efter
            <Select value={sortBy} onValueChange={(value: 'recent' | 'name' | 'sector') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Senast sparad</SelectItem>
                <SelectItem value="name">Namn A–Ö</SelectItem>
                <SelectItem value="sector">Sektor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid xl:grid-cols-[3fr_1.2fr] gap-6">
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <>
                <div className="md:hidden relative">
                  <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory scroll-smooth"
                  >
                    {filteredRecommendations.map((recommendation) => (
                      <div key={recommendation.id} className="min-w-[86%] snap-start flex-shrink-0">
                        <div
                          className="h-full flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-transform duration-200"
                          onClick={() => handleViewItem(recommendation)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge
                                  variant={isAIGenerated(recommendation) ? 'secondary' : 'outline'}
                                  className="rounded-full px-2 py-0.5"
                                >
                                  {isAIGenerated(recommendation) ? 'AI-genererad' : 'Community'}
                                </Badge>
                                {recommendation.stock_case?.sector && (
                                  <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                    {recommendation.stock_case.sector}
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-semibold text-base text-foreground line-clamp-2">
                                  {getItemTitle(recommendation)}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {getItemDescription(recommendation)}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
                              <User className="w-3 h-3" />
                              {getCreatorInfo(recommendation) || 'Community'}
                            </span>
                            {recommendation.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full rounded-lg"
                              onClick={(e) => handleAddToPortfolio(recommendation, e)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" /> Lägg till
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-lg"
                              onClick={(e) => handleDiscussWithAI(recommendation, e)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" /> Diskutera
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => scrollToSlide(carouselIndex - 1)}
                      disabled={carouselIndex === 0}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {filteredRecommendations.map((_, index) => (
                        <button
                          key={`dot-${index}`}
                          className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                            carouselIndex === index ? 'bg-primary w-4' : 'bg-border'
                          }`}
                          onClick={() => scrollToSlide(index)}
                          aria-label={`Gå till kort ${index + 1}`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full"
                      onClick={() => scrollToSlide(carouselIndex + 1)}
                      disabled={carouselIndex >= filteredRecommendations.length - 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredRecommendations.slice(0, 8).map((recommendation) => (
                    <div
                      key={recommendation.id}
                      onClick={() => handleViewItem(recommendation)}
                      className="group relative flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant={isAIGenerated(recommendation) ? 'secondary' : 'outline'}
                              className="rounded-full px-2 py-0.5"
                            >
                              {isAIGenerated(recommendation) ? 'AI-genererad' : 'Community'}
                            </Badge>
                            {recommendation.stock_case?.sector && (
                              <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                {recommendation.stock_case.sector}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                            {getItemTitle(recommendation)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {getItemDescription(recommendation)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
                          <User className="w-3 h-3" />
                          {getCreatorInfo(recommendation) || 'Community'}
                        </span>
                        {recommendation.tags?.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full sm:flex-1 rounded-lg"
                          onClick={(e) => handleAddToPortfolio(recommendation, e)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" /> Lägg till
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:flex-1 rounded-lg"
                          onClick={(e) => handleDiscussWithAI(recommendation, e)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> Diskutera
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full sm:w-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={(e) => handleDeleteRecommendationRequest(recommendation, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredRecommendations.length > 8 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
                    onClick={() => navigate('/discover-opportunities')}
                  >
                    Visa alla sparade rekommendationer ({filteredRecommendations.length})
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="sticky top-16 z-10 -mx-6 px-6 py-3 bg-card/95 backdrop-blur border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ListIcon className="w-4 h-4" /> Lista
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    {filteredRecommendations.length} st
                  </Badge>
                </div>
                <div className="divide-y divide-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                  {filteredRecommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="p-4 bg-card/40 hover:bg-card/70 transition-colors flex flex-col gap-3"
                      onClick={() => handleViewItem(recommendation)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant={isAIGenerated(recommendation) ? 'secondary' : 'outline'}
                              className="rounded-full px-2 py-0.5"
                            >
                              {isAIGenerated(recommendation) ? 'AI-genererad' : 'Community'}
                            </Badge>
                            {recommendation.stock_case?.sector && (
                              <Badge variant="outline" className="rounded-full px-2 py-0.5">
                                {recommendation.stock_case.sector}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base text-foreground line-clamp-2">
                            {getItemTitle(recommendation)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 sm:line-clamp-2">
                            {getItemDescription(recommendation)}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
                          {formatDate(recommendation.created_at)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1">
                          <User className="w-3 h-3" />
                          {getCreatorInfo(recommendation) || 'Community'}
                        </span>
                        {recommendation.tags?.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="rounded-full px-2 py-0.5">
                            Sparad {getRelativeTime(recommendation.created_at)}
                          </Badge>
                          <Badge variant="outline" className="rounded-full px-2 py-0.5">
                            {recommendation.stock_case?.market || 'Onoterad'}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 sm:min-w-[280px]">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full sm:w-auto rounded-lg"
                            onClick={(e) => handleAddToPortfolio(recommendation, e)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" /> Lägg till
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto rounded-lg"
                            onClick={(e) => handleDiscussWithAI(recommendation, e)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" /> Diskutera
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full sm:w-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            onClick={(e) => handleDeleteRecommendationRequest(recommendation, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredRecommendations.length > 8 && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
                    onClick={() => navigate('/discover-opportunities')}
                  >
                    Visa alla sparade rekommendationer ({filteredRecommendations.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          <aside className="hidden xl:block rounded-2xl border border-border/40 bg-muted/20 p-4 h-fit">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-foreground">
              <Brain className="w-4 h-4 text-primary" /> Topptaggar & mest sparade
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Topptaggar</h4>
                {topTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">Inga taggar ännu</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {topTags.map(([tag, count]) => (
                    <Badge key={tag} variant="outline" className="rounded-full px-3 py-1 text-xs">
                      {tag} · {count}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/40 pt-3">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Nyast sparade</h4>
                <div className="space-y-3">
                  {filteredRecommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="flex items-center gap-3">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                        {isAIGenerated(rec) ? 'AI' : 'Community'}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{getItemTitle(rec)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(rec.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </CardContent>

      <AlertDialog
        open={!!recommendationToDelete}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDeleteRecommendation();
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Ta bort rekommendation
            </AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort {recommendationToDelete ? getItemTitle(recommendationToDelete) : 'denna rekommendation'} från dina sparade rekommendationer?
              Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              onClick={handleCancelDeleteRecommendation}
              disabled={isDeletingRecommendation}
            >
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              onClick={handleConfirmDeleteRecommendation}
              disabled={isDeletingRecommendation}
            >
              {isDeletingRecommendation ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          closeAddHoldingDialog();
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation?.stockInfo}
      />
    </Card>
  );
};

export default CommunityRecommendations;
