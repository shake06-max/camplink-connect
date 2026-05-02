import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, MessageCircle, Trash2, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: "marketplace" | "housing";
  contact_phone: string | null;
  contact_email: string | null;
  location: string | null;
  image_url: string | null;
  created_at: string;
};

const emoji = (c: string) => (c === "housing" ? "🏠" : "🛒");

export const ListingCard = ({ listing, onDelete }: { listing: Listing; onDelete?: () => void }) => {
  const { user, isAdmin } = useAuth();
  const canDelete = user && (user.id === listing.user_id || isAdmin);

  const startChat = async () => {
    if (!user || user.id === listing.user_id) return;
    const [a, b] = [user.id, listing.user_id].sort();
    const { data: existing } = await supabase.from("conversations").select("id").eq("user_a", a).eq("user_b", b).maybeSingle();
    let convoId = existing?.id;
    if (!convoId) {
      const { data, error } = await supabase.from("conversations").insert({ user_a: a, user_b: b }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convoId = data.id;
    }
    window.location.href = `/chat?c=${convoId}`;
  };

  const remove = async () => {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    onDelete?.();
  };

  const addToCart = async () => {
    if (!user) return;
    const { error } = await supabase.from("cart_items").upsert(
      { user_id: user.id, listing_id: listing.id, quantity: 1 },
      { onConflict: "user_id,listing_id" }
    );
    if (error) { toast.error(error.message); return; }
    toast.success("Added to cart");
  };

  return (
    <Card className="gradient-card border-border overflow-hidden transition-smooth hover:shadow-glow hover:-translate-y-0.5">
      <div className="aspect-[4/3] bg-secondary/40 grid place-items-center text-6xl">
        {listing.image_url ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" /> : <span>{emoji(listing.category)}</span>}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{listing.title}</h3>
          <Badge variant="secondary" className="shrink-0 text-[10px]">{listing.category}</Badge>
        </div>
        <p className="text-primary font-bold">KSh {Number(listing.price).toLocaleString()}</p>
        {listing.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</p>}
        {listing.description && <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {listing.contact_phone && <Button size="sm" variant="outline" className="h-7 text-[11px]" asChild><a href={`tel:${listing.contact_phone}`}><Phone className="h-3 w-3 mr-1" />Call</a></Button>}
          {listing.contact_email && <Button size="sm" variant="outline" className="h-7 text-[11px]" asChild><a href={`mailto:${listing.contact_email}`}><Mail className="h-3 w-3 mr-1" />Email</a></Button>}
          {user && user.id !== listing.user_id && <Button size="sm" className="h-7 text-[11px] gradient-accent" onClick={startChat}><MessageCircle className="h-3 w-3 mr-1" />Chat</Button>}
          {user && user.id !== listing.user_id && <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={addToCart}><ShoppingCart className="h-3 w-3 mr-1" />Cart</Button>}
          {canDelete && <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive" onClick={remove}><Trash2 className="h-3 w-3" /></Button>}
        </div>
      </div>
    </Card>
  );
};
