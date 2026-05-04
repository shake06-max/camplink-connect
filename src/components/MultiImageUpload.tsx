import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const MultiImageUpload = ({
  userId,
  bucket = "listing-photos",
  values,
  onChange,
  max = 5,
}: {
  userId: string;
  bucket?: string;
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) => {
  const [busy, setBusy] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = max - values.length;
    if (remaining <= 0) { toast.error(`Max ${max} photos`); return; }
    const toUpload = files.slice(0, remaining);
    setBusy(true);
    const uploaded: string[] = [];
    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} > 5MB`); continue; }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setBusy(false);
    if (uploaded.length) {
      onChange([...values, ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length>1?"s":""} added`);
    }
    e.target.value = "";
  };

  const remove = (url: string) => onChange(values.filter(v => v !== url));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={() => remove(url)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {values.length < max && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-secondary/30">
            {busy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Add</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={busy} />
          </label>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">{values.length}/{max} photos · max 5MB each</p>
    </div>
  );
};
