import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectList } from "@/components/projects/project-list";

export const metadata: Metadata = { title: "Projeler" };

export default function Page() {
  return (
    <>
      <PageHeader title="Projeler" description="Projeleri, talep yoğunluğunu ve teslimat durumunu izleyin." />
      <ProjectList />
    </>
  );
}
