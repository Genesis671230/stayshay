import Image from "next/image";
import Link from "next/link";
import { PROJECTS, TEAM, projectsFor, type Project } from "@/lib/portfolio";

export function ProjectCard({ x, big = false, priority = false }: { x: Project; big?: boolean; priority?: boolean }) {
  return (
    <Link href={`/work/${x.slug}`} className="group relative block overflow-hidden rounded-[26px] bg-ink">
      <div className={`relative ${big ? "aspect-[4/3] md:aspect-[16/11]" : "aspect-[4/3.2]"}`}>
        <Image src={x.cover} alt={`${x.name}, ${x.location}`} fill priority={priority} sizes={big ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0)_45%,rgb(0_0_0/0.72)_100%)]" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-ink backdrop-blur">{x.category}</span>
        <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-lime text-[18px] text-brand-deep transition-transform group-hover:rotate-45">↗</span>
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-white/75">{x.location}</p>
          <p className={`font-display mt-1 text-white ${big ? "text-[30px] md:text-[44px]" : "text-[26px]"} leading-[1.02]`}>{x.name}</p>
          <p className="mt-1.5 line-clamp-1 text-[14px] text-white/85">{x.tagline}</p>
        </div>
      </div>
    </Link>
  );
}

/** "15+ years" credentials strip used on the work, services and project pages. */
export function ExpertiseBand({ dark = true }: { dark?: boolean }) {
  return (
    <div className={`grid grid-cols-1 gap-8 rounded-[30px] p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr] ${dark ? "bg-brand-deep text-white" : "bg-[#ecf8ee] text-ink"}`}>
      <div>
        <p className={`text-[12px] font-bold uppercase tracking-[0.14em] ${dark ? "text-lime" : "text-brand"}`}>Design & build team</p>
        <p className="font-display mt-3 text-[64px] leading-none md:text-[92px]">
          {TEAM.years}
          <span className={`ml-2 align-top text-[18px] font-semibold md:text-[22px] ${dark ? "text-white/70" : "text-ink-2"}`}>years</span>
        </p>
        <p className={`mt-4 max-w-[460px] text-[15.5px] leading-relaxed ${dark ? "text-white/85" : "text-ink-2"}`}>{TEAM.line} One team from first sketch to handover, so nothing gets lost between design and site.</p>
      </div>
      <div className="space-y-6">
        <div>
          <p className={`text-[12.5px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-white/60" : "text-muted"}`}>We build</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {TEAM.sectors.map((s) => (
              <span key={s} className={`rounded-full px-3.5 py-1.5 text-[14px] font-semibold ${dark ? "bg-white/10 text-white" : "bg-white text-ink"}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className={`text-[12.5px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-white/60" : "text-muted"}`}>In-house disciplines</p>
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {TEAM.disciplines.map((d) => (
              <span key={d} className={`flex items-center gap-2 text-[14px] ${dark ? "text-white/85" : "text-ink-2"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dark ? "bg-lime" : "bg-brand"}`} />
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Selected projects block for service pages, the services hub and the homepage. */
export function WorkShowcase({ service, title = "Our work speaks first", eyebrow = "Selected projects", compact = false, className = "" }: { service?: string; title?: string; eyebrow?: string; compact?: boolean; className?: string }) {
  const list = service ? projectsFor(service, compact ? 3 : 5) : PROJECTS.slice(0, compact ? 3 : 5);
  const [first, ...rest] = list;
  return (
    <section className={`mx-auto max-w-[1240px] px-4 md:px-8 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="font-display mt-2 text-[32px] leading-[1.04] md:text-[48px]">{title}</h2>
          <p className="mt-2 max-w-[620px] text-[15.5px] text-ink-2">Villas, penthouses and offices designed and built end to end by our team in Dubai.</p>
        </div>
        <Link href="/work" className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border border-line-strong px-5 text-[14.5px] font-semibold hover:border-ink md:self-auto">
          View all projects <span aria-hidden>↗</span>
        </Link>
      </div>
      {compact ? (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {list.map((x) => (
            <ProjectCard key={x.slug} x={x} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <ProjectCard x={first} big />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {rest.slice(0, 4).map((x) => (
              <ProjectCard key={x.slug} x={x} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
