
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Trash2, Download } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [confirmationText, setConfirmationText] = useState('');
  const [understandConsequences, setUnderstandConsequences] = useState(false);
  const [wantDataExport, setWantDataExport] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedConfirmation = 'RADERA MITT KONTO';

  const handleClose = () => {
    setStep(1);
    setConfirmationText('');
    setUnderstandConsequences(false);
    setWantDataExport(false);
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleExportAndDelete = async () => {
    if (wantDataExport) {
      toast({
        title: "Dataexport startad",
        description: "Du kommer att få ett e-postmeddelande med din data innan kontot raderas",
      });
      // Implementation for data export would go here
    }
    
    setIsDeleting(true);
    
    // Simulate account deletion process
    setTimeout(() => {
      toast({
        title: "Konto raderat",
        description: "Ditt konto har markerats för radering och kommer att tas bort inom 30 dagar",
      });
      handleClose();
      setIsDeleting(false);
    }, 2000);
  };

  const canProceedToStep2 = understandConsequences;
  const canDelete = confirmationText === expectedConfirmation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Radera konto
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Förstå konsekvenserna' : 'Bekräfta radering'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Alert className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p><strong>Detta kommer att raderas permanent:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Ditt användarkonto och profil</li>
                    <li>Alla dina portföljanalyser</li>
                    <li>Skapade aktiecases och kommentarer</li>
                    <li>AI-chatthistorik</li>
                    <li>Prenumerationshistorik</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understand"
                  checked={understandConsequences}
                  onCheckedChange={setUnderstandConsequences}
                />
                <Label
                  htmlFor="understand"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Jag förstår att denna åtgärd är permanent och inte kan ångras
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="export"
                  checked={wantDataExport}
                  onCheckedChange={setWantDataExport}
                />
                <Label
                  htmlFor="export"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  Jag vill exportera mina data innan radering
                </Label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                För att bekräfta, skriv <strong>"{expectedConfirmation}"</strong> nedan:
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmation">Bekräftelsetext</Label>
              <Input
                id="confirmation"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={expectedConfirmation}
                className="font-mono"
              />
            </div>

            {wantDataExport && (
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Din dataexport kommer att skickas till {user?.email} innan kontot raderas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Avbryt
          </Button>
          
          {step === 1 && (
            <Button
              variant="destructive"
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
            >
              Fortsätt
            </Button>
          )}
          
          {step === 2 && (
            <Button
              variant="destructive"
              onClick={handleExportAndDelete}
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? 'Raderar...' : 'Radera konto permanent'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
