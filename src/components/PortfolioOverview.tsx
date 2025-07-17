import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Trash2, 
  MessageSquare, 
  Plus,
  ChevronRight,
  Package,
  Building2,
  BarChart3,
  DollarSign,
  Brain,
  Lightbulb
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import UserHoldingsManager from './UserHoldingsManager';

interface PortfolioOverviewProps {
  portfolio: any;
  onQuickChat: (message: string) => void;
  onActionClick: (action: string) => void;
}

const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({ 
  portfolio, 
  onQuickChat, 
  onActionClick 
}) => {
  const { recommendations, deleteHolding } = useUserHoldings();
  const { performance } = usePortfolioPerformance();
  const { totalCash } = useCashHoldings();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteRecommendation = async (recommendationId: string, recommendationName: string) => {
    console.log(`Deleting recommendation: ${recommendationName} (${recommendationId})`);
    const success = await deleteHolding(recommendationId);
    if (success) {
      console.log('Recommendation deleted successfully');
    }
  };

  const handleDiscussRecommendation = (recommendationName: string, symbol?: string) => {
    const sessionName = `AI-rekommendation: ${recommendationName}`;
    const message = `Berätta mer om din AI-rekommendation för ${recommendationName}${symbol ? ` (${symbol})` : ''}. Varför rekommenderar du denna investering för min portfölj? Analysera företaget, dess potential och eventuella risker.`;
    
    onQuickChat(`NEW_SESSION:${sessionName}:${message}`);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portföljvärde</p>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(performance.totalPortfolioValue + totalCash)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kassaandel</p>
                <p className="text-lg font-bold text-foreground">
                  {((totalCash / (performance.totalPortfolioValue + totalCash)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI-rekommendationer</p>
                <p className="text-lg font-bold text-foreground">{recommendations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Riskprofil</p>
                <p className="text-lg font-bold text-foreground">
                  {portfolio?.risk_score ? `${portfolio.risk_score}/10` : 'Ej beräknad'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Manager */}
      <UserHoldingsManager />

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              AI-rekommenderade Innehav
            </CardTitle>
            <CardDescription>
              Smarta investeringsförslag baserade på din riskprofil och mål ({recommendations.length} st)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map(recommendation => (
              <div key={recommendation.id} className="relative bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 transition-all duration-200 hover:shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
                  {/* Rekommendation info */}
                  <div className="min-w-0 flex-1 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-purple-900 truncate">{recommendation.name}</h3>
                      {recommendation.symbol && (
                        <span className="font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0">
                          {recommendation.symbol}
                        </span>
                      )}
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
                        AI-rekommendation
                      </Badge>
                    </div>
                    <div className="text-sm text-purple-700 flex flex-wrap items-center gap-3">
                      {recommendation.quantity && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          Förslag: {recommendation.quantity} aktier
                        </span>
                      )}
                      {recommendation.purchase_price && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          Riktpris: {formatCurrency(recommendation.purchase_price)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                        {recommendation.holding_type}
                      </span>
                    </div>
                  </div>

                  {/* AI-analys kolumn */}
                  <div className="min-w-0 flex-1 lg:col-span-1">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Brain className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">AI-genererad rekommendation</span>
                      </div>
                      <div className="text-xs text-purple-700">
                        Baserad på din riskprofil och portföljmål
                      </div>
                    </div>
                  </div>

                  {/* Åtgärder */}
                  <div className="flex lg:justify-end gap-2 lg:col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 hover:border-purple-300"
                      onClick={() => handleDiscussRecommendation(recommendation.name, recommendation.symbol)}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Diskutera
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Radera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera AI-rekommendation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill radera AI-rekommendationen för <strong>{recommendation.name}</strong>? 
                            Denna åtgärd kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRecommendation(recommendation.id, recommendation.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Radera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioOverview;
