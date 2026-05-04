import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, Trash2, Search, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Post = {
  id: string; user_id: string; kind: string; title: string; body: string | null;
  image_url: string | null; location: string | null; contact: string | null; created_at: string;
};

const KINDS = ["announcement", "lost", "found", "event", "other"] as const;
const kindEmoji: Record<string, string> = { announcement: "📢", lost: "❓", found: "✅", event: "🎉", other: "💬" };

const Community = () => {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ kind: "announcement", title: "", body: "", location: "", contact: "", image_url: "" });

  useEffect(() => { document.title = "Community — Camplink"; }, []);

  const load = async () => {
    const { data } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false }).limit(100);
    setPosts((data ?? []) as Post[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) return;
    if (form.title.trim().length < 2) { toast.error("Title required"); return; }
    setBusy(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      kind: form.kind,
      title: form.title.trim().slice(0, 120),
      body: form.body.trim().slice(0, 2000) || null,
      location: form.location.trim().slice(0, 120) || null,
      contact: form.contact.trim().slice(0, 60) || null,
      image_url: form.image_url || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted!");
    setOpen(false);
    setForm({ kind: "announcement", title: "", body: "", location: "", contact: "", image_url: "" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete post?")) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); load();
  };

  const filtered = posts.filter(p => {
    if (filter !== "all" && p.kind !== filter) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return [p.title, p.body, p.location].some(v => v?.toLowerCase().includes(s));
  });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">📣 Community</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-accent shadow-glow"><Plus className="h-4 w-4 mr-1" />Post</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New community post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map(k => <SelectItem key={k} value={k}>{kindEmoji[k]} {k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Lost: Black Backpack near Library" /></div>
              <div><Label>Details</Label><Textarea rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Describe what happened, where, when…" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Main library, 2nd floor" /></div>
              <div><Label>Contact</Label><Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Phone or email" /></div>
              <div>
                <Label>Photo (optional)</Label>
                {user && <ImageUpload userId={user.id} value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />}
              </div>
              <Button className="w-full gradient-accent" onClick={submit} disabled={busy}>Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search posts…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4 pb-1">
        {(["all", ...KINDS] as const).map(k => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} className={`h-8 text-xs whitespace-nowrap ${filter === k ? "gradient-accent" : ""}`} onClick={() => setFilter(k)}>
            {k === "all" ? "All" : `${kindEmoji[k]} ${k}`}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center gradient-card text-muted-foreground">No posts yet.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const canDelete = user && (user.id === p.user_id || isAdmin);
            return (
              <Card key={p.id} className="gradient-card overflow-hidden">
                {p.image_url && <img src={p.image_url} alt={p.title} className="w-full max-h-60 object-cover" />}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">{kindEmoji[p.kind]} {p.kind}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      </div>
                      <h3 className="font-semibold leading-tight">{p.title}</h3>
                    </div>
                    {canDelete && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                  {p.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.body}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>}
                    {p.contact && <a href={p.contact.includes("@") ? `mailto:${p.contact}` : `tel:${p.contact}`} className="flex items-center gap-1 text-primary"><Phone className="h-3 w-3" />{p.contact}</a>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};

export default Community;
