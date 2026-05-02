import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({ comment: z.string().trim().min(2).max(500), rating: z.number().min(1).max(5) });

type Review = { id: string; rating: number; comment: string | null; created_at: string; user_id: string; profiles?: { display_name: string | null } | null };

const Reviews = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => { document.title = "Reviews — Camplink"; }, []);

  const load = async () => {
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(50);
    const reviews = (data ?? []) as Review[];
    const ids = [...new Set(reviews.map(r => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const map = new Map(profs?.map(p => [p.id, p]));
      reviews.forEach(r => { r.profiles = map.get(r.user_id) as any; });
    }
    setItems(reviews);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    const parsed = schema.safeParse({ comment, rating });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    const { error } = await supabase.from("reviews").insert({ user_id: user.id, comment, rating });
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for your review!");
    setComment(""); setRating(5); load();
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold mb-4">⭐ Community Reviews</h1>

      <Card className="p-4 gradient-card mb-4 space-y-3">
        <p className="text-sm font-semibold">Leave a review</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <Star className={`h-6 w-6 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience…" rows={3} maxLength={500} />
        <Button className="w-full gradient-accent" onClick={submit}>Post review</Button>
      </Card>

      <div className="space-y-3">
        {items.length === 0 && <p className="text-center text-muted-foreground py-6">No reviews yet.</p>}
        {items.map(r => (
          <Card key={r.id} className="p-4 gradient-card">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm">{r.profiles?.display_name ?? "Anonymous"}</p>
              <div className="flex">{[...Array(r.rating)].map((_,i) => <Star key={i} className="h-3 w-3 fill-warning text-warning" />)}</div>
            </div>
            <p className="text-sm text-muted-foreground">{r.comment}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
};

export default Reviews;
