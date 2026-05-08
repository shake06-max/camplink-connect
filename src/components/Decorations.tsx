import { useTheme } from "@/lib/theme";

const EMOJIS: Record<string, string[]> = {
  christmas: ["❄️", "🎄", "⛄", "🎁"],
  halloween: ["🎃", "👻", "🦇", "🕷️"],
  valentine: ["💖", "💘", "🌹", "💝"],
  newyear: ["🎆", "🎇", "🥂", "✨"],
  birthday: ["🎂", "🎈", "🎉", "🎊"],
  easter: ["🐰", "🥚", "🌷", "🐣"],
};

/** Floating decorative emojis layered on top of the app for events / holidays. */
export const Decorations = () => {
  const t = useTheme();
  const kind = t["decoration"];
  if (!kind || kind === "none") return null;
  const set = EMOJIS[kind];
  if (!set) return null;
  const items = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {items.map((_, i) => {
        const e = set[i % set.length];
        const left = (i * 53) % 100;
        const delay = (i * 0.7) % 8;
        const dur = 7 + (i % 6);
        const size = 18 + ((i * 7) % 22);
        return (
          <span key={i} className="absolute animate-float-down opacity-80"
            style={{ left: `${left}%`, top: `-10%`, fontSize: size, animationDelay: `${delay}s`, animationDuration: `${dur}s` }}>
            {e}
          </span>
        );
      })}
    </div>
  );
};
