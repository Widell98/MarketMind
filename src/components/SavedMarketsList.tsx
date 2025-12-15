import React from 'react';
import { useSavedPredictionMarkets } from '@/hooks/useSavedPredictionMarkets';
import { PredictionMarketCard } from '@/components/PredictionMarketCard';
import { Card } from '@/components/ui/card';
import { Loader2, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const SavedMarketsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savedMarkets, loading, refetch } = useSavedPredictionMarkets();

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Inloggning krävs</h3>
        <p className="text-muted-foreground mb-4">
          Du måste vara inloggad för att se dina sparade marknader.
        </p>
        <Button onClick={() => navigate('/auth')}>
          Logga in
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-muted-foreground h-8 w-8" />
      </div>
    );
  }

  if (savedMarkets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Inga sparade marknader</h3>
        <p className="text-muted-foreground">
          Du har inte sparat några marknader än. Klicka på bokmärket på en marknad för att spara den.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
      {savedMarkets.map((market) => (
        <PredictionMarketCard key={market.id} market={market} />
      ))}
    </div>
  );
};

