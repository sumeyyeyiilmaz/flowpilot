/**
 * Demo verisinin yapısal doğrulaması (saf fonksiyonlar).
 *
 * - v1 koleksiyonları (proje … hata) ve v2 ile eklenen Agile koleksiyonları ayrı doğrulanır.
 * - Kayıt yapısının yanında koleksiyonlar arası kurallar da kontrol edilir
 *   (ör. Daily Scrum tekilliği, Hata işi ↔ Defect bağının tekilliği).
 * - Sorun varsa okunabilir bir açıklama döndürülür; tarayıcı depolaması bu açıklamayla
 *   kurtarma moduna geçer (veri silinmez).
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
  SPRINT_STATUSES,
  STORY_POINTS,
  TEST_RESULTS,
  WORK_ITEM_STATUSES,
  WORK_ITEM_TYPES,
  type DemoState,
  type DemoStateV1,
} from "../domain/types";

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const optStr = (v: unknown) => v === undefined || isStr(v);
const nullableStr = (v: unknown) => v === null || isStr(v);
const oneOf = (list: readonly (string | number)[]) => (v: unknown) => (isStr(v) || isNum(v)) && list.includes(v);
const hasStrings = (r: Rec, keys: string[]) => keys.every((k) => isStr(r[k]));
const isCalendarDate = (v: unknown) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);

/* ------------------------------------------------------------------ */
/* v1 koleksiyonları                                                   */
/* ------------------------------------------------------------------ */

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
    nullableStr(v.sectionId) &&
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

const V1_VALIDATORS = {
  projects: isProject,
  requests: isRequest,
  analyses: isAnalysis,
  requirements: isRequirement,
  testCases: isTestCase,
  testRuns: isTestRun,
  defects: isDefect,
} satisfies Record<Exclude<keyof DemoStateV1, "schemaVersion">, (v: unknown) => boolean>;

/* ------------------------------------------------------------------ */
/* v2: Agile koleksiyonları                                            */
/* ------------------------------------------------------------------ */

function isTeamMember(v: unknown): boolean {
  return isRec(v) && hasStrings(v, ["id", "name", "role"]);
}

function isWorkItem(v: unknown): boolean {
  if (!isRec(v)) return false;
  if (!hasStrings(v, ["id", "code", "projectId", "title", "description", "createdAt", "updatedAt"])) return false;
  if (!oneOf(WORK_ITEM_TYPES)(v.type) || !oneOf(WORK_ITEM_STATUSES)(v.status) || !isNum(v.rank)) return false;
  if (!(v.storyPoints === null || oneOf(STORY_POINTS)(v.storyPoints))) return false;
  if (!(v.estimateHours === undefined || (isNum(v.estimateHours) && v.estimateHours >= 0))) return false;
  if (!nullableStr(v.assigneeId) || !nullableStr(v.sprintId) || !nullableStr(v.defectId)) return false;
  if (!optStr(v.requestId) || !optStr(v.analysisId) || !optStr(v.completedAt) || !isStrArr(v.requirementIds)) return false;
  // "Hata" türü bir Defect kaydına bağlı olmalı; diğer türler bağlanamaz.
  return v.type === "Hata" ? isStr(v.defectId) : v.defectId === null;
}

function isSprintSummary(v: unknown): boolean {
  return (
    isRec(v) &&
    isNum(v.committedPoints) &&
    isNum(v.completedPoints) &&
    Array.isArray(v.completedItems) &&
    v.completedItems.every((i) => isRec(i) && isStr(i.workItemId) && isNum(i.storyPoints)) &&
    isStrArr(v.carriedOverItemIds)
  );
}

function isSprint(v: unknown): boolean {
  if (!isRec(v) || !hasStrings(v, ["id", "code", "projectId", "name", "goal"])) return false;
  if (!isCalendarDate(v.startDate) || !isCalendarDate(v.endDate) || !oneOf(SPRINT_STATUSES)(v.status)) return false;
  if (!optStr(v.completedAt) || !(v.summary === undefined || isSprintSummary(v.summary))) return false;
  // Tamamlanan sprintin geçmişi (özet) korunmalıdır.
  return v.status === "Tamamlandı" ? isStr(v.completedAt) && v.summary !== undefined : v.summary === undefined;
}

function isDailyScrumEntry(v: unknown): boolean {
  return (
    isRec(v) &&
    hasStrings(v, ["id", "sprintId", "memberId", "yesterday", "today", "blockers", "updatedAt"]) &&
    isCalendarDate(v.date)
  );
}

const V2_AGILE_VALIDATORS = {
  teamMembers: isTeamMember,
  workItems: isWorkItem,
  sprints: isSprint,
  dailyScrums: isDailyScrumEntry,
} satisfies Record<Exclude<keyof DemoState, keyof DemoStateV1>, (v: unknown) => boolean>;

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

function findCollectionProblem(value: Rec, validators: Record<string, (v: unknown) => boolean>): string | null {
  for (const [key, validate] of Object.entries(validators)) {
    const list = value[key];
    if (!Array.isArray(list)) return `"${key}" listesi eksik veya hatalı.`;
    const index = list.findIndex((item) => !validate(item));
    if (index !== -1) return `"${key}" listesindeki ${index + 1}. kayıt hatalı.`;
  }
  return null;
}

function firstDuplicate(values: string[]): string | undefined {
  const seen = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) return v;
    seen.add(v);
  }
  return undefined;
}

