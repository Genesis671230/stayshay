import Link from "next/link";
import { ReviewPrompt } from "./review-prompt";
import { TOOLS, approvedReviews, reviewStats, type ToolKey } from "@/lib/reviews";

const Stars = ({ n }: { n: number }) => (
  <span className="text-[16px] tracking-[1px] text-[#f5b301]" aria-label={`${n} out of 5`}>
    {"★".repeat(n)}
    <span className="text-line">{"★".repeat(5 - n)}</span>
  </span>
);

/**
 * What people say, from approved reviews only. Each card names the tool the person used and links to it, so a
 * testimonial is also a way into the tool. With no approved reviews yet, it asks for the first one instead of faking it.
 */
export async function Testimonials({ tool, title = "What people say", className = "" }: { tool?: ToolKey; title?: string; className?: string }) {
  const [reviews, stats] = await Promise.all([approvedReviews(tool, 6), reviewStats()]);
  return (
    <section className={`mx-auto max-w-[1240px] px-4 py-10 md:px-8 md:py-14 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Real reviews</p>
          <h2 className="font-display mt-2 text-[30px] leading-[1.08] md:text-[40px]">{title}</h2>
          {stats.count > 0 && (
            <p className="mt-2 text-[14.5px] text-ink-2">
              <Stars n={Math.round(stats.avg)} /> <b className="text-ink">{stats.avg.toFixed(1)}</b> from {stats.count} {stats.count === 1 ? "review" : "reviews"}, checked by our team before they appear.
            </p>
          )}
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="card flex flex-col p-5">
              <Stars n={r.rating} />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">“{r.text}”</blockquote>
              <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <span className="text-[14px]">
                  <b>{r.name}</b>
                  {r.role && <span className="text-muted"> · {r.role}</span>}
                </span>
                <Link href={TOOLS[r.tool].href} className="rounded-full bg-mint px-3 py-1 text-[12px] font-semibold text-brand hover:bg-brand hover:text-white">
                  Used {TOOLS[r.tool].name} →
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-4 max-w-[640px] text-[15px] text-ink-2">We only show reviews from real people who used Stayshay, after our team checks them. Be one of the first.</p>
      )}

      <div className="mt-6 max-w-[640px]">
        <ReviewPrompt tool={tool ?? "stayshay"} question={tool ? `Used ${TOOLS[tool].name}? Rate it` : "Used Stayshay? Rate your experience"} />
      </div>
    </section>
  );
}
