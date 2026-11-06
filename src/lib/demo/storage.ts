/**
 * Demo verisinin tarayıcıda (localStorage) saklanması.
 *
 * - Yalnızca sentetik demo verisi içindir; gerçek veya hassas veri girilmemelidir.
 * - Tarayıcı depolaması kapalı veya dolu olabilir; tüm erişimler hata yakalanarak yapılır
 *   ve sonuç çağırana açıkça bildirilir (sessizce "kaydedildi" sayılmaz).
 * - Okunan veri iç içe yapısıyla birlikte doğrulanır. Bozuk veri otomatik olarak
 *   silinmez veya üzerine yazılmaz; ayrı bir anahtara yedeklenir.
 */
import {
  ANALYSIS_STATUSES,
  DEFECT_STATUSES,
  DEMO_SCHEMA_VERSION,
  IMPACT_LEVELS,
  MOSCOW_PRIORITIES,
  PRIORITIES,
  PROJECT_STATUSES,
  REQUEST_STATUSES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  TEST_RESULTS,
  type DemoState,
} from "../domain/types";

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
/* Doğrulama                                                           */
/* ------------------------------------------------------------------ */

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const optStr = (v: unknown) => v === undefined || isStr(v);
const oneOf = (list: readonly string[]) => (v: unknown) => isStr(v) && list.includes(v);
const hasStrings = (r: Rec, keys: string[]) => keys.every((k) => isStr(r[k]));

function isProject(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "name", "description", "owner", "startDate", "targetDate"]) &&
    oneOf(PROJECT_STATUSES)(v.status)
  );
}

function isRequest(v: unknown): boolean {
  if (!isRec(v)) return false;
  if (!hasStrings(v, ["id", "code", "projectId", "title", "description", "requester", "createdAt", "updatedAt"])) return false;
  if (!oneOf(PRIORITIES)(v.priority) || !oneOf(REQUEST_STATUSES)(v.status) || !optStr(v.dueDate)) return false;
  const d = v.details;
  if (!isRec(d)) return false;
  if (v.type === "new") return hasStrings(d, ["businessGoal", "targetUsers", "expectedBenefit"]);
  if (v.type === "change")
    return hasStrings(d, ["affectedSystem", "currentBehavior", "desiredBehavior", "changeReason"]) && oneOf(IMPACT_LEVELS)(d.impactLevel);
  return false;
}

function isSection(v: unknown): boolean {
  if (!isRec(v) || !hasStrings(v, ["id", "title"])) return false;
  switch (v.kind) {
    case "text":
      return isStr(v.content);
    case "list":
      return isStrArr(v.items);
    case "checklist":
      return Array.isArray(v.items) && v.items.every((i) => isRec(i) && isStr(i.id) && isStr(i.text) && isBool(i.done));
    default:
      return false;
  }
}

function isAnalysis(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "requestId", "title", "author", "createdAt", "updatedAt"]) &&
    optStr(v.description) &&
    oneOf(ANALYSIS_STATUSES)(v.status) &&
    Array.isArray(v.sections) &&
    v.sections.every(isSection)
  );
}

function isRequirement(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "requestId", "analysisId", "title", "description", "createdAt"]) &&
    (v.sectionId === null || isStr(v.sectionId)) &&
    oneOf(REQUIREMENT_TYPES)(v.type) &&
    oneOf(MOSCOW_PRIORITIES)(v.priority) &&
    oneOf(REQUIREMENT_STATUSES)(v.status) &&
    isStrArr(v.acceptanceCriteria)
  );
}

function isTestCase(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "title", "expectedResult"]) &&
    isStrArr(v.requirementIds) &&
    isStrArr(v.steps) &&
    oneOf(PRIORITIES)(v.priority)
  );
}

function isTestRun(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "testCaseId", "executedBy", "executedAt"]) &&
    oneOf(TEST_RESULTS)(v.result) &&
    optStr(v.note)
  );
}

function isDefect(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "code", "title", "createdAt"]) &&
    oneOf(PRIORITIES)(v.severity) &&
    oneOf(DEFECT_STATUSES)(v.status) &&
    optStr(v.requirementId) &&
    optStr(v.testRunId) &&
    optStr(v.assignee)
  );
}

const COLLECTION_VALIDATORS = {
  projects: isProject,
  requests: isRequest,
  analyses: isAnalysis,
  requirements: isRequirement,
  testCases: isTestCase,
  testRuns: isTestRun,
  defects: isDefect,
} satisfies Record<Exclude<keyof DemoState, "schemaVersion">, (v: unknown) => boolean>;

/**
 * Verinin beklenen yapıda olup olmadığını kontrol eder.
 * Sorun varsa okunabilir bir açıklama döndürür, yoksa null.
 */
export function findDemoStateProblem(value: unknown): string | null {
  if (!isRec(value)) return "Veri bir nesne değil.";
  if (value.schemaVersion !== DEMO_SCHEMA_VERSION) return `Desteklenmeyen şema sürümü (${String(value.schemaVersion)}).`;
  for (const [key, validate] of Object.entries(COLLECTION_VALIDATORS)) {
    const list = value[key];
    if (!Array.isArray(list)) return `"${key}" listesi eksik veya hatalı.`;
    const index = list.findIndex((item) => !validate(item));
    if (index !== -1) return `"${key}" listesindeki ${index + 1}. kayıt hatalı.`;
  }
  return null;
}

export function isDemoState(value: unknown): value is DemoState {
  return findDemoStateProblem(value) === null;
}

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
  | { kind: "ok"; state: DemoState }
  | { kind: "invalid"; raw: string; problem: string; backup: BackupOutcome }
  | { kind: "unavailable" };

export type BackupInfo = {
  key: string;
  /** Yedeğin alındığı zaman; önceki sürümün tekil yedeğinde bilinmez (null). */
  createdAt: string | null;
  size: number;
};

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
function backupRaw(storage: Storage, raw: string): BackupOutcome {
  try {
    const keys = backupKeys(storage);
    if (keys.some((key) => storage.getItem(key) === raw)) return "exists";
    if (keys.length >= MAX_BACKUPS) return "limit";
    let key = `${DEMO_BACKUP_PREFIX}.${new Date().toISOString()}`;
    for (let n = 2; storage.getItem(key) !== null; n++) key = `${DEMO_BACKUP_PREFIX}.${new Date().toISOString()}-${n}`;
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
  const problem = findDemoStateProblem(parsed);
  if (problem) return { kind: "invalid", raw, problem, backup: backupRaw(storage, raw) };
  return { kind: "ok", state: parsed as DemoState };
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
