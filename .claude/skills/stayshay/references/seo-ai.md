# SEO + AI distribution

Full strategy and the manual to-do list (GSC, Bing, Cloudflare AI-bot setting, ChatGPT/Claude directory submissions, backlinks): repo `docs/SEO-PLAYBOOK.md`.

- Site is **indexable** (was noindex during private testing). Canonicals are set per page; the root layout deliberately has none (it would leak "/" to every page).
- GA4 `G-12X8446CFV` via `components/analytics.tsx` (`NEXT_PUBLIC_GA_ID` overrides). `track("generate_lead", …)` on viewing requests / find-me-a-room / WhatsApp, call and email clicks. Manual `page_view` per route (init has `send_page_view:false`).
- `lib/seo.ts`: `SITE`, landing helpers, JSON-LD builders, `landingFaq` (live numbers only). `lib/blog.ts`: posts as blocks; `prices` / `listings` / `deals` blocks render live data. Never hardcode prices in posts.
- Landing routes: `/rent/<type-slug>[/<area>]` (type slugs from `TYPE_SLUG`: bed-space, partitions, rooms, studios), `/areas[/<area>]`, `/deals`, `/blog[/<slug>]`, `/blog/rss.xml`, `/ai`. All `force-dynamic` (data lives in STAYSHAY_DATA_DIR; build-time data is a stub).
- Server components must not call client helpers (`searchHref` from `marketplace.tsx` is client → 500).
- `.doc` prose styles target direct children only so cards/tables embedded in articles keep their styles.
- Core: `rankDeals()` (deals.ts) and `parseSearchText()` (search.ts) are shared by the site (`?q=`), Shay (`best_deals` tool) and MCP.
- MCP: `POST /mcp` stateless JSON-RPC (Streamable HTTP, JSON responses, no session). Tools search/fetch (ChatGPT shape), search_listings, best_deals, request_viewing (rate-limited 5/h/IP, lead `source: "ai"`). Discovery: `/.well-known/mcp.json`, `/.well-known/ai-plugin.json`, `/openapi.json`, `/api/public/*`, `/llms.txt`, `/llms-full.txt`.
- Test MCP: `curl -s -H 'content-type: application/json' https://stayshay.com/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search","arguments":{"query":"bed space karama"}}}'`
- Agents from agency-agents (MIT) live in repo `.claude/agents/`.
