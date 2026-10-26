# Stayshay SEO, AI-search & growth playbook

Goal: rank #1 in the UAE for shared/monthly housing searches ("bed space Dubai", "partition Karama", "room for rent Al Nahda Sharjah", "cheap studio monthly Dubai", "dubizzle rooms alternative") and be the source ChatGPT, Claude, Perplexity and Gemini cite and call.

## What's built (in the code)

| Piece | Where | Why it ranks |
| --- | --- | --- |
| Indexing on, GA4 (`G-12X8446CFV`, override with `NEXT_PUBLIC_GA_ID`) + lead events (`generate_lead`: whatsapp / viewing_request / find_me_a_room / call / email) | `app/layout.tsx`, `components/analytics.tsx` | Measure what converts. Mark `generate_lead` as a key event in GA4. |
| Programmatic landing pages: `/rent/{bed-space,partitions,rooms,studios}`, `/rent/<type>/<area>`, `/areas/<area>`, `/areas` | `app/rent`, `app/areas`, `components/seo-landing.tsx` | One page per search intent × area, live prices in the title ("from AED 400"), FAQ answered from live data. Empty combos are `noindex,follow`. |
| `/deals`: Shay's ranked below-market listings | `app/deals`, `packages/core/src/deals.ts` | "cheap ___ Dubai" intent; fresh every visit. |
| 14 guides (`/blog`) with live price tables, live listing cards, FAQ schema, RSS | `lib/blog.ts`, `app/blog` | Topical authority + long-tail. Covers come from our own listing photos. |
| JSON-LD: Organization, WebSite+SearchAction (`/search?q=`), RealEstateListing+Offer per listing, BreadcrumbList, ItemList, FAQPage, Article | `lib/seo.ts` | Rich results, sitelinks search box, AI extraction. |
| `sitemap.xml` (every page, listing + images), `robots.txt` (AI bots explicitly allowed), canonicals on every page, OG image, manifest | `app/sitemap.ts`, `app/robots.ts` | Crawl coverage. |
| Footer "Popular searches" + header links to landing pages; listing breadcrumbs → landing pages | `components/sections.tsx`, `header.tsx` | Internal link equity to money pages. |
| **MCP server** `https://stayshay.com/mcp` (search, fetch, search_listings, best_deals, request_viewing) | `lib/mcp.ts`, `app/mcp/route.ts` | ChatGPT connectors/apps, Claude connectors, Cursor etc. Viewing requests land in /admin as source "ChatGPT / Claude". |
| GPT Actions: `/openapi.json`, `/api/public/{search,deals,listing/:id}`; `/.well-known/ai-plugin.json`, `/.well-known/mcp.json` | `app/openapi.json`, `app/api/public` | Custom GPTs and agent discovery. |
| `llms.txt` / `llms-full.txt` (every live listing) | `lib/llms.ts` | AI crawlers read these. |
| `/ai` setup page | `app/ai` | Linkable asset; tells users how to add Stayshay to ChatGPT/Claude. |
| `?q=` free-text search ("female bed space Karama under 900 bills") | `parseSearchText` in core | Powers the search box schema + MCP `search`. |

## Do these now (need your accounts; ~1 hour total)

1. **Google Search Console**: add the `stayshay.com` domain property (DNS TXT in Cloudflare), or set `GOOGLE_SITE_VERIFICATION=<token>` in `apps/web/.env` on the server and restart. Submit `https://stayshay.com/sitemap.xml`. Request indexing for `/`, `/rent/bed-space`, `/rent/partitions`, `/rent/rooms`, `/rent/studios`, `/deals`, `/blog`.
2. **Bing Webmaster Tools**: import from GSC (or `BING_SITE_VERIFICATION`), submit the sitemap. Bing feeds ChatGPT search and Copilot, so this matters as much as Google.
3. **GA4**: Admin → Events → mark `generate_lead` as a key event. Link GA4 ↔ Search Console.
4. **Cloudflare**: Security → Bots → make sure **"Block AI bots"/AI Crawl Control is OFF** for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User, PerplexityBot; and turn off "Managed robots.txt" (it prepends content-signal rules to ours).
5. **Google Business Profile**: "Stayshay", category *Real estate rental agency*, Dubai service area, WhatsApp number, link to the site. Post weekly (new deals).
6. **ChatGPT app**: in ChatGPT → Settings → Apps & Connectors → Create → URL `https://stayshay.com/mcp`, auth None. Test, then submit to the ChatGPT app directory (OpenAI developer platform → Apps) so any user can find "Stayshay" without setup. Also publish a custom GPT "Stayshay: Dubai rooms & bed spaces" using `/openapi.json` and list it in the GPT Store.
7. **Claude**: Settings → Connectors → Add custom connector → `https://stayshay.com/mcp`. Submit to the Anthropic connectors directory when open for submissions.
8. **MCP registries** (free backlinks + discovery): the official MCP Registry (registry.modelcontextprotocol.io), Smithery, mcp.so, PulseMCP, Glama. Use the `/.well-known/mcp.json` card.

