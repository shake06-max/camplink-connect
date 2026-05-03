import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { NeonBackground } from "@/components/NeonBackground";
import camplinkLogo from "@/assets/camplink-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
    document.title = "404 — Camplink";
  }, [location.pathname]);

  return (
    <NeonBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 text-center" style={{ perspective: "1200px" }}>
        <div className="mb-6 animate-neon-bob">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-fuchsia-500/60 blur-2xl" />
            <img src={camplinkLogo} alt="Camplink" className="relative h-20 w-20 rounded-2xl shadow-neon" />
          </div>
        </div>

        <h1 className="text-[8rem] sm:text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter text-white text-3d animate-neon-tilt select-none">
          404
        </h1>

        <p className="mt-8 max-w-2xl text-2xl sm:text-3xl md:text-4xl font-bold text-white neon-glow-text">
          seems like shakes forgot to configure something! LOL 😂
        </p>
        <p className="mt-4 text-base sm:text-lg text-fuchsia-100/80">
          This page is lost somewhere on campus. Let's get you back home.
        </p>

        <Button asChild size="lg" className="mt-10 gradient-accent shadow-glow rounded-full px-8 py-6 text-lg font-bold hover-scale">
          <Link to="/"><Home className="mr-2 h-5 w-5" />Take me home</Link>
        </Button>
      </div>
    </NeonBackground>
  );
};

export default NotFound;
