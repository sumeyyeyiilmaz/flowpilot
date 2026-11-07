/**
 * Demo verisinin tarayıcıda (localStorage) saklanması.
 *
 * - Yalnızca sentetik demo verisi içindir; gerçek veya hassas veri girilmemelidir.
 * - Tarayıcı depolaması kapalı veya dolu olabilir; tüm erişimler hata yakalanarak yapılır
 *   ve sonuç çağırana açıkça bildirilir (sessizce "kaydedildi" sayılmaz).
 * - Okunan veri iç içe yapısıyla birlikte doğrulanır ve gerekiyorsa güncel şemaya geçirilir
 *   (bkz. migrations.ts). Bozuk veri veya başarısız geçiş otomatik olarak silinmez ya da
 *   üzerine yazılmaz; ayrı bir anahtara yedeklenir ve kurtarma moduna geçilir.
 */
import type { DemoState } from "../domain/types";
import { migrateToCurrent } from "./migrations";
import { findDemoStateV1Problem } from "./validation";

export { findDemoStateProblem, isDemoState } from "./validation";

/**
 * Ana demo verisi anahtarı. Adındaki "v1" tarihsel anahtar adıdır ve mevcut kullanıcı
 * verisine erişimi korumak için değiştirilmez; içerikteki şema sürümü `schemaVersion` alanındadır.
 */
export const DEMO_STORAGE_KEY = "flowpilot.demo.v1";
/**
 * Okunamayan verinin dokunulmadan kopyalandığı yedeklerin anahtar öneki.
 * Yeni yedekler `<önek>.<ISO zaman>` anahtarına yazılır. Önceki sürümün tekil
 * `<önek>` anahtarı da mevcut bir yedek olarak sayılır (silinmez).
 */
export const DEMO_BACKUP_PREFIX = "flowpilot.demo.v1.yedek";
/** Saklanacak en fazla yedek sayısı. Sınır dolunca yedek otomatik silinmez; yeni yedek alınmaz. */
export const MAX_BACKUPS = 3;

/* ------------------------------------------------------------------ */
/* Okuma / yazma                                                       */
/* ------------------------------------------------------------------ */

/**
 * Yedekleme sonucu:
 * - created: yeni yedek yazıldı
 * - exists: aynı içerik zaten bir yedekte var
 * - limit: yedek sınırı dolu, yeni yedek alınmadı (mevcut yedekler korunur)
 * - failed: yedek yazılamadı (ör. depolama dolu)
 */
export type BackupOutcome = "created" | "exists" | "limit" | "failed";

export type StorageReadResult =
  | { kind: "empty" }
  /** `migratedFrom`: veri eski bir şemadan bellekte geçirildiyse kaynak sürüm, değilse null. */
  | { kind: "ok"; state: DemoState; migratedFrom: number | null }
  | { kind: "invalid"; raw: string; problem: string; backup: BackupOutcome }
  | { kind: "unavailable" };

export type BackupInfo = {
  key: string;
  /** Yedeğin alındığı zaman; önceki sürümün tekil yedeğinde bilinmez (null). */
  createdAt: string | null;
  size: number;
  /** Şema geçişinden önce alınan yedek mi? */
  preMigration: boolean;
};

/** Şema v1 → v2 geçişinden önce alınan yedeklerin anahtar eki. */
const PRE_MIGRATION_SUFFIX = "-gecis-oncesi-v1";

export type StorageWriteResult = { ok: true } | { ok: false; reason: "unavailable" | "write-failed" };

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isBackupKey = (key: string) => key === DEMO_BACKUP_PREFIX || key.startsWith(`${DEMO_BACKUP_PREFIX}.`);

function backupKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isBackupKey(key)) keys.push(key);
  }
  return keys;
}

/**
 * Bozuk veriyi ana anahtara dokunmadan yeni bir yedek anahtarına kopyalar.
 * Mevcut hiçbir yedeğin üzerine yazmaz ve sınır dolunca yedek silmez.
 */
