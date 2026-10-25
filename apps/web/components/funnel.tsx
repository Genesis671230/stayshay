"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon, Logo } from "./ui";

/** Focused, distraction-free step layout shared by the tenant and owner funnels. */
export function FunnelShell({
  step,
  total,
  title,
  subtitle,
  aside,
  image,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  busy,
  footerNote,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  aside: React.ReactNode;
  image: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  busy?: boolean;
  footerNote?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-[68px] items-center justify-between px-5 md:px-10">
          <Link href="/" aria-label="Stayshay home">
            <Logo />
          </Link>
          <Link href="/" className="text-[13.5px] text-muted hover:text-ink">
            Exit
          </Link>
        </header>
        <div className="px-5 md:px-10" aria-hidden>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-line">
            <div className="h-full bg-brand transition-[width] duration-500" style={{ width: `${(step / total) * 100}%` }} />
          </div>
          <p className="font-figure mt-2 text-[12px] text-muted">
            Step {Math.min(step, total)} of {total}
          </p>
        </div>

        <main className="flex flex-1 flex-col px-5 pb-32 pt-8 md:px-10 lg:pb-12 lg:pt-14">
          <div className="mx-auto w-full max-w-[620px]">
            <h1 className="font-display text-[32px] leading-[1.08] md:text-[42px]">{title}</h1>
            {subtitle && <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>

        {(onNext || onBack) && (
          <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-5 py-3 md:px-10 lg:static lg:border-t lg:py-5">
            <div className="mx-auto flex max-w-[620px] items-center justify-between gap-3">
              {onBack ? (
                <button onClick={onBack} className="flex h-12 items-center gap-1.5 px-1 text-[14.5px] font-medium underline underline-offset-4">
                  <Icon name="chevron-left" size={16} /> Back
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-4">
                {footerNote && <span className="hidden text-[13px] text-muted sm:inline">{footerNote}</span>}
                {onNext && (
                  <button
                    onClick={onNext}
                    disabled={nextDisabled || busy}
                    className="flex h-12 items-center gap-2 rounded-[12px] bg-brand px-6 text-[15px] font-medium text-white transition-opacity disabled:opacity-35"
                  >
                    {busy ? "Sending…" : nextLabel} {!busy && <Icon name="arrow-right" size={16} />}
                  </button>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>

      <aside className="relative hidden bg-surface lg:block">
        <div className="sticky top-0 h-screen">
          <Image src={image} alt="" fill priority sizes="45vw" className="object-cover" />
          <div className="absolute inset-x-8 bottom-8">{aside}</div>
        </div>
      </aside>
    </div>
  );
}

export function OptionCard({
  selected,
  onClick,
  title,
  hint,
  image,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  image?: string;
  icon?: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group flex w-full items-center gap-4 rounded-[18px] border bg-white p-3 text-left transition-colors ${selected ? "border-brand ring-1 ring-brand" : "border-line hover:border-brand-2"}`}
    >
      {image ? (
        <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[12px] bg-surface">
          <Image src={image} alt="" fill sizes="80px" className="object-cover" />
        </span>
      ) : icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center text-ink">
          <Icon name={icon} size={22} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-medium">{title}</span>
        {hint && <span className="mt-0.5 block text-[13px] text-muted">{hint}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-brand bg-brand text-white" : "border-line-strong"}`}>
        {selected && <Icon name="check" size={13} />}
      </span>
    </button>
  );
}

/** Proof panel on the photo: a big number and a line. */
export function AsideStat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="rounded-[18px] bg-white p-5 shadow-[0_12px_40px_rgb(0_0_0/0.16)]">
      <p className="font-figure text-[40px] font-semibold leading-none">{value}</p>
      <p className="mt-2 text-[15px] font-medium">{label}</p>
      {note && <p className="mt-1 text-[13px] leading-relaxed text-muted">{note}</p>}
    </div>
  );
}

export const fieldCls = "w-full rounded-[16px] border border-line bg-white px-4 py-3.5 text-[16px] focus:border-brand focus:outline-none";
