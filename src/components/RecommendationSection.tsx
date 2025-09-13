import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List as ListIcon, ArrowRight } from 'lucide-react';
import RecommendationCard from '@/components/RecommendationCard';
import { Recommendation } from '@/types/recommendation';

interface RecommendationSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  recommendations: Recommendation[];
  loading?: boolean;
  loadingText?: string;
  emptyState?: React.ReactNode;
  navigateLabel?: string;
  onNavigate?: () => void;
  viewAllLabel?: string;
  onViewAll?: () => void;
  onAdd: (index: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDiscuss: (index: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (index: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onSelect: (index: number) => void;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  title,
  description,
  icon,
  recommendations,
  loading = false,
  loadingText = 'Laddar rekommendationer...',
  emptyState,
  navigateLabel,
  onNavigate,
  viewAllLabel,
  onViewAll,
  onAdd,
  onDiscuss,
  onDelete,
  onSelect
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const count = recommendations.length;

  if (loading) {
    return (
      <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              {icon}
              <span>{loadingText}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (count === 0 && emptyState) {
    return (
      <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
          <CardTitle className="text-xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2 ml-13 leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">{emptyState}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 backdrop-blur-xl border-border/20 shadow-lg rounded-3xl overflow-hidden">
      <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-purple/5 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
              {title}
              {count > 0 && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 ml-2 px-3 py-1 rounded-full"
                >
                  {count} rekommendationer
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 ml-13 leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground font-medium">
            {count} rekommendationer
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'text-primary' : 'text-muted-foreground'}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            {onNavigate && navigateLabel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigate}
                className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-xl font-medium"
              >
                {navigateLabel} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((rec, index) => (
              <RecommendationCard
                key={index}
                title={rec.title}
                description={rec.description}
                tags={rec.tags}
                isAI={rec.isAI}
                author={rec.author}
                onAdd={(e) => onAdd(index, e)}
                onDiscuss={(e) => onDiscuss(index, e)}
                onDelete={(e) => onDelete(index, e)}
                onClick={() => onSelect(index)}
              />
            ))}
          </div>
        ) : (
          <div className={`space-y-3 ${count > 5 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
            {recommendations.slice(0, 6).map((rec, index) => (
              <RecommendationCard
                key={index}
                title={rec.title}
                description={rec.description}
                tags={rec.tags}
                isAI={rec.isAI}
                author={rec.author}
                onAdd={(e) => onAdd(index, e)}
                onDiscuss={(e) => onDiscuss(index, e)}
                onDelete={(e) => onDelete(index, e)}
                onClick={() => onSelect(index)}
              />
            ))}
          </div>
        )}

        {count > 6 && onViewAll && (
          <Button
            variant="outline"
            className="w-full mt-6 rounded-xl py-3 bg-card/50 hover:bg-primary/5 text-primary hover:text-primary/80 border-primary/20 hover:border-primary/30"
            onClick={onViewAll}
          >
            {viewAllLabel || `Visa alla (${count})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationSection;
