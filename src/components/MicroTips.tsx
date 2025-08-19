import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface MicroTipsProps {
  userContext?: string;
}

const MicroTips: React.FC<MicroTipsProps> = ({ userContext }) => {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-microtips', {
        body: { userContext }
      });

      if (error) throw error;
      if (data?.tip) {
        setTip(data.tip);
      }
    } catch (error) {
      console.error('Error fetching tip:', error);
      setTip('Prova att lägga till obligationer för extra trygghet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <Card className="bg-primary/5 border-primary/20 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">💡 Dagens tips</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTip}
              disabled={loading}
              className="h-6 w-6 p-0 text-primary/60 hover:text-primary"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Genererar tips...' : tip}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MicroTips;