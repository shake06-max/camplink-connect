import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./ImageUpload";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce.number().min(0).max(100000000),
  category: z.enum(["marketplace", "housing"]),
  contact_phone: z.string().trim().max(30).optional(),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  location: z.string().trim().max(120).optional(),
  image_url: z.string().trim().url().max(2000).optional().or(z.literal("")),
});

export const AddListingDialog = ({
  defaultCategory = "marketplace", onCreated, trigger,
}: { defaultCategory?: "marketplace" | "housing"; onCreated?: () => void; trigger?: React.ReactNode }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: defaultCategory,
    contact_phone: "", contact_email: user?.email ?? "", location: "", image_url: "",
  });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("listings").insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      price: parsed.data.price,
      category: parsed.data.category,
      contact_phone: parsed.data.contact_phone || null,
      contact_email: parsed.data.contact_email || null,
      location: parsed.data.location || null,
      image_url: parsed.data.image_url || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing posted!");
    setOpen(false);
    setForm({ ...form, title: "", description: "", price: "", location: "", image_url: "" });
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button className="gradient-accent shadow-glow"><Plus className="h-4 w-4 mr-1" />Post</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Post a listing</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Scientific Calculator FX-991" /></div>
          <div><Label>Price (KSh) *</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="800" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Condition, details…" rows={3} /></div>
          <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ruiru Town" /></div>
          <div>
            <Label>Photo</Label>
            {user && <ImageUpload userId={user.id} value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Phone</Label><Input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} placeholder="+254…" /></div>
            <div><Label>Email</Label><Input value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
          </div>
          <Button className="w-full gradient-accent" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Post listing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
