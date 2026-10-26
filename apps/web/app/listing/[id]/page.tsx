import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AREA_BY_SLUG, TYPE_LABEL, TYPE_LABEL_PLURAL, isVerifiedCompliant, similarListings } from "@stayshay/core";
import { getAllListings, getListing, getListingsForAdmin } from "@/lib/store";
import { adminAllowed } from "@/lib/admin-guard";
import { Header } from "@/components/header";
import { Footer } from "@/components/sections";
import { Badge, Icon, aed } from "@/components/ui";
import { LocationMap, MobileBookingBar, PhotoGrid, ShareSave, ViewingFunnel } from "@/components/listing-page";
import { ListingCard } from "@/components/listing-card";
import { MarketplaceProvider } from "@/components/marketplace";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, listingLd, rentPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = await getListing((await params).id);
  if (!l) return {};
  const area = AREA_BY_SLUG.get(l.areaSlug)?.name ?? l.areaName ?? "UAE";
  return {
    title: `${l.title} · ${aed(l.priceAed)}/month · ${area}`,
    description: `${TYPE_LABEL[l.type]} in ${area} for ${aed(l.priceAed)}/month${l.billsIncluded ? ", bills included" : ""}${l.deposit ? "" : ", no deposit"}. ${l.description}`.slice(0, 160),
    alternates: { canonical: `/listing/${l.id.toLowerCase()}` },
    openGraph: { title: `${l.title} · ${aed(l.priceAed)}/month`, url: `/listing/${l.id.toLowerCase()}`, images: l.photos[0] ? [l.photos[0]] : [] },
  };
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-line py-3.5">
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14.5px] font-medium">{value}</dd>
    </div>
  );
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  // Admins can preview listings that aren't public yet (pending review, hidden, rented).
  const live = await getListing(id);
  const l = live ?? ((await adminAllowed()) ? (await getListingsForAdmin()).find((x) => x.id.toLowerCase() === id.toLowerCase()) : undefined);
  if (!l) notFound();
  const preview = !live;
  const all = await getAllListings();

  const area = AREA_BY_SLUG.get(l.areaSlug);
  const areaName = area?.name ?? l.areaName ?? "UAE";
  const typeLabel = l.typeName ?? TYPE_LABEL[l.type];
  const similar = similarListings(all, l, 4);

  const facts: [string, React.ReactNode][] = [
    ["Monthly rent", <span key="r" className="font-figure">{l.priceMaxAed ? `${aed(l.priceAed)} – ${aed(l.priceMaxAed)}` : aed(l.priceAed)}</span>],
    ["Utilities", l.utilities ?? (l.billsIncluded ? "Included" : "Not included")],
    ["Security deposit", l.deposit ? aed(l.deposit) : "None"],
    ["Upfront cost", l.upfrontCost ? aed(l.upfrontCost) : "None"],
    ["Availability", l.availability ?? "Ask the lister"],
    ["Minimum stay", l.minimumStay ?? `${l.minStayMonths} month${l.minStayMonths > 1 ? "s" : ""}`],
    ["Notice period", l.noticePeriod ?? "Ask the lister"],
    ["Bathroom", l.bathroom ?? "Ask the lister"],
    ["Sleeping set", l.sleepingSet ?? "Ask the lister"],
    ["Max people", l.maxCapacity ? String(l.maxCapacity) : "Ask the lister"],
  ];
  if (l.flatmates) facts.push(["Flatmates", l.flatmates]);
  if (l.balcony) facts.push(["Balcony", l.balcony]);

  const verified = isVerifiedCompliant(l) || l.verifiedLister;

  return (
    <MarketplaceProvider listings={all}>
      {!preview && <JsonLd data={[listingLd(l), breadcrumbLd([["Home", "/"], [TYPE_LABEL_PLURAL[l.type], rentPath(l.type)], [areaName, rentPath(l.type, l.areaSlug)], [l.title, `/listing/${l.id.toLowerCase()}`]])]} />}
      <Header />
      <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-4 md:px-8 lg:pb-20">
        {preview && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[#fbefdc] px-4 py-3 text-[14px] text-[#8a5a14]">
            <span>
              <b>Admin preview</b> · this listing is <b>{(l.status ?? "hidden").replace("_", " ")}</b> and not visible to renters.
            </span>
            <a href="/admin" className="font-semibold underline">
              Approve in admin
            </a>
          </div>
        )}
        <nav className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link>
          <Icon name="chevron-right" size={12} />
          <Link href={rentPath(l.type)} className="hover:text-ink">{TYPE_LABEL_PLURAL[l.type]}</Link>
          <Icon name="chevron-right" size={12} />
          <Link href={rentPath(l.type, l.areaSlug)} className="hover:text-ink">{areaName}</Link>
        </nav>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-[30px] leading-[1.1] md:text-[40px]">{l.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-ink-2">
              <span>{typeLabel}</span>
              <span className="flex items-center gap-1.5"><Icon name="pin" size={15} /> {areaName}{l.city && l.city !== areaName ? `, ${l.city}` : ""}</span>
              {l.metro && (
                <span className="flex items-center gap-1.5">
                  <Icon name="train" size={15} /> {l.metro}{l.nearMetroMinutes != null ? ` · ${l.nearMetroMinutes} min walk` : ""}
                </span>
              )}
              <span className="font-figure text-muted">Ref {l.id}</span>
            </p>
          </div>
          <ShareSave listing={l} />
        </div>

        <div className="mt-5">
          <PhotoGrid listing={l} />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              {verified && (
                <Badge tone="verified">
                  <Icon name="check" size={12} /> Verified listing
                </Badge>
              )}
              {l.billsIncluded && <Badge>Bills included</Badge>}
              {!l.deposit && <Badge>No deposit</Badge>}
              {!l.upfrontCost && <Badge>No upfront cost</Badge>}
              {l.gender !== "any" && <Badge>{l.gender === "female" ? "Female only" : "Male only"}</Badge>}
              {l.preferredTenant?.some((t) => /couple/i.test(t)) && <Badge>Couples welcome</Badge>}
            </div>

            <section className="mt-8 border-b border-line pb-8">
              <h2 className="font-display text-[24px]">About this {TYPE_LABEL[l.type].toLowerCase()}</h2>
              <div className="mt-3 space-y-2 text-[15.5px] leading-relaxed text-ink-2">
                {(l.descriptionLines?.length ? l.descriptionLines : [l.description]).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>

            <section className="border-b border-line py-8">
              <h2 className="font-display text-[24px]">The details</h2>
              <dl className="mt-2 grid grid-cols-2 gap-x-8 md:grid-cols-3">
                {facts.map(([k, v]) => (
                  <Fact key={k} label={k} value={v} />
                ))}
              </dl>
            </section>

            {!!l.features?.length && (
              <section className="border-b border-line py-8">
                <h2 className="font-display text-[24px]">What’s included</h2>
                <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-[14.5px] text-ink-2 sm:grid-cols-2">
                  {l.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Icon name="check" size={16} className="shrink-0 text-verified" /> {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {(!!l.preferredTenant?.length || !!l.preferredNationality?.length) && (
              <section className="border-b border-line py-8">
                <h2 className="font-display text-[24px]">Who can live here</h2>
                {!!l.preferredTenant?.length && (
                  <div className="mt-4">
                    <p className="text-[13px] font-semibold">Tenants</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{l.preferredTenant.map((t) => <Badge key={t}>{t}</Badge>)}</div>
                  </div>
                )}
                {!!l.preferredNationality?.length && (
                  <div className="mt-4">
                    <p className="text-[13px] font-semibold">Open to</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{l.preferredNationality.map((t) => <Badge key={t}>{t}</Badge>)}</div>
                  </div>
                )}
              </section>
            )}

            <section className="border-b border-line py-8">
              <h2 className="font-display text-[24px]">Where you’ll be</h2>
              <p className="mt-1 text-[14px] text-muted">
                {areaName}
                {l.metro ? ` · near ${l.metro} metro` : ""}. {l.lat ? "The exact address is shared after you contact the lister." : "Pin shows the area centre."}
              </p>
              <div className="mt-4">
                <LocationMap listing={l} />
              </div>
            </section>

            <section className="py-8">
              <h2 className="font-display text-[24px]">Before you pay</h2>
              <ul className="mt-4 space-y-3 text-[14.5px] text-ink-2">
                <li className="flex gap-3"><Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brass" /> View the place in person and meet the lister before sending any money.</li>
                <li className="flex gap-3"><Icon name="key" size={18} className="mt-0.5 shrink-0 text-brass" /> Ask for the landlord’s written consent if you’re renting from a tenant, and the permit for partitions.</li>
                <li className="flex gap-3"><Icon name="wallet" size={18} className="mt-0.5 shrink-0 text-brass" /> Get a receipt for the deposit and agree the notice period in writing.</li>
              </ul>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[88px] rounded-[22px] border border-line p-6 shadow-[0_10px_32px_rgb(0_0_0/0.06)]">
              <ViewingFunnel listing={l} />
            </div>
            <p className="mt-3 px-1 text-[12px] text-muted">Listed by {l.listerName}{l.views ? ` · ${l.views.toLocaleString("en-US")} views` : ""}</p>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-6 border-t border-line pt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-[28px]">More near {areaName}</h2>
              <Link href={`/areas/${l.areaSlug}`} className="text-[14px] font-medium underline underline-offset-4">See all</Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => (
                <ListingCard key={s.id} listing={s} />
              ))}
            </div>
          </section>
        )}
      </main>
      <MobileBookingBar listing={l} />
      <Footer />
    </MarketplaceProvider>
  );
}
