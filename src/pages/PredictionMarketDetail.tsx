import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { usePolymarketMarketDetail, usePolymarketMarketHistory, transformHistoryToGraphData } from "@/hooks/usePolymarket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MarketImpactAnalysis } from "@/components/MarketImpactAnalysis";

// Format volume number to display string
const formatVolume = (volumeNum: number): string => {
  if (volumeNum >= 1_000_000_000) {
    return `${(volumeNum / 1_000_000_000).toFixed(3)}`;
  } else if (volumeNum >= 1_000_000) {
    return `${(volumeNum / 1_000_000).toFixed(1)}`;
  } else if (volumeNum >= 1_000) {
    return `${(volumeNum / 1_000).toFixed(1)}`;
  }
  return volumeNum.toFixed(0);
};

const PredictionMarketDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  const { data: market, isLoading: marketLoading, error: marketError } = usePolymarketMarketDetail(slug || "");
  const { data: history, isLoading: historyLoading, error: historyError } = usePolymarketMarketHistory(market || null);

  // Transform history to graph data
  const graphData = useMemo(() => {
    if (!history) {
      console.log('PredictionMarketDetail: No history data available');
      return [];
    }
    if (!history.points || !Array.isArray(history.points) || history.points.length === 0) {
      console.log('PredictionMarketDetail: History points are empty or invalid', {
        hasPoints: !!history.points,
        isArray: Array.isArray(history.points),
        length: history.points?.length || 0,
        history,
      });
      return [];
    }
    const transformed = transformHistoryToGraphData(history);
    console.log('PredictionMarketDetail: Transformed graph data', {
      pointsCount: history.points.length,
      transformedCount: transformed.length,
      firstFew: transformed.slice(0, 3),
    });
    return transformed;
  }, [history]);

  // Generate date navigation points (simplified - based on resolution date or end date)
  const datePoints = useMemo(() => {
    if (!market) return [];
    
    const dates: string[] = ["Past"];
    
    if (market.endDate) {
      const endDate = new Date(market.endDate);
      dates.push(endDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }));
      
      // Add some future dates for navigation
      for (let i = 1; i <= 4; i++) {
        const futureDate = new Date(endDate);
        futureDate.setDate(futureDate.getDate() + i * 30);
        dates.push(futureDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric', year: futureDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined }));
      }
    } else {
      dates.push("Dec 10", "Jan 28, 2026", "Mar 18, 2026", "Apr 29, 2026");
    }
    
    return dates;
  }, [market]);

  const [selectedDate, setSelectedDate] = useState(datePoints[1] || "Dec 10");

  // Set first outcome as default selected scenario
  React.useEffect(() => {
    if (market && market.outcomes.length > 0 && !selectedScenario) {
      setSelectedScenario(market.outcomes[0].id);
    }
  }, [market, selectedScenario]);

  if (marketLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 max-w-7xl space-y-8">
          <div className="animate-pulse space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (marketError || !market) {
    return (
      <Layout>
        <div className="container mx-auto py-8 max-w-7xl">
          <Card className="p-8 border-red-500/50 bg-red-500/10">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <p>Marknaden kunde inte hittas eller laddas.</p>
            </div>
            <Button onClick={() => navigate('/predictions')} className="mt-4">
              Tillbaka till marknader
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const volumeDisplay = formatVolume(market.volumeNum || market.volume || 0);

  // Find primary outcome for display
const primaryOutcome = market.outcomes.find(o => 
    o.title.toLowerCase().includes('yes') || 
    o.title.toLowerCase() === 'yes'
  ) || market.outcomes[0];

  // ÄNDRING: Hämta priset från historiken (grafen) för att få senaste riktiga handelspriset
  const currentPrice = useMemo(() => {
    // Om vi har grafdata, ta det allra sista värdet (det är det senaste priset)
    if (graphData && graphData.length > 0) {
      return graphData[graphData.length - 1].price;
    }
    // Fallback: Använd metadatan om grafen inte laddat än
    return primaryOutcome ? Math.round(primaryOutcome.price * 100) : 0;
  }, [graphData, primaryOutcome]);

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-7xl space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/predictions')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>

        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          {market.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={market.imageUrl}
                alt={market.question}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-grow min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{market.question}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              $ {volumeDisplay}m Vol. • Polymarket
            </p>
          </div>
        </div>

        {/* Date Navigation */}
        {datePoints.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {datePoints.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDate(date)}
                className="flex-shrink-0 whitespace-nowrap"
              >
                {date}
              </Button>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Graph and Scenarios */}
          <div className="lg:col-span-2 space-y-6">
            {/* Probability Graph */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                    {primaryOutcome && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 bg-blue-500"
                        />
                        <span className="whitespace-nowrap">
                          Pris: {currentPrice}%
                        </span>
                      </div>
                    )}
                    <span className="ml-auto text-muted-foreground whitespace-nowrap">Polymarket</span>
                  </div>
                </div>
                
                {historyLoading ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : historyError ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                      <p>Kunde inte ladda historisk data</p>
                    </div>
                  </div>
                ) : graphData.length > 0 ? (
                 <div className="h-48 sm:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={graphData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        {/* Polymarket har oftast inga synliga grids */}
                        {/* <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} /> */}
                        
                        <XAxis 
                          dataKey="date" 
                          hide={true} // Polymarket döljer ofta X-axeln i miniatyrer, eller gör den väldigt diskret
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={['dataMin - 5', 'dataMax + 5']} // Dynamisk skala så kurvan fyller rutan
                          hide={true} // Dölj Y-axeln för renare look (visa bara i tooltip)
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                            padding: '8px 12px'
                          }}
                          itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                          formatter={(value: any) => [`${value}%`, 'Sannolikhet']}
                          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                        />
                        <Line
                          type="monotone" // Mjukare kurva
                          dataKey="price"
                          stroke="#10b981" // Polymarket grön (eller röd om trenden är ner)
                          strokeWidth={2}
                          dot={false} // Ta bort prickarna på linjen
                          activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <p>Historisk data är inte tillgänglig</p>
                      {market && market.outcomes && market.outcomes.length === 0 && (
                        <p className="text-xs mt-2 opacity-75">Marknaden har inga outcomes</p>
                      )}
                      {market && market.outcomes && market.outcomes.length > 0 && (
                        <p className="text-xs mt-2 opacity-75">
                          Debug: history={history ? 'exists' : 'null'}, 
                          points={history?.points?.length || 0}, 
                          graphData={graphData.length}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scenario Selection Buttons */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-4">Välj scenario</h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {market.outcomes.map((outcome) => (
                    <Button
                      key={outcome.id}
                      variant={selectedScenario === outcome.id ? "default" : "outline"}
                      onClick={() => setSelectedScenario(outcome.id)}
                      className="flex-1 min-w-[120px] sm:min-w-[140px] text-sm"
                    >
                      {outcome.title}
                      <span className="ml-2 text-xs opacity-80">
                        ({Math.round(outcome.price * 100)}%)
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analysis */}
          <div className="space-y-4 sm:space-y-6">
            {/* Market Impact Analysis */}
            <MarketImpactAnalysis market={market} />

            {/* Analysis Text Box */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Analys</span>
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {market.description || 
                    "Fed-beslut styr marknader genom att påverka värderingar och likviditet. Räntehöjningar pressar aktier och stärker USD, medan räntesänkningar gynnar tech, fastigheter och krypto. En neutral ränta tolkas positivt eller negativt beroende på tonen. De största rörelserna uppstår när Fed överraskar och marknaden snabbt måste omprissätta framtiden."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PredictionMarketDetail;

