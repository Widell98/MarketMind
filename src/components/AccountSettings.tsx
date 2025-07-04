
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Download, 
  Mail, 
  Key, 
  Settings, 
  AlertTriangle,
  FileText,
  Bell
} from 'lucide-react';
import DeleteAccountDialog from './DeleteAccountDialog';

const AccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Fel",
        description: "Lösenorden matchar inte",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Fel",
        description: "Lösenordet måste vara minst 6 tecken",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    // Implementation would go here
    setTimeout(() => {
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Lösenord ändrat",
        description: "Ditt lösenord har uppdaterats",
      });
    }, 1000);
  };

  const handleExportData = async () => {
    toast({
      title: "Dataexport startad",
      description: "Du kommer att få ett e-postmeddelande när exporten är klar",
    });
    // Implementation would go here
  };

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Kontoinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">E-postadress</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Konto skapat</Label>
              <div className="text-sm text-muted-foreground mt-1">
                {user?.created_at ? 
                  new Date(user.created_at).toLocaleDateString('sv-SE') : 
                  'Okänt'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Säkerhetsinställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ändra lösenord</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Input
                  type="password"
                  placeholder="Nytt lösenord"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Bekräfta lösenord"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              size="sm"
            >
              <Key className="h-4 w-4 mr-2" />
              {isChangingPassword ? 'Uppdaterar...' : 'Uppdatera lösenord'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifikationsinställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">E-postnotifikationer</div>
                <div className="text-xs text-muted-foreground">
                  Få meddelanden om viktiga uppdateringar
                </div>
              </div>
              <Button variant="outline" size="sm">
                Hantera
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Marknadsinsikter</div>
                <div className="text-xs text-muted-foreground">
                  Veckovisa AI-genererade marknadsrapporter
                </div>
              </div>
              <Button variant="outline" size="sm">
                Hantera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data & Integritet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Exportera mina data</div>
                <div className="text-xs text-muted-foreground">
                  Ladda ner all din data från plattformen
                </div>
              </div>
              <Button 
                onClick={handleExportData}
                variant="outline" 
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Riskzon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>Radera konto:</strong> Detta kommer att permanent ta bort ditt konto och all associerad data.
                  Denna åtgärd kan inte ångras.
                </p>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Radera mitt konto
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <DeleteAccountDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default AccountSettings;
