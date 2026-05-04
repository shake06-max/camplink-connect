import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, Listing } from "@/components/ListingCard";
import { AddListingDialog } from "@/components/AddListingDialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cacheGet, cacheSet } from "@/lib/offlineCache";
import { useOnline } from "@/hooks/useOnline";
import { SUBCATEGORIES } from "@/components/AddListingDialog";

const MARKET_CATS = ["All", ...SUBCATEGORIES.filter(s => s !== "Housing")] as const;

const Page = ({ category, title, emoji }: { category: "marketplace" | "housing"; title: string; emoji: string }) => {
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const online = useOnline();

  useEffect(() => { document.title = `${title} — Camplink`; }, [title]);

  const load = async () => {
    const cached = cacheGet<Listing[]>("listings:" + category);
    if (cached) setItems(cached);
    if (!online) return;
    const { data } = await supabase.from("listings").select("*").eq("category", category).order("created_at", { ascending: false });
    const rows = (data ?? []) as Listing[];
    setItems(rows);
    cacheSet("listings:" + category, rows);
  };
  useEffect(() => { load(); }, [category, online]);

  const filtered = useMemo(() => {
    return items.filter(l => {
      if (cat !== "All" && (l.subcategory || "Other") !== cat) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return [l.title, l.description, l.location, l.subcategory].some(v => v?.toLowerCase().includes(s));
    });
  }, [items, q, cat]);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-extrabold">{emoji} {title}</h1>
        <AddListingDialog defaultCategory={category} onCreated={load} />
      </div>

      <div className="relative mb-3">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search listings…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {category === "marketplace" && (
        <div className="flex gap-2 overflow-x-auto mb-4 pb-1 -mx-1 px-1 scrollbar-thin">
          {MARKET_CATS.map(c => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              className={`h-8 text-xs whitespace-nowrap ${cat === c ? "gradient-accent" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-8 text-center gradient-card text-muted-foreground">No {title.toLowerCase()} listings match.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(l => <ListingCard key={l.id} listing={l} onDelete={load} />)}
        </div>
      )}
    </AppShell>
  );
};

export const Market = () => <Page category="marketplace" title="Marketplace" emoji="🛒" />;
export const Housing = () => <Page category="housing" title="Housing" emoji="🏠" />;
