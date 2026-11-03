import type { Metadata } from "next";
import { ToolShell } from "@/components/tool-shell";
import { BudgetTool } from "@/components/tools";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "How much rent can I afford in Dubai? Salary to rent calculator",
  description: "Slide your salary and see a comfortable monthly rent, how many bed spaces, partitions, rooms and studios fit your budget, and the areas where it goes furthest.",
  alternates: { canonical: "/tools/budget" },
};

export default function Page() {
  return (
    <ToolShell eyebrow="Salary to Rent" title="What can your salary rent in Dubai?" intro="Slide your monthly salary. See a comfortable rent, what it gets you, and where it goes furthest." photo="/photos/studio.jpg" path="/tools/budget">
      <BudgetTool />
    </ToolShell>
  );
}
