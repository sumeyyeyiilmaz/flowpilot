"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmAndResetDemoData } from "@/components/layout/demo-backup";

/** Demo verisinin tarayıcıda saklandığını belirtir ve sıfırlama sağlar. */
export function DemoDataControls() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Demo verileri sentetiktir ve yalnızca bu tarayıcıda saklanır. Gerçek veya hassas veri girmeyin.
      </p>
      <Button variant="outline" size="sm" onClick={() => confirmAndResetDemoData()} className="w-full">
        <RotateCcw data-icon="inline-start" aria-hidden="true" />
        Demo verisini sıfırla
      </Button>
    </div>
  );
}
