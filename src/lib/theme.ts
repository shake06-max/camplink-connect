import { supabase } from "@/integrations/supabase/client";

// Convert "#rrggbb" to "h s% l%"
export const hexToHsl = (hex: string): string => {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const hslToHex = (hsl: string): string => {
  const m = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!m) return "#000000";
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r = l, g = l, b = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
  }
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export type ThemeMap = Record<string, string>;

export const THEME_KEYS = ["primary", "primary-glow", "accent", "background", "card"] as const;

export const applyTheme = (theme: ThemeMap | null) => {
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme).forEach(([k, v]) => {
    if (!v) return;
    if (k === "favicon-url") {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = v;
      return;
    }
    root.style.setProperty(`--${k}`, v);
  });
};

export const loadAndSubscribeTheme = () => {
  supabase.from("app_settings").select("theme").eq("id", 1).maybeSingle()
    .then(({ data }) => applyTheme((data?.theme as ThemeMap) ?? null));
  const ch = supabase.channel("app_settings")
    .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, (p: any) => {
      applyTheme(p.new?.theme ?? null);
    }).subscribe();
  return () => { supabase.removeChannel(ch); };
};
