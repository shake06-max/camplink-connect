import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { document.title = "Set new password — Camplink"; }, []);

  useEffect(() => {
    // Supabase puts a recovery session in the URL hash; the SDK auto-handles it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 8) { toast.error("Min 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate("/");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card/95 backdrop-blur-xl shadow-glow border border-border p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo size={56} withText={false} />
          <h1 className="text-2xl font-extrabold mt-4">Set new password</h1>
        </div>
        {!ready ? (
          <p className="text-sm text-muted-foreground text-center">Open this page from the reset email link…</p>
        ) : (
          <div className="space-y-3">
            <div><Label>New password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
            <div><Label>Confirm</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
            <Button className="w-full gradient-accent shadow-glow" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update password
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
