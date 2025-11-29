import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useInvestmentGoals } from '@/hooks/useInvestmentGoals';
import { useCashHoldings } from '@/hooks/useCashHoldings';
import { useUserHoldings } from '@/hooks/useUserHoldings';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useFinancialProgress } from '@/hooks/useFinancialProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  ArrowRight, 
  MessageSquare, 
  BarChart3,
  Star,
  Wallet,
  Settings,
  Building2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Bell,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Shield
} from 'lucide-react';
import { Milestones } from '@/components/goals/Milestones';

export const PersonalDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activePortfolio, loading: portfolioLoading } = usePortfolio();
  const { performance } = usePortfolioPerformance();
  const { goals, loading: goalsLoading } = useInvestmentGoals();
  const { totalCash } = useCashHoldings();
  const { actualHoldings } = useUserHoldings();
  const {
    insights,
    isLoading: insightsLoading,
    refreshInsights,
  } = useAIInsights();
  const progressData = useFinancialProgress();

  const greetingName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('common.user');
  const totalPortfolioValue = performance?.totalPortfolioValue || 0;
  const holdingsCount = actualHoldings?.length ?? 0;
  const safeTotalPortfolioValue = typeof totalPortfolioValue === 'number' && Number.isFinite(totalPortfolioValue) ? totalPortfolioValue : 0;
  const safeTotalCash = typeof totalCash === 'number' && Number.isFinite(totalCash) ? totalCash : 0;

  // Filter top goal by priority or amount
  const topGoal = useMemo(() => {
    return [...goals]
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })[0];
  }, [goals]);

  // Mock daily change data since it's not in the hook yet
  const dailyChangePercent = 1.24;
  const dailyChangeValue = safeTotalPortfolioValue * (dailyChangePercent / 100);
  const isPositive = dailyChangePercent >= 0;

  const quickActions = useMemo(() => [
    {
      icon: MessageSquare,
      title: 'Fråga AI',
      description: 'Din personliga coach',
      to: '/ai-chatt',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      icon: Wallet,
      title: 'Ny insättning',
      description: 'Logga transaktion',
      to: '/portfolio-implementation', // Should ideally be a specific modal/route
      color: 'bg-green-500/10 text-green-600 dark:text-green-400'
    },
    {
      icon: LineChart,
      title: 'Analysera',
      description: 'Hitta nästa case',
      to: '/discover',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    }
  ], []);

  // Mock health score
  const healthScore = 78;
  const healthStatus = healthScore >= 80 ? 'Utmärkt' : healthScore >= 60 ? 'God' : 'Behöver översyn';
  const healthColor = healthScore >= 80 ? 'text-emerald-600' : healthScore >= 60 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className="min-h-0 bg-background/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* 1. Personlig "Morgonkoll" */}
        <Card className="rounded-3xl border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 flex-1">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    God morgon, {greetingName}! ☀️
                  </h1>
                  <p className="text-muted-foreground mt-1 text-lg">
                    Din portfölj är <span className={isPositive ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                      {isPositive ? 'upp' : 'ner'} {Math.abs(dailyChangePercent)}%
                    </span> idag.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-white/60 dark:bg-card/60 p-3 rounded-xl backdrop-blur-sm border border-border/50">
                    <Bell className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Viktig händelse</p>
                      <p className="text-sm text-muted-foreground">Tesla (som du äger) rapporterar vinst idag kl 22:00.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/60 dark:bg-card/60 p-3 rounded-xl backdrop-blur-sm border border-border/50">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Status</p>
                      <p className="text-sm text-muted-foreground">Inga akuta åtgärder krävs. Din strategi håller.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-card/80 p-5 rounded-2xl shadow-sm border border-border/50 w-full md:w-auto min-w-[280px]">
                <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">Totalt värde</div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {safeTotalPortfolioValue.toLocaleString('sv-SE')} kr
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant={isPositive ? 'default' : 'destructive'} className="rounded-full">
                    {isPositive ? '+' : ''}{dailyChangePercent}%
                  </Badge>
                  <span className="text-muted-foreground">
                    {isPositive ? '+' : ''}{Math.round(dailyChangeValue).toLocaleString('sv-SE')} kr
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 2. Målspårning (Gamification) */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Ditt huvudmål
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/goals" className="text-primary">Visa alla mål <ArrowRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              </div>
              
              <Card className="rounded-3xl border-border/60 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {topGoal ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div>
                          <h3 className="text-xl font-bold">{topGoal.name}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Du ligger <span className="text-emerald-600 font-medium">före planen! 🚀</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Math.round((topGoal.current_amount || 0) / (topGoal.target_amount || 1) * 100)}%</p>
                          <p className="text-xs text-muted-foreground">av {topGoal.target_amount?.toLocaleString('sv-SE')} kr</p>
                        </div>
                      </div>
                      
                      <div className="relative pt-2 pb-6">
                        <Progress 
                          value={Math.min(((topGoal.current_amount || 0) / (topGoal.target_amount || 1)) * 100, 100)} 
                          className="h-3 rounded-full" 
                        />
                        <Milestones progress={Math.min(((topGoal.current_amount || 0) / (topGoal.target_amount || 1)) * 100, 100)} />
                      </div>

                      <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3 border border-border/50">
                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                          <Lightbulb className="w-5 h-5" />
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">Tips:</span> Spara 500 kr extra denna månad så når du nästa milstolpe snabbare!
                        </p>
                        <Button size="sm" variant="outline" className="ml-auto whitespace-nowrap">
                          Öka sparande
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Sätt upp ett mål för att börja din resa.</p>
                      <Button asChild>
                        <Link to="/goals">Skapa mål</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* 4. Relevant "Discover"-feed */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Utvalt för dig
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-border/60 hover:border-primary/30 transition-colors cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">Teknik</div>
                      <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">+2.4%</Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-1">Nvidia Corp</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">Liknar Microsoft som du redan äger. Stark tillväxt inom AI-sektorn.</p>
                  </CardContent>
                </Card>
                
                <Card className="rounded-2xl border-border/60 hover:border-primary/30 transition-colors cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded text-xs font-medium">Hållbarhet</div>
                      <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">+1.1%</Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-1">Vestas Wind</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">Populär i communityt just nu. Ledande inom vindkraft.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-8">
            
            {/* 3. Portföljens Hälsa */}
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Portföljhälsa
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="flex items-center justify-center py-6 relative">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        className="text-muted/20"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className={healthColor}
                        strokeWidth="10"
                        strokeDasharray={365}
                        strokeDashoffset={365 - (365 * healthScore) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="58"
                        cx="64"
                        cy="64"
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className={`text-3xl font-bold ${healthColor}`}>{healthScore}</span>
                      <span className="block text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <p className="font-medium text-lg">{healthStatus}</p>
                  <p className="text-sm text-muted-foreground">Din portfölj ser stark ut!</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Diversifiering
                    </span>
                    <span className="font-medium">Bra</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Risk
                    </span>
                    <span className="font-medium">Något hög</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Avgifter
                    </span>
                    <span className="font-medium">Låga</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-6 text-xs" asChild>
                  <Link to="/portfolio-advisor">Se detaljerad analys</Link>
                </Button>
              </CardContent>
            </Card>

            {/* 5. Snabbval */}
            <Card className="rounded-3xl border-border/60 shadow-sm bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Snabbval</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                {quickActions.map((action) => (
                  <Link 
                    key={action.title} 
                    to={action.to}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-background transition-colors border border-transparent hover:border-border/50 group"
                  >
                    <div className={`p-2.5 rounded-lg ${action.color} group-hover:scale-105 transition-transform`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 ml-auto group-hover:text-primary/50" />
                  </Link>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};
