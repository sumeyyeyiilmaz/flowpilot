"use client"; // Hata sınırları istemci bileşeni olmalıdır.

import { useState } from "react";
import { AlertTriangle, Download, RefreshCw, RotateCcw } from "lucide-react";
import { BackupList } from "@/components/layout/backup-list";
import { confirmAndResetDemoData, downloadCurrentData } from "@/components/layout/demo-backup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Next.js'in sunucu hatalarına eklediği eşleştirme kodu (varsa). */
function getErrorDigest(error: unknown): string {
  if (typeof error === "object" && error !== null && "digest" in error) {
    const digest = (error as { digest?: unknown }).digest;
    return typeof digest === "string" ? digest : "";
  }
  return "";
}

/**
 * Sayfa çizilirken oluşan hatalar için ekran. Uygulama kabuğu (menü) görünür kalır.
 * Demo verisi otomatik silinmez; kullanıcı veriyi indirip isterse açıkça sıfırlayabilir.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const digest = getErrorDigest(error);

  return (
    <Card role="alert" className="mx-auto max-w-2xl">
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">Bu sayfa görüntülenemedi</h1>
            <p className="text-sm text-muted-foreground">
              Beklenmeyen bir hata oluştu. Tarayıcıdaki demo verisi silinmedi. Önce tekrar deneyin; sorun sürerse
              mevcut veriyi indirip demo verisini sıfırlayabilirsiniz.
            </p>
            {digest && (
              <p className="text-xs text-muted-foreground" data-error-digest>
                Hata kodu: {digest}
              </p>
            )}
            {message && <p className="text-sm font-medium">{message}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:pl-13">
          <Button onClick={() => retry()}>
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Tekrar dene
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setMessage(downloadCurrentData() ? "Mevcut kayıtlı veri indirildi." : "İndirilecek kayıtlı demo verisi bulunamadı.")
            }
          >
            <Download data-icon="inline-start" aria-hidden="true" />
            Mevcut veriyi indir
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirmAndResetDemoData()) retry();
            }}
          >
            <RotateCcw data-icon="inline-start" aria-hidden="true" />
            Demo verisini sıfırla
          </Button>
        </div>
        <div className="sm:pl-13">
          <BackupList onMessage={setMessage} />
        </div>
      </CardContent>
    </Card>
  );
}
