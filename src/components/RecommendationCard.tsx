import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Brain, User, Tag, ShoppingCart, MessageCircle, Trash2 } from 'lucide-react';

interface RecommendationCardProps {
  title: string;
  description: string;
  tags?: string[];
  isAI: boolean;
  author?: string;
  onAdd: (e: React.MouseEvent) => void;
  onDiscuss: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  description,
  tags = [],
  isAI,
  author,
  onAdd,
  onDiscuss,
  onDelete,
  onClick
}) => {
  return (
    <div
      className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/30"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-primary flex-shrink-0" />
            <h4 className="font-medium text-sm truncate">{title}</h4>
            <Badge
              variant={isAI ? 'secondary' : 'outline'}
              className={`text-xs ${isAI ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
            >
              {isAI ? <Brain className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
              {isAI ? 'AI' : 'Community'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{description}</p>

          {author && (
            <p className="text-xs text-muted-foreground mb-2">Av: {author}</p>
          )}

          {tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mb-2">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-border/50 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="text-xs w-full sm:flex-1"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Lägg till i portfölj
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscuss}
              className="text-xs w-full sm:flex-1"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Diskutera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs w-full sm:w-auto"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;

