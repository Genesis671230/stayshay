"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Send a GA4 event; safe to call before gtag loads or when it's blocked. */
export function track(event: string, params: Record<string, unknown> = {}) {
  window.gtag?.("event", event, params);
}

function PageViews({ id }: { id: string }) {
  const path = usePathname();
  const search = useSearchParams();
  // Client-side navigations don't reload gtag.js, so report each route change ourselves.
  useEffect(() => {
    window.gtag?.("event", "page_view", { page_location: location.href, page_title: document.title, send_to: id });
  }, [id, path, search]);
  return null;
}

/** Google Analytics 4 + lead events for the clicks that matter (WhatsApp, calls, email). */
export function Analytics({ id }: { id: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (/wa\.me|whatsapp/i.test(href)) track("generate_lead", { method: "whatsapp", page: location.pathname });
      else if (href.startsWith("tel:")) track("generate_lead", { method: "call", page: location.pathname });
      else if (href.startsWith("mailto:")) track("generate_lead", { method: "email", page: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${id}',{send_page_view:false});`}
      </Script>
      <Suspense>
        <PageViews id={id} />
      </Suspense>
    </>
  );
}
