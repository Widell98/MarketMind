import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpRight,
  BarChart3,
  Brain,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Tag,
  Users,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAnalysisDetail } from '@/hooks/useAnalysisDetail';
import { useAnalysisComments } from '@/hooks/useAnalysisComments';
import { useAnalysisLikes } from '@/hooks/useAnalysisLikes';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AnalysisComments from './AnalysisComments';
import AnalysisAIChat from './AnalysisAIChat';

interface AnalysisDetailModalProps {
  analysisId: string | null;
  open: boolean;
  onClose: () => void;
}

const AnalysisDetailModal: React.FC<AnalysisDetailModalProps> = ({ analysisId, open, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: analysis, isLoading, error } = useAnalysisDetail(analysisId || '');
  const { data: comments } = useAnalysisComments(analysisId || '');
  const { likeCount, isLiked, toggleLike } = useAnalysisLikes(analysisId || '');
  const { followUser, unfollowUser, isFollowing } = useUserFollows();

  useEffect(() => {
    const updateViewCount = async () => {
      if (analysis?.id && user) {
        const { error: viewError } = await supabase
          .from('analyses')
          .update({ views_count: analysis.views_count + 1 })
          .eq('id', analysis.id);

        if (viewError) {
          console.error('Error updating view count:', viewError);
        }
      }
    };

    if (analysis && open) {
      updateViewCount();
    }
  }, [analysis?.id, analysis?.views_count, user, open]);

  const handleFollowClick = () => {
    if (!user || !analysis?.user_id) return;

    if (isFollowing(analysis.user_id)) {
      unfollowUser(analysis.user_id);
    } else {
      followUser(analysis.user_id);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'market_insight':
        return 'Marknadsinsikt';
      case 'stock_analysis':
        return 'Aktieanalys';
      case 'sector_analysis':
        return 'Sektoranalys';
      case 'portfolio_review':
        return 'Portföljgranskning';
      default:
        return 'Analys';
    }
  };

  const metaBadges = (
    <div className="flex flex-wrap gap-2 mt-2">
      <Badge variant="outline">{getAnalysisTypeLabel(analysis?.analysis_type || '')}</Badge>
      {analysis?.tags?.map((tag: string, index: number) => (
        <Badge key={index} variant="secondary" className="text-xs">
          <Tag className="w-3 h-3 mr-1" />
          {tag}
        </Badge>
      ))}
    </div>
  );

  const kpiRow = (
    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
      <div className="rounded-lg border p-3 bg-muted/40">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          Visningar
        </div>
        <div className="text-xl font-semibold mt-1">{analysis?.views_count ?? '–'}</div>
      </div>
      <button
        onClick={toggleLike}
        className={`rounded-lg border p-3 bg-muted/40 transition-colors ${
          isLiked ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-900/30' : ''
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-red-600' : ''}`} />
          Gillningar
        </div>
        <div className="text-xl font-semibold mt-1">{likeCount}</div>
      </button>
      <div className="rounded-lg border p-3 bg-muted/40">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          Kommentarer
        </div>
        <div className="text-xl font-semibold mt-1">{comments?.length ?? '–'}</div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex items-start justify-between p-6 pb-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
              {analysis?.title || 'Analys'}
              {analysis?.ai_generated && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  <Brain className="w-3 h-3 mr-1" />
                  AI
                </Badge>
              )}
            </DialogTitle>
            {analysis && (
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true, locale: sv })}
                </div>
                {analysis.profiles && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <button
                      onClick={() => navigate(`/profile/${analysis.user_id}`)}
                      className="text-primary hover:underline"
                    >
                      {analysis.profiles.display_name || analysis.profiles.username}
                    </button>
                  </div>
                )}
              </div>
            )}
            {analysis && metaBadges}
            {analysis && kpiRow}
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/analysis/${analysis?.id}`)}
              className="shrink-0"
              disabled={!analysis}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Separator />

        {isLoading || !analysis ? (
          <div className="p-6 space-y-4">
            {error ? (
              <div className="text-center text-muted-foreground">Kunde inte läsa in analysen.</div>
            ) : (
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">Analys</span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    {analysis.content}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <Brain className="w-4 h-4" />
                    AI-respons
                  </div>
                  <AnalysisAIChat analysis={analysis} />
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 font-semibold mb-3">
                    <MessageCircle className="w-4 h-4" />
                    Kommentarer
                  </div>
                  <AnalysisComments analysisId={analysis.id} />
                </div>

                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <Users className="w-4 h-4" />
                    Författare & innehav
                  </div>
                  {analysis.profiles && (
                    <div className="flex items-center justify-between rounded border p-3">
                      <div>
                        <div className="font-medium">
                          {analysis.profiles.display_name || analysis.profiles.username}
                        </div>
                        <div className="text-sm text-muted-foreground">{analysis.profiles.username}</div>
                      </div>
                      {user && analysis.user_id !== user.id && (
                        <Button
                          onClick={handleFollowClick}
                          variant={isFollowing(analysis.user_id) ? 'default' : 'outline'}
                          size="sm"
                        >
                          {isFollowing(analysis.user_id) ? 'Följer' : 'Följ'}
                        </Button>
                      )}
                    </div>
                  )}

                  {analysis.related_holdings && analysis.related_holdings.length > 0 && (
                    <div className="space-y-2">
                      {analysis.related_holdings.map((holding: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center rounded border p-2 bg-muted/40"
                        >
                          <span className="font-medium">{holding.name || holding.symbol}</span>
                          {holding.allocation && <Badge variant="outline">{holding.allocation}%</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisDetailModal;
