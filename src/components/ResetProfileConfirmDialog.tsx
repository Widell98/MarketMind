
import React from 'react';
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
import { AlertTriangle } from 'lucide-react';

interface ResetProfileConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ResetProfileConfirmDialog: React.FC<ResetProfileConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Varning - Radera Riskprofil
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            <div className="space-y-3">
              <p>
                <strong>Detta kommer att permanent radera din nuvarande riskprofil och all relaterad data.</strong>
              </p>
              <p>
                Du kommer att behöva fylla i hela riskbedömningsformuläret igen från början.
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Är du säker på att du vill fortsätta?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Ja, radera profil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ResetProfileConfirmDialog;
