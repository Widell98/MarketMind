
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Minus, 
  BarChart3, 
  Target,
  TrendingUp,
  RefreshCw,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface QuickActionsProps {
  portfolio: any;
  onActionComplete: (action: string, data?: any) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  portfolio, 
  onActionComplete 
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionData, setActionData] = useState<any>({});
  const { toast } = useToast();

  const handleQuickAction = async (actionType: string, data?: any) => {
    try {
      // Simulera API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Åtgärd genomförd",
        description: getActionSuccessMessage(actionType),
      });
      
      onActionComplete(actionType, data);
      setSelectedAction(null);
      setActionData({});
    } catch (error) {
      toast({
        title: "Fel",
        description: "Något gick fel. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const getActionSuccessMessage = (actionType: string) => {
    switch (actionType) {
      case 'buy': return 'Köp genomfört framgångsrikt';
      case 'sell': return 'Försäljning genomförd framgångsrikt';
      case 'rebalance': return 'Portföljen har rebalanserats';
      case 'analyze': return 'Analys startad';
      default: return 'Åtgärd genomförd';
    }
  };

  const quickActions = [
    {
      id: 'buy',
      title: 'Köp aktie',
      description: 'Lägg till nytt innehav',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'sell',
      title: 'Sälja innehav',
      description: 'Minska position',
      icon: Minus,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      id: 'rebalance',
      title: 'Rebalansera',
      description: 'Justera fördelning',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'analyze',
      title: 'Djupanalys',
      description: 'AI-analys av portfölj',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Snabbåtgärder
        </CardTitle>
        <CardDescription>
          Hantera din portfölj direkt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Dialog key={action.id}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-auto p-4 flex flex-col items-center gap-2 ${action.bgColor} border-2 hover:scale-105 transition-all duration-200`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <Icon className={`w-6 h-6 ${action.color}`} />
                    <div className="text-center">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${action.color}`} />
                      {action.title}
                    </DialogTitle>
                    <DialogDescription>
                      {getActionDialogDescription(action.id)}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {renderActionForm(action.id)}
                    
                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={() => handleQuickAction(action.id, actionData)}
                        className="flex-1"
                      >
                        Genomför
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedAction(null)}
                        className="flex-1"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
        
        {/* Portföljstatistik */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Senast uppdaterad:</span>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString('sv-SE')}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Prestanda i år:</span>
            <span className="font-medium text-green-600">+12.3%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  function getActionDialogDescription(actionId: string) {
    switch (actionId) {
      case 'buy': return 'Lägg till en ny aktie till din portfölj';
      case 'sell': return 'Sälja hela eller delar av ett befintligt innehav';
      case 'rebalance': return 'Justera fördelningen av dina innehav';
      case 'analyze': return 'Få en djupgående AI-analys av din portfölj';
      default: return '';
    }
  }

  function renderActionForm(actionId: string) {
    switch (actionId) {
      case 'buy':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="symbol">Aktiesymbol</Label>
              <Input 
                id="symbol"
                placeholder="t.ex. AAPL, TSLA"
                value={actionData.symbol || ''}
                onChange={(e) => setActionData({...actionData, symbol: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="amount">Belopp (SEK)</Label>
              <Input 
                id="amount"
                type="number"
                placeholder="10000"
                value={actionData.amount || ''}
                onChange={(e) => setActionData({...actionData, amount: e.target.value})}
              />
            </div>
          </div>
        );
      
      case 'sell':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="holding">Välj innehav</Label>
              <Select onValueChange={(value) => setActionData({...actionData, holding: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj aktie att sälja" />
                </SelectTrigger>
                <SelectContent>
                  {portfolio?.recommended_stocks?.map((stock: any, index: number) => (
                    <SelectItem key={index} value={stock.symbol || `stock-${index}`}>
                      {stock.symbol || `Aktie ${index + 1}`} - {stock.allocation}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="percentage">Procent att sälja</Label>
              <Input 
                id="percentage"
                type="number"
                placeholder="25"
                min="1"
                max="100"
                value={actionData.percentage || ''}
                onChange={(e) => setActionData({...actionData, percentage: e.target.value})}
              />
            </div>
          </div>
        );
      
      case 'rebalance':
        return (
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Automatisk rebalansering</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI:n kommer att föreslå optimal fördelning baserat på din riskprofil.
              </p>
            </div>
          </div>
        );
      
      case 'analyze':
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="analysisType">Typ av analys</Label>
              <Select onValueChange={(value) => setActionData({...actionData, analysisType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj analystyp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Riskanalys</SelectItem>
                  <SelectItem value="performance">Prestandaanalys</SelectItem>
                  <SelectItem value="diversification">Diversifieringsanalys</SelectItem>
                  <SelectItem value="complete">Komplett analys</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }
};

export default QuickActions;
