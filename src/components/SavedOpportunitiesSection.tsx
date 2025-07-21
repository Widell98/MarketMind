import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bookmark, Tag, MessageCircle, Plus, X, Filter } from 'lucide-react';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const SavedOpportunitiesSection = () => {
  const { savedItems, loading, removeOpportunity, updateTags } = useSavedOpportunities();
  const [filterTag, setFilterTag] = useState('');
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const navigate = useNavigate();

  const filteredItems = filterTag 
    ? savedItems.filter(item => item.tags.includes(filterTag))
    : savedItems;

  const allTags = Array.from(new Set(savedItems.flatMap(item => item.tags)));

  const handleItemClick = (item: any) => {
    if (item.item_type === 'stock_case') {
      navigate(`/stock-cases/${item.item_id}`);
    } else {
      navigate(`/analysis/${item.item_id}`);
    }
  };

  const handleDiscussWithAI = (item: any) => {
    const contextData = {
      type: item.item_type,
      id: item.item_id,
      title: item.item_type === 'stock_case' ? item.stock_cases?.title : item.analyses?.title,
      notes: item.notes
    };
    navigate('/ai-chat', { state: { contextData } });
  };

  const handleAddTag = async (itemId: string, currentTags: string[]) => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      await updateTags(itemId, [...currentTags, newTag.trim()]);
      setNewTag('');
      setEditingTags(null);
    }
  };

  const handleRemoveTag = async (itemId: string, currentTags: string[], tagToRemove: string) => {
    await updateTags(itemId, currentTags.filter(tag => tag !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (savedItems.length === 0) {
    return (
      <Card className="text-center py-8 bg-gray-50 dark:bg-gray-800">
        <CardContent className="pt-4">
          <Bookmark className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
          <CardTitle className="text-lg mb-2">Inga sparade möjligheter än</CardTitle>
          <p className="text-sm text-muted-foreground mb-4">
            Börja spara intressanta aktiefall och analyser för att bygga din personliga samling.
          </p>
          <Button onClick={() => navigate('/stock-cases')} variant="outline">
            Upptäck möjligheter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">Sparade Möjligheter</h2>
          <Badge variant="secondary">{savedItems.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <select 
            className="text-sm border rounded px-2 py-1"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="">Alla taggar</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const data = item.item_type === 'stock_case' ? item.stock_cases : item.analyses;
          
          return (
            <Card key={item.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs mb-2 ${
                        item.item_type === 'stock_case' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}
                    >
                      {item.item_type === 'stock_case' ? 'Aktiefall' : 'Analys'}
                    </Badge>
                    <CardTitle 
                      className="text-base cursor-pointer hover:text-primary line-clamp-2"
                      onClick={() => handleItemClick(item)}
                    >
                      {data?.title || data?.company_name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOpportunity(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {item.notes && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.notes}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => setFilterTag(tag)}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-auto p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(item.id, item.tags, tag);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                  
                  {editingTags === item.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        size="sm"
                        placeholder="Ny tagg"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag(item.id, item.tags)}
                        className="h-6 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddTag(item.id, item.tags)}
                        className="h-6 px-2"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTags(item.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Tagg
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Sparad {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: sv })}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDiscussWithAI(item)}
                      className="text-purple-600 hover:text-purple-700 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Diskutera med AI
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SavedOpportunitiesSection;