/** Agile koleksiyonları için koleksiyonlar arası kurallar (yapısal doğrulamadan sonra çağrılır). */
function findAgileRelationProblem(state: DemoState): string | null {
  for (const key of ["teamMembers", "workItems", "sprints", "dailyScrums"] as const) {
    const dup = firstDuplicate(state[key].map((r) => r.id));
    if (dup) return `"${key}" listesinde tekrarlanan kimlik: ${dup}.`;
  }

  const projectIds = new Set(state.projects.map((p) => p.id));
  const sprintIds = new Set(state.sprints.map((s) => s.id));
  const memberIds = new Set(state.teamMembers.map((m) => m.id));
  const defectIds = new Set(state.defects.map((d) => d.id));

  for (const sprint of state.sprints) {
    if (!projectIds.has(sprint.projectId)) return `${sprint.code} sprinti olmayan bir projeye bağlı.`;
  }
  const activeByProject = new Map<string, number>();
  for (const sprint of state.sprints.filter((s) => s.status === "Aktif")) {
    activeByProject.set(sprint.projectId, (activeByProject.get(sprint.projectId) ?? 0) + 1);
  }
  for (const [projectId, count] of activeByProject) {
    if (count > 1) return `${projectId} projesinde birden fazla aktif sprint var.`;
  }

  const completedSprintIds = new Set(state.sprints.filter((s) => s.status === "Tamamlandı").map((s) => s.id));
  for (const item of state.workItems) {
    if (!projectIds.has(item.projectId)) return `${item.code} işi olmayan bir projeye bağlı.`;
    if (item.sprintId !== null && !sprintIds.has(item.sprintId)) return `${item.code} işi olmayan bir sprinte bağlı.`;
    // Product Backlog ile Sprint Kanban durumları ayrıdır.
    if (item.sprintId === null && item.status !== "Backlog") return `${item.code} işi sprintte değil ama durumu "${item.status}".`;
    if (item.sprintId !== null && item.status === "Backlog") return `${item.code} işi sprintte ama durumu "Backlog".`;
    // Tamamlanma zamanı yalnızca tamamlanan işte bulunur.
    if (item.status === "Tamamlandı" && item.completedAt === undefined) return `${item.code} işi tamamlanmış ama tamamlanma zamanı yok.`;
    if (item.status !== "Tamamlandı" && item.completedAt !== undefined) return `${item.code} işi tamamlanmamış ama tamamlanma zamanı var.`;
    // Tamamlanan sprintte bitmemiş iş kalamaz (bitmemiş işler kapanışta backlog'a döner).
    if (item.sprintId !== null && completedSprintIds.has(item.sprintId) && item.status !== "Tamamlandı")
      return `${item.code} işi tamamlanmış bir sprintte ama durumu "${item.status}".`;
    if (item.assigneeId !== null && !memberIds.has(item.assigneeId)) return `${item.code} işi olmayan bir ekip üyesine atanmış.`;
    if (item.defectId !== null && !defectIds.has(item.defectId)) return `${item.code} işi olmayan bir hata kaydına bağlı.`;
  }
  const dupDefect = firstDuplicate(state.workItems.flatMap((w) => (w.defectId ? [w.defectId] : [])));
  if (dupDefect) return `${dupDefect} hata kaydı birden fazla işe bağlı (mükerrer hata işi).`;

  for (const entry of state.dailyScrums) {
    if (!sprintIds.has(entry.sprintId)) return "Bir Daily Scrum kaydı olmayan bir sprinte bağlı.";
    if (!memberIds.has(entry.memberId)) return "Bir Daily Scrum kaydı olmayan bir ekip üyesine bağlı.";
  }
  const dupDaily = firstDuplicate(state.dailyScrums.map((d) => `${d.sprintId}|${d.memberId}|${d.date}`));
  if (dupDaily) return `Aynı sprint, kişi ve tarih için birden fazla Daily Scrum kaydı var (${dupDaily.replaceAll("|", " / ")}).`;

  return null;
}

/* ------------------------------------------------------------------ */
/* Dışa açık doğrulayıcılar                                            */
/* ------------------------------------------------------------------ */

/** Şema v1 verisinin yapısını doğrular (geçiş öncesi). */
export function findDemoStateV1Problem(value: unknown): string | null {
  if (!isRec(value)) return "Veri bir nesne değil.";
  if (value.schemaVersion !== 1) return `Beklenen şema sürümü 1, bulunan ${String(value.schemaVersion)}.`;
  return findCollectionProblem(value, V1_VALIDATORS);
}

/**
 * Güncel şema (v2) verisini doğrular. Sorun varsa okunabilir açıklama, yoksa null döndürür.
 */
export function findDemoStateProblem(value: unknown): string | null {
  if (!isRec(value)) return "Veri bir nesne değil.";
  if (value.schemaVersion !== DEMO_SCHEMA_VERSION) return `Desteklenmeyen şema sürümü (${String(value.schemaVersion)}).`;
  const structural =
    findCollectionProblem(value, V1_VALIDATORS) ?? findCollectionProblem(value, V2_AGILE_VALIDATORS);
  if (structural) return structural;
  return findAgileRelationProblem(value as DemoState);
}

export function isDemoState(value: unknown): value is DemoState {
  return findDemoStateProblem(value) === null;
}