function backupRaw(storage: Storage, raw: string, suffix = ""): BackupOutcome {
  try {
    const keys = backupKeys(storage);
    if (keys.some((key) => storage.getItem(key) === raw)) return "exists";
    if (keys.length >= MAX_BACKUPS) return "limit";
    let key = `${DEMO_BACKUP_PREFIX}.${new Date().toISOString()}${suffix}`;
    for (let n = 2; storage.getItem(key) !== null; n++) key = `${DEMO_BACKUP_PREFIX}.${new Date().toISOString()}-${n}${suffix}`;
    storage.setItem(key, raw);
    return "created";
  } catch {
    return "failed";
  }
}

/** Mevcut yedekler, en yeniden eskiye (zamanı bilinmeyen önceki sürüm yedeği en sonda). */
export function listBackups(): BackupInfo[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return backupKeys(storage)
      .map((key) => ({
        key,
        createdAt: key === DEMO_BACKUP_PREFIX ? null : key.slice(DEMO_BACKUP_PREFIX.length + 1, DEMO_BACKUP_PREFIX.length + 25),
        size: storage.getItem(key)?.length ?? 0,
        preMigration: key.endsWith(PRE_MIGRATION_SUFFIX),
      }))
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  } catch {
    return [];
  }
}

/** Yalnızca yedek anahtarlarını okur (yanlış kaynağı okumayı önler). */
export function readBackup(key: string): string | null {
  if (!isBackupKey(key)) return null;
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Yalnızca yedek anahtarlarını siler; çağıran kullanıcı onayını almış olmalıdır. */
export function deleteBackup(key: string): boolean {
  if (!isBackupKey(key)) return false;
  try {
    getStorage()?.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function readDemoStorage(): StorageReadResult {
  const storage = getStorage();
  if (!storage) return { kind: "unavailable" };
  let raw: string | null;
  try {
    raw = storage.getItem(DEMO_STORAGE_KEY);
  } catch {
    return { kind: "unavailable" };
  }
  if (!raw) return { kind: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "invalid", raw, problem: "Veri geçerli JSON değil.", backup: backupRaw(storage, raw) };
  }
  // Geçerli v1 veri: geçişten önce tek seferlik yedek zorunlu. Yedek alınamazsa geçiş yapılmaz;
  // veri korunur ve kurtarma bildirimiyle kullanıcıya bildirilir (3 yedek sınırı aşılmaz).
  if ((parsed as { schemaVersion?: unknown } | null)?.schemaVersion === 1 && findDemoStateV1Problem(parsed) === null) {
    const backup = backupRaw(storage, raw, PRE_MIGRATION_SUFFIX);
    if (backup === "limit" || backup === "failed") {
      return {
        kind: "invalid",
        raw,
        backup,
        problem:
          "Veriniz eski şemada (v1). Güncel sürüme geçirilmeden önce yedeklenmesi gerekiyor, ancak yedek alınamadı; geçiş yapılmadı ve veriniz olduğu gibi korunuyor.",
      };
    }
  }

  // Doğrula ve gerekiyorsa güncel şemaya geçir. Başarısız geçişte ham veri korunur ve yedeklenir.
  const migration = migrateToCurrent(parsed);
  if (!migration.ok) return { kind: "invalid", raw, problem: migration.problem, backup: backupRaw(storage, raw) };
  return { kind: "ok", state: migration.state, migratedFrom: migration.migratedFrom };
}

export function writeDemoStorage(state: DemoState): StorageWriteResult {
  const storage = getStorage();
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

/** Ana demo verisini siler (yalnızca kullanıcının açık sıfırlama eylemiyle çağrılır). Yedek korunur. */
export function clearDemoStorage(): StorageWriteResult {
  const storage = getStorage();
  if (!storage) return { ok: false, reason: "unavailable" };
  try {
    storage.removeItem(DEMO_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

/** Ana anahtardaki mevcut kayıtlı ham veri (geçerli veya bozuk). Yedeklere bakmaz. */
export function readCurrentRaw(): string | null {
  try {
    return getStorage()?.getItem(DEMO_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}
