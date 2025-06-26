
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, X, TrendingUp } from 'lucide-react';
import { useCreateAnalysis } from '@/hooks/useAnalysisMutations';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/contexts/AuthContext';
import AnalysisStockCaseSelect from './AnalysisStockCaseSelect';

const CreateAnalysisDialog = () => {
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analysisType, setAnalysisType] = useState<'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis' | 'portfolio_analysis' | 'position_analysis' | 'sector_deep_dive'>('market_insight');
  const [stockCaseId, setStockCaseId] = useState<string>('no-case');
  const [includePortfolio, setIncludePortfolio] = useState(false);
  const [selectedHoldings, setSelectedHoldings] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const createAnalysis = useCreateAnalysis();

  const portfolioHoldings = activePortfolio?.recommended_stocks || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('No user found');
      return;
    }

    const relatedHoldings = includePortfolio ? 
      portfolioHoldings.filter(stock => selectedHoldings.includes(stock.symbol || stock.name)) : 
      [];

    try {
      console.log('Creating analysis with data:', {
        title,
        content,
        analysis_type: analysisType,
        stock_case_id: stockCaseId !== 'no-case' ? stockCaseId : undefined,
        portfolio_id: includePortfolio ? activePortfolio?.id : undefined,
        tags,
        related_holdings: relatedHoldings,
        is_public: true
      });

      await createAnalysis.mutateAsync({
        title,
        content,
        analysis_type: analysisType,
        stock_case_id: stockCaseId !== 'no-case' ? stockCaseId : undefined,
        portfolio_id: includePortfolio ? activePortfolio?.id : undefined,
        tags,
        related_holdings: relatedHoldings,
        is_public: true
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setAnalysisType('market_insight');
      setStockCaseId('no-case');
      setIncludePortfolio(false);
      setSelectedHoldings([]);
      setTags([]);
      setTagInput('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating analysis:', error);
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

  if (!user) {
    return (
      <Button variant="outline" disabled>
        <PlusCircle className="w-4 h-4 mr-2" />
        Logga in för att skapa analys
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <PlusCircle className="w-4 h-4 mr-2" />
          Skapa ny analys
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skapa ny analys</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ange titel för din analys..."
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
                <SelectItem value="market_insight">Marknadsinsikt</SelectItem>
                <SelectItem value="technical_analysis">Teknisk analys</SelectItem>
                <SelectItem value="fundamental_analysis">Fundamental analys</SelectItem>
                <SelectItem value="sector_analysis">Sektoranalys</SelectItem>
                <SelectItem value="portfolio_analysis">Portföljanalys</SelectItem>
                <SelectItem value="position_analysis">Positionsanalys</SelectItem>
                <SelectItem value="sector_deep_dive">Djup sektoranalys</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnalysisStockCaseSelect
            value={stockCaseId}
            onValueChange={setStockCaseId}
            disabled={createAnalysis.isPending}
          />

          {activePortfolio && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Checkbox
                id="includePortfolio"
                checked={includePortfolio}
                onCheckedChange={(checked) => setIncludePortfolio(!!checked)}
              />
              <label htmlFor="includePortfolio" className="text-sm cursor-pointer flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Koppla till min portfölj ({activePortfolio.portfolio_name})
              </label>
            </div>
          )}

          <div>
            <Label htmlFor="content">Innehåll</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din analys här..."
              rows={8}
              required
            />
          </div>

          {includePortfolio && portfolioHoldings.length > 0 && (
            <div>
              <Label>Relaterade innehav från portfölj</Label>
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

export default CreateAnalysisDialog;
