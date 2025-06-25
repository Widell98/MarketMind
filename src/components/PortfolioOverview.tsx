
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  TrendingDown, 
  Shield,
  Target,
  ChevronRight,
  Lightbulb,
  Star,
  AlertTriangle
} from 'lucide-react';

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
  const [marketMood, setMarketMood] = useState<'calm' | 'volatile' | 'bearish'>('calm');
  
  // Simple portfolio health calculation
  const getPortfolioMood = () => {
    const riskScore = portfolio?.risk_score || 5;
    const expectedReturn = portfolio?.expected_return || 0;
    
    if (riskScore <= 4 && expectedReturn >= 6) return { mood: 'good', color: 'green', message: 'Din portfölj mår bra' };
    if (riskScore <= 7 && expectedReturn >= 3) return { mood: 'okay', color: 'yellow', message: 'Din portfölj är stabil' };
    return { mood: 'needs-attention', color: 'orange', message: 'Din portfölj behöver lite uppmärksamhet' };
  };

  const portfolioMood = getPortfolioMood();
  
  const quickChatOptions = [
    { text: "Hur mår min portfölj just nu?", icon: Heart },
    { text: "Vad händer på marknaden idag?", icon: TrendingUp },
    { text: "Borde jag vara orolig för något?", icon: Shield },
    { text: "Vad ska jag göra nu?", icon: Target }
  ];

  const suggestedActions = [
    {
      type: 'rebalance',
      title: 'Överväg ombalansering',
      description: 'Din tech-exponering är lite hög',
      priority: 'medium',
      action: () => onActionClick('rebalance')
    },
    {
      type: 'opportunity',
      title: 'Intressant möjlighet',
      description: 'Hälsovårdssektorn ser lovande ut',
      priority: 'low',
      action: () => onActionClick('opportunity')
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Portfolio Mood Card */}
      <Card className={`border-l-4 ${
        portfolioMood.color === 'green' ? 'border-l-green-500 bg-green-50/50' :
        portfolioMood.color === 'yellow' ? 'border-l-yellow-500 bg-yellow-50/50' :
        'border-l-orange-500 bg-orange-50/50'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className={`w-5 h-5 ${
                portfolioMood.color === 'green' ? 'text-green-600' :
                portfolioMood.color === 'yellow' ? 'text-yellow-600' :
                'text-orange-600'
              }`} />
              {portfolioMood.message}
            </CardTitle>
            <Badge variant={portfolioMood.mood === 'good' ? 'default' : 'secondary'}>
              {portfolio?.total_value?.toLocaleString() || '0'} SEK
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>{portfolio?.recommended_stocks?.length || 0} innehav</span>
            <span>Förväntad avkastning: {portfolio?.expected_return || 0}%</span>
          </div>
          
          {marketMood === 'volatile' && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Marknaderna är lite volatila idag. Kom ihåg dina långsiktiga mål! 💪
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onQuickChat("Berätta mer detaljerat om hur min portfölj mår och vad jag borde tänka på")}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Prata med din AI-rådgivare
          </Button>
        </CardContent>
      </Card>

      {/* Quick Chat Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Snabba frågor</CardTitle>
          <CardDescription className="text-sm">
            Klicka för att få snabba svar från din AI-rådgivare
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickChatOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => onQuickChat(option.text)}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{option.text}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Föreslagna åtgärder
            </CardTitle>
            <CardDescription className="text-sm">
              Baserat på din portfölj och marknadsläget
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {suggestedActions.map((action, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={action.priority === 'high' ? 'destructive' : 
                               action.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {action.priority === 'high' ? 'Viktigt' : 
                       action.priority === 'medium' ? 'Rekommenderat' : 'Tips'}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={action.action}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortfolioOverview;
