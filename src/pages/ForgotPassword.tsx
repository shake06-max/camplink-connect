import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => { document.title = "Reset password — Camplink"; }, []);

  const submit = async () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Check your email");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-card/95 backdrop-blur-xl shadow-glow border border-border p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <Logo size={56} withText={false} />
          <h1 className="text-2xl font-extrabold mt-4">Forgot password?</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">We'll email you a link to reset it</p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">📬 If <b>{email}</b> matches an account, a reset link is on its way.</p>
            <Link to="/auth"><Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4 mr-2" />Back to sign in</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" /></div>
            <Button className="w-full gradient-accent shadow-glow" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send reset link
            </Button>
            <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3 inline mr-1" />Back to sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
