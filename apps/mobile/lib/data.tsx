import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import type { Area, Listing } from "./core";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link: string | null;
}

interface Data {
  announcement: Announcement | null;
  listings: Listing[];
  areas: Area[];
  areaBySlug: Map<string, Area>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saved: Set<string>;
  toggleSaved: (id: string) => void;
}

const Ctx = createContext<Data | null>(null);

export function useData(): Data {
  const v = useContext(Ctx);
  if (!v) throw new Error("useData outside <DataProvider>");
  return v;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${API_URL}/api/listings`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { listings: Listing[]; areas: Area[] };
      setListings(json.listings ?? []);
      setAreas(json.areas ?? []);
      fetch(`${API_URL}/api/announcement`)
        .then((r) => r.json())
        .then((a) => setAnnouncement(a ?? null))
        .catch(() => {});
    } catch (e) {
      setError(e instanceof Error && e.name === "AbortError" ? "The server took too long to answer." : "We couldn’t load places. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleSaved = useCallback((id: string) => {
    setSaved((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ announcement, listings, areas, areaBySlug: new Map(areas.map((a) => [a.slug, a])), loading, error, refresh, saved, toggleSaved }),
    [announcement, listings, areas, loading, error, refresh, saved, toggleSaved],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
