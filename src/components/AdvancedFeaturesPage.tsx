
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import ConversationExporter from '@/components/ConversationExporter';
import NotificationSystem from '@/components/NotificationSystem';
import { 
  Calculator, 
  Download, 
  Bell, 
  Sparkles,
  ArrowRight 
} from 'lucide-react';

const AdvancedFeaturesPage = () => {
  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  Avancerade funktioner
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Utforska kraftfulla verktyg för djupare portföljanalys och hantering
                </p>
              </div>
            </div>

            {/* Feature Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <Card className="border border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-medium">Scenario-simulator</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Testa hur din portfölj reagerar på olika marknadsscenarier
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-green-200 dark:border-green-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-medium">Export & Delning</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exportera konversationer och analysresultat
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-orange-200 dark:border-orange-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-medium">Smart Notifikationer</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Få alerts om viktiga förändringar i din portfölj
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="simulator" className="w-full">
            <div className="w-full overflow-x-auto mb-4 sm:mb-6">
              <TabsList className="flex w-max min-w-full sm:grid sm:grid-cols-3 sm:w-full h-auto p-1">
                <TabsTrigger 
                  value="simulator" 
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 min-w-32 sm:min-w-0 flex items-center gap-2"
                >
                  <Calculator className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Scenario-simulator</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="export" 
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 min-w-32 sm:min-w-0 flex items-center gap-2"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Export & Delning</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 min-w-32 sm:min-w-0 flex items-center gap-2"
                >
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Notifikationer</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="simulator" className="focus-visible:outline-none">
              <ScenarioSimulator />
            </TabsContent>

            <TabsContent value="export" className="focus-visible:outline-none">
              <ConversationExporter />
            </TabsContent>

            <TabsContent value="notifications" className="focus-visible:outline-none">
              <NotificationSystem />
            </TabsContent>
          </Tabs>

          {/* Help Section */}
          <Card className="mt-6 sm:mt-8 border border-purple-200 dark:border-purple-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Tips för avancerade funktioner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Scenario-simulator
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Testa extrema marknadsförhållanden</li>
                    <li>• Anpassa sektorspecifika påverkningar</li>
                    <li>• Jämför olika tidsramar</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Download className="w-4 h-4 text-green-600" />
                    Export & Delning
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Spara AI-konversationer för framtida referens</li>
                    <li>• Dela insikter med finansiella rådgivare</li>
                    <li>• Exportera i olika format</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-600" />
                    Smart Notifikationer
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Anpassa varningströsklar</li>
                    <li>• Aktivera rebalanseringspåminnelser</li>
                    <li>• Få marknadsuppdateringar i realtid</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-600" />
                    Kom igång
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Börja med förberedda scenarier</li>
                    <li>• Aktivera viktiga notifikationer</li>
                    <li>• Exportera din första analys</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdvancedFeaturesPage;
