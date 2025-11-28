import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePortfolios } from '@/hooks/usePortfolios';
import { Portfolio } from '@/hooks/usePortfolio';
import PortfolioSummaryView from '@/components/PortfolioSummaryView';
import {
  Briefcase,
  Calendar,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useState } from 'react';

interface SavedPortfoliosSectionProps {
  onViewPortfolio?: (portfolio: Portfolio) => void;
}

const SavedPortfoliosSection = ({ onViewPortfolio }: SavedPortfoliosSectionProps) => {
  const { portfolios, loading } = usePortfolios();
  const navigate = useNavigate();
  const [expandedPortfolioId, setExpandedPortfolioId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: sv });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card className="border rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            Senaste Portföljgenerering / Analys
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
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            Senaste Portföljgenerering / Analys
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
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          Senaste Portföljgenerering / Analys
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                <div className="p-6 border rounded-xl hover:shadow-md transition-shadow bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {portfolio.portfolio_name}
                        </h3>
                        {portfolio.portfolio_name === 'Portföljsammanfattning gjord av AI' ? (
                          <Badge variant="secondary" className="text-xs">
                            Analys
                          </Badge>
                        ) : portfolio.is_active ? (
                          <Badge variant="default" className="text-xs">
                            Aktiv
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(portfolio.created_at)}
                        </div>
                        {stockCount > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {stockCount} rekommendation{stockCount !== 1 ? 'er' : ''}
                          </div>
                        )}
                        {portfolio.risk_score && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Risk: {portfolio.risk_score}/10
                          </div>
                        )}
                      </div>
                      {summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {typeof summary === 'string' ? summary : JSON.stringify(summary)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {recommendedStocks.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Rekommendationer:</p>
                      <div className="flex flex-wrap gap-2">
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
                    className="w-full sm:w-auto"
                  >
                    {expandedPortfolioId === portfolio.id ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Dölj sammanfattning
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Visa sammanfattning
                      </>
                    )}
                  </Button>

                  {/* Full portfolio summary */}
                  {expandedPortfolioId === portfolio.id && (
                    <div className="mt-6 pt-6 border-t border-border">
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
