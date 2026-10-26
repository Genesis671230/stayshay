import type { Metadata } from "next";
import Link from "next/link";
import { DocPage } from "@/components/doc-page";
import { SITE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Use Stayshay in ChatGPT, Claude and other AI assistants",
  description: "Search live UAE bed spaces, partitions, rooms and studios from ChatGPT or Claude. Add the Stayshay MCP connector in one minute and ask Shay for the best deals.",
  alternates: { canonical: "/ai" },
};

const MCP = `${SITE}/mcp`;

export default function AiPage() {
  return (
    <DocPage
      eyebrow="Stayshay for AI assistants"
      title="Ask for a room, wherever you chat."
      intro="Shay finds you the best-value bed spaces, partitions, rooms and studios on Stayshay. Use it right here, or plug Stayshay into ChatGPT, Claude, Cursor or any assistant that speaks MCP."
    >
      <h2>Connector URL</h2>
      <p>
        <code className="rounded bg-surface px-2 py-1 text-[14px]">{MCP}</code>. No sign-in needed. Tools: <strong>search</strong>, <strong>fetch</strong>, <strong>search_listings</strong>, <strong>best_deals</strong> and <strong>request_viewing</strong>.
      </p>
      <h2>ChatGPT</h2>
      <ol>
        <li>Open ChatGPT → Settings → Apps &amp; Connectors (turn on Developer mode under Advanced if you don’t see “Create”).</li>
        <li>Choose <strong>Create</strong>, name it “Stayshay”, paste <code>{MCP}</code>, authentication <strong>None</strong>, then save.</li>
        <li>In a new chat, add Stayshay from the + menu and ask: “Find me a female bed space in Karama under AED 900 with bills included.”</li>
      </ol>
      <p>
        Building a custom GPT instead? Import the Actions schema from <a href={`${SITE}/openapi.json`}>{SITE}/openapi.json</a>.
      </p>
      <h2>Claude</h2>
      <ol>
        <li>Open claude.ai → Settings → Connectors → <strong>Add custom connector</strong>.</li>
        <li>Name it “Stayshay”, paste <code>{MCP}</code> and add it.</li>
        <li>Turn it on from the tools menu in a chat and ask: “What are the best studio deals in Dubai right now?”</li>
      </ol>
      <p>
        Claude Code: <code>claude mcp add --transport http stayshay {MCP}</code>
      </p>
      <h2>Other assistants</h2>
      <p>
        Cursor, VS Code, Windsurf and other MCP clients: add a remote server with URL <code>{MCP}</code> (Streamable HTTP). Search engines and assistants can also read <a href={`${SITE}/llms.txt`}>llms.txt</a>.
      </p>
      <h2>What Shay does</h2>
      <ul>
        <li>Understands plain requests: area or metro station, budget, type, ladies-only, bills included, no deposit.</li>
        <li>Ranks <Link href="/deals">best deals</Link> against the typical price for the same kind of place and area.</li>
        <li>Books a viewing: the Stayshay team then WhatsApps you to fix a time. You never pay through an assistant.</li>
      </ul>
    </DocPage>
  );
}
