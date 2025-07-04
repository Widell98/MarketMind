
import React, { useState } from 'react';
import { AlertTriangle, Trash2, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountDialog = ({ isOpen, onClose }: DeleteAccountDialogProps) => {
  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [wantDataExport, setWantDataExport] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const handleClose = () => {
    setStep(1);
    setConfirmationText('');
    setUnderstandConsequences(false);
    setWantDataExport(false);
    onClose();
  };

  const handleDataExport = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Fetch all user data
      const [profileResult, holdingsResult, portfoliosResult, analysesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id),
        supabase.from('user_holdings').select('*').eq('user_id', user.id),
        supabase.from('user_portfolios').select('*').eq('user_id', user.id),
        supabase.from('analyses').select('*').eq('user_id', user.id)
      ]);

      const userData = {
        profile: profileResult.data,
        holdings: holdingsResult.data,
        portfolios: portfoliosResult.data,
        analyses: analysesResult.data,
        exportDate: new Date().toISOString()
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `min-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exporterad",
        description: "Din data har laddats ner som JSON-fil",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Exportfel",
        description: "Kunde inte exportera din data. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmationText !== 'RADERA MITT KONTO') return;
    
    setIsDeleting(true);
    try {
      // Mark account for deletion (soft delete with 30-day grace period)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          deletion_requested: true 
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Konto markerat för radering",
        description: "Ditt konto kommer att raderas permanent om 30 dagar. Du kan återaktivera det genom att logga in innan dess.",
      });

      await signOut();
      handleClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Raderingsfel",
        description: "Kunde inte radera kontot. Försök igen eller kontakta support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canProceedToStep2 = understandConsequences && (!wantDataExport || step > 1);
  const canDeleteAccount = confirmationText === 'RADERA MITT KONTO' && understandConsequences;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <AlertDialogTitle>
              {step === 1 ? 'Radera konto' : 'Bekräfta radering'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div>
              {step === 1 ? (
                <div className="space-y-4">
                  <p>Detta kommer att radera ditt konto permanent efter 30 dagar. Följande data kommer att förloras:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Din profil och inställningar</li>
                    <li>Alla dina portföljanalyser</li>
                    <li>Dina aktiecases och kommentarer</li>
                    <li>AI-chatthistorik och rekommendationer</li>
                    <li>Prenumerationsdata</li>
                  </ul>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="understand"
                        checked={understandConsequences}
                        onCheckedChange={(checked) => setUnderstandConsequences(checked === true)}
                      />
                      <Label htmlFor="understand" className="text-sm">
                        Jag förstår konsekvenserna av att radera mitt konto
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="export"
                        checked={wantDataExport}
                        onCheckedChange={(checked) => setWantDataExport(checked === true)}
                      />
                      <Label htmlFor="export" className="text-sm">
                        Jag vill exportera min data först
                      </Label>
                    </div>
                  </div>
                  
                  {wantDataExport && (
                    <Button
                      onClick={handleDataExport}
                      disabled={isExporting}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporterar...' : 'Exportera min data'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-destructive font-medium">
                    Detta är ditt sista steg. Skriv "RADERA MITT KONTO" för att bekräfta.
                  </p>
                  <Input
                    placeholder="Skriv: RADERA MITT KONTO"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>
            Avbryt
          </AlertDialogCancel>
          
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              variant="destructive"
            >
              Fortsätt
            </Button>
          ) : (
            <AlertDialogAction asChild>
              <Button
                onClick={handleDeleteAccount}
                disabled={!canDeleteAccount || isDeleting}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Raderar...' : 'Radera konto permanent'}
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
