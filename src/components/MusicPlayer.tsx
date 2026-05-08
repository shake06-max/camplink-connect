import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

/** Hidden global music player. Admin controls it; users only hear it. */
export const MusicPlayer = () => {
  const t = useTheme();
  const url = t["music-url"];
  const type = t["music-type"] || "file"; // file | youtube | spotify
  const playing = t["music-playing"] === "1";
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (type === "file" && url && playing) {
      if (a.src !== url) a.src = url;
      a.loop = true;
      a.volume = 0.5;
      a.play().catch(() => { /* autoplay may be blocked until user interaction */ });
    } else {
      a.pause();
    }
  }, [url, type, playing]);

  // Re-attempt play on first user interaction (browsers block autoplay)
  useEffect(() => {
    if (type !== "file" || !playing) return;
    const tryPlay = () => audioRef.current?.play().catch(() => {});
    window.addEventListener("click", tryPlay, { once: true });
    window.addEventListener("touchstart", tryPlay, { once: true });
    return () => {
      window.removeEventListener("click", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
    };
  }, [type, playing, url]);

  // Hidden iframe embeds for YouTube / Spotify
  const renderEmbed = () => {
    if (!playing || !url) return null;
    if (type === "youtube") {
      const id = extractYouTubeId(url);
      if (!id) return null;
      const src = `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0`;
      return <iframe title="bg-music" src={src} allow="autoplay" style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none", left: -9999 }} />;
    }
    if (type === "spotify") {
      const embed = toSpotifyEmbed(url);
      if (!embed) return null;
      return <iframe title="bg-music" src={embed} allow="autoplay" style={{ position: "fixed", width: 1, height: 80, opacity: 0, pointerEvents: "none", left: -9999 }} />;
    }
    return null;
  };

  return (
    <>
      <audio ref={audioRef} hidden />
      {renderEmbed()}
    </>
  );
};

const extractYouTubeId = (u: string): string | null => {
  try {
    const url = new URL(u);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/");
    const i = parts.findIndex(p => p === "embed" || p === "shorts");
    if (i >= 0) return parts[i + 1] ?? null;
  } catch { /* ignore */ }
  return null;
};

const toSpotifyEmbed = (u: string): string | null => {
  try {
    const url = new URL(u);
    if (!url.hostname.includes("spotify.com")) return null;
    return `https://open.spotify.com${url.pathname.startsWith("/embed") ? "" : "/embed"}${url.pathname}`;
  } catch { return null; }
};
