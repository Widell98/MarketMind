
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Activity, Target, TrendingUp } from 'lucide-react';

interface ModernPortfolioHeaderProps {
  activePortfolio: any;
}

const ModernPortfolioHeader: React.FC<ModernPortfolioHeaderProps> = ({ activePortfolio }) => {
  return (
    <div className="relative mb-8">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-3xl -z-10" />
      
      <Card className="border-0 bg-white/80 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Icon and Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AI Portfolio Hub
                </h1>
                <p className="text-muted-foreground mt-1">
                  Intelligenta investeringsinsikter för din framgång
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 lg:ml-8">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Aktiv
                </Badge>
              </div>

              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Rekommendationer</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {activePortfolio?.recommended_stocks?.length || 0}
                </span>
              </div>

              <div className="text-center lg:text-left col-span-2 lg:col-span-1">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Sedan</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {activePortfolio ? new Date(activePortfolio.created_at).toLocaleDateString('sv-SE') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernPortfolioHeader;
