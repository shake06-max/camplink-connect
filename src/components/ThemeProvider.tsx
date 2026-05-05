import { useEffect } from "react";
import { loadAndSubscribeTheme } from "@/lib/theme";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => loadAndSubscribeTheme(), []);
  return <>{children}</>;
};
