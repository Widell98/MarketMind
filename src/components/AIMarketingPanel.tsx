import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, TrendingUp, Target, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
const AIMarketingPanel = () => {
  return <div className="space-y-6">
      {/* AI Features Card */}
      

      {/* Upgrade Prompt */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Upplev AI-kraften</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Få tillgång till avancerade AI-funktioner för smartare investeringar
              </p>
            </div>
            <Button className="w-full rounded-xl" size="sm">
              <ArrowRight className="w-4 h-4 mr-2" />
              Kom igång
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default AIMarketingPanel;