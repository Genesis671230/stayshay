import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { FairRent } from "@/components/tools";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Is my rent fair? Free Dubai rent checker for rooms and bed spaces",
  description: "Paste any ad or enter the rent: see if a bed space, partition, room or studio in Dubai is a steal, fair or overpriced, compared with live listings in the same area.",
  alternates: { canonical: "/tools/fair-rent" },
};

export default function Page() {
  return (
    <ToolShell eyebrow="Fair Rent Check" title="Is that rent fair?" intro="Compare any rent with what people pay for the same kind of place in the same area today. Works with ads from anywhere." photo="/photos/area-deira.jpg" path="/tools/fair-rent" tool="fair-rent">
      <FairRent />
    </ToolShell>
  );
}
