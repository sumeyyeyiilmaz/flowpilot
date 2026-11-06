import type { Metadata } from "next";
import { RequestsWorkspace } from "@/components/requests/requests-workspace";

export const metadata: Metadata = { title: "Talepler" };

export default function Page() {
  return <RequestsWorkspace />;
}
