import Link from "next/link";
import { ReviewPrompt } from "./review-prompt";
import { TOOLS, approvedReviews, reviewStats, type ToolKey } from "@/lib/reviews";

const Stars = ({ n }: { n: number }) => (
  <span className="text-[17px] tracking-[2px] text-brand-deep" aria-label={`${n} out of 5`}>
    {"★".repeat(n)}
    <span className="text-brand-deep/20">{"★".repeat(5 - n)}</span>
  </span>
);

/**
 * What people say, from approved reviews only. Each card names the tool the person used and links to it, so a
 * testimonial is also a way into the tool. With no approved reviews yet, it asks for the first one instead of faking it.
 */
export async function Testimonials({ tool, title = "What our renters say", className = "" }: { tool?: ToolKey; title?: string; className?: string }) {
  const [reviews, stats] = await Promise.all([approvedReviews(tool, 6), reviewStats()]);
  return (
    <section id="reviews" className={`mx-auto max-w-[1240px] scroll-mt-24 px-4 py-14 md:px-8 md:py-20 ${className}`}>
      <div className="text-center">
        <p className="eyebrow">Real reviews</p>
        <h2 className="font-display mt-2 text-[34px] leading-[1.05] md:text-[52px]">{title}</h2>
        {stats.count > 0 ? (
          <p className="mt-3 text-[15px] text-ink-2">
            <Stars n={Math.round(stats.avg)} /> <b className="text-ink">{stats.avg.toFixed(1)}</b> from {stats.count} {stats.count === 1 ? "review" : "reviews"}, each checked by our team before it appears.
          </p>
        ) : (
          <p className="mx-auto mt-3 max-w-[560px] text-[15.5px] text-ink-2">Only real people who used Stayshay, checked by our team before they appear. No paid or made-up reviews.</p>
        )}
      </div>

      {reviews.length > 0 && (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="flex flex-col rounded-[24px] border border-brand/15 bg-[#ecf8ee] p-6 md:p-7">
              <Stars n={r.rating} />
              <blockquote className="mt-4 flex-1 text-[15.5px] leading-relaxed text-ink">“{r.text}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[16px] font-bold text-white">{r.name.trim()[0]?.toUpperCase()}</span>
                <span className="min-w-0 flex-1 text-[14px] leading-tight">
                  <b className="block text-ink">{r.name}</b>
                  {r.role && <span className="text-ink-2">{r.role}</span>}
                </span>
                <Link href={TOOLS[r.tool].href} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-brand hover:bg-brand hover:text-white">
                  {TOOLS[r.tool].name} →
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="mx-auto mt-10 max-w-[720px] rounded-[24px] border border-brand/15 bg-[#ecf8ee] p-6 md:p-8">
        <ReviewPrompt tool={tool ?? "stayshay"} question={reviews.length ? "Found your place with us? Add your review" : "Be one of the first: how was Stayshay for you?"} />
        <p className="mt-4 text-[13px] text-ink-2">
          Used a free tool?{" "}
          {(["fair-rent", "budget", "move-in-cost"] as ToolKey[]).map((k, i) => (
            <span key={k}>
              {i > 0 && " · "}
              <Link href={TOOLS[k].href} className="font-semibold text-brand underline underline-offset-4">
                {TOOLS[k].name}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
