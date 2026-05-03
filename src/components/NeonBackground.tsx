import { ReactNode } from "react";

export const NeonBackground = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative min-h-screen overflow-hidden gradient-hero ${className}`}>
    {/* Glow orbs */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl animate-neon-float" />
      <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/40 blur-3xl animate-neon-float [animation-delay:-5s]" />
      <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl animate-neon-float [animation-delay:-2s]" />
    </div>
    {/* Grid overlay */}
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "linear-gradient(rgba(217,70,239,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,.3) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      }}
    />
    <div className="relative z-10">{children}</div>
  </div>
);
