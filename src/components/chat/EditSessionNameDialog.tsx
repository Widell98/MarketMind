
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditSessionNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void;
}

const EditSessionNameDialog = ({ isOpen, onClose, currentName, onSave }: EditSessionNameDialogProps) => {
  const [newName, setNewName] = useState(currentName);

  // Reset the name when dialog opens with a new current name
  React.useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = React.useCallback(() => {
    if (newName.trim() && newName.trim() !== currentName) {
      onSave(newName.trim());
    }
    onClose();
  }, [newName, currentName, onSave, onClose]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  }, [handleSave]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ändra chattnamn</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Nytt namn</Label>
            <Input
              id="session-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ange nytt chattnamn..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={!newName.trim()}>
              Spara
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionNameDialog;
