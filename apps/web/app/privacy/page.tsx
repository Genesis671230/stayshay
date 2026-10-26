import type { Metadata } from "next";
import { BRAND } from "@stayshay/core";
import { DocPage } from "@/components/doc-page";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <DocPage eyebrow="Legal" title="Privacy policy" updated="25 October 2026" intro="What we collect, why, and the choices you have. We keep it short and we don’t sell your data.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>What you send us:</strong> name, WhatsApp number, move-in date, budget, areas, and anything you write in a request or roommate profile.</li>
        <li><strong>Listing details:</strong> for owners, property details and photos you share with us.</li>
        <li><strong>Your account:</strong> name, email and phone number. If you sign in with Google we receive your name, email address and profile picture from Google (never your Google password).</li>
        <li><strong>Roommate profiles:</strong> the details and photo you add. If you choose to show your profile publicly, your first name, photo, age, gender, nationality, work, budget, areas, move-in date, habits and bio are visible to visitors after our team approves it. Your phone number and email are never shown.</li>
        <li><strong>Chats with Shay:</strong> what you write to our AI assistant and any contact details you share there. Messages are processed by our AI provider (Anthropic) to generate replies, and kept so our team can follow up.</li>
        <li><strong>Basic usage:</strong> pages viewed and searches, to improve the service. Saved listings stay in your browser.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To pass your inquiry to the right lister and arrange viewings.</li>
        <li>To match roommate profiles and send you places that fit.</li>
        <li>To keep the platform safe, investigate reports and prevent fraud.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can edit your name and phone in your account, hide your public roommate profile, or ask us to delete your account and data at any time.</p>
      <h2>Who sees it</h2>
      <p>Your number and request go only to the lister or match you asked about. We use service providers (hosting, messaging) who process data for us under contract. We don’t sell personal data.</p>
      <h2>How long we keep it</h2>
      <p>Requests and profiles are kept for up to 12 months after your last activity, then deleted, unless the law requires longer.</p>
      <h2>Your rights</h2>
      <p>Under the UAE Personal Data Protection Law you can ask to see, correct or delete your data, or withdraw consent. Message us and we’ll act within 30 days.</p>
      <h2>Contact</h2>
      <p>WhatsApp <a href={`https://wa.me/${BRAND.whatsapp}`}>{BRAND.whatsappDisplay}</a> or <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>.</p>
    </DocPage>
  );
}
