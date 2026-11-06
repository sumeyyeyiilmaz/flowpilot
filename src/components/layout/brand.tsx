import Link from "next/link";
import { Workflow } from "lucide-react";

export function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Workflow className="size-4.5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-tight">FlowPilot</span>
        <span className="text-[11px] text-muted-foreground">Kalite Yönetim Platformu</span>
      </span>
    </Link>
  );
}
