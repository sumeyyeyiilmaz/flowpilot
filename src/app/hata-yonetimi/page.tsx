import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "Hata Yönetimi" };

export default function Page() {
  return <ModulePlaceholder href="/hata-yonetimi" />;
}
