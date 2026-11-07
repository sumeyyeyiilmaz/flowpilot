/**
 * Demo verisi şema geçişleri (saf fonksiyonlar).
 *
 * v1 → v2: Agile koleksiyonları (teamMembers, workItems, sprints, dailyScrums) eklenir.
 * - Mevcut v1 kayıtlarının hiçbiri değiştirilmez, silinmez veya yeniden sıralanmaz.
 * - Geçiş sonrası v1 koleksiyonlarının birebir korunduğu doğrulanır; ardından sonuç v2
 *   kurallarıyla doğrulanır. Herhangi bir adım başarısız olursa geçiş reddedilir ve
 *   çağıran (tarayıcı depolaması) kurtarma moduna geçer; ham veri silinmez.
 * - Geçiş yalnızca bellekte yapılır; depolamaya ancak kullanıcının bir sonraki
 *   değişikliğinde yazılır. (Geçiş öncesi yedek storage.ts'te alınır.)
 *
 * Agile başlangıç verisi: Dört Agile koleksiyonunun TAMAMI boşsa sentetik Agile başlangıç
 * verisi eklenir. Herhangi biri doluysa hiçbirine otomatik veri eklenmez. Eklenen veri
 * mevcut kayıtlarla doğrulanamazsa eklenmez (koleksiyonlar boş kalır, geçiş başarısız sayılmaz).
 */
import { DEMO_SCHEMA_VERSION, type DemoState, type DemoStateV1 } from "../domain/types";
import { createAgileSeed } from "./agile-seed";
import { findDemoStateProblem, findDemoStateV1Problem } from "./validation";

export type MigrationResult =
  | { ok: true; state: DemoState; migratedFrom: number | null; agileSeeded: boolean }
  | { ok: false; problem: string };

const V1_KEYS = ["projects", "requests", "analyses", "requirements", "testCases", "testRuns", "defects"] as const;

/** v1 verisini v2'ye yükseltir: v1 kayıtları aynen, Agile koleksiyonları boş. */
export function migrateV1ToV2(v1: DemoStateV1): DemoState {
  return { ...v1, schemaVersion: 2, teamMembers: [], workItems: [], sprints: [], dailyScrums: [] };
}

const agileIsEmpty = (s: DemoState) =>
  s.teamMembers.length === 0 && s.workItems.length === 0 && s.sprints.length === 0 && s.dailyScrums.length === 0;

/**
 * Dört Agile koleksiyonu da boşsa sentetik Agile başlangıç verisini ekler.
 * Sonuç geçerli değilse (ör. başlangıç verisinin işaret ettiği kayıt yoksa) state'i değiştirmez.
 */
export function seedAgileIfEmpty(state: DemoState): { state: DemoState; seeded: boolean } {
  if (!agileIsEmpty(state)) return { state, seeded: false };
  const candidate: DemoState = { ...state, ...createAgileSeed() };
  return findDemoStateProblem(candidate) === null ? { state: candidate, seeded: true } : { state, seeded: false };
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
 * - Güncel şemadaysa doğrular (`migratedFrom: null`).
 * - v1 ise doğrular, geçirir, kayıpsızlığı ve sonucu doğrular (`migratedFrom: 1`).
 * - Her iki durumda da Agile koleksiyonları tamamen boşsa başlangıç verisi eklenir (`agileSeeded`).
 * - Diğer her durumda okunabilir bir sorun açıklaması döndürür.
 */
export function migrateToCurrent(value: unknown): MigrationResult {
  const version = typeof value === "object" && value !== null ? (value as { schemaVersion?: unknown }).schemaVersion : undefined;

  if (version === DEMO_SCHEMA_VERSION) {
    const problem = findDemoStateProblem(value);
    if (problem) return { ok: false, problem };
    const seeded = seedAgileIfEmpty(value as DemoState);
    return { ok: true, state: seeded.state, migratedFrom: null, agileSeeded: seeded.seeded };
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
    const seeded = seedAgileIfEmpty(migrated);
    return { ok: true, state: seeded.state, migratedFrom: 1, agileSeeded: seeded.seeded };
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false, problem: "Veri bir nesne değil." };
  return { ok: false, problem: `Desteklenmeyen şema sürümü (${String(version)}).` };
}
