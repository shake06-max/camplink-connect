import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";

export const VideoUpload = ({
  userId,
  value,
  onChange,
  bucket = "listing-photos",
}: {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
}) => {
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { toast.error("Video must be under 25MB"); return; }
    setBusy(true);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${userId}/video-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) { toast.error(error.message); setBusy(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    setBusy(false);
    toast.success("Video uploaded");
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <video src={value} controls className="w-full rounded-lg border border-border max-h-48" />
          <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/30">
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <>
              <Video className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Upload video (optional, ≤25MB)</span>
            </>
          )}
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} disabled={busy} />
        </label>
      )}
    </div>
  );
};
