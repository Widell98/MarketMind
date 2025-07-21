
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  Mail, 
  Share2, 
  Calendar,
  MessageSquare,
  Filter
} from 'lucide-react';

interface ConversationExporterProps {
  conversations?: any[];
  currentSessionId?: string;
}

const ConversationExporter: React.FC<ConversationExporterProps> = ({ 
  conversations = [], 
  currentSessionId 
}) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState('pdf');
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Mock conversations data
  const mockConversations = [
    {
      id: '1',
      name: 'Portfolio Analysis Discussion',
      date: new Date('2024-01-15'),
      messageCount: 12,
      type: 'analysis'
    },
    {
      id: '2', 
      name: 'Stock Research Session',
      date: new Date('2024-01-10'),
      messageCount: 8,
      type: 'research'
    },
    {
      id: '3',
      name: 'Risk Assessment Chat',
      date: new Date('2024-01-05'),
      messageCount: 15,
      type: 'risk'
    }
  ];

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
    let filtered = mockConversations;
    
    if (dateRange !== 'all') {
      const now = new Date();
      const daysAgo = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(conv => conv.date >= cutoffDate);
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

    setIsExporting(true);

    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate export data
      const exportData = {
        conversations: selectedConversations,
        format: exportFormat,
        metadata: includeMetadata,
        analysis: includeAnalysis,
        exportDate: new Date().toISOString(),
        totalMessages: selectedConversations.reduce((total, id) => {
          const conv = mockConversations.find(c => c.id === id);
          return total + (conv?.messageCount || 0);
        }, 0)
      };

      // Mock file download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `conversations_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast({
        title: "Export slutförd",
        description: `${selectedConversations.length} konversationer exporterade som ${exportFormat.toUpperCase()}`,
      });

    } catch (error) {
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
                <SelectItem value="pdf">PDF</SelectItem>
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
                onCheckedChange={setIncludeMetadata}
              />
              <label htmlFor="metadata" className="text-xs sm:text-sm">Metadata (tidsstämplar, användarinfo)</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="analysis" 
                checked={includeAnalysis}
                onCheckedChange={setIncludeAnalysis}
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
            {filteredConversations.map((conversation) => (
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
                      {conversation.name}
                    </label>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>{conversation.date.toLocaleDateString('sv-SE')}</span>
                    <span>•</span>
                    <span>{conversation.messageCount} meddelanden</span>
                  </div>
                </div>
              </div>
            ))}
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
