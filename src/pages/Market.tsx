import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, Listing } from "@/components/ListingCard";
import { AddListingDialog } from "@/components/AddListingDialog";
import { Card } from "@/components/ui/card";

const Page = ({ category, title, emoji }: { category: "marketplace" | "housing"; title: string; emoji: string }) => {
  const [items, setItems] = useState<Listing[]>([]);
  useEffect(() => { document.title = `${title} — Camplink`; }, [title]);
  const load = async () => {
    const { data } = await supabase.from("listings").select("*").eq("category", category).order("created_at", { ascending: false });
    setItems((data ?? []) as Listing[]);
  };
  useEffect(() => { load(); }, [category]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">{emoji} {title}</h1>
        <AddListingDialog defaultCategory={category} onCreated={load} />
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center gradient-card text-muted-foreground">No {title.toLowerCase()} listings yet.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map(l => <ListingCard key={l.id} listing={l} onDelete={load} />)}
        </div>
      )}
    </AppShell>
  );
};

export const Market = () => <Page category="marketplace" title="Marketplace" emoji="🛒" />;
export const Housing = () => <Page category="housing" title="Housing" emoji="🏠" />;
