import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { RoomSwipe } from "@/components/tools";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Room Swipe: swipe through rooms and bed spaces in Dubai",
  description: "Swipe right to save, left to skip. The fastest way to browse real bed spaces, partitions, rooms and studios in Dubai, best deals first. Book all your favourites in one message.",
  alternates: { canonical: "/swipe" },
};

export default function Page() {
  return (
    <ToolShell eyebrow="Room Swipe" title="Swipe your way to a room" intro="Best deals first. Right to save, left to skip. When you're done, book all your favourites in one message." photo="/photos/roommates.jpg" path="/swipe">
      <RoomSwipe />
    </ToolShell>
  );
}
