
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X, TrendingUp } from 'lucide-react';
import { useCreateAnalysis } from '@/hooks/useAnalyses';
import { useAuth } from '@/contexts/AuthContext';

interface CreateAnalysisFromStockCaseProps {
  stockCaseId: string;
  stockCaseTitle: string;
  companyName: string;
  children?: React.ReactNode;
}

const CreateAnalysisFromStockCase = ({ stockCaseId, stockCaseTitle, companyName, children }: CreateAnalysisFromStockCaseProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [analysisType, setAnalysisType] = useState<'market_insight' | 'technical_analysis' | 'fundamental_analysis' | 'sector_analysis'>('fundamental_analysis');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const createAnalysis = useCreateAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      await createAnalysis.mutateAsync({
        title,
        content,
        analysis_type: analysisType,
        stock_case_id: stockCaseId,
        tags,
        is_public: true
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setAnalysisType('fundamental_analysis');
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

  if (!user) {
    return (
      <Button variant="outline" disabled>
        <PlusCircle className="w-4 h-4 mr-2" />
        Logga in för att skapa analys
      </Button>
    );
  }

  const defaultTrigger = (
    <Button className="bg-green-600 hover:bg-green-700 text-white">
      <TrendingUp className="w-4 h-4 mr-2" />
      Skapa analys för detta case
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skapa analys för {stockCaseTitle}</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Denna analys kommer att kopplas till aktiecaset för {companyName}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Analys av ${companyName}...`}
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
                <SelectItem value="fundamental_analysis">Fundamental analys</SelectItem>
                <SelectItem value="technical_analysis">Teknisk analys</SelectItem>
                <SelectItem value="market_insight">Marknadsinsikt</SelectItem>
                <SelectItem value="sector_analysis">Sektoranalys</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Analysinnehåll</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Skriv din analys av ${companyName} här...`}
              rows={8}
              required
            />
          </div>

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

export default CreateAnalysisFromStockCase;
