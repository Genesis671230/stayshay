import { RoomieApp } from "./app";

/** The roommate app on a dark stage. On phones the app is the page; on desktop it sits beside the pitch. */
export function RoomieStage({ people, returnTo, title, intro }: { people: number; returnTo: "/roommates" | "/swipe"; title: string; intro: string }) {
  const steps = [
    ["Make your profile", "Photo, budget, areas and how you live. Two minutes, and our team checks every profile."],
    ["Swipe and request to connect", "People who fit your budget, area and routine come first. Swipe right to ask to connect."],
    ["Connect, then message", "When they accept, you’re connected. Message with the Stayshay Pass and meet before you agree anything."],
  ];
  return (
    <section className="bg-[#0b100e] md:px-4 md:py-10">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] items-start gap-10 md:grid-cols-[minmax(0,1fr)_480px] md:gap-14">
        <div className="hidden pt-10 text-white md:block">
          <p className="text-[12.5px] font-bold uppercase tracking-[0.16em] text-lime">Roommate matching</p>
          <h1 className="mt-4 text-[64px] font-extrabold uppercase leading-[0.9] tracking-[-0.045em]">{title}</h1>
          <p className="mt-6 max-w-[460px] text-[17px] leading-relaxed text-white/70">{intro}</p>
          <ol className="mt-10 space-y-6">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[15px] font-bold text-lime">{i + 1}</span>
                <span>
                  <span className="block text-[17px] font-bold">{t}</span>
                  <span className="mt-0.5 block max-w-[420px] text-[14.5px] leading-relaxed text-white/60">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-10 max-w-[440px] text-[13px] text-white/45">Your number is never shown. Every profile is checked by the Stayshay team before others see it. Meet in a public place first and never pay before you’ve seen the room.</p>
        </div>
        <div className="min-w-0 pb-24 md:pb-0">
          <h1 className="sr-only md:hidden">{title}</h1>
          <RoomieApp people={people} returnTo={returnTo} />
        </div>
      </div>
    </section>
  );
}
