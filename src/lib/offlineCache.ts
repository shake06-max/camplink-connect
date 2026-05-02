// Tiny localStorage cache for offline mode.
const PREFIX = "camplink:cache:";

export const cacheSet = (key: string, value: unknown) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {}
};

export const cacheGet = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return (JSON.parse(raw).v as T) ?? null;
  } catch {
    return null;
  }
};
