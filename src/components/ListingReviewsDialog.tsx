import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type R = { id: string; user_id: string; rating: number; comment: string | null; created_at: string; display_name?: string };

export const ListingReviewsDialog = ({ listingId }: { listingId: string }) => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<R[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = async () => {
    const { data } = await supabase.from("listing_reviews").select("*").eq("listing_id", listingId).order("created_at", { ascending: false });
    const rows = (data ?? []) as R[];
    const ids = [...new Set(rows.map(r => r.user_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", ids);
      const map = new Map(profs?.map(p => [p.id, p.display_name]));
      rows.forEach(r => { r.display_name = map.get(r.user_id) ?? "User"; });
    }
    setItems(rows);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const submit = async () => {
    if (!user) return;
    if (!comment.trim()) { toast.error("Add a comment"); return; }
    const { error } = await supabase.from("listing_reviews").insert({ listing_id: listingId, user_id: user.id, rating, comment: comment.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Review posted");
    setComment(""); setRating(5); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete review?")) return;
    const { error } = await supabase.from("listing_reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-[11px]"><MessageSquare className="h-3 w-3 mr-1" />Reviews</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Product Reviews</DialogTitle></DialogHeader>

        {user && (
          <div className="space-y-2 border-b border-border pb-3">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={`h-5 w-5 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your thoughts on this product…" rows={2} maxLength={500} />
            <Button size="sm" className="w-full gradient-accent" onClick={submit}>Post review</Button>
          </div>
        )}

        <div className="space-y-2 mt-2">
          {items.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No reviews yet.</p>}
          {items.map(r => (
            <div key={r.id} className="rounded-md border border-border p-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-xs">{r.display_name}</p>
                <div className="flex">{[...Array(r.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-warning text-warning" />)}</div>
              </div>
              {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
              {(isAdmin || user?.id === r.user_id) && (
                <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive mt-1 px-1" onClick={() => del(r.id)}>Delete</Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