## Backlinks: the honest, durable plan

No paid link farms or PBNs: Google penalises them and they'd sink a new domain. These do work:

**Week 1: foundations (≈25 links)**
- Business listings: Google Business Profile, Bing Places, Apple Business Connect, Yellow Pages UAE, Connect.ae, UAE Business Directory, Hotfrog UAE, Cylex UAE, Crunchbase, LinkedIn company page, Product Hunt (launch "Shay, the AI room-finder for Dubai"), BetaList, AlternativeTo (as alternative to Dubizzle/Bayut for rooms), G2/Capterra not relevant.
- Social profiles with link in bio: Instagram, TikTok, Facebook page, X, YouTube, Pinterest (pin every listing photo → listing URL), Reddit account.
- MCP/AI directories listed above; "There's an AI for that", Futurepedia, TopAI.tools.

**Weeks 2–6: community + content (where renters actually are)**
- Reddit r/dubai, r/UAE, r/DubaiJobs, r/expats: answer "where do I find a bed space / partition" threads genuinely; link the relevant guide, not the homepage. 2–3 helpful answers a week. (Use `.claude/agents/reddit-community-builder.md`.)
- Facebook groups (Bed Space Dubai, Partition Dubai, Indian/Filipino/Pakistani expats in UAE): share the weekly `/deals` page and guides.
- Quora: "cheapest area to live in Dubai", "is partition legal in Dubai", "how to find a roommate in Dubai": answer with live numbers + link.
- Linkable data asset: a monthly **"Stayshay Shared Housing Price Index"**: median bed space / partition / room / studio price by area from live data (the `/areas` and `/rent/*` tables already compute it). Pitch to Gulf News, Khaleej Times, The National, Time Out Dubai, Arabian Business, Zawya, Gulf Business, What's On. Journalists cover rent every month and need numbers.
- Guest posts / features: expat blogs (Expat Woman, Dubai Moms, Pinoy Dubai, Desi Dubai), job portals' "moving to Dubai" guides (Naukrigulf, Bayt blog), university career pages (housing for students: Middlesex Dubai, Heriot-Watt, AUD, Amity, Manipal).
- Partnerships: recruitment agencies, nursing/hospitality employers, PRO companies, visa services: "where your new hires can live", with a co-branded landing page and a link from their onboarding pages.
- HARO-style: Featured.com, Qwoted, Help a B2B Writer: answer UAE rent/expat queries.

**Ongoing**
- Publish 2 guides a week. Priorities: one area guide per busy area ("Living in Al Karama: rent, metro, food"), "bed space near <metro station>" for every Red/Green line station, nationality-specific guides (Indian/Filipino/Pakistani-friendly rooms), "Ejari explained for sharers", "DEWA bill split", "Moving from Dubizzle to Stayshay", Arabic versions of the top 5.
- Every new owner listing: send the lister their listing link and a "Listed on Stayshay" image to share. Each share is a link and new traffic.

## AI-search (GEO) checklist

- Pages lead with a direct answer and a live number (done in landing intros + FAQ).
- Entities are consistent: "Stayshay", "Shay", stayshay.com, WhatsApp number, everywhere (site, GBP, socials, directories).
- Get mentioned where LLMs learn: Reddit, Quora, news, Wikipedia-cited sources (news coverage of the price index).
- Track: ask ChatGPT/Claude/Perplexity/Gemini monthly "best site to find a bed space in Dubai", "cheapest partition in Karama" and log whether Stayshay appears (`.claude/agents/ai-citation-strategist.md`).

## Competitors (positioning, not copying)

Dubizzle (volume classifieds), Bayut / Property Finder (agent-led yearly whole-unit rentals), Homebook, FB/WhatsApp groups. We win on: full monthly cost up front, reviewed listings, verified consent/permits, free for renters, Shay as the renter's deal-finding agent, available inside ChatGPT/Claude. **Never copy their photos or listing text**: it's their (or the lister's) copyright and duplicate content hurts rankings. Ask listers to post with us directly instead.

## Agents installed (`.claude/agents/`, from msitarzewski/agency-agents, MIT)

seo-specialist, ai-citation-strategist, agentic-search-optimizer, aeo-foundations, content-creator, growth-hacker, reddit-community-builder, social-media-strategist, instagram-curator, tiktok-strategist, pr-communications-manager, app-store-optimizer, ppc-strategist, paid-social-strategist, sales-offer-lead-gen-strategist, real-estate-buyer-seller, customer-service. In Claude Code: "use the seo-specialist agent to …".
