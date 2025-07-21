
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStockCase?: string;
}

const CreateAnalysisDialog: React.FC<CreateAnalysisDialogProps> = ({
  isOpen,
  onClose,
  preselectedStockCase
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [stockSymbol, setStockSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [timeHorizon, setTimeHorizon] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Fel",
        description: "Du måste vara inloggad för att skapa en analys",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !content.trim() || !stockSymbol.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i alla obligatoriska fält",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            stock_symbol: stockSymbol.trim().toUpperCase(),
            target_price: targetPrice ? parseFloat(targetPrice) : null,
            time_horizon: timeHorizon || null,
            risk_level: riskLevel || null,
            user_id: user.id,
            stock_case_id: preselectedStockCase || null
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Framgång!",
        description: "Din analys har skapats framgångsrikt",
        variant: "default"
      });

      // Reset form
      setTitle('');
      setContent('');
      setStockSymbol('');
      setTargetPrice('');
      setTimeHorizon('');
      setRiskLevel('');
      
      onClose();
      
      // Navigate to the created analysis
      if (data?.id) {
        navigate(`/analysis/${data.id}`);
      }
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast({
        title: "Fel",
        description: "Kunde inte skapa analysen. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Skapa ny analys
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Teknisk analys av Tesla Q4 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="stock-symbol">Aktiesymbol *</Label>
            <Input
              id="stock-symbol"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value)}
              placeholder="t.ex. TSLA, AAPL, MSFT"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target-price">Målpris (valfritt)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="t.ex. 250.00"
              />
            </div>

            <div>
              <Label htmlFor="time-horizon">Tidshorisont</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj tidshorisont" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kort">Kort (1-6 månader)</SelectItem>
                  <SelectItem value="medellang">Medellång (6-18 månader)</SelectItem>
                  <SelectItem value="lang">Lång (18+ månader)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="risk-level">Risknivå</Label>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Välj risknivå" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lag">Låg</SelectItem>
                <SelectItem value="medel">Medel</SelectItem>
                <SelectItem value="hog">Hög</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Analysinnehåll *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din analys här... Inkludera teknisk analys, fundamental analys, marknadsförhållanden, etc."
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa analys
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnalysisDialog;
