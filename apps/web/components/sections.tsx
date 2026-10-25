import Image from "next/image";
import Link from "next/link";
import { BRAND, coverFor } from "@stayshay/core";
import { Icon, Logo } from "./ui";
import { stayshayWhatsapp } from "@/lib/contact";

const H2 = "font-display mt-2 text-[34px] leading-[1.08] md:text-[44px]";

const TENANT_STEPS = [
  ["Search or ask", "Filter by area, metro, budget and move-in date, or answer five questions and we’ll match you."],
  ["Check the details", "Rent, deposit, upfront cost, bills, bathroom and who can live there, on every listing."],
  ["Book a viewing", "One tap sends the lister your name, date and budget on WhatsApp."],
  ["View, then pay", "Never transfer money before you’ve seen the place and met the lister."],
];
const OWNER_STEPS = [
  ["Tell us about it", "Type, area, rent and who it suits. About two minutes."],
  ["Send photos", "Share 4 to 8 photos on WhatsApp. We write and check the listing."],
  ["Get verified", "Phone and ID checked; consent and permit details earn the compliance badge."],
  ["Take inquiries", "Renters reach you pre-qualified. Mark it rented in one tap."],
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
      <p className="eyebrow">How it works</p>
      <h2 className={H2}>Simple on both sides</h2>
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[
          ["For renters", TENANT_STEPS, "/find", "Find me a room"],
          ["For owners", OWNER_STEPS, "/list", "List your place"],
        ].map(([title, steps, href, cta]) => (
          <div key={title as string} className="rounded-[22px] border border-line p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-[26px]">{title as string}</h3>
              <Link href={href as string} className="flex h-10 shrink-0 items-center gap-1.5 rounded-[12px] bg-brand px-4 text-[14px] font-medium text-white">
                {cta as string} <Icon name="arrow-right" size={15} />
              </Link>
            </div>
            <ol className="mt-6 space-y-5">
              {(steps as string[][]).map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-figure flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-[13px] font-semibold text-brass">{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-medium">{t}</span>
                    <span className="mt-0.5 block text-[14px] leading-relaxed text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Trust() {
  const items: { icon: Parameters<typeof Icon>[0]["name"]; title: string; body: string }[] = [
    {
      icon: "shield",
      title: "Verified compliant",
      body: "The lister uploaded the landlord’s written consent and, for partitions, declared a shared-housing permit. We check the documents are complete and match the listing.",
    },
    { icon: "key", title: "Verified lister", body: "Phone verified, with identity checked against Emirates ID. UAE PASS sign-in is on the way." },
    { icon: "flag", title: "Report in two taps", body: "Already rented, wrong price, unsafe or looks like a scam? We review reports within 24 hours and pause the listing while we check." },
    { icon: "wallet", title: "Never pay before viewing", body: "Don’t send a deposit or rent before you’ve seen the place. Stayshay will never ask you to pay over WhatsApp." },
  ];
  return (
    <section className="bg-brand text-white">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <p className="eyebrow">Trust &amp; safety</p>
          <h2 className={`${H2} text-white`}>Safety you can see on every listing</h2>
          <p className="mt-4 max-w-[440px] text-[15.5px] leading-relaxed text-white/75">
            Dubai’s shared-housing rules now require permits for partitions and landlord consent for sharing. We show you what’s been declared and checked before you pick up the phone.
          </p>
          <p className="mt-6 max-w-[440px] border-l-2 border-brass pl-4 text-[13px] leading-relaxed text-white/60">
            Badges show what we’ve checked. They aren’t a government approval or a legal guarantee. Read the listing and your contract before you sign.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[16px] bg-white/12 sm:grid-cols-2">
          {items.map((it) => (
            <div key={it.title} className="bg-brand p-6">
              <Icon name={it.icon} size={22} className="text-brass" />
              <h3 className="mt-4 text-[16px] font-semibold">{it.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ListerCta() {
  const benefits = [
    ["Free to list", "No commission, no card."],
    ["Pre-qualified inquiries", "Each one arrives with move-in date and budget."],
    ["Compliance badge", "Upload consent and permit details to get Verified compliant. Renters filter for it."],
    ["Mark rented in one tap", "The calls stop once your room is let."],
  ];
  return (
    <section id="list" className="mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
      <div className="grid grid-cols-1 overflow-hidden rounded-[22px] border border-line lg:grid-cols-2">
        <div className="relative min-h-[280px] bg-surface">
          <Image src={coverFor("room", 5) ?? ""} alt="Furnished room ready for tenants" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="p-6 md:p-10">
          <p className="eyebrow">For owners and landlords</p>
          <h2 className={H2}>Fill your room without the back-and-forth</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">List for free in under five minutes. Get WhatsApp inquiries that already include name, move-in date and budget.</p>
          <ul className="mt-6 space-y-3.5">
            {benefits.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-verified" />
                <span className="text-[14.5px]">
                  <span className="font-medium">{t}.</span> <span className="text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/list" className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-brand px-6 text-[15px] font-medium text-white">
              List for free <Icon name="arrow-right" size={16} />
            </Link>
            <a href="#faq" className="flex h-12 items-center justify-center rounded-[12px] border border-line-strong px-6 text-[15px] font-medium">
              How verification works
            </a>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
            Partitions and bed spaces need landlord consent and the applicable permit. We may pause listings we can’t check.
          </p>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="request" className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-4 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
        {[
          ["Looking for a place?", "Answer five quick questions. We’ll show what fits now and WhatsApp you new matches.", "/find", "Find me a room", coverFor("bed_space", 2)],
          ["Have a room to rent?", "List for free in two minutes and get renters who already know your price and rules.", "/list", "List your place", coverFor("partition", 2)],
        ].map(([t, d, href, cta, img]) => (
          <Link key={href} href={href!} className="group grid grid-cols-[minmax(0,1fr)_120px] overflow-hidden rounded-[22px] border border-line bg-white sm:grid-cols-[minmax(0,1fr)_180px]">
            <span className="p-6 md:p-8">
              <span className="font-display block text-[26px] leading-tight md:text-[30px]">{t}</span>
              <span className="mt-2 block text-[14.5px] leading-relaxed text-muted">{d}</span>
              <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-5 text-[14.5px] font-medium text-white">
                {cta} <Icon name="arrow-right" size={15} />
              </span>
            </span>
            <span className="relative bg-surface">
              {img && <Image src={img} alt="" fill sizes="180px" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const FAQ: [string, string][] = [
  [
    "Are partitions legal in Dubai?",
    "Only with the right approvals. Under Dubai’s shared-housing rules, partitioned rooms and bed spaces need a permit, and only owners or licensed operators may rent them out. A tenant needs the landlord’s written consent to sublet. On Stayshay, listings that declare consent and a permit get a Verified compliant badge once we’ve checked the documents. Stayshay is not a government body and doesn’t issue or confirm permits. For a definitive answer, check with Dubai Municipality.",
  ],
  ["Is Stayshay free?", "Yes, for renters. Listing is free for landlords too. Optional boosts will come later."],
  ["Does Stayshay charge commission?", "No. Some listers do, and their listings say so. Use the No commission filter to hide them."],
  ["What does “Verified lister” mean?", "We’ve confirmed the lister’s phone number and identity. It doesn’t mean we’ve inspected the property, so always view before you pay."],
  ["How do I contact a lister?", "Tap WhatsApp on any listing. Your name, move-in date and budget are filled in for you, and we keep a record of the request."],
  ["Should I pay a deposit to hold a room?", "Not before you’ve viewed it in person. If someone pressures you to pay first, report the listing."],
  ["Can Stayshay find a place for me?", "Yes. Answer five questions in Find me a room and we’ll show what fits now, then WhatsApp you new matches and help book viewings."],
  ["Which cities do you cover?", "Dubai first, then Sharjah, Abu Dhabi and Ajman. Rules differ by emirate, and badges follow Dubai rules unless the listing says otherwise."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[880px] px-4 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-center">Questions</p>
      <h2 className={`${H2} text-center`}>Good to know before you move</h2>
      <div className="mt-10 divide-y divide-line border-y border-line">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[16px] font-medium">
              {q}
              <Icon name="chevron-down" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
          }),
        }}
      />
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-[300px] text-[14px] leading-relaxed text-muted">{BRAND.tagline}</p>
          <a
            href={stayshayWhatsapp("Hi Stayshay, I have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[12px] border border-line px-4 text-[14px] font-medium text-whatsapp"
          >
            <Icon name="whatsapp" size={16} /> Talk to us
          </a>
        </div>
        {[
          ["Renters", ["Rooms", "Bed spaces", "Partitions", "Studios"]],
          ["Listers", ["List for free", "Verification", "Lister guidelines"]],
          ["Company", ["About", "Privacy", "Terms", BRAND.supportEmail]],
        ].map(([title, links]) => (
          <div key={title as string}>
            <p className="text-[13px] font-semibold">{title}</p>
            <ul className="mt-3 space-y-2">
              {(links as string[]).map((l) => (
                <li key={l} className="text-[14px] text-muted">
                  {l.includes("@") ? <a href={`mailto:${l}`} className="hover:text-ink">{l}</a> : l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-[12px] leading-relaxed text-muted md:flex-row md:justify-between md:px-8">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. A listings marketplace. We are not a government body and do not issue permits. Badges reflect documents listers provide and the checks we run on them.
          </p>
          <p className="shrink-0">Photos: Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
