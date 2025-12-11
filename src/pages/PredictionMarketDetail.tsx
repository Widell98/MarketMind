import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { 
  usePolymarketMarketDetail, 
  usePolymarketMarketHistory, 
  transformHistoryToGraphData,
  type TimeRange 
} from "@/hooks/usePolymarket";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
  
  // State för vald tidsperiod
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const { data: market, isLoading: marketLoading, error: marketError } = usePolymarketMarketDetail(slug || "");
  
  // Skicka med vald timeRange till hooken
  const { data: history, isLoading: historyLoading, error: historyError } = usePolymarketMarketHistory(market || null, timeRange);

  // --- LOGIK & HOOKS ---

  // Transform history to graph data
  const graphData = useMemo(() => {
    if (!history) return [];
    if (!history.points || !Array.isArray(history.points) || history.points.length === 0) {
      return [];
    }
    return transformHistoryToGraphData(history);
  }, [history]);

  // Find primary outcome safely
  const primaryOutcome = useMemo(() => {
    if (!market || !market.outcomes || market.outcomes.length === 0) return null;
    return market.outcomes.find(o => 
      o.title.toLowerCase().includes('yes') || 
      o.title.toLowerCase() === 'yes'
    ) || market.outcomes[0];
  }, [market]);

  // Calculate Current Price
  const currentPrice = useMemo(() => {
    if (graphData && graphData.length > 0) {
      return graphData[graphData.length - 1].price;
    }
    return primaryOutcome ? Math.round(primaryOutcome.price * 100) : 0;
  }, [graphData, primaryOutcome]);

  // --- RENDERING ---

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* VÄNSTER KOLUMN (Huvudinnehåll) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Probability Graph */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                
                {/* Header med Pris och Tidsval på samma rad (på desktop) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-2">
                    {primaryOutcome && (
                      <>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 bg-blue-500" />
                        <span className="whitespace-nowrap font-medium text-lg text-foreground">
                          {currentPrice}%
                        </span>
                        <span className="text-muted-foreground">Sannolikhet ({primaryOutcome.title})</span>
                      </>
                    )}
                  </div>

                  {/* Time Range Selector */}
                  <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg self-start sm:self-auto">
                    {(['1h', '6h', '1d', '1w', '1m', 'all'] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`
                          px-3 py-1 text-xs font-medium rounded-md transition-all
                          ${timeRange === range 
                            ? 'bg-background text-foreground shadow-sm' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
                        `}
                      >
                        {range.toUpperCase()}
                      </button>
                    ))}
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
                        <XAxis 
                          dataKey="date" 
                          hide={true} 
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          domain={['dataMin - 2', 'dataMax + 2']} 
                          hide={true} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
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
                          type="monotone"
                          dataKey="price"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <p>Historisk data är inte tillgänglig</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Market Impact Analysis - NU HÄR (Under grafen) */}
            <MarketImpactAnalysis market={market} />
          </div>

          {/* HÖGER KOLUMN (Sidopanel) */}
          <div className="space-y-4 sm:space-y-6">
            {/* --- LÄGG TILL DENNA KNAPP HÄR --- */}
  <Button 
    className="w-full gap-2" 
    size="lg"
    onClick={() => navigate('/ai-chatt', { 
      // Valfritt: Om du vill skicka med vilken marknad det gäller till chatten
      state: { 
        context: `Jag vill diskutera prediktionsmarknaden: "${market.question}"` 
      } 
    })}
  >
    <MessageSquare className="h-4 w-4" />
    Diskutera med AI
  </Button>
            {/* Analysis Text Box (Beskrivning) */}
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
