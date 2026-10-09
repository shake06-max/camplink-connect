import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Building2, Star, ArrowRight, ArrowUpRight, Heart, Megaphone, Loader2, Film, Search, TrendingUp, Sparkles, Users } from "lucide-react";
import { ListingCard, Listing } from "@/components/ListingCard";
import { AddListingDialog } from "@/components/AddListingDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cacheGet, cacheSet } from "@/lib/offlineCache";
import { useOnline } from "@/hooks/useOnline";
import { AdBanner } from "@/components/AdBanner";
import campusEvening from "@/assets/campus-evening.jpg";
import { useTheme } from "@/lib/theme";

const PAGE_SIZE = 30;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5) return { text: "Burning the midnight oil", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (h < 21) return { text: "Good evening", emoji: "🌆" };
  return { text: "Good night", emoji: "✨" };
};

const Index = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const online = useOnline();
  const [recent, setRecent] = useState<Listing[]>([]);
  const [name, setName] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [stats, setStats] = useState({ listings: 0, users: 0, today: 0 });
  const [greeting, setGreeting] = useState(getGreeting());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Camplink — Campus Marketplace"; }, []);
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchPage = useCallback(async (pageIdx: number, replace = false) => {
    if (!online) return;
    setLoadingMore(true);
    const from = pageIdx * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    const rows = (data ?? []) as Listing[];
    setHasMore(rows.length === PAGE_SIZE);
    setRecent(prev => {
      const merged = replace ? rows : [...prev, ...rows];
      if (replace) cacheSet("listings:recent", merged);
      return merged;
    });
    setLoadingMore(false);
  }, [online]);

  const load = useCallback(async () => {
    const cached = cacheGet<Listing[]>("listings:recent");
    if (cached) setRecent(cached);
    setPage(0);
    await fetchPage(0, true);
    if (user) {
      const { data: p } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      setName(p?.display_name ?? user.email?.split("@")[0] ?? "");
    }
    // Cool stat counters
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const [{ count: lc }, { count: uc }, { count: tc }] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString()),
    ]);
    setStats({ listings: lc ?? 0, users: uc ?? 0, today: tc ?? 0 });
  }, [user, fetchPage]);

  useEffect(() => { load(); }, [user, online]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  }, [page, hasMore, loadingMore, fetchPage]);

  // Vertical infinite scroll on window
  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const io = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "600px 0px 600px 0px", threshold: 0.01 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [loadMore, recent.length]);

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    recent.forEach(r => {
      const t = (r.subcategory || r.category || "").toString().trim();
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [recent]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recent.filter(l => {
      if (activeTag && (l.subcategory || l.category) !== activeTag) return false;
      if (!q) return true;
      return (l.title?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q));
    });
  }, [recent, query, activeTag]);

  const featured = useMemo(() => {
    // Top by price as a simple "premium picks" highlight
    return [...recent].sort((a, b) => Number(b.price) - Number(a.price)).slice(0, 6);
  }, [recent]);

  return (
    <AppShell>
      <AdBanner />
      <section className="campus-masthead relative mb-6 overflow-hidden border-b border-accent/30">
        <img src={campusEvening} alt="Students walking through a warmly lit campus at dusk" width={1920} height={1024} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[65%_center]" />
        <div className="campus-photo-shade absolute inset-0" />
        <div className="relative p-5 sm:p-8 lg:px-9 lg:py-8">
        <div className="flex items-center justify-between gap-4">
          <span className="kicker text-accent">{theme["app-name"] || "Camplink"} · The campus edition</span>
          <span className="kicker text-foreground/80 hidden sm:block">A world within your campus</span>
        </div>
        <div className="my-4 sm:my-5 h-px bg-foreground/20" />

        <h1 className="campus-headline font-serif text-foreground">
          Good things happen<br />
          when you <em className="text-accent">connect.</em><br />
          Your campus, curated.
        </h1>
        <p className="mt-4 max-w-xl text-foreground/85 text-[13px] leading-relaxed">
          A private marketplace, community and social club for students.{" "}<br className="hidden sm:block" />
          Real people. Fresh finds. A little closer to home.
        </p>

        <div className="relative mt-6 max-w-[490px]">
          <Search className="pointer-events-none absolute z-10 left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search campus listings"
            placeholder="Search the marketplace, housing, and more…"
            className="campus-search pl-11 h-12 rounded-md bg-background/65 backdrop-blur-sm border-foreground/20 text-foreground text-xs placeholder:text-muted-foreground focus-visible:ring-accent"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: "/market", label: "Market", icon: ShoppingBag },
            { to: "/housing", label: "Housing", icon: Building2 },
            { to: "/dating", label: "Hookup", icon: Heart },
            { to: "/community", label: "Community", icon: Megaphone },
            { to: "/reviews", label: "Reviews", icon: Star },
            { to: "/reels", label: "Reels", icon: Film },
          ].map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant="outline" className="campus-shortcut group h-11 rounded-md border-foreground/15 bg-background/60 backdrop-blur-sm text-xs text-foreground hover:border-accent/50 hover:bg-background/80 hover:text-foreground">
              <Link to={to}>
                <Icon className="text-accent" />
                <span>{label}</span>
                <ArrowUpRight className="text-accent/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ))}
        </div>
        </div>
      </section>


      <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr] border-y border-border py-5 mb-8">
        {[
          { label: "Campus listings", value: stats.listings, icon: ShoppingBag },
          { label: "Community members", value: stats.users, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 px-1 sm:px-4 border-r border-border last:border-r-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/60"><Icon className="h-4 w-4 text-accent" /></span>
            <div>
              <p className="font-serif text-3xl leading-none text-foreground">{String(value).padStart(2, "0")}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{label}</p>
            </div>
          </div>
        ))}
        <Link to={user ? "/dashboard" : "/community"} className="hidden lg:flex items-center justify-end gap-3 px-6 text-xs text-muted-foreground hover:text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {user ? `${greeting.text}, ${name || "friend"}` : "A campus full of possibilities"}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Trending tags */}
      {trendingTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="kicker text-muted-foreground">In circulation</span>
            <div className="hairline-gold flex-1" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4">
            <Badge
              variant={activeTag === null ? "default" : "secondary"}
              className="cursor-pointer shrink-0 rounded-full"
              onClick={() => setActiveTag(null)}
            >All</Badge>
            {trendingTags.map(t => (
              <Badge
                key={t}
                variant={activeTag === t ? "default" : "secondary"}
                className="cursor-pointer shrink-0 rounded-full capitalize"
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >#{t}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Featured — magazine hero row */}
      {featured.length > 0 && !query && !activeTag && (
        <div className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="kicker text-accent flex items-center gap-1"><Sparkles className="h-3 w-3" /> The Editors' Selection</span>
              <h2 className="font-serif text-3xl md:text-4xl mt-1">Featured this week</h2>
            </div>
            <Link to="/market" className="hidden md:inline-flex kicker text-muted-foreground hover:text-accent items-center gap-1">Browse all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="h-px bg-border mb-4" />
          <div className="-mx-4 flex gap-4 overflow-x-auto pb-3 px-4 snap-x snap-mandatory scrollbar-none">
            {featured.map(l => (
              <div key={l.id} className="snap-start shrink-0 w-48 sm:w-56 md:w-64">
                <ListingCard listing={l} onDelete={load} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="kicker text-accent">Latest dispatches</span>
          <h2 className="font-serif text-3xl md:text-4xl mt-1">Recent Listings</h2>
        </div>
        <Link to="/market" className="kicker text-muted-foreground hover:text-accent flex items-center gap-1">See all <ArrowRight className="h-3 w-3" /></Link>
      </div>
      <div className="h-px bg-border mb-5" />


      {filtered.length === 0 ? (
        <div className="py-12 text-center border-y border-border">
          <p className="text-muted-foreground mb-3">{recent.length === 0 ? "No listings yet — be the first!" : "No matches for your search."}</p>
          {recent.length === 0 && user && <AddListingDialog onCreated={load} />}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(l => (
              <ListingCard key={l.id} listing={l} onDelete={load} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-10" aria-hidden />

          <div className="flex justify-center py-6">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading more…
              </div>
            ) : hasMore ? (
              <Button variant="outline" onClick={loadMore}>Load more</Button>
            ) : (
              <p className="text-xs text-muted-foreground">🎉 You're all caught up</p>
            )}
          </div>
        </>
      )}

      {user ? (
        <div className="fixed bottom-24 right-4 z-40">
          <AddListingDialog onCreated={load} trigger={<Button size="lg" className="rounded-full h-14 w-14 p-0 gradient-accent shadow-glow"><span className="text-2xl leading-none">+</span></Button>} />
        </div>
      ) : (
        <div className="flex justify-center py-6">
          <Button asChild size="lg" variant="outline" className="border-accent/40 text-accent"><Link to="/auth">Sign up / Log in <ArrowRight /></Link></Button>
        </div>
      )}
    </AppShell>
  );
};

export default Index;
