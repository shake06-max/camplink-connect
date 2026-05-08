import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { OfflineBanner } from "./OfflineBanner";
import { DownloadAppButton } from "./DownloadAppButton";
import { useCartCount } from "@/hooks/useCartCount";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const cartCount = useCartCount();
  const [avatar, setAvatar] = useState<string | null>(null);
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => setAvatar(data?.avatar_url ?? null));
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <OfflineBanner />
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-1">
            <DownloadAppButton />
            <NotificationBell />
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] gradient-accent border-0">
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <Avatar className="h-9 w-9 border border-border ml-1">
                {avatar && <AvatarImage src={avatar} alt="me" />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
};
