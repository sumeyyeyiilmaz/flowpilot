import { Suspense } from "react";
import type { Metadata } from "next";
import { AnalysisWorkspace } from "@/components/analysis/analysis-workspace";

export const metadata: Metadata = { title: "Analiz Çalışma Alanı" };

// Talep ve analiz kimlikleri adres sorgusundan okunur (?talep=…&analiz=…).
// Kullanıcının oluşturduğu talepler yalnızca tarayıcıda bulunduğu için sayfa statiktir;
// sorgu parametreleri Cache Components gereği Suspense içinde okunur.
export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />}>
      <AnalysisWorkspace />
    </Suspense>
  );
}
