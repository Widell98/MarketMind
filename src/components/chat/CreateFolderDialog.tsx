import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, Plus } from 'lucide-react';

interface CreateFolderDialogProps {
  onCreateFolder: (name: string, color: string) => void;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

const FOLDER_COLORS = [
  { name: 'Blå', value: '#3B82F6' },
  { name: 'Grön', value: '#10B981' },
  { name: 'Lila', value: '#8B5CF6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Röd', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
];

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({
  onCreateFolder,
  isLoading = false,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0].value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await onCreateFolder(name.trim(), selectedColor);
    setName('');
    setSelectedColor(FOLDER_COLORS[0].value);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Ny mapp
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Skapa ny mapp
          </DialogTitle>
          <DialogDescription>
            Organisera dina chattar genom att skapa mappar. Du kan flytta chattar mellan mappar senare.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Mappnamn</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Aktier, Portfölj, Marknadsanalys"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Färg</Label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-ring scale-105'
                      : 'border-transparent hover:border-muted-foreground/20'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  disabled={isLoading}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Skapar...' : 'Skapa mapp'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;