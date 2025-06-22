
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Brain, 
  BarChart3, 
  Clock,
  RefreshCw,
  Lightbulb,
  Target
} from 'lucide-react';
import { usePortfolioInsights } from '@/hooks/usePortfolioInsights';
import { useAIChat } from '@/hooks/useAIChat';

interface AIInsightsPanelProps {
  portfolioId?: string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ portfolioId }) => {
  const { insights, loading, unreadCount, criticalInsights, markAsRead, refetch } = usePortfolioInsights();
  const { getQuickAnalysis, isAnalyzing } = useAIChat(portfolioId);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      await getQuickAnalysis('Ge mig en omfattande marknadsanalys och insikter om min portfölj baserat på aktuella marknadsförhållanden');
      await refetch();
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <TrendingDown className="w-4 h-4 text-orange-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'news_impact': return <BarChart3 className="w-4 h-4" />;
      case 'rebalancing': return <Target className="w-4 h-4" />;
      case 'risk_warning': return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity': return <TrendingUp className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const groupedInsights = {
    critical: insights.filter(i => i.severity === 'critical'),
    actionRequired: insights.filter(i => i.action_required && i.severity !== 'critical'),
    informational: insights.filter(i => !i.action_required && i.severity !== 'critical')
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Insights - Fas 4
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Laddar AI-insikter...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Insights - Fas 4
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} nya
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateInsights}
              disabled={generatingInsights || isAnalyzing}
            >
              {generatingInsights ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Generera Insikter
            </Button>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Avancerade AI-genererade insikter om din portfölj och marknaden
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {criticalInsights.length > 0 && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Du har {criticalInsights.length} kritiska insikter som kräver omedelbar uppmärksamhet!
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Alla ({insights.length})</TabsTrigger>
            <TabsTrigger value="critical">
              Kritiska ({groupedInsights.critical.length})
            </TabsTrigger>
            <TabsTrigger value="action">
              Åtgärder ({groupedInsights.actionRequired.length})
            </TabsTrigger>
            <TabsTrigger value="info">
              Info ({groupedInsights.informational.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <ScrollArea className="h-[400px]">
              {insights.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Inga AI-insikter tillgängliga än</p>
                  <p className="text-sm">Klicka på "Generera Insikter" för att få AI-analys</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight) => (
                    <Card key={insight.id} className={`border-l-4 ${
                      insight.severity === 'critical' ? 'border-l-red-500' :
                      insight.severity === 'high' ? 'border-l-orange-500' :
                      insight.severity === 'medium' ? 'border-l-yellow-500' :
                      'border-l-blue-500'
                    } ${!insight.is_read ? 'bg-blue-50' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getInsightTypeIcon(insight.insight_type)}
                            <CardTitle className="text-sm font-medium">
                              {insight.title}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(insight.severity)}
                            <Badge variant={getSeverityColor(insight.severity) as any} className="text-xs">
                              {insight.severity}
                            </Badge>
                            {!insight.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(insight.id)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(insight.created_at).toLocaleString('sv-SE')}
                          </div>
                          {insight.action_required && (
                            <Badge variant="outline" className="text-xs">
                              Åtgärd krävs
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="critical" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {groupedInsights.critical.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightTypeIcon(insight.insight_type)}
                          <CardTitle className="text-sm font-medium">
                            {insight.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(insight.severity)}
                          <Badge variant={getSeverityColor(insight.severity) as any} className="text-xs">
                            {insight.severity}
                          </Badge>
                          {!insight.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(insight.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(insight.created_at).toLocaleString('sv-SE')}
                        </div>
                        {insight.action_required && (
                          <Badge variant="outline" className="text-xs">
                            Åtgärd krävs
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="action" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {groupedInsights.actionRequired.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightTypeIcon(insight.insight_type)}
                          <CardTitle className="text-sm font-medium">
                            {insight.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(insight.severity)}
                          <Badge variant={getSeverityColor(insight.severity) as any} className="text-xs">
                            {insight.severity}
                          </Badge>
                          {!insight.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(insight.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(insight.created_at).toLocaleString('sv-SE')}
                        </div>
                        {insight.action_required && (
                          <Badge variant="outline" className="text-xs">
                            Åtgärd krävs
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {groupedInsights.informational.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getInsightTypeIcon(insight.insight_type)}
                          <CardTitle className="text-sm font-medium">
                            {insight.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(insight.severity)}
                          <Badge variant={getSeverityColor(insight.severity) as any} className="text-xs">
                            {insight.severity}
                          </Badge>
                          {!insight.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(insight.id)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(insight.created_at).toLocaleString('sv-SE')}
                        </div>
                        {insight.action_required && (
                          <Badge variant="outline" className="text-xs">
                            Åtgärd krävs
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPanel;
