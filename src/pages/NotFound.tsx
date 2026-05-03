// src/pages/NotFound.tsx
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import camplinkLogo from "@/assets/camplink-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "404 — Camplink";
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-hero px-4 py-12">
      {/* Neon glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/40 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-violet-400/30 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(217,70,239,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ perspective: "1200px" }}
      >
        {/* Logo */}
        <div className="mb-6 animate-[bob_4s_ease-in-out_infinite]">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-fuchsia-500/60 blur-2xl" />
            <img
              src={camplinkLogo}
              alt="Camplink"
              className="relative h-20 w-20 rounded-2xl shadow-[0_0_40px_rgba(217,70,239,0.8)]"
            />
          </div>
        </div>

        {/* 3D 404 */}
        <div
          className="select-none animate-[tilt_6s_ease-in-out_infinite]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <h1
            className="text-[8rem] sm:text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter bg-gradient-to-b from-white via-fuchsia-200 to-purple-300 bg-clip-text text-transparent"
            style={{
              textShadow: `
                1px 1px 0 #e879f9,
                2px 2px 0 #d946ef,
                3px 3px 0 #c026d3,
                4px 4px 0 #a21caf,
                5px 5px 0 #86198f,
                6px 6px 0 #701a75,
                7px 7px 0 #581c5c,
                8px 8px 0 #4a154b,
                10px 10px 30px rgba(0,0,0,0.7),
                0 0 60px rgba(217,70,239,0.8),
                0 0 100px rgba(168,85,247,0.6)
              `,
              transform: "rotateX(15deg) rotateY(-10deg)",
            }}
          >
            404
          </h1>
        </div>

        {/* Funny message */}
        <div className="mt-8 max-w-2xl">
          <p
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
            style={{
              textShadow:
                "0 0 20px rgba(217,70,239,0.8), 0 0 40px rgba(168,85,247,0.5), 0 4px 12px rgba(0,0,0,0.6)",
            }}
          >
            seems like shakes forgot to configure something! LOL 😂
          </p>
          <p className="mt-4 text-base sm:text-lg text-fuchsia-100/80">
            This page is lost somewhere on campus. Let's get you back home.
          </p>
        </div>

        {/* CTA */}
        <Button asChild size="lg" className="mt-10 gradient-accent shadow-glow rounded-full px-8 py-6 text-lg font-bold hover:scale-105 transition-transform">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Take me home
          </Link>
        </Button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
        }
        @keyframes tilt {
          0%, 100% { transform: rotateX(15deg) rotateY(-10deg); }
          25% { transform: rotateX(10deg) rotateY(10deg); }
          50% { transform: rotateX(20deg) rotateY(5deg); }
          75% { transform: rotateX(5deg) rotateY(-15deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
