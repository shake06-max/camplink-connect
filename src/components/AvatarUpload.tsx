import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const AvatarUpload = ({
  userId,
  value,
  fallback,
  onChange,
  size = 96,
}: {
  userId: string;
  value: string | null;
  fallback: string;
  onChange: (url: string | null) => void;
  size?: number;
}) => {
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast.success("Photo updated");
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar style={{ width: size, height: size }} className="border-2 border-border">
        {value && <AvatarImage src={value} alt="avatar" />}
        <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <label>
          <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
            <span className="cursor-pointer">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {value ? "Change photo" : "Upload photo"}
            </span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
        {value && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(null)}>
            <X className="h-4 w-4 mr-1" /> Remove
          </Button>
        )}
      </div>
    </div>
  );
};
