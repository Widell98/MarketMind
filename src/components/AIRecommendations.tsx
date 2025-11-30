import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Loader2,
  Table as TableIcon,
  Info,
  CircleDot
} from 'lucide-react';
import RecommendationCard from '@/components/RecommendationCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/AddHoldingDialog';
import { usePersistentDialogOpenState } from '@/hooks/usePersistentDialogOpenState';
import { ADD_HOLDING_DIALOG_STORAGE_KEY } from '@/constants/storageKeys';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const AIRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    addHolding,
    deleteHolding,
    clearRecommendations,
    recommendations: aiRecommendations,
    loading: holdingsLoading
  } = useUserHoldings();
  const { toast } = useToast();
  const {
    isOpen: isAddHoldingOpen,
    open: openAddHoldingDialog,
    close: closeAddHoldingDialog,
  } = usePersistentDialogOpenState(ADD_HOLDING_DIALOG_STORAGE_KEY, 'ai-recommendations');
  const [selectedRecommendation, setSelectedRecommendation] = useState<UserHolding | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [isAllRecommendationsOpen, setIsAllRecommendationsOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearingRecommendations, setIsClearingRecommendations] = useState(false);
  const [recommendationToDelete, setRecommendationToDelete] = useState<UserHolding | null>(null);
  const [isDeletingRecommendation, setIsDeletingRecommendation] = useState(false);
  const [sortOption, setSortOption] = useState<'recommended' | 'alpha' | 'sector'>('recommended');
  const [isMobile, setIsMobile] = useState(false);
  const totalRecommendations = aiRecommendations.length;
  const sortedRecommendations = useMemo(() => {
    const recommendationsCopy = [...aiRecommendations];

    switch (sortOption) {
      case 'alpha':
        return recommendationsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'sector':
        return recommendationsCopy.sort((a, b) => (a.sector || '').localeCompare(b.sector || ''));
      case 'recommended':
      default:
        return recommendationsCopy.sort((a, b) => (b.allocation || 0) - (a.allocation || 0));
    }
  }, [aiRecommendations, sortOption]);

  const displayedRecommendations = useMemo(
    () => sortedRecommendations.slice(0, 6),
    [sortedRecommendations]
  );

  const averageAllocation = useMemo(() => {
    if (sortedRecommendations.length === 0) return 0;
    const total = sortedRecommendations.reduce((sum, rec) => sum + (rec.allocation || 0), 0);
    return Math.round(total / sortedRecommendations.length);
  }, [sortedRecommendations]);

  const sectorCount = useMemo(() => {
    const sectors = sortedRecommendations.map((rec) => rec.sector).filter(Boolean) as string[];
    return new Set(sectors).size;
  }, [sortedRecommendations]);

  const marketCount = useMemo(() => {
    const markets = sortedRecommendations.map((rec) => rec.market).filter(Boolean) as string[];
    return new Set(markets).size;
  }, [sortedRecommendations]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setViewMode('table');
    }
  }, []);

  const renderMobileDetails = (recommendation: UserHolding) => {
    const tags = buildRecommendationTags(recommendation);

    return (
      <div className="space-y-2">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[11px] rounded-full px-2 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {typeof recommendation.allocation === 'number' && (
          <div className="flex items-center gap-2 text-foreground">
            <Badge variant="secondary" className="text-[11px] rounded-full px-2 py-0">
              Föreslagen vikt
            </Badge>
            <span className="font-medium">{Math.round(recommendation.allocation)}%</span>
          </div>
        )}
        <div className="space-y-1 text-muted-foreground/90">
          {recommendation.sector && <div>Sektor: {recommendation.sector}</div>}
          {recommendation.market && <div>Marknad: {recommendation.market}</div>}
        </div>
      </div>
    );
  };

  const renderRecommendationCard = (recommendation: UserHolding) => (
    <RecommendationCard
      key={recommendation.id}
      title={recommendation.name}
      description={formatRecommendationDescription(recommendation)}
      tags={isMobile ? [] : buildRecommendationTags(recommendation)}
      isAI
      stackedActions
      descriptionClamp={isMobile ? 3 : 2}
      mobileDetails={isMobile ? renderMobileDetails(recommendation) : undefined}
      onAdd={(e) => handleAddToPortfolio(recommendation, e)}
      onDiscuss={(e) => handleDiscussWithAI(recommendation, e)}
      onDelete={(e) => handleDeleteRecommendationRequest(recommendation, e)}
      onClick={() => handleViewRecommendation(recommendation)}
    />
  );

  const renderCardCollection = (
    recommendations: UserHolding[],
    options?: { constrainHeight?: boolean }
  ) => {
    const cardWidthClass = viewMode === 'grid' ? 'min-w-[240px]' : 'min-w-[280px]';

    if (isMobile) {
      return (
        <div className="relative">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className={`snap-start ${cardWidthClass} max-w-[320px] flex-shrink-0`}
              >
                {renderRecommendationCard(recommendation)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {recommendations.map(renderRecommendationCard)}
        </div>
      );
    }

    return (
      <div
        className={`grid grid-cols-1 xl:grid-cols-2 gap-4 ${options?.constrainHeight ? 'sm:max-h-96 sm:overflow-y-auto' : ''}`}
      >
        {recommendations.map(renderRecommendationCard)}
      </div>
    );
  };

  const formatRecommendationDescription = (recommendation: UserHolding) => {
    const parts: string[] = [];
    if (recommendation.sector) {
      parts.push(`Sektor: ${recommendation.sector}`);
    }
    if (recommendation.market) {
      parts.push(`Marknad: ${recommendation.market}`);
    }
    if (typeof recommendation.allocation === 'number') {
      parts.push(`AI-förslag: ${Math.round(recommendation.allocation)}% av portföljen`);
    }
    return parts.join(' • ') || 'AI-genererad rekommendation baserad på din rådgivning.';
  };

  const buildRecommendationTags = (recommendation: UserHolding) => {
    const tags = [
      recommendation.symbol,
      recommendation.sector,
      recommendation.currency
    ].filter(Boolean) as string[];
    return Array.from(new Set(tags));
  };

  const createDiscussionPrompt = (recommendation: UserHolding) => {
    const identifier = recommendation.symbol
      ? `${recommendation.name} (${recommendation.symbol})`
      : recommendation.name;
    return `Kan du analysera ${identifier} och förklara varför den rekommenderades till min portfölj?`;
  };

  const handleViewRecommendation = (recommendation: UserHolding) => {
    navigate('/ai-chatt', {
      state: {
        createNewSession: true,
        sessionName: `AI-rekommendation: ${recommendation.name}`,
        initialMessage: createDiscussionPrompt(recommendation)
      }
    });
  };

  const handleAddToPortfolio = (recommendation: UserHolding, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att lägga till innehav",
        variant: "destructive"
      });
      return;
    }

    setSelectedRecommendation(recommendation);
    openAddHoldingDialog();
  };

  const handleDiscussWithAI = (recommendation: UserHolding, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleViewRecommendation(recommendation);
  };

  const handleDeleteRecommendationRequest = (
    recommendation: UserHolding,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    setRecommendationToDelete(recommendation);
  };

  const handleCancelDeleteRecommendation = () => {
    if (isDeletingRecommendation) return;
    setRecommendationToDelete(null);
  };

  const handleConfirmDeleteRecommendation = async () => {
    if (!recommendationToDelete) return;
    setIsDeletingRecommendation(true);
    const success = await deleteHolding(recommendationToDelete.id);
    setIsDeletingRecommendation(false);

    if (success) {
      setRecommendationToDelete(null);
    }
  };

  const handleClearAllRecommendations = async () => {
    setIsClearingRecommendations(true);
    const success = await clearRecommendations();
    setIsClearingRecommendations(false);

    if (success) {
      setIsAllRecommendationsOpen(false);
      setIsClearDialogOpen(false);
    }
  };

  const handleAddHolding = async (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addHolding(holdingData);
      toast({
        title: "Tillagt till portfölj!",
        description: `${holdingData.name} har lagts till i din portfölj`,
        variant: "default"
      });
      closeAddHoldingDialog();
      setSelectedRecommendation(null);
      return true;
    } catch (error) {
      console.error('Error adding holding:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till i portföljen. Försök igen.",
        variant: "destructive"
      });
      return false;
    }
  };
  if (!user) {
    return null;
  }
  if (holdingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Rekommenderade Innehav
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Brain className="w-4 h-4 animate-pulse" />
              <span>Laddar AI-rekommendationer...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalRecommendations === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Rekommenderade Innehav
          </CardTitle>
          <CardDescription>
            Personaliserade investeringsförslag baserade på din profil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga AI-rekommendationer tillgängliga</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Chatta med AI:n eller använd Portfolio Advisor för att få personaliserade investeringsidéer baserade på din portfölj.
            </p>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Få AI-rekommendationer
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Chatta med AI:n för att få personaliserade investeringsförslag
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/ai-chatt')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="w-4 h-4" />
                Chatta med AI
              </Button>
              <Button
                onClick={() => navigate('/portfolio-advisor')}
                variant="outline"
                className="flex items-center gap-2"
              >
                Portfolio Advisor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col items-center text-center gap-3 sm:items-start sm:text-left">
              <CardTitle className="text-xl font-semibold flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <span>AI-Rekommenderade Innehav</span>
                {totalRecommendations > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-full"
                  >
                    {totalRecommendations} rekommendationer
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed text-center sm:text-left">
                Personaliserade investeringsförslag baserade på din profil
              </CardDescription>
            </div>
            <div className="flex justify-center lg:justify-end">
              <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                    disabled={totalRecommendations === 0 || isClearingRecommendations}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Rensa alla
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      Rensa alla AI-rekommendationer
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base">
                      Är du säker på att du vill radera alla AI-rekommenderade innehav? Den här åtgärden kan inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 rounded-xl"
                      onClick={handleClearAllRecommendations}
                      disabled={isClearingRecommendations}
                    >
                      {isClearingRecommendations ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Rensa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="mt-6 hidden lg:grid grid-cols-1 xl:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-background/60 border border-border/40 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Genomsnittlig vikt</p>
                <p className="text-xl font-semibold text-foreground">{averageAllocation}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-background/60 border border-border/40 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CircleDot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Sektorspridning</p>
                <p className="text-xl font-semibold text-foreground">{sectorCount} sektorer</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-background/60 border border-border/40 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Marknadstäckning</p>
                <p className="text-xl font-semibold text-foreground">{marketCount || '–'} marknader</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-purple/10 to-primary/10 border border-primary/20 shadow-sm">
              <div>
                <p className="text-xs uppercase text-primary">Sortera</p>
                <p className="text-sm text-foreground">Välj prioritering för dina AI-tips</p>
              </div>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
                <SelectTrigger className="w-36 bg-background/80 border-border/40 text-sm">
                  <SelectValue placeholder="Sortera" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="recommended">Rekommenderad vikt</SelectItem>
                  <SelectItem value="alpha">Alfabetiskt</SelectItem>
                  <SelectItem value="sector">Sektor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {/* Header: antal och vy-val */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="text-sm text-muted-foreground font-medium text-center sm:text-left">
                {totalRecommendations} AI-rekommendationer
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="sm:hidden w-full">
                  <div className="grid grid-cols-2 bg-muted/60 rounded-full p-1 text-xs shadow-inner">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 rounded-full ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      <LayoutGrid className="h-3 w-3 mr-1" /> Kort
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 rounded-full ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      <ListIcon className="h-3 w-3 mr-1" /> Lista
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center sm:justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`rounded-full ${viewMode === 'list' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full ${viewMode === 'grid' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className={`hidden lg:inline-flex rounded-full ${viewMode === 'table' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/ai-chatt')}
                  className="w-full sm:w-auto text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium"
                >
                  Få fler <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

          {/* Grid-, list- eller tabellvy */}
          {viewMode === 'table' && !isMobile ? (
            <div className="hidden lg:block overflow-hidden rounded-2xl border border-border/30 shadow-sm">
              <div className="grid grid-cols-7 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                <span>Namn</span>
                <span>Symbol</span>
                <span>Sektor</span>
                <span>Marknad</span>
                <span className="text-right pr-4">Föreslagen vikt</span>
                <span className="text-center">AI-insikt</span>
                <span className="text-right">Åtgärder</span>
              </div>
              <div className="divide-y divide-border/30">
                {sortedRecommendations.map((recommendation) => (
                  <div
                    key={recommendation.id}
                    className="grid grid-cols-7 items-center px-4 py-4 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium text-foreground truncate">{recommendation.name}</div>
                    <div className="text-muted-foreground truncate">{recommendation.symbol || '–'}</div>
                    <div className="text-muted-foreground truncate">{recommendation.sector || '–'}</div>
                    <div className="text-muted-foreground truncate">{recommendation.market || '–'}</div>
                    <div className="text-right pr-4 font-semibold text-primary">
                      {typeof recommendation.allocation === 'number' ? `${Math.round(recommendation.allocation)}%` : '–'}
                    </div>
                    <div className="text-center">
                      <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/10">AI</Badge>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-xl"
                        onClick={(e) => handleDiscussWithAI(recommendation, e)}
                      >
                        Diskutera
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={(e) => handleAddToPortfolio(recommendation, e)}
                      >
                        Lägg till
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderCardCollection(displayedRecommendations, { constrainHeight: viewMode === 'list' })
          )}

          {/* Visa alla-knapp */}
          {totalRecommendations > 6 && (
            <Button
              variant="outline"
              className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
              onClick={() => setIsAllRecommendationsOpen(true)}
            >
              Visa alla AI-rekommendationer ({totalRecommendations})
            </Button>
          )}
        </CardContent>
      </Card>

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
              Är du säker på att du vill ta bort {recommendationToDelete?.name || 'denna'} AI-rekommendation? Denna åtgärd kan
              inte ångras.
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

      <Dialog open={isAllRecommendationsOpen} onOpenChange={setIsAllRecommendationsOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-hidden bg-card">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="w-5 h-5 text-primary" />
              Alla AI-rekommenderade innehav
            </DialogTitle>
            <DialogDescription>
              Utforska hela listan över dina sparade AI-rekommendationer.
            </DialogDescription>
          </DialogHeader>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
              <span className="text-sm text-muted-foreground text-center sm:text-left">
                {totalRecommendations} AI-rekommendationer
              </span>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="sm:hidden w-full">
                  <div className="grid grid-cols-2 bg-muted/60 rounded-full p-1 text-xs shadow-inner">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={`h-8 rounded-full ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      <LayoutGrid className="h-3 w-3 mr-1" /> Kort
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-8 rounded-full ${viewMode === 'list' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                    >
                      <ListIcon className="h-3 w-3 mr-1" /> Lista
                    </Button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center sm:justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`rounded-full ${viewMode === 'list' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full ${viewMode === 'grid' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className={`hidden lg:inline-flex rounded-full ${viewMode === 'table' ? 'text-primary bg-muted/60' : 'text-muted-foreground'}`}
                  >
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              {viewMode === 'table' && !isMobile ? (
                <div className="hidden lg:block overflow-hidden rounded-2xl border border-border/30 shadow-sm">
                  <div className="grid grid-cols-7 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                    <span>Namn</span>
                    <span>Symbol</span>
                    <span>Sektor</span>
                    <span>Marknad</span>
                    <span className="text-right pr-4">Föreslagen vikt</span>
                    <span className="text-center">AI-insikt</span>
                    <span className="text-right">Åtgärder</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {sortedRecommendations.map((recommendation) => (
                      <div
                        key={recommendation.id}
                        className="grid grid-cols-7 items-center px-4 py-4 text-sm hover:bg-muted/30 transition-colors"
                      >
                        <div className="font-medium text-foreground truncate">{recommendation.name}</div>
                        <div className="text-muted-foreground truncate">{recommendation.symbol || '–'}</div>
                        <div className="text-muted-foreground truncate">{recommendation.sector || '–'}</div>
                        <div className="text-muted-foreground truncate">{recommendation.market || '–'}</div>
                        <div className="text-right pr-4 font-semibold text-primary">
                          {typeof recommendation.allocation === 'number' ? `${Math.round(recommendation.allocation)}%` : '–'}
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/10">AI</Badge>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-xl"
                          onClick={(e) => handleDiscussWithAI(recommendation, e)}
                        >
                          Diskutera
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={(e) => handleAddToPortfolio(recommendation, e)}
                        >
                          Lägg till
                        </Button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              ) : (
                renderCardCollection(sortedRecommendations)
              )}
            </div>
        </DialogContent>
      </Dialog>

      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          closeAddHoldingDialog();
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation || undefined}
      />
    </>
  );
};

export default AIRecommendations;
