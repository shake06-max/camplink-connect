import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { BottomNav } from "./BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/"><Logo /></Link>
          <Link to="/profile">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4 animate-fade-in">{children}</main>
      <BottomNav />
    </div>
  );
};
