import logo from "@/assets/camplink-logo.png";

export const Logo = ({ size = 36, withText = true }: { size?: number; withText?: boolean }) => (
  <div className="flex items-center gap-2">
    <img src={logo} alt="Camplink logo" width={size} height={size} className="rounded-lg shadow-soft" />
    {withText && <span className="text-xl font-extrabold tracking-tight">Camplink</span>}
  </div>
);
