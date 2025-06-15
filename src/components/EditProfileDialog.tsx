import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, AlertCircle } from "lucide-react";

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  userId: string;
  onSaved?: (newName: string) => void;
};

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  currentName,
  userId,
  onSaved,
}) => {
  const [displayName, setDisplayName] = useState(currentName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setDisplayName(currentName || "");
      setError("");
    }
  }, [open, currentName]);

  const validateName = (name: string): string | null => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return "Display name is required";
    }
    
    if (trimmedName.length < 2) {
      return "Display name must be at least 2 characters long";
    }
    
    if (trimmedName.length > 32) {
      return "Display name must be less than 32 characters";
    }
    
    // Check for valid characters (letters, numbers, spaces, some special chars)
    const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validNameRegex.test(trimmedName)) {
      return "Display name can only contain letters, numbers, spaces, hyphens, dots, and underscores";
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayName(value);
    
    // Clear error when user starts typing
    if (error) {
      setError("");
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
    
    // Check if name is unchanged
    if (trimmedName === currentName) {
      onOpenChange(false);
      return;
    }

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
        throw new Error("Failed to validate name availability");
      }

      if (existingUser) {
        setError("This display name is already taken. Please choose another one.");
        setSaving(false);
        return;
      }

      // Update display_name
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: trimmedName })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      toast({ 
        title: "Success!", 
        description: "Your display name has been updated successfully.",
        variant: "default"
      });
      
      onSaved?.(trimmedName);
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update display name. Please try again.");
      toast({ 
        title: "Update failed", 
        description: "There was an error updating your display name.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentName || "");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md rounded-lg border shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-finance-navy dark:text-gray-200 flex items-center gap-2">
              <User className="h-5 w-5" />
              Change Display Name
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                New Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={handleInputChange}
                placeholder="Enter your new display name"
                maxLength={32}
                autoFocus
                className={`bg-background ${error ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={saving}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2-32 characters</span>
                <span>{displayName.length}/32</span>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {currentName && (
              <div className="text-sm text-muted-foreground">
                Current name: <span className="font-medium">{currentName}</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel} 
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !!error || !displayName.trim()}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
