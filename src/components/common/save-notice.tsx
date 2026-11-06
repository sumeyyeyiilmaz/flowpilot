"use client";

import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useDemoStorageStatus } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

/**
 * İşlem sonrası bildirim. Kayıt durumu "ok" değilse başarı gibi görünmez;
 * değişikliğin tarayıcıya kaydedilmediğini açıkça belirtir.
 */
export function SaveNotice({ message, onDismiss }: { message: React.ReactNode; onDismiss: () => void }) {
  const status = useDemoStorageStatus();
  const saved = status.kind === "ok";
  const Icon = saved ? CheckCircle2 : AlertTriangle;

  return (
    <div
      data-saved={saved}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        saved
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        {message}
        {!saved && <strong className="font-semibold"> Ancak değişiklik tarayıcıya kaydedilmedi.</strong>}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Bildirimi kapat"
        className="rounded p-0.5 outline-none hover:bg-black/5 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
