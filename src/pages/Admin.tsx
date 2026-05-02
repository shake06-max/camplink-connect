import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

type Row = Record<string, any>;

const Admin = () => {
  const [listings, setListings] = useState<Row[]>([]);
  const [users, setUsers] = useState<Row[]>([]);
  const [reviews, setReviews] = useState<Row[]>([]);

  useEffect(() => { document.title = "Admin — Camplink"; }, []);

  const load = async () => {
    const [{ data: l }, { data: p }, { data: r }] = await Promise.all([
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    ]);
    setListings(l ?? []); setUsers(p ?? []); setReviews(r ?? []);
  };
  useEffect(() => { load(); }, []);

  const del = async (table: "listings" | "reviews", id: string) => {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4"><Shield className="h-6 w-6 text-accent" /><h1 className="text-2xl font-extrabold">Admin Panel</h1></div>

      <Tabs defaultValue="listings">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-2 mt-3">
          {listings.map(l => (
            <Card key={l.id} className="p-3 gradient-card flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.category} · KSh {l.price}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del("listings", l.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="space-y-2 mt-3">
          {users.map(u => (
            <Card key={u.id} className="p-3 gradient-card">
              <p className="font-semibold text-sm">{u.display_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-2 mt-3">
          {reviews.map(r => (
            <Card key={r.id} className="p-3 gradient-card flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm">⭐ {r.rating} — {r.comment}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => del("reviews", r.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default Admin;
