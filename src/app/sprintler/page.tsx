import { Suspense } from "react";
import type { Metadata } from "next";
import { PlanningWorkspace } from "@/components/agile/planning-workspace";

export const metadata: Metadata = { title: "Sprint Planlama" };

// Proje seçimi adres sorgusundan okunur (?proje=…); Cache Components gereği Suspense içinde.
export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />}>
      <PlanningWorkspace />
    </Suspense>
  );
}
