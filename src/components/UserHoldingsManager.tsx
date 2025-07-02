import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trash2,
  Package,
  MessageSquare,
  Plus
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUserHoldings } from '@/hooks/useUserHoldings';

const UserHoldingsManager: React.FC = () => {
  const { actualHoldings, loading, deleteHolding } = useUserHoldings();
  const navigate = useNavigate();

  const handleDeleteHolding = async (holdingId: string, holdingName: string) => {
    console.log(`Deleting holding: ${holdingName} (${holdingId})`);
    const success = await deleteHolding(holdingId);
    if (success) {
      console.log('Holding deleted successfully');
    }
  };

  const handleDiscussHolding = (holdingName: string, symbol?: string) => {
    const message = `Berätta mer om ${holdingName}${symbol ? ` (${symbol})` : ''}. Vad gör företaget, vilka är deras huvudsakliga affärsområden, och varför skulle det vara en bra investering för min portfölj? Analysera också eventuella risker och möjligheter.`;
    
    // Navigate to AI chat and pre-fill the input (without sending)
    navigate('/ai-chat');
    
    // Small delay to ensure navigation is complete before dispatching event
    setTimeout(() => {
      const event = new CustomEvent('prefillChatInput', {
        detail: { message }
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Dina Nuvarande Innehav
        </CardTitle>
        <CardDescription>
          {loading 
            ? "Laddar dina innehav..."
            : actualHoldings.length > 0 
              ? `Hantera dina aktieinnehav (${actualHoldings.length} st)`
              : "Lägg till dina befintliga aktier och fonder för bättre portföljanalys"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4 animate-pulse" />
              <span>Laddar innehav...</span>
            </div>
          </div>
        ) : actualHoldings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2 text-foreground">Inga innehav registrerade</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Lägg till dina nuvarande aktier och fonder för att få en komplett bild av din portfölj och bättre AI-rekommendationer.
            </p>
            <Button className="flex items-center gap-2" onClick={() => navigate('/ai-chat')}>
              <Plus className="w-4 h-4" />
              Lägg till innehav
            </Button>
          </div>
        ) : (
          actualHoldings.map(holding => (
            <div key={holding.id} className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{holding.name}</h3>
                    {holding.symbol && (
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                        {holding.symbol}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-3">
                    {holding.quantity && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {holding.quantity} aktier
                      </span>
                    )}
                    {holding.purchase_price && (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        Köpt för {formatCurrency(holding.purchase_price)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      {holding.holding_type}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
                    onClick={() => handleDiscussHolding(holding.name, holding.symbol)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Diskutera
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Radera
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Radera innehav</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill radera <strong>{holding.name}</strong> från dina innehav? 
                          Denna åtgärd kan inte ångras.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Avbryt</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteHolding(holding.id, holding.name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Radera
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UserHoldingsManager;
