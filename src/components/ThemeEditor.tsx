import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hexToHsl, hslToHex, applyTheme, saveTheme, THEME_KEYS, ThemeMap } from "@/lib/theme";
import { Palette, RotateCcw, Music, Play, Square, Image as ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

const DEFAULTS: ThemeMap = {
  "primary": "252 84% 65%",
  "primary-glow": "270 90% 72%",
  "accent": "168 76% 52%",
  "background": "240 10% 6%",
  "card": "240 12% 10%",
};

const DECORATIONS = [
  { v: "none", label: "None" },
  { v: "christmas", label: "🎄 Christmas" },
  { v: "halloween", label: "🎃 Halloween" },
  { v: "valentine", label: "💖 Valentine" },
  { v: "newyear", label: "🎆 New Year" },
  { v: "birthday", label: "🎂 Birthday" },
  { v: "easter", label: "🐰 Easter" },
];

export const ThemeEditor = () => {
  const [theme, setTheme] = useState<ThemeMap>({});
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [musicLink, setMusicLink] = useState("");
  const [musicLinkType, setMusicLinkType] = useState<"youtube" | "spotify">("youtube");

  useEffect(() => {
    supabase.from("app_settings").select("theme").eq("id", 1).maybeSingle()
      .then(({ data }) => setTheme((data?.theme as ThemeMap) ?? {}));
  }, []);

  const update = async (next: ThemeMap, msg?: string) => {
    setTheme(next);
    const { error } = await saveTheme(next);
    if (error) toast.error(error.message);
    else if (msg) toast.success(msg);
  };

  const setKey = (k: string, hex: string) => {
    const next = { ...theme, [k]: hexToHsl(hex) };
    setTheme(next);
    applyTheme(next);
  };

  const saveColors = async () => {
    setSaving(true);
    const { error } = await saveTheme(theme);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Theme saved for everyone 🎨");
  };

  const reset = async () => {
    const next: ThemeMap = {};
    setTheme(next);
    applyTheme(DEFAULTS);
    await saveTheme(next);
    toast.success("Reset");
    location.reload();
  };

  const uploadTo = async (bucket: string, file: File, prefix: string) => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  const uploadFavicon = async (file: File) => {
    setUploadingIcon(true);
    try { const url = await uploadTo("avatars", file, "favicon"); await update({ ...theme, "favicon-url": url }, "Web icon updated 🖼️"); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploadingIcon(false); }
  };

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true);
    try { const url = await uploadTo("avatars", file, "logo"); await update({ ...theme, "logo-url": url }, "App logo updated"); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploadingLogo(false); }
  };

  const uploadMusic = async (file: File) => {
    setUploadingMusic(true);
    try {
      const url = await uploadTo("music", file, "track");
      await update({ ...theme, "music-url": url, "music-type": "file", "music-playing": "1" }, "Now playing for everyone 🎵");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploadingMusic(false); }
  };

  const useLink = async () => {
    if (!musicLink.trim()) { toast.error("Paste a link first"); return; }
    await update({ ...theme, "music-url": musicLink.trim(), "music-type": musicLinkType, "music-playing": "1" }, "Streaming for everyone 🎵");
  };

  const togglePlay = () => update({ ...theme, "music-playing": theme["music-playing"] === "1" ? "0" : "1" });
  const stopMusic = () => update({ ...theme, "music-playing": "0" }, "Stopped");

  return (
    <Card className="gradient-card p-4 space-y-4 mb-4">
      <div>
        <p className="font-semibold text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> App theme & colors</p>
        <p className="text-xs text-muted-foreground">Pick colors — every user sees them live.</p>
      </div>
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

      <div className="border-t border-border pt-3 space-y-2">
        <Label className="text-xs flex items-center gap-2"><ImageIcon className="h-3 w-3" /> Top-left app logo</Label>
        <div className="flex items-center gap-2">
          {theme["logo-url"] && <img src={theme["logo-url"]} alt="logo" className="h-10 w-10 rounded object-cover" />}
          <Input type="file" accept="image/*" disabled={uploadingLogo}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
        </div>
        <Label className="text-xs">App name (optional)</Label>
        <div className="flex gap-2">
          <Input value={theme["app-name"] ?? ""} placeholder="Camplink" onChange={e => setTheme({ ...theme, "app-name": e.target.value })} />
          <Button size="sm" onClick={() => update(theme, "Name updated")}>Save</Button>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <Label className="text-xs">🖼️ Web icon (favicon)</Label>
        <div className="flex items-center gap-2 mt-1">
          {theme["favicon-url"] && <img src={theme["favicon-url"]} alt="icon" className="h-8 w-8 rounded" />}
          <Input type="file" accept="image/*" disabled={uploadingIcon}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFavicon(f); }} />
        </div>
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <Label className="text-xs flex items-center gap-2"><Sparkles className="h-3 w-3" /> Decorations / holiday theme</Label>
        <Select value={theme["decoration"] ?? "none"} onValueChange={v => update({ ...theme, "decoration": v }, "Decoration updated ✨")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{DECORATIONS.map(d => <SelectItem key={d.v} value={d.v}>{d.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-sm font-semibold flex items-center gap-2"><Music className="h-4 w-4" /> Background music (plays for ALL users)</p>
        <p className="text-[11px] text-muted-foreground">Users won't see a player — only hear the music. Tap to start; it persists across pages.</p>
        <div>
          <Label className="text-xs">Upload audio file (mp3, m4a…)</Label>
          <Input type="file" accept="audio/*" disabled={uploadingMusic}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadMusic(f); }} />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs">Or paste a YouTube / Spotify link</Label>
            <Input value={musicLink} onChange={e => setMusicLink(e.target.value)} placeholder="https://…" />
          </div>
          <Select value={musicLinkType} onValueChange={(v: any) => setMusicLinkType(v)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="spotify">Spotify</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={useLink}>Use</Button>
        </div>
        {theme["music-url"] && (
          <div className="rounded-md bg-secondary/40 p-2 text-xs space-y-1">
            <div><span className="text-muted-foreground">Source:</span> {theme["music-type"]} · <span className="truncate">{theme["music-url"]}</span></div>
            <div><span className="text-muted-foreground">Status:</span> {theme["music-playing"] === "1" ? "▶ Playing for everyone" : "⏸ Paused"}</div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={togglePlay} className="flex-1">
                {theme["music-playing"] === "1" ? <><Square className="h-3 w-3 mr-1" />Pause</> : <><Play className="h-3 w-3 mr-1" />Play</>}
              </Button>
              <Button size="sm" variant="outline" onClick={stopMusic}>Stop</Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <Button className="flex-1 gradient-accent" onClick={saveColors} disabled={saving}>{saving ? "Saving…" : "Apply colors for everyone"}</Button>
        <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
      </div>
    </Card>
  );
};
