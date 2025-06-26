import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatePost } from '@/hooks/usePosts';
import { useStockCases } from '@/hooks/useStockCases';
import { TrendingUp, BookOpen, Brain, Sparkles, Target, Lightbulb } from 'lucide-react';

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
  const { stockCases } = useStockCases();

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
      description: 'Share personal thoughts and lessons learned',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
    },
    {
      value: 'case_analysis' as const,
      label: 'Stock Case Analysis',
      description: 'Deep dive into a specific investment case',  
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    },
    {
      value: 'market_insight' as const,
      label: 'Market Insight',
      description: 'Share market observations and predictions',
      icon: <Brain className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    }
  ];

  const selectedOption = postTypeOptions.find(option => option.value === postType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Share Your Investment Insights
              </DialogTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Connect with the community and share your knowledge
              </p>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Post Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
              What type of insight are you sharing?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {postTypeOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    postType === option.value 
                      ? `${option.bgColor} border-2 shadow-sm` 
                      : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setPostType(option.value)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                      {option.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {option.label}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stock Case Selection */}
          {postType === 'case_analysis' && stockCases && stockCases.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="stock-case" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Related Stock Case (Optional)
              </Label>
              <Select value={stockCaseId} onValueChange={setStockCaseId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose a stock case to analyze" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None - General analysis</SelectItem>
                  {stockCases.map((stockCase) => (
                    <SelectItem key={stockCase.id} value={stockCase.id}>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span>{stockCase.company_name} - {stockCase.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a compelling title that draws readers in..."
              className="h-12 text-base"
              required
            />
          </div>

          {/* Content Input */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Your Insights
            </Label>
            <div className="relative">
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your detailed analysis, thoughts, or insights here. What did you learn? What patterns did you notice? What advice would you give to fellow investors?"
                className="min-h-[200px] text-base resize-none pr-16"
                required
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {content.length}/2000
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedOption && (
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  Writing a {selectedOption.label.toLowerCase()}
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              disabled={!title.trim() || !content.trim() || createPost.isPending}
            >
              {createPost.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Publish Post
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
