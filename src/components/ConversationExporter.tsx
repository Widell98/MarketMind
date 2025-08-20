
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileText, 
  Share2, 
  Calendar,
  MessageSquare,
  Loader2
} from 'lucide-react';

interface Conversation {
  id: string;
  session_name: string;
  created_at: string;
  messageCount?: number;
}

interface ConversationExporterProps {
  conversations?: Conversation[];
  currentSessionId?: string;
}

const ConversationExporter: React.FC<ConversationExporterProps> = ({ 
  conversations = [], 
  currentSessionId 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exportFormat, setExportFormat] = useState('json');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [availableConversations, setAvailableConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations from database
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data: sessions, error } = await supabase
          .from('ai_chat_sessions')
          .select('id, session_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get message counts for each session
        const sessionsWithCounts = await Promise.all(
          sessions.map(async (session) => {
            const { count } = await supabase
              .from('portfolio_chat_history')
              .select('*', { count: 'exact', head: true })
              .eq('chat_session_id', session.id);
            
            return {
              ...session,
              messageCount: count || 0
            };
          })
        );

        setAvailableConversations(sessionsWithCounts);
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda konversationer",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user, toast]);

  const handleConversationToggle = (conversationId: string) => {
    setSelectedConversations(prev => 
      prev.includes(conversationId)
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const selectAllConversations = () => {
    const filteredConversations = getFilteredConversations();
    setSelectedConversations(filteredConversations.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedConversations([]);
  };

  const getFilteredConversations = () => {
    let filtered = availableConversations;
    
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(conv => new Date(conv.created_at) >= cutoffDate);
    }
    
    return filtered;
  };

  const exportConversations = async () => {
    if (selectedConversations.length === 0) {
      toast({
        title: "Ingen konversation vald",
        description: "Välj minst en konversation att exportera",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Autentiseringsfel",
        description: "Du måste vara inloggad för att exportera konversationer",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Fetch conversation data with messages
      const conversationsWithMessages = await Promise.all(
        selectedConversations.map(async (sessionId) => {
          const session = availableConversations.find(c => c.id === sessionId);
          
          // Get messages for this session
          const { data: messages, error } = await supabase
            .from('portfolio_chat_history')
            .select('*')
            .eq('chat_session_id', sessionId)
            .order('created_at', { ascending: true });

          if (error) throw error;

          return {
            session: session,
            messages: messages.map(msg => ({
              role: msg.message_type,
              content: msg.message,
              timestamp: msg.created_at,
              ...(includeMetadata && {
                id: msg.id,
                context: msg.context_data,
                ...(includeAnalysis && {
                  confidence: msg.ai_confidence_score,
                  responseTime: msg.response_time_ms
                })
              })
            }))
          };
        })
      );

      // Generate export data
      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          format: exportFormat,
          totalConversations: selectedConversations.length,
          totalMessages: conversationsWithMessages.reduce((total, conv) => total + conv.messages.length, 0),
          includeMetadata,
          includeAnalysis
        },
        conversations: conversationsWithMessages
      };

      // Create and download file
      let fileContent: string;
      let mimeType: string;
      let fileExtension: string;

      switch (exportFormat) {
        case 'json':
          fileContent = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'txt':
          fileContent = conversationsWithMessages.map(conv => {
            const header = `=== ${conv.session?.session_name} ===\nSkapad: ${new Date(conv.session?.created_at || '').toLocaleString('sv-SE')}\nAntal meddelanden: ${conv.messages.length}\n\n`;
            const messages = conv.messages.map(msg => `[${msg.role.toUpperCase()}] ${new Date(msg.timestamp).toLocaleString('sv-SE')}\n${msg.content}\n`).join('\n');
            return header + messages;
          }).join('\n\n' + '='.repeat(50) + '\n\n');
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;
        case 'csv':
          const csvHeaders = ['Konversation', 'Datum', 'Roll', 'Meddelande', 'Tidsstämpel'];
          const csvRows = conversationsWithMessages.flatMap(conv =>
            conv.messages.map(msg => [
              `"${conv.session?.session_name || ''}"`,
              `"${new Date(conv.session?.created_at || '').toLocaleDateString('sv-SE')}"`,
              `"${msg.role}"`,
              `"${msg.content.replace(/"/g, '""')}"`,
              `"${new Date(msg.timestamp).toLocaleString('sv-SE')}"`
            ])
          );
          fileContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        default:
          throw new Error('Okänt exportformat');
      }
      
      const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(fileContent)}`;
      const exportFileDefaultName = `konversationer_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      toast({
        title: "Export slutförd",
        description: `${selectedConversations.length} konversationer exporterade som ${exportFormat.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export misslyckades",
        description: "Ett fel uppstod vid export av konversationer",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const shareConversations = async () => {
    if (selectedConversations.length === 0) {
      toast({
        title: "Ingen konversation vald",
        description: "Välj minst en konversation att dela",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate share link (mock)
      const shareUrl = `${window.location.origin}/shared-conversations/${selectedConversations.join(',')}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'AI Portfolio Conversations',
          text: `Se mina AI-konversationer om portföljanalys (${selectedConversations.length} st)`,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Länk kopierad",
          description: "Delningslänken har kopierats till urklipp",
        });
      }
    } catch (error) {
      toast({
        title: "Delning misslyckades",
        description: "Kunde inte dela konversationerna",
        variant: "destructive"
      });
    }
  };

  const filteredConversations = getFilteredConversations();

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
          <Download className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          <span>Exportera konversationer</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Exportera och dela dina AI-konversationer i olika format
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4 sm:space-y-6">
        {/* Export Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="txt">Textfil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Tidsperiod</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla konversationer</SelectItem>
                <SelectItem value="week">Senaste veckan</SelectItem>
                <SelectItem value="month">Senaste månaden</SelectItem>
                <SelectItem value="quarter">Senaste kvartalet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Settings */}
        <div className="space-y-3">
          <label className="text-xs sm:text-sm font-medium">Inkludera i export</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="metadata" 
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(checked === true)}
              />
              <label htmlFor="metadata" className="text-xs sm:text-sm">Metadata (tidsstämplar, användarinfo)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="analysis" 
                checked={includeAnalysis}
                onCheckedChange={(checked) => setIncludeAnalysis(checked === true)}
              />
              <label htmlFor="analysis" className="text-xs sm:text-sm">AI-analysdata och konfidenspoäng</label>
            </div>
          </div>
        </div>

        {/* Conversation Selection */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="text-xs sm:text-sm font-medium">Välj konversationer</label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllConversations}
                className="text-xs"
              >
                Markera alla
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
                className="text-xs"
              >
                Rensa
              </Button>
            </div>
          </div>

          <div className="max-h-40 sm:max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2 sm:p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Laddar konversationer...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Inga konversationer hittades
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded"
                >
                  <Checkbox 
                    id={conversation.id}
                    checked={selectedConversations.includes(conversation.id)}
                    onCheckedChange={() => handleConversationToggle(conversation.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <label htmlFor={conversation.id} className="text-xs sm:text-sm font-medium truncate cursor-pointer">
                        {conversation.session_name}
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(conversation.created_at).toLocaleDateString('sv-SE')}</span>
                      <span>•</span>
                      <span>{conversation.messageCount || 0} meddelanden</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedConversations.length > 0 && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {selectedConversations.length} konversationer valda
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            onClick={exportConversations}
            disabled={isExporting || selectedConversations.length === 0}
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Download className="w-4 h-4 mr-2 animate-pulse" />
                Exporterar...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Exportera ({selectedConversations.length})
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={shareConversations}
            disabled={selectedConversations.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Dela
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationExporter;
