"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoActions, useDemoHydrated } from "@/lib/demo/store";
import { MAX_BACKUPS, type BackupInfo } from "@/lib/demo/storage";
import { formatDateTime } from "@/lib/format";
import { confirmAndDeleteBackup, downloadBackup } from "./demo-backup";

const backupLabel = (b: BackupInfo) => (b.createdAt ? `Yedek · ${formatDateTime(b.createdAt)}` : "Yedek · önceki sürüm");

/** Mevcut yedekleri listeler; her biri ayrı ayrı indirilebilir veya onayla silinebilir. */
export function BackupList({ onMessage }: { onMessage: (message: string) => void }) {
  const hydrated = useDemoHydrated();
  const [backups, setBackups] = useState<BackupInfo[]>(() => demoActions.listBackups());

  // Tarayıcı depolaması yalnızca istemcide okunabilir; sunucu çiziminde liste gösterilmez.
  if (!hydrated) return null;

  if (backups.length === 0) {
    return <p className="text-xs opacity-80">Kayıtlı yedek yok.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium">
        Önceki yedekler ({backups.length}/{MAX_BACKUPS})
      </p>
      <ul className="flex flex-col gap-1.5" aria-label="Önceki yedekler">
        {backups.map((backup) => {
          const label = backupLabel(backup);
          return (
            <li key={backup.key} data-backup-key={backup.key} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">
                {label} <span className="opacity-70">({Math.ceil(backup.size / 1024)} KB)</span>
              </span>
              <Button
                size="xs"
                variant="outline"
                className="bg-background"
                aria-label={`${label} indir`}
                onClick={() => onMessage(downloadBackup(backup) ? `${label} indirildi.` : "Yedek bulunamadı.")}
              >
                <Download data-icon="inline-start" aria-hidden="true" />
                Bu yedeği indir
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="bg-background"
                aria-label={`${label} sil`}
                onClick={() => {
                  if (confirmAndDeleteBackup(backup, label)) {
                    setBackups(demoActions.listBackups());
                    onMessage(`${label} silindi.`);
                  }
                }}
              >
                <Trash2 data-icon="inline-start" aria-hidden="true" />
                Sil
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
