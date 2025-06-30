
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, FileText, Calendar, User } from 'lucide-react';
import { useDeleteAnalysis, useAdminAnalyses } from '@/hooks/useAnalysisOperations';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type Analysis = {
  id: string;
  title: string;
  content: string;
  analysis_type: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  ai_generated?: boolean;
  profiles?: {
    username: string;
    display_name: string | null;
  };
  stock_cases?: {
    company_name: string;
    title: string;
  };
  user_portfolios?: {
    portfolio_name: string;
  };
};

const AdminAnalysesDashboard = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const deleteAnalysis = useDeleteAnalysis();
  const { fetchAllAnalyses } = useAdminAnalyses();

  const loadAnalyses = async () => {
    setLoading(true);
    const data = await fetchAllAnalyses();
    setAnalyses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleDelete = async (analysisId: string) => {
    await deleteAnalysis.mutateAsync(analysisId);
    loadAnalyses(); // Refresh the list
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      'market_insight': 'bg-purple-100 text-purple-800',
      'technical_analysis': 'bg-blue-100 text-blue-800',
      'fundamental_analysis': 'bg-green-100 text-green-800',
      'sector_analysis': 'bg-orange-100 text-orange-800',
      'portfolio_analysis': 'bg-indigo-100 text-indigo-800',
      'position_analysis': 'bg-pink-100 text-pink-800',
      'sector_deep_dive': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAnalysisTypeLabel = (type: string) => {
    const labels = {
      'market_insight': 'Marknadsinsikt',
      'technical_analysis': 'Teknisk analys',
      'fundamental_analysis': 'Fundamental analys',
      'sector_analysis': 'Sektoranalys',
      'portfolio_analysis': 'Portföljanalys',
      'position_analysis': 'Positionsanalys',
      'sector_deep_dive': 'Djupanalys sektor'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar analyser...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Hantera Analyser ({analyses.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Inga analyser hittades.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Författare</TableHead>
                  <TableHead>Kopplad till</TableHead>
                  <TableHead>Statistik</TableHead>
                  <TableHead>Skapad</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={analysis.title}>
                        {analysis.title}
                      </div>
                      {analysis.ai_generated && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          AI-genererad
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getAnalysisTypeColor(analysis.analysis_type)}>
                        {getAnalysisTypeLabel(analysis.analysis_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {analysis.profiles?.display_name || 
                           analysis.profiles?.username || 
                           'Okänd användare'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {analysis.stock_cases && (
                        <div className="text-sm text-blue-600">
                          {analysis.stock_cases.company_name}
                        </div>
                      )}
                      {analysis.user_portfolios && (
                        <div className="text-sm text-green-600">
                          {analysis.user_portfolios.portfolio_name}
                        </div>
                      )}
                      {!analysis.stock_cases && !analysis.user_portfolios && (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>👁️ {analysis.views_count}</div>
                        <div>❤️ {analysis.likes_count}</div>
                        <div>💬 {analysis.comments_count}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(analysis.created_at), { 
                          addSuffix: true, 
                          locale: sv 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteAnalysis.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort analys</AlertDialogTitle>
                            <AlertDialogDescription>
                              Är du säker på att du vill ta bort analysen "{analysis.title}"? 
                              Denna åtgärd kan inte ångras och kommer även att ta bort alla 
                              kommentarer och likes kopplade till analysen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(analysis.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAnalysesDashboard;
