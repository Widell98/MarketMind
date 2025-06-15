
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: "Name missing", description: "You must enter a name.", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Check if the name is already taken (ignore my own)
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", displayName.trim())
      .neq("id", userId)
      .maybeSingle();

    if (error) {
      toast({ title: "Error", description: "Could not check the name. Try again.", variant: "destructive" });
      setSaving(false);
      return;
    }
    if (data) {
      toast({ title: "Name taken", description: "The chosen name is already taken.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Update display_name
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", userId);

    if (updateError) {
      toast({ title: "Update error", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your name has been updated." });
      onSaved?.(displayName.trim());
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card max-w-md rounded-lg px-8 py-7 border shadow text-left">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-semibold text-finance-navy dark:text-gray-200">
              Change name
            </DialogTitle>
          </DialogHeader>
          <label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            New display name
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="New display name"
            maxLength={32}
            autoFocus
            className="bg-background"
          />
          <DialogFooter className="mt-4 flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
