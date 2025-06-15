
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
      toast({ title: "Namn saknas", description: "Du måste ange ett namn.", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Kolla om namnet redan är taget (ignorera mitt eget)
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", displayName.trim())
      .neq("id", userId)
      .maybeSingle();

    if (error) {
      toast({ title: "Fel", description: "Kunde inte kontrollera namnet. Försök igen.", variant: "destructive" });
      setSaving(false);
      return;
    }
    if (data) {
      toast({ title: "Namnet upptaget", description: "Det valda namnet är redan upptaget.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Uppdatera display_name
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("id", userId);

    if (updateError) {
      toast({ title: "Fel vid uppdatering", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Profil uppdaterad", description: "Ditt namn har uppdaterats." });
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
              Ändra namn
            </DialogTitle>
          </DialogHeader>
          <label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Nytt visningsnamn
          </label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nytt visningsnamn"
            maxLength={32}
            autoFocus
            className="bg-background"
          />
          <DialogFooter className="mt-4 flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Avbryt
            </Button>
            <Button type="submit" disabled={saving}>
              Spara
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
