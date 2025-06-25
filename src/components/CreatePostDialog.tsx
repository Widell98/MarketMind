
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreatePost } from '@/hooks/usePosts';
import { useStockCases } from '@/hooks/useStockCases';
import { TrendingUp, BookOpen, Brain } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ open, onOpenChange }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'reflection' | 'case_analysis' | 'market_insight'>('reflection');
  const [stockCaseId, setStockCaseId] = useState<string>('');
  
  const createPost = useCreatePost();
  const { data: stockCases } = useStockCases();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    createPost.mutate({
      title: title.trim(),
      content: content.trim(),
      post_type: postType,
      stock_case_id: stockCaseId || undefined,
    });

    // Reset form
    setTitle('');
    setContent('');
    setPostType('reflection');
    setStockCaseId('');
    onOpenChange(false);
  };

  const postTypeOptions = [
    {
      value: 'reflection' as const,
      label: 'Investment Reflection',
      description: 'Share your thoughts on investing',
      icon: <BookOpen className="w-4 h-4" />
    },
    {
      value: 'case_analysis' as const,
      label: 'Stock Case Analysis',
      description: 'Analyze a specific stock case',  
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      value: 'market_insight' as const,
      label: 'Market Insight',
      description: 'Share market observations',
      icon: <Brain className="w-4 h-4" />
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Share Your Investment Insights</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select post type" />
              </SelectTrigger>
              <SelectContent>
                {postTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {postType === 'case_analysis' && stockCases && stockCases.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="stock-case">Related Stock Case (Optional)</Label>
              <Select value={stockCaseId} onValueChange={setStockCaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a stock case" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {stockCases.map((stockCase) => (
                    <SelectItem key={stockCase.id} value={stockCase.id}>
                      {stockCase.company_name} - {stockCase.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a compelling title..."
              className="text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your investment insights, analysis, or reflections..."
              className="min-h-[200px] text-base resize-none"
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {content.length}/2000 characters
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!title.trim() || !content.trim() || createPost.isPending}
            >
              {createPost.isPending ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
