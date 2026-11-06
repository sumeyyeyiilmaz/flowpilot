import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/projects/project-detail";
import { createSeedState } from "@/lib/demo/seed";

// Demoda proje oluşturma yok; geçerli proje kimlikleri sentetik başlangıç verisinden gelir.
// Bilinmeyen kimlikler için gerçek HTTP 404, sayfa çizilmeden önce src/proxy.ts tarafından döndürülür.
const seedProjects = createSeedState().projects;

export function generateStaticParams() {
  return seedProjects.map((project) => ({ projeId: project.id }));
}

export async function generateMetadata({ params }: PageProps<"/projeler/[projeId]">): Promise<Metadata> {
  const { projeId } = await params;
  const project = seedProjects.find((p) => p.id === projeId);
  return { title: project ? project.name : "Proje bulunamadı" };
}

export default function Page({ params }: PageProps<"/projeler/[projeId]">) {
  return (
    <Suspense fallback={<ProjectDetailFallback />}>
      <ProjectDetailForParams params={params} />
    </Suspense>
  );
}

async function ProjectDetailForParams({ params }: { params: PageProps<"/projeler/[projeId]">["params"] }) {
  const { projeId } = await params;
  // Proxy atlanırsa (ör. istemci tarafı gezinme) ikinci güvenlik ağı.
  if (!seedProjects.some((p) => p.id === projeId)) notFound();
  return <ProjectDetail projectId={projeId} />;
}

function ProjectDetailFallback() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Proje yükleniyor">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-7 w-64 max-w-full rounded bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[74px] rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-muted" />
    </div>
  );
}
