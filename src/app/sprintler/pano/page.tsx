import { Suspense } from "react";
import type { Metadata } from "next";
import { BoardWorkspace } from "@/components/agile/board-workspace";

export const metadata: Metadata = { title: "Sprint Panosu" };

// Proje ve sprint seçimi adres sorgusundan okunur (?proje=…&sprint=…); Cache Components gereği Suspense içinde.
export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />}>
      <BoardWorkspace />
    </Suspense>
  );
}
