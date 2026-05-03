import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Search, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type DP = {
  id: string; user_id: string; display_name: string;
  age: number | null; gender: string | null; looking_for: string | null;
  bio: string | null; interests: string | null; photo_url: string | null;
};

const Dating = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<DP[]>([]);
  const [q, setQ] = useState("");
  const [hasOwn, setHasOwn] = useState<boolean | null>(null);

  useEffect(() => { document.title = "Hookup — Camplink"; }, []);

  const load = async () => {
    const { data } = await supabase.from("dating_profiles").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(100);
    setProfiles((data ?? []) as DP[]);
    if (user) {
      const { data: own } = await supabase.from("dating_profiles").select("id").eq("user_id", user.id).maybeSingle();
      setHasOwn(!!own);
    }
  };
  useEffect(() => { load(); }, [user]);

  const filtered = profiles.filter(p => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (p.display_name?.toLowerCase().includes(s) || p.bio?.toLowerCase().includes(s) || p.interests?.toLowerCase().includes(s) || p.looking_for?.toLowerCase().includes(s));
  });

  const dm = async (otherId: string) => {
    if (!user) return;
    if (otherId === user.id) { toast.error("That's you 😄"); return; }
    const [a, b] = [user.id, otherId].sort();
    const { data: existing } = await supabase.from("conversations").select("id").or(`and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`).maybeSingle();
    let cid = existing?.id;
    if (!cid) {
      const { data, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
      if (error) { toast.error(error.message); return; }
      cid = data.id;
    }
    navigate(`/chat?c=${cid}`);
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">💖 Hookup</h1>
        <Link to="/dating/edit"><Button size="sm" variant="outline"><Settings className="h-4 w-4 mr-1" />{hasOwn ? "Edit" : "Create"}</Button></Link>
      </div>

      {hasOwn === false && (
        <Card className="p-4 mb-3 gradient-card text-sm text-muted-foreground">
          Create your dating profile to be discovered. Tap <b>Create</b> ↑
        </Card>
      )}

      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, interests, bio…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center gradient-card text-muted-foreground">No matches found.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => (
            <Card key={p.id} className="overflow-hidden gradient-card hover:shadow-glow transition-smooth">
              <div className="aspect-[3/4] bg-secondary relative">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center"><Avatar className="h-20 w-20"><AvatarFallback className="text-2xl bg-primary/20 text-primary">{p.display_name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white font-bold text-sm truncate">{p.display_name}{p.age ? `, ${p.age}` : ""}</p>
                  {p.gender && <p className="text-white/80 text-[10px]">{p.gender}{p.looking_for ? ` · seeks ${p.looking_for}` : ""}</p>}
                </div>
              </div>
              <div className="p-2 space-y-1">
                {p.bio && <p className="text-xs text-muted-foreground line-clamp-2">{p.bio}</p>}
                {p.interests && <p className="text-[10px] text-primary truncate">❤ {p.interests}</p>}
                <Button size="sm" className="w-full gradient-accent h-8 text-xs" onClick={() => dm(p.user_id)}>
                  <MessageCircle className="h-3 w-3 mr-1" /> Message
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Dating;
