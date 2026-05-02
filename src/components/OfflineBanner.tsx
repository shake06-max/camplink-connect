import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

export const OfflineBanner = () => {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="bg-destructive/90 text-destructive-foreground text-xs px-4 py-1.5 flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5" />
      You're offline — showing saved content
    </div>
  );
};
