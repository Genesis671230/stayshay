import type { Metadata } from "next";
import { BRAND } from "@stayshay/core";
import { DocPage } from "@/components/doc-page";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <DocPage eyebrow="Legal" title="Terms of use" updated="25 October 2026" intro="These terms apply when you use the Stayshay website or app to find, list or ask about a place to live.">
      <h2>1. What Stayshay is</h2>
      <p>Stayshay is an online listings platform. We are not a landlord, real estate broker, government body or party to any tenancy. Agreements are made directly between renters and listers.</p>
      <h2>2. Using the platform</h2>
      <ul>
        <li>You must be 18 or older and give accurate information.</li>
        <li>Don’t post false, misleading, discriminatory or unlawful content, or contact people for spam or fraud.</li>
        <li>We may edit, pause or remove listings and profiles that break these terms or the law.</li>
      </ul>
      <h2>3. Listings and listers</h2>
      <p>Listers are responsible for their listings being accurate and lawful, including landlord consent for subletting and any permit required for shared housing or partitions under the rules of the relevant emirate. “Verified” badges show the checks we ran on information listers gave us. They are not a guarantee or a government approval.</p>
      <h2>4. Payments and viewings</h2>
      <p>Stayshay does not collect rent or deposits. Never pay before you’ve viewed the place and met the lister, and get a receipt for anything you pay. Report anyone who asks for money first.</p>
      <h2>5. Liability</h2>
      <p>The platform is provided “as is”. To the extent the law allows, Stayshay is not liable for the condition of any property, the conduct of any user, or losses from arrangements made between users.</p>
      <h2>6. Changes and law</h2>
      <p>We may update these terms and will show the date above. These terms are governed by the laws of the United Arab Emirates as applied in the Emirate of Dubai.</p>
      <h2>7. Contact</h2>
      <p>Questions or reports: WhatsApp <a href={`https://wa.me/${BRAND.whatsapp}`}>{BRAND.whatsappDisplay}</a> or <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
    </DocPage>
  );
}
