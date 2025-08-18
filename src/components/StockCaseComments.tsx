import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MessageCircle, Edit, Trash2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useStockCaseComments,
  useCreateStockCaseComment,
  useUpdateStockCaseComment,
  useDeleteStockCaseComment,
} from '@/hooks/useStockCaseComments';

interface StockCaseCommentsProps {
  stockCaseId: string;
}

const StockCaseComments: React.FC<StockCaseCommentsProps> = ({ stockCaseId }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments, isLoading } = useStockCaseComments(stockCaseId);
  const createComment = useCreateStockCaseComment();
  const updateComment = useUpdateStockCaseComment();
  const deleteComment = useDeleteStockCaseComment();

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Inloggning krävs",
        description: "Du måste vara inloggad för att kommentera",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    createComment.mutate(
      { stockCaseId, content: newComment },
      {
        onSuccess: () => {
          setNewComment('');
        },
      }
    );
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editContent.trim()) return;

    updateComment.mutate(
      { commentId, content: editContent },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditContent('');
        },
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Är du säker på att du vill ta bort denna kommentar?')) {
      deleteComment.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Kommentarer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Kommentarer ({comments?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="Skriv din kommentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || createComment.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {createComment.isPending ? 'Skickar...' : 'Skicka kommentar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Du måste vara inloggad för att kommentera
            </p>
          </div>
        )}

        {/* Comments List */}
        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            <Separator />
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.profiles?.display_name || comment.profiles?.username || 'Anonym'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                        locale: sv,
                      })}
                      {comment.updated_at !== comment.created_at && ' (redigerad)'}
                    </span>
                  </div>

                  {/* Edit/Delete buttons for comment owner */}
                  {user && comment.user_id === user.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditComment(comment.id, comment.content)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editContent.trim() || updateComment.isPending}
                      >
                        {updateComment.isPending ? 'Sparar...' : 'Spara'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditContent('');
                        }}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                <Separator />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Vad tycker du om detta case?
              </p>
              <p className="text-muted-foreground">
                Diskutera här! Var den första att dela dina tankar.
              </p>
            </div>
            {!user && (
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Logga in för att kommentera
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockCaseComments;