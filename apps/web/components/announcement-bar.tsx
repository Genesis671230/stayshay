"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./ui";

export interface PublicAnnouncement {
  id: string;
  title: string;
  message: string;
  link?: string | null;
}

/** Site-wide banner for the live announcement; dismissing hides that one announcement in this browser. */
export function AnnouncementBar({ a }: { a: PublicAnnouncement | null }) {
  const [hidden, setHidden] = useState(true);
  const path = usePathname();
  useEffect(() => {
    if (!a) return;
    try {
      setHidden(localStorage.getItem("stayshay:dismissed") === a.id);
    } catch {
      setHidden(false);
    }
  }, [a]);
  if (!a || hidden || path?.startsWith("/admin")) return null;
  return (
    <div className="bg-brand-deep text-white">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-4 py-2.5 md:px-8">
        <span className="h-2 w-2 shrink-0 rounded-full bg-fresh" aria-hidden />
        <p className="min-w-0 flex-1 text-[13.5px] leading-snug">
          <span className="font-bold">{a.title}</span> <span className="text-white/85">{a.message}</span>
          {a.link && (
            <a href={a.link} className="ml-2 font-semibold text-[#8fe3bd] underline underline-offset-2">
              Learn more
            </a>
          )}
        </p>
        <button
          aria-label="Dismiss"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem("stayshay:dismissed", a.id);
            } catch {}
          }}
          className="shrink-0 rounded-full p-1 text-white/70 hover:text-white"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
}
