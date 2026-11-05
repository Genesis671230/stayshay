import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { MoveInCost } from "@/components/tools";
import { Faq } from "@/components/seo-blocks";
import { JsonLd } from "@/components/json-ld";
import { faqLd } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dubai move-in cost calculator: deposit, agency fee, Ejari, DEWA",
  description: "How much cash do you need to rent a flat in Dubai? Enter the rent and cheques: first cheque, security deposit, agency fee + VAT, Ejari and DEWA deposit in one total.",
  keywords: ["Dubai move in cost calculator", "how much to rent apartment Dubai upfront", "Dubai security deposit rent", "agency fee Dubai rent", "Ejari fee", "DEWA deposit", "2BHK upfront cost Dubai"],
  alternates: { canonical: "/tools/move-in-cost" },
};

const FAQ: [string, string][] = [
  ["How much money do I need upfront to rent in Dubai?", "For a yearly lease: the first cheque (rent divided by the number of cheques), a security deposit (about 5% unfurnished, 10% furnished), an agency fee (about 5% + VAT) if you use an agent, Ejari registration and a refundable DEWA deposit. The calculator adds it up."],
  ["Is the security deposit refundable in Dubai?", "Yes, at the end of the lease, minus any agreed deductions for damage. Get the condition of the flat documented with photos when you move in."],
  ["How can I reduce the upfront cost?", "Ask for more cheques (4, 6 or 12), rent directly from the owner to skip the agency fee, or start in a monthly room or studio with no cheques while you save."],
];

export default function Page() {
  return (
    <ToolShell eyebrow="Move-in Cost Calculator" title="How much cash do you need to move in?" intro="Slide the rent, pick your cheques. See every upfront cost of a yearly Dubai lease, and what comes back." photo="/photos/living.jpg" path="/tools/move-in-cost" tool="move-in-cost">
      <JsonLd data={faqLd(FAQ)} />
      <MoveInCost />
      <div className="mx-auto max-w-[820px] px-4">
        <Faq faq={FAQ} />
      </div>
    </ToolShell>
  );
}
