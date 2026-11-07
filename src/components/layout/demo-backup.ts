"use client";

import { demoActions } from "@/lib/demo/store";
import type { BackupInfo } from "@/lib/demo/storage";

/**
 * Demo verisini kullanıcının cihazına JSON dosyası olarak indirme yardımcıları.
 * Veri tarayıcıdan çıkmaz; harici bir servise gönderilmez.
 * "Mevcut veri" ve "yedek" kaynakları ayrıdır; dosya adı kaynağı belirtir.
 */

const fileStamp = (iso: string) => iso.slice(0, 19).replace(/[:T]/g, "-");

function saveFile(raw: string, fileName: string) {
  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Ana anahtardaki mevcut kayıtlı veriyi indirir. Kayıtlı veri yoksa false döndürür. */
export function downloadCurrentData(): boolean {
  const raw = demoActions.getCurrentRawData();
  if (!raw) return false;
  saveFile(raw, `flowpilot-demo-MEVCUT-VERI-${fileStamp(new Date().toISOString())}.json`);
  return true;
}

/** Seçilen yedeği indirir. Yedek bulunamazsa false döndürür. */
export function downloadBackup(backup: BackupInfo): boolean {
  const raw = demoActions.readBackup(backup.key);
  if (!raw) return false;
  const stamp = (backup.createdAt ? fileStamp(backup.createdAt) : "onceki-surum") + (backup.preMigration ? "-gecis-oncesi-v1" : "");
  saveFile(raw, `flowpilot-demo-YEDEK-${stamp}.json`);
  return true;
}

/** Kullanıcı onayıyla bir yedeği siler. Silindiyse true döndürür. */
export function confirmAndDeleteBackup(backup: BackupInfo, label: string): boolean {
  if (!window.confirm(`"${label}" yedeği kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return false;
  return demoActions.deleteBackup(backup.key);
}

/** Kullanıcı onayıyla demo verisini sıfırlar. Sıfırlama yapıldıysa true döndürür. */
export function confirmAndResetDemoData(): boolean {
  const ok = window.confirm(
    "Tarayıcıdaki demo verisi silinip başlangıç verisine dönülecek. Mevcut yedekler korunur. Devam edilsin mi?"
  );
  if (!ok) return false;
  demoActions.resetDemoData();
  return true;
}
