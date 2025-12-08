import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolios } from '@/hooks/usePortfolios';
import { Portfolio, usePortfolio } from '@/hooks/usePortfolio';
import { useRiskProfile } from '@/hooks/useRiskProfile';
import PortfolioSummaryView from '@/components/PortfolioSummaryView';
import {
  Briefcase,
  Calendar,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SavedPortfoliosSectionProps {
  onViewPortfolio?: (portfolio: Portfolio) => void;
}

const SavedPortfoliosSection = ({ onViewPortfolio }: SavedPortfoliosSectionProps) => {
  const { portfolios, loading, refetch } = usePortfolios();
  const { riskProfile, loading: riskProfileLoading } = useRiskProfile();
  const { generatePortfolio, loading: portfolioGenerating } = usePortfolio();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [expandedPortfolioId, setExpandedPortfolioId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: sv });
    } catch {
      return dateString;
    }
  };

  const handleGenerateNewPortfolio = async () => {
    if (!riskProfile || !riskProfile.id) {
      toast({
        title: 'Riskprofil saknas',
        description: 'Du behöver en riskprofil för att generera en portfölj. Skapa en riskprofil först.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generatePortfolio(riskProfile.id);
      
      // Refetch portfolios to show the new one
      await refetch();
      
      toast({
        title: 'Portfölj genererad',
        description: 'Din nya portfölj har skapats och visas nu.',
      });
    } catch (error: any) {
      console.error('Error generating portfolio:', error);
      toast({
        title: 'Fel vid generering',
        description: error?.message || 'Kunde inte generera portfölj. Försök igen senare.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center justify-between gap-3 text-xl font-semibold">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-sm sm:text-base md:text-xl">Senaste Portföljgenerering / Analys</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Laddar portföljer...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolios.length === 0) {
    return (
      <Card className="border rounded-xl shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center justify-between gap-3 text-xl font-semibold">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-sm sm:text-base md:text-xl">Senaste Portföljgenerering / Analys</span>
            </div>
            <Button
              onClick={handleGenerateNewPortfolio}
              disabled={isGenerating || !riskProfile || !riskProfile.id || riskProfileLoading}
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 transition-all duration-200"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden sm:inline">Genererar...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Generera ny portfölj</span>
                  <span className="sm:hidden">Ny</span>
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Ingen portfölj genererad än</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              När du genererar en portfölj via Portfolio Advisor kommer den att sparas här så att du kan gå tillbaka och granska den senare.
            </p>
            <Button
              onClick={() => navigate('/portfolio-advisor')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Generera portfölj
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center justify-between gap-2 sm:gap-3 text-lg sm:text-xl font-semibold">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <span className="text-sm sm:text-base md:text-xl">Senaste Portföljgenerering / Analys</span>
          </div>
          <Button
            onClick={handleGenerateNewPortfolio}
            disabled={isGenerating || portfolioGenerating || !riskProfile || !riskProfile.id || riskProfileLoading || loading}
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating || portfolioGenerating ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Genererar...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Generera ny portfölj</span>
                <span className="sm:hidden">Ny</span>
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {portfolios.length > 0 ? (
          <div>
            {(() => {
              const portfolio = portfolios[0];
              const structuredPlan = portfolio.asset_allocation?.structured_plan;
              
              // Extract summary from structured plan
              const summary = structuredPlan?.action_summary || structuredPlan?.summary || 
                             'AI-genererad portfölj';

              const recommendedStocks = portfolio.recommended_stocks || [];
              const stockCount = recommendedStocks.length;

              return (
                <div className="p-4 sm:p-6 border rounded-xl hover:shadow-md transition-shadow bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">
                          {portfolio.portfolio_name}
                        </h3>
                        {portfolio.portfolio_name === 'Portföljsammanfattning gjord av AI' ? (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            Analys
                          </Badge>
                        ) : portfolio.is_active ? (
                          <Badge variant="default" className="text-xs flex-shrink-0">
                            Aktiv
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{formatDate(portfolio.created_at)}</span>
                        </div>
                        {stockCount > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">{stockCount} rekommendation{stockCount !== 1 ? 'er' : ''}</span>
                          </div>
                        )}
                        {portfolio.risk_score && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">Risk: {portfolio.risk_score}/10</span>
                          </div>
                        )}
                      </div>
                      {summary && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-4">
                          {typeof summary === 'string' ? summary : JSON.stringify(summary)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {recommendedStocks.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Rekommendationer:</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {recommendedStocks.slice(0, 5).map((stock: any, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {stock.name || stock.symbol}
                            {stock.allocation && ` (${stock.allocation}%)`}
                          </Badge>
                        ))}
                        {recommendedStocks.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{recommendedStocks.length - 5} fler
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (expandedPortfolioId === portfolio.id) {
                        setExpandedPortfolioId(null);
                      } else {
                        setExpandedPortfolioId(portfolio.id);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {expandedPortfolioId === portfolio.id ? (
                      <>
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Dölj sammanfattning
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Visa sammanfattning
                      </>
                    )}
                  </Button>

                  {/* Full portfolio summary */}
                  {expandedPortfolioId === portfolio.id && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                      <PortfolioSummaryView portfolio={portfolio} />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SavedPortfoliosSection;
