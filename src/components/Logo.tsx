import logo from "@/assets/camplink-logo.png";
import { useTheme } from "@/lib/theme";

export const Logo = ({ size = 36, withText = true }: { size?: number; withText?: boolean }) => {
  const t = useTheme();
  const src = t["logo-url"] || logo;
  const name = t["app-name"] || "Camplink";
  return (
    <div className="flex items-center gap-2">
      <img src={src} alt={`${name} logo`} width={size} height={size} className="rounded-lg shadow-soft object-cover" style={{ height: size, width: size }} />
      {withText && <span className="text-xl font-extrabold tracking-tight">{name}</span>}
    </div>
  );
};
