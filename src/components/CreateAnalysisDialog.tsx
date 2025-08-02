
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
  const [analysisType, setAnalysisType] = useState('market_insight');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

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

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen fyll i titel och innehåll",
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
            analysis_type: analysisType,
            tags: tags,
            user_id: user.id,
            is_public: true,
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
      setAnalysisType('market_insight');
      setTags([]);
      setCurrentTag('');
      
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
            Skapa ny marknadsanalys
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Marknadsutblick Q1 2024 eller Tekniska indikatorer visar..."
              required
            />
          </div>

          <div>
            <Label htmlFor="analysis-type">Analystyp</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj analystyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market_insight">Marknadsinsikt</SelectItem>
                <SelectItem value="technical_analysis">Teknisk analys</SelectItem>
                <SelectItem value="fundamental_analysis">Fundamental analys</SelectItem>
                <SelectItem value="sector_analysis">Sektoranalys</SelectItem>
                <SelectItem value="portfolio_analysis">Portföljanalys</SelectItem>
                <SelectItem value="position_analysis">Positionsanalys</SelectItem>
                <SelectItem value="sector_deep_dive">Sektordjupdykning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">Taggar</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Lägg till tagg..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="content">Analysinnehåll *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din analys här... Du kan inkludera marknadskommentarer, teknisk analys, fundamental analys, investeringsidéer, riskbedömningar, etc."
              rows={10}
              required
              className="min-h-[200px]"
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
