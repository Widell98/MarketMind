
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, AlertCircle, Camera, Upload } from "lucide-react";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  userId: string;
  profileData?: any;
  onSaved?: (newName: string) => void;
};

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  userId,
  profileData,
  onSaved,
}) => {
  const [displayName, setDisplayName] = useState(currentName || "");
  const [bio, setBio] = useState(profileData?.bio || "");
  const [location, setLocation] = useState(profileData?.location || "");
  const [avatarUrl, setAvatarUrl] = useState(profileData?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setDisplayName(currentName || "");
      setBio(profileData?.bio || "");
      setLocation(profileData?.location || "");
      setAvatarUrl(profileData?.avatar_url || "");
      setError("");
    }
  }, [open, currentName, profileData]);

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Visningsnamn krävs";
    }
    
    if (trimmedName.length < 2) {
      return "Visningsnamnet måste vara minst 2 tecken långt";
    }
    
    if (trimmedName.length > 32) {
      return "Visningsnamnet måste vara mindre än 32 tecken";
    }
    
    const validNameRegex = /^[a-zA-ZåäöÅÄÖ0-9\s\-_.]+$/;
    if (!validNameRegex.test(trimmedName)) {
      return "Visningsnamnet kan bara innehålla bokstäver, siffror, mellanslag, bindestreck, punkter och understreck";
    }
    
    return null;
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ogiltig filtyp",
        description: "Vänligen välj en bildfil.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Filen är för stor",
        description: "Profilbilden får vara max 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('stock-cases')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stock-cases')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      toast({
        title: "Framgång!",
        description: "Profilbilden har laddats upp.",
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Uppladdning misslyckades",
        description: error.message || "Kunde inte ladda upp profilbilden.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateName(displayName);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmedName = displayName.trim();
    const trimmedBio = bio.trim();
    const trimmedLocation = location.trim();
    
    setSaving(true);
    setError("");

    try {
      // Check if the name is already taken (ignore current user)
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("display_name", trimmedName)
        .neq("id", userId)
        .maybeSingle();

      if (checkError) {
        throw new Error("Kunde inte validera namnets tillgänglighet");
      }

      if (existingUser) {
        setError("Detta visningsnamn är redan taget. Vänligen välj ett annat.");
        setSaving(false);
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          display_name: trimmedName,
          bio: trimmedBio || null,
          location: trimmedLocation || null,
          avatar_url: avatarUrl || null
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      toast({ 
        title: "Framgång!", 
        description: "Din profil har uppdaterats.",
        variant: "default"
      });
      
      onSaved?.(trimmedName);
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Kunde inte uppdatera profilen. Försök igen.");
      toast({ 
        title: "Uppdatering misslyckades", 
        description: "Det gick inte att uppdatera din profil.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md rounded-lg border shadow-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-finance-navy dark:text-gray-200 flex items-center gap-2">
              <User className="h-5 w-5" />
              Redigera profil
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-700">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Laddar upp...' : 'Ändra profilbild'}
              </Button>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Visningsnamn
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Ditt visningsnamn"
                maxLength={32}
                className={`bg-background ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={saving}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2-32 tecken</span>
                <span>{displayName.length}/32</span>
              </div>
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Om mig
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Berätta lite om dig själv..."
                maxLength={300}
                rows={3}
                className="bg-background resize-none"
                disabled={saving}
              />
              <div className="text-xs text-muted-foreground text-right">
                {bio.length}/300
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Plats (valfritt)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Stockholm, Sverige"
                maxLength={50}
                className="bg-background"
                disabled={saving}
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={saving || uploading}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button 
              type="submit" 
              disabled={saving || uploading || !!error || !displayName.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara ändringar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
