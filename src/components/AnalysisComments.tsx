
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAnalysisComments, useCreateAnalysisComment, useUpdateAnalysisComment, useDeleteAnalysisComment } from '@/hooks/useAnalysisComments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalysisCommentsProps {
  analysisId: string;
}

const AnalysisComments = ({ analysisId }: AnalysisCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: comments, isLoading } = useAnalysisComments(analysisId);
  const createComment = useCreateAnalysisComment();
  const updateComment = useUpdateAnalysisComment();
  const deleteComment = useDeleteAnalysisComment();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await createComment.mutateAsync({
        analysisId,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingComment(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment.mutateAsync({
        commentId,
        content: editContent.trim(),
      });
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Är du säker på att du vill radera denna kommentar?')) return;

    try {
      await deleteComment.mutateAsync(commentId);
      toast({
        title: "Kommentar raderad",
        description: "Kommentaren har raderats framgångsrikt.",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
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
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
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
        {user && (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Skriv en kommentar..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newComment.trim() || createComment.isPending}
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {createComment.isPending ? 'Skickar...' : 'Kommentera'}
              </Button>
            </div>
          </form>
        )}

        {!user && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>Logga in för att kommentera</p>
          </div>
        )}

        <div className="space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  {comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {comment.profiles?.display_name || comment.profiles?.username || 'Anonym'}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: sv })}
                  </span>
                  {comment.created_at !== comment.updated_at && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">(redigerad)</span>
                  )}
                </div>
                
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editContent.trim() || updateComment.isPending}
                      >
                        Spara
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    {user && user.id === comment.user_id && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEditComment(comment.id, comment.content)}
                          className="h-8 px-2"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Redigera
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          disabled={deleteComment.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Radera
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {comments?.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Inga kommentarer än</p>
              <p className="text-sm">Bli den första att kommentera denna analys!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisComments;
