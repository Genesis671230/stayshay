import type { ContactReason } from "@stayshay/core";

export interface ChatNotice {
  title: string;
  line: string;
}

const WHAT: Record<ContactReason, string> = {
  phone: "a phone number",
  email: "an email address",
  link: "a link",
  handle: "a social media handle",
  app: "another app",
  ask: "a request for contact details",
};

/** Contact details never go through, on any plan. Copy must not imply the Pass unlocks sharing. */
export function strikeResponse(strikes: number, reason: ContactReason, pass: boolean, name: string): { error: "contact_warning" | "contact_upgrade" | "contact_final"; notice: ChatNotice } {
  if (strikes <= 1)
    return {
      error: "contact_warning",
      notice: { title: "This message wasn’t sent", line: `It looks like it included ${WHAT[reason]}. Chats stay on Stayshay so your number stays private and our team can step in if something goes wrong. This is your one warning.` },
    };
  if (pass) return { error: "contact_final", notice: { title: "Not sent", line: `Contact details can’t be shared on Stayshay. Attempt ${strikes} is on record, and repeated attempts can get your account reviewed.` } };
  return {
    error: "contact_upgrade",
    notice: { title: `Keep talking to ${name} here`, line: `That wasn’t sent: contact details stay off Stayshay on every plan. What the Pass gives you is unlimited messages with ${name}, so you can plan a viewing together without running out.` },
  };
}

export function limitNotice(name: string, free: number, theyReplied: boolean): ChatNotice {
  return {
    title: theyReplied ? `${name} is talking to you. Don’t stop now.` : `Your message to ${name} is one tap away`,
    line: `You’ve used your ${free} free messages. The Stayshay Pass gives you unlimited messages, so you can agree the budget, the area and a viewing before someone else does.`,
  };
}
