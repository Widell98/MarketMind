import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, ArrowRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import RecommendationCard from '@/components/RecommendationCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserHoldings, UserHolding } from '@/hooks/useUserHoldings';
import { useToast } from '@/hooks/use-toast';
import AddHoldingDialog from '@/components/AddHoldingDialog';

const AIRecommendations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    addHolding,
    deleteHolding,
    recommendations: aiRecommendations,
    loading: holdingsLoading
  } = useUserHoldings();
  const { toast } = useToast();
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<UserHolding | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const totalRecommendations = aiRecommendations.length;
  const displayedRecommendations = useMemo(
    () => aiRecommendations.slice(0, 6),
    [aiRecommendations]
  );

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
    navigate('/ai-chat', {
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
    setIsAddHoldingOpen(true);
  };

  const handleDiscussWithAI = (recommendation: UserHolding, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleViewRecommendation(recommendation);
  };

  const handleDeleteRecommendation = async (
    recommendation: UserHolding,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    await deleteHolding(recommendation.id);
  };

  const handleAddHolding = async (holdingData: Omit<UserHolding, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await addHolding(holdingData);
      toast({
        title: "Tillagt till portfölj!",
        description: `${holdingData.name} har lagts till i din portfölj`,
        variant: "default"
      });
      setIsAddHoldingOpen(false);
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
                onClick={() => navigate('/ai-chat')}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                AI-Rekommenderade Innehav
                {totalRecommendations > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/20 ml-2 px-3 py-1 rounded-full"
                  >
                    {totalRecommendations} rekommendationer
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2 ml-13 leading-relaxed">
                Personaliserade investeringsförslag baserade på din profil
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Header: antal och vy-val */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground font-medium">
              {totalRecommendations} AI-rekommendationer
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ai-chat')}
                className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium"
              >
                Få fler <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>

          {/* Grid- eller listvy */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayedRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  title={recommendation.name}
                  description={formatRecommendationDescription(recommendation)}
                  tags={buildRecommendationTags(recommendation)}
                  isAI
                  onAdd={(e) => handleAddToPortfolio(recommendation, e)}
                  onDiscuss={(e) => handleDiscussWithAI(recommendation, e)}
                  onDelete={(e) => handleDeleteRecommendation(recommendation, e)}
                  onClick={() => handleViewRecommendation(recommendation)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {displayedRecommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  title={recommendation.name}
                  description={formatRecommendationDescription(recommendation)}
                  tags={buildRecommendationTags(recommendation)}
                  isAI
                  onAdd={(e) => handleAddToPortfolio(recommendation, e)}
                  onDiscuss={(e) => handleDiscussWithAI(recommendation, e)}
                  onDelete={(e) => handleDeleteRecommendation(recommendation, e)}
                  onClick={() => handleViewRecommendation(recommendation)}
                />
              ))}
            </div>
          )}

          {/* Visa alla-knapp */}
          {totalRecommendations > 6 && (
            <Button
              variant="outline"
              className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
              onClick={() => navigate('/ai-chat')}
            >
              Visa alla AI-rekommendationer ({totalRecommendations})
            </Button>
          )}
        </CardContent>
      </Card>

      <AddHoldingDialog
        isOpen={isAddHoldingOpen}
        onClose={() => {
          setIsAddHoldingOpen(false);
          setSelectedRecommendation(null);
        }}
        onAdd={handleAddHolding}
        initialData={selectedRecommendation || undefined}
      />
    </>
  );
};

export default AIRecommendations;
