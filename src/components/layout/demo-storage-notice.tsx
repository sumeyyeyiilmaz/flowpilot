"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, RefreshCw, RotateCcw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoActions, useDemoStorageStatus } from "@/lib/demo/store";
import { MAX_BACKUPS, type BackupOutcome } from "@/lib/demo/storage";
import { BackupList } from "./backup-list";
import { confirmAndResetDemoData, downloadCurrentData } from "./demo-backup";

const backupText: Record<BackupOutcome, string> = {
  created: "Okunamayan verinin yeni bir yedeği alındı.",
  exists: "Okunamayan verinin aynısı zaten yedeklerde bulunuyor.",
  limit: `Yedek sınırına (${MAX_BACKUPS}) ulaşıldığı için bu veri ayrıca yedeklenmedi; hiçbir yedek silinmedi. Yer açmak için eski bir yedeği silip “Tekrar dene”ye basabilir veya mevcut veriyi indirebilirsiniz.`,
  failed: "Okunamayan verinin yedeği alınamadı (depolama dolu olabilir). Mevcut veriyi indirmeniz önerilir.",
};

/** Kayıt sorunlarını uygulama genelinde açıkça gösterir. Durum "ok" iken yalnızca son "Tekrar kaydet" sonucunu gösterebilir. */
export function DemoStorageNotice() {
  const status = useDemoStorageStatus();
  const [message, setMessage] = useState<string | null>(null);
  const [savedAfterRetry, setSavedAfterRetry] = useState(false);

  if (status.kind === "ok") {
    if (!savedAfterRetry) return null;
    return (
      <div
        role="status"
        data-retry-result="saved"
        className="mb-6 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">Değişiklikler tarayıcıya kaydedildi.</span>
        <button
          type="button"
          onClick={() => setSavedAfterRetry(false)}
          aria-label="Bildirimi kapat"
          className="rounded p-0.5 outline-none hover:bg-emerald-500/15 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const handleRetrySave = () => {
    const result = demoActions.retrySave();
    if (result === "saved") {
      setMessage(null);
      setSavedAfterRetry(true);
    } else {
      setSavedAfterRetry(false);
      setMessage("Tekrar kaydetme başarısız oldu. Değişiklikler hâlâ kaydedilmedi; sayfayı yenilerseniz kaybolur.");
    }
  };

  const content = {
    recovery: {
      title: "Kayıtlı demo verisi okunamadı",
      text: `${status.kind === "recovery" ? status.problem : ""} Veri silinmedi ve üzerine yazılmıyor. ${
        status.kind === "recovery" ? backupText[status.backup] : ""
      } Şu an başlangıç verisi gösteriliyor ve yaptığınız değişiklikler kaydedilmiyor.`,
    },
    unavailable: {
      title: "Değişiklikler kaydedilmiyor",
      text: "Tarayıcı depolamasına erişilemiyor (ör. gizli pencere veya engellenmiş site verisi). Sayfayı yenilerseniz değişiklikler kaybolur.",
    },
    "save-error": {
      title: "Son değişiklik kaydedilemedi",
      text: "Tarayıcı depolaması dolu olabilir. Değişiklik yalnızca bu sayfada duruyor; sayfayı yenilerseniz kaybolur.",
    },
  }[status.kind];

  return (
    <div
      role="alert"
      data-storage-status={status.kind}
      className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{content.title}</p>
          <p>{content.text}</p>
          {message && (
            <p className="font-medium" data-notice-message>
              {message}
            </p>
          )}
        </div>
      </div>

      {(status.kind === "save-error" || status.kind === "unavailable") && (
        <div className="flex flex-wrap gap-2 pl-6">
          <Button size="sm" variant="outline" className="bg-background" onClick={handleRetrySave}>
            <Save data-icon="inline-start" aria-hidden="true" />
            Tekrar kaydet
          </Button>
        </div>
      )}

      {status.kind === "recovery" && (
        <div className="flex flex-col gap-3 pl-6">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-background"
              onClick={() =>
                setMessage(downloadCurrentData() ? "Mevcut kayıtlı veri indirildi." : "İndirilecek kayıtlı veri bulunamadı.")
              }
            >
              <Download data-icon="inline-start" aria-hidden="true" />
              Mevcut veriyi indir
            </Button>
            <Button size="sm" variant="outline" className="bg-background" onClick={() => demoActions.retryLoad()}>
              <RefreshCw data-icon="inline-start" aria-hidden="true" />
              Tekrar dene
            </Button>
            <Button size="sm" variant="outline" className="bg-background" onClick={() => confirmAndResetDemoData()}>
              <RotateCcw data-icon="inline-start" aria-hidden="true" />
              Demo verisini sıfırla
            </Button>
          </div>
          {/* Yedekleme sonucu değişince (ör. yer açılıp yeni yedek alınınca) liste yeniden okunur. */}
          <BackupList key={status.backup} onMessage={setMessage} />
        </div>
      )}
    </div>
  );
}
