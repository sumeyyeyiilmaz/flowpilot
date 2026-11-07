/**
 * Demo verisi şema geçişleri (saf fonksiyonlar).
 *
 * v1 → v2: Agile koleksiyonları (teamMembers, workItems, sprints, dailyScrums) eklenir.
 * - Mevcut v1 kayıtlarının hiçbiri değiştirilmez, silinmez veya yeniden sıralanmaz.
 * - Eklenen koleksiyonların başlangıç değerleri sentetik başlangıç verisinden alınır.
 * - Geçiş sonrası v1 koleksiyonlarının birebir korunduğu doğrulanır; ardından sonuç v2
 *   kurallarıyla doğrulanır. Herhangi bir adım başarısız olursa geçiş reddedilir ve
 *   çağıran (tarayıcı depolaması) kurtarma moduna geçer; ham veri silinmez.
 * - Geçiş yalnızca bellekte yapılır; depolamaya ancak kullanıcının bir sonraki
 *   değişikliğinde yazılır.
 */
import { DEMO_SCHEMA_VERSION, type DemoState, type DemoStateV1 } from "../domain/types";
import { createSeedState } from "./seed";
import { findDemoStateProblem, findDemoStateV1Problem } from "./validation";

export type MigrationResult =
  | { ok: true; state: DemoState; migratedFrom: number | null }
  | { ok: false; problem: string };

const V1_KEYS = ["projects", "requests", "analyses", "requirements", "testCases", "testRuns", "defects"] as const;

/** v1 verisini v2'ye yükseltir. Girdi önceden v1 olarak doğrulanmış olmalıdır. */
export function migrateV1ToV2(v1: DemoStateV1): DemoState {
  const seed = createSeedState();
  return {
    ...v1,
    schemaVersion: 2,
    teamMembers: seed.teamMembers,
    workItems: seed.workItems,
    sprints: seed.sprints,
    dailyScrums: seed.dailyScrums,
  };
}

/** Geçişin v1 kayıtlarını birebir koruduğunu doğrular. */
function findLossProblem(before: DemoStateV1, after: DemoState): string | null {
  for (const key of V1_KEYS) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      return `Geçiş "${key}" kayıtlarını değiştirdi; geçiş iptal edildi.`;
    }
  }
  return null;
}

/**
 * Okunan veriyi güncel şemaya getirir.
 * - Güncel şemadaysa yalnızca doğrular (`migratedFrom: null`).
 * - v1 ise doğrular, geçirir, kayıpsızlığı ve sonucu doğrular (`migratedFrom: 1`).
 * - Diğer her durumda okunabilir bir sorun açıklaması döndürür.
 */
export function migrateToCurrent(value: unknown): MigrationResult {
  const version = typeof value === "object" && value !== null ? (value as { schemaVersion?: unknown }).schemaVersion : undefined;

  if (version === DEMO_SCHEMA_VERSION) {
    const problem = findDemoStateProblem(value);
    return problem ? { ok: false, problem } : { ok: true, state: value as DemoState, migratedFrom: null };
  }

  if (version === 1) {
    const v1Problem = findDemoStateV1Problem(value);
    if (v1Problem) return { ok: false, problem: `Şema v1 verisi okunamadı: ${v1Problem}` };
    const v1 = value as DemoStateV1;
    let migrated: DemoState;
    try {
      migrated = migrateV1ToV2(v1);
    } catch {
      return { ok: false, problem: "Şema v1 → v2 geçişi sırasında beklenmeyen hata oluştu." };
    }
    const loss = findLossProblem(v1, migrated);
    if (loss) return { ok: false, problem: loss };
    const v2Problem = findDemoStateProblem(migrated);
    if (v2Problem) return { ok: false, problem: `Şema v1 → v2 geçişi doğrulanamadı: ${v2Problem}` };
    return { ok: true, state: migrated, migratedFrom: 1 };
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false, problem: "Veri bir nesne değil." };
  return { ok: false, problem: `Desteklenmeyen şema sürümü (${String(version)}).` };
}
