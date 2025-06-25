
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, X, Sparkles, Share2 } from 'lucide-react';
import { useCreateAnalysis } from '@/hooks/useAnalyses';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';

interface PortfolioAnalysisDialogProps {
  insightData?: {
    title: string;
    description: string;
    type: string;
    relatedHoldings?: any[];
  };
  children?: React.ReactNode;
}

const PortfolioAnalysisDialog = ({ insightData, children }: PortfolioAnalysisDialogProps) => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(insightData?.title || '');
  const [content, setContent] = useState(insightData?.description || '');
  const [analysisType, setAnalysisType] = useState<'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive'>('portfolio_analysis');
  const [selectedHoldings, setSelectedHoldings] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const createAnalysis = useCreateAnalysis();

  const portfolioHoldings = activePortfolio?.recommended_stocks || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !activePortfolio) return;

    const relatedHoldings = portfolioHoldings.filter(stock => 
      selectedHoldings.includes(stock.symbol || stock.name)
    );

    try {
      await createAnalysis.mutateAsync({
        title,
        content,
        analysis_type: analysisType,
        portfolio_id: activePortfolio.id,
        tags,
        related_holdings: relatedHoldings,
        ai_generated: !!insightData,
        is_public: true
      });
      
      setTitle('');
      setContent('');
      setAnalysisType('portfolio_analysis');
      setSelectedHoldings([]);
      setTags([]);
      setTagInput('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating portfolio analysis:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const toggleHolding = (holding: string) => {
    if (selectedHoldings.includes(holding)) {
      setSelectedHoldings(selectedHoldings.filter(h => h !== holding));
    } else {
      setSelectedHoldings([...selectedHoldings, holding]);
    }
  };

  if (!user || !activePortfolio) {
    return (
      <Button variant="outline" disabled>
        <TrendingUp className="w-4 h-4 mr-2" />
        Ingen aktiv portfölj
      </Button>
    );
  }

  const defaultTrigger = insightData ? (
    <Button variant="outline" size="sm" className="flex items-center gap-1">
      <Share2 className="w-3 h-3" />
      <Sparkles className="w-3 h-3" />
      Dela
    </Button>
  ) : (
    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
      <TrendingUp className="w-4 h-4 mr-2" />
      Portföljanalys
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            {insightData ? 'Dela AI-insikt som analys' : 'Skapa portföljanalys'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ange titel för din portföljanalys..."
              required
            />
          </div>

          <div>
            <Label htmlFor="analysisType">Typ av analys</Label>
            <Select value={analysisType} onValueChange={(value: any) => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Välj typ av analys" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portfolio_analysis">Portföljanalys</SelectItem>
                <SelectItem value="position_analysis">Positionsanalys</SelectItem>
                <SelectItem value="sector_deep_dive">Sektoranalys</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Analysinnehåll</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beskriv din analys av portföljen..."
              rows={8}
              required
            />
          </div>

          {portfolioHoldings.length > 0 && (
            <div>
              <Label>Relaterade innehav</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                {portfolioHoldings.map((stock, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`stock-${index}`}
                      checked={selectedHoldings.includes(stock.symbol || stock.name)}
                      onCheckedChange={() => toggleHolding(stock.symbol || stock.name)}
                    />
                    <label htmlFor={`stock-${index}`} className="text-sm cursor-pointer">
                      {stock.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Välj vilka innehav som är relevanta för denna analys
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="tags">Taggar</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Lägg till taggar..."
              />
              <Button type="button" onClick={addTag} variant="outline">
                Lägg till
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createAnalysis.isPending}>
              {createAnalysis.isPending ? 'Skapar...' : 'Publicera analys'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PortfolioAnalysisDialog;
