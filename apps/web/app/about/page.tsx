import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@stayshay/core";
import { DocPage } from "@/components/doc-page";

export const metadata: Metadata = { title: "About | Stayshay" };

export default function About() {
  return (
    <DocPage eyebrow="About Stayshay" title="Shared living, without the guesswork." intro="Stayshay helps people across the UAE find affordable monthly rooms, bed spaces, partitions, studios and roommates, with the real price, deposit and rules shown up front.">
      <h2>Why we exist</h2>
      <p>Most people in the UAE start out in shared housing. Finding a good bed space or room usually means scrolling group chats, calling numbers that don’t answer and turning up to viewings where the price has changed. We think it should feel as clear as booking a hotel, at a price people can actually afford.</p>
      <h2>What we do differently</h2>
      <ul>
        <li><strong>Real monthly prices.</strong> Rent, deposit, upfront cost and bills on every listing.</li>
        <li><strong>Checked listings.</strong> We verify listers and ask for landlord consent and permits where shared housing needs them.</li>
        <li><strong>WhatsApp first.</strong> Every inquiry goes out with your move-in date and budget, so you get real answers faster.</li>
        <li><strong>Free for renters.</strong> No booking fee and no commission from Stayshay.</li>
      </ul>
      <h2>For owners and landlords</h2>
      <p>Listing is free. Send us the details and photos on WhatsApp and our team builds the listing for you. <Link href="/list">List your place</Link>.</p>
      <h2>Talk to us</h2>
      <p>WhatsApp <a href={`https://wa.me/${BRAND.whatsapp}`}>{BRAND.whatsappDisplay}</a> or email <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
    </DocPage>
  );
}
