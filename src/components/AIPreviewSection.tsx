
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, Shield, Zap, BarChart3, PieChart, Activity } from 'lucide-react';

const AIPreviewSection = () => {
  const features = [
    {
      icon: Brain,
      title: "Intelligent Analys",
      description: "AI analyserar marknadstrender och ger personliga rekommendationer",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      icon: TrendingUp,
      title: "Realtidsdata",
      description: "Kontinuerlig övervakning av din portfölj och marknadsrörelser",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      icon: Target,
      title: "Målbaserade Strategier",
      description: "Skräddarsydda investeringsstrategier baserat på dina mål",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      icon: Shield,
      title: "Riskhantering",
      description: "Automatisk riskbedömning och diversifieringsförslag",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-800"
    }
  ];

  const liveMetrics = [
    { label: "Aktiva Analyser", value: "1,247", icon: Activity, trend: "+12%" },
    { label: "Portföljer Optimerade", value: "8,934", icon: PieChart, trend: "+8%" },
    { label: "AI Rekommendationer", value: "15,623", icon: Zap, trend: "+15%" },
    { label: "Framgångsgrad", value: "94.2%", icon: BarChart3, trend: "+2.1%" }
  ];

  return (
    <div id="features" className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full px-6 py-2 mb-6">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI-Powered Features</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Så hjälper AI:n dig att
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> optimera</span> din portfölj
          </h2>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Vår avancerade AI-teknologi arbetar dygnet runt för att analysera marknaden och ge dig de bästa investeringsråden
          </p>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {liveMetrics.map((metric, index) => (
            <Card key={index} className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-4 sm:p-6">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {metric.label}
                </div>
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                  {metric.trend}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`${feature.bgColor} ${feature.borderColor} border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {feature.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {index === 0 && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Marknadsanalys i realtid
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Personliga investeringsförslag
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Avancerade AI-algoritmer
                      </div>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Live prisuppdateringar
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Marknadsnotifieringar
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Prestationsrapporter
                      </div>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Målbaserad planering
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Anpassade tidsramar
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Progressuppföljning
                      </div>
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Automatisk diversifiering
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Riskvarningar
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Stresstester
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Demo Section */}
        <div className="mt-20">
          <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white border-0 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-10"></div>
            
            <CardContent className="relative p-8 sm:p-12 md:p-16">
              <div className="text-center max-w-4xl mx-auto">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-bold mb-6">
                  Redo att låta AI:n optimera din portfölj?
                </h3>
                
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Börja din resa mot smartare investeringar idag. Vår AI-rådgivare hjälper dig att fatta bättre beslut och nå dina finansiella mål snabbare.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg">
                    Starta gratis idag
                  </button>
                  <button className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300">
                    Se demo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIPreviewSection;
