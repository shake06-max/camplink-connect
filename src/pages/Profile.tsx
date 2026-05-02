import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const Profile = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => { document.title = "Profile — Camplink"; }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name,phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => { setName(data?.display_name ?? ""); setPhone(data?.phone ?? ""); });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ display_name: name.slice(0,60), phone: phone.slice(0,30) }).eq("id", user.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold mb-4">👤 Profile</h1>
      <Card className="p-5 gradient-card space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">{(name || user?.email || "U").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
          <div>
            <p className="font-semibold">{name || "—"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            {isAdmin && <span className="inline-flex items-center gap-1 text-[10px] mt-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold"><Shield className="h-3 w-3" />Admin</span>}
          </div>
        </div>
        <div><Label>Display name</Label><Input value={name} onChange={e => setName(e.target.value)} maxLength={60} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254…" maxLength={30} /></div>
        <Button className="w-full gradient-accent" onClick={save}>Save profile</Button>
      </Card>

      {isAdmin && (
        <Link to="/admin"><Card className="p-4 gradient-card mt-3 hover:shadow-glow transition-smooth flex items-center gap-3"><Shield className="h-5 w-5 text-accent" /><span className="font-semibold">Open Admin Panel</span></Card></Link>
      )}

      <Card className="p-4 gradient-card mt-3">
        <p className="text-xs text-muted-foreground mb-2">App contact</p>
        <p className="text-sm">📞 +254 702 060 628</p>
        <p className="text-sm">✉️ shakesian6@gmail.com</p>
      </Card>

      <Button variant="outline" className="w-full mt-4" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
    </AppShell>
  );
};

export default Profile;
