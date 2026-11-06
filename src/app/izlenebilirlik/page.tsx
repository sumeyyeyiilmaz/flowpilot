import type { Metadata } from "next";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export const metadata: Metadata = { title: "İzlenebilirlik" };

export default function Page() {
  return <ModulePlaceholder href="/izlenebilirlik" />;
}
