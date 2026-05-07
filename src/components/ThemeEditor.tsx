import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { hexToHsl, hslToHex, applyTheme, THEME_KEYS, ThemeMap } from "@/lib/theme";
import { Palette, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS: ThemeMap = {
  "primary": "252 84% 65%",
  "primary-glow": "270 90% 72%",
  "accent": "168 76% 52%",
  "background": "240 10% 6%",
  "card": "240 12% 10%",
};

export const ThemeEditor = () => {
  const [theme, setTheme] = useState<ThemeMap>({});
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("theme").eq("id", 1).maybeSingle()
      .then(({ data }) => setTheme((data?.theme as ThemeMap) ?? {}));
  }, []);

  const setKey = (k: string, hex: string) => {
    const hsl = hexToHsl(hex);
    const next = { ...theme, [k]: hsl };
    setTheme(next);
    applyTheme(next);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ id: 1, theme, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Theme saved for everyone 🎨");
  };

  const reset = async () => {
    setTheme({});
    applyTheme(DEFAULTS);
    await supabase.from("app_settings").upsert({ id: 1, theme: {}, updated_at: new Date().toISOString() });
    toast.success("Reset");
    location.reload();
  };

  const uploadFavicon = async (file: File) => {
    setUploadingIcon(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `favicon-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploadingIcon(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const next = { ...theme, "favicon-url": pub.publicUrl };
    setTheme(next);
    applyTheme(next);
    const { error } = await supabase.from("app_settings").upsert({ id: 1, theme: next, updated_at: new Date().toISOString() });
    setUploadingIcon(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Web icon updated for everyone 🖼️");
  };

  return (
    <Card className="gradient-card p-4 space-y-3 mb-4">
      <p className="font-semibold text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> App theme & colors</p>
      <p className="text-xs text-muted-foreground">Pick colors — every user sees them live.</p>
      <div className="grid grid-cols-2 gap-3">
        {THEME_KEYS.map(k => {
          const hsl = theme[k] || DEFAULTS[k];
          return (
            <div key={k}>
              <Label className="text-xs capitalize">{k.replace("-", " ")}</Label>
              <div className="flex gap-2 items-center">
                <Input type="color" value={hslToHex(hsl)} onChange={e => setKey(k, e.target.value)} className="h-9 w-14 p-1" />
                <span className="text-[10px] text-muted-foreground truncate">{hsl}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border pt-3">
        <Label className="text-xs flex items-center gap-2">🖼️ Web icon (favicon)</Label>
        <div className="flex items-center gap-2 mt-1">
          {theme["favicon-url"] && <img src={theme["favicon-url"]} alt="icon" className="h-8 w-8 rounded" />}
          <Input type="file" accept="image/*" disabled={uploadingIcon}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFavicon(f); }} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 gradient-accent" onClick={save} disabled={saving}>{saving ? "Saving…" : "Apply colors for everyone"}</Button>
        <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
      </div>
    </Card>
  );
};
