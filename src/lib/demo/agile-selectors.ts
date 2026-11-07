/**
 * Agile / Sprint sorguları ve metrikler (saf fonksiyonlar).
 * Burndown ve Velocity kayıt tutulmadan hesaplanır:
 * - Tamamlanan sprintlerde puanlar değişmez özetten (summary) okunur; geçmiş korunur.
 * - Gün sınırları Europe/Istanbul saat dilimine göre belirlenir.
 */
import type { DemoState, Sprint, WorkItem, WorkItemStatus } from "../domain/types";

const TIME_ZONE = "Europe/Istanbul";
const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** ISO zamanı Europe/Istanbul takvim gününe çevirir (YYYY-MM-DD). */
export const toCalendarDay = (iso: string) => dayFormatter.format(new Date(iso));

const points = (items: WorkItem[]) => items.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0);

/** Başlangıç ve bitiş dahil takvim günleri. */
export function sprintDays(sprint: Pick<Sprint, "startDate" | "endDate">): string[] {
  const days: string[] = [];
  for (let d = new Date(`${sprint.startDate}T00:00:00Z`); d <= new Date(`${sprint.endDate}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/* ------------------------------------------------------------------ */
/* Temel sorgular                                                      */
/* ------------------------------------------------------------------ */

export const getTeamMember = (s: DemoState, memberId: string | null) =>
  memberId ? s.teamMembers.find((m) => m.id === memberId) : undefined;

export const getSprint = (s: DemoState, sprintId: string) => s.sprints.find((sp) => sp.id === sprintId);

export const getWorkItem = (s: DemoState, workItemId: string) => s.workItems.find((w) => w.id === workItemId);

/** Projenin sprintleri, başlangıç tarihine göre. */
export const getProjectSprints = (s: DemoState, projectId: string) =>
  s.sprints.filter((sp) => sp.projectId === projectId).sort((a, b) => a.startDate.localeCompare(b.startDate));

export const getActiveSprint = (s: DemoState, projectId: string) =>
  s.sprints.find((sp) => sp.projectId === projectId && sp.status === "Aktif");

/** Product Backlog: sprintsiz işler, sıraya göre. */
export const getBacklog = (s: DemoState, projectId: string) =>
  s.workItems.filter((w) => w.projectId === projectId && w.sprintId === null).sort((a, b) => a.rank - b.rank);

export const getSprintItems = (s: DemoState, sprintId: string) =>
  s.workItems.filter((w) => w.sprintId === sprintId).sort((a, b) => a.rank - b.rank);

const BOARD_COLUMNS: Exclude<WorkItemStatus, "Backlog">[] = ["Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"];

/** Kanban panosu: sprint işleri durum sütunlarına göre. */
export function getSprintBoard(s: DemoState, sprintId: string) {
  const items = getSprintItems(s, sprintId);
  return BOARD_COLUMNS.map((status) => ({ status, items: items.filter((w) => w.status === status) }));
}

/** Daily Scrum kayıtları (isteğe bağlı gün filtresi), tarih ve kişiye göre. */
export const getDailyScrums = (s: DemoState, sprintId: string, date?: string) =>
  s.dailyScrums
    .filter((d) => d.sprintId === sprintId && (date === undefined || d.date === date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.memberId.localeCompare(b.memberId));

export const getDailyScrumEntry = (s: DemoState, sprintId: string, memberId: string, date: string) =>
  s.dailyScrums.find((d) => d.sprintId === sprintId && d.memberId === memberId && d.date === date);

/* ------------------------------------------------------------------ */
/* Puanlar ve metrikler                                                */
/* ------------------------------------------------------------------ */

/** Sprint puanları. Tamamlanan sprintte değişmez özet kullanılır. */
export function getSprintPoints(s: DemoState, sprintId: string) {
  const sprint = getSprint(s, sprintId);
  if (sprint?.summary) {
    const { committedPoints, completedPoints } = sprint.summary;
    return { committed: committedPoints, completed: completedPoints, remaining: committedPoints - completedPoints };
  }
  const items = getSprintItems(s, sprintId);
  const committed = points(items);
  const completed = points(items.filter((w) => w.status === "Tamamlandı"));
  return { committed, completed, remaining: committed - completed };
}

export type BurndownPoint = { date: string; ideal: number; remaining: number | null };

/**
 * Burndown: her gün sonundaki kalan puan ve ideal çizgi.
 * `today` verilirse (YYYY-MM-DD) sonraki günlerin kalan değeri null olur. Tamamlanan sprintte
 * özetteki işler ve tamamlanma zamanları kullanılır.
 * Not (MVP): sprint ortasında eklenen/çıkarılan işler kapsam değişikliği olarak ayrıca gösterilmez.
 */
export function getBurndown(s: DemoState, sprintId: string, today?: string): BurndownPoint[] {
  const sprint = getSprint(s, sprintId);
  if (!sprint) return [];
  const days = sprintDays(sprint);
  const total = getSprintPoints(s, sprintId).committed;

  const completions: { day: string; points: number }[] = sprint.summary
    ? sprint.summary.completedItems.flatMap((ci) => {
        const w = getWorkItem(s, ci.workItemId);
        return w?.completedAt ? [{ day: toCalendarDay(w.completedAt), points: ci.storyPoints }] : [];
      })
    : getSprintItems(s, sprintId)
        .filter((w) => w.status === "Tamamlandı" && w.completedAt)
        .map((w) => ({ day: toCalendarDay(w.completedAt!), points: w.storyPoints ?? 0 }));

  const step = days.length > 1 ? total / (days.length - 1) : total;
  return days.map((day, i) => ({
    date: day,
    ideal: Math.max(0, Math.round((total - step * i) * 10) / 10),
    remaining:
      today !== undefined && day > today
        ? null
        : total - completions.filter((c) => c.day <= day).reduce((sum, c) => sum + c.points, 0),
  }));
}

/** Velocity: tamamlanan son sprintlerin taahhüt/tamamlanan puanları ve ortalama. */
export function getVelocity(s: DemoState, projectId: string, limit = 5) {
  const sprints = s.sprints
    .filter((sp) => sp.projectId === projectId && sp.status === "Tamamlandı" && sp.summary)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(-limit)
    .map((sp) => ({ sprint: sp, committed: sp.summary!.committedPoints, completed: sp.summary!.completedPoints }));
  const average = sprints.length ? Math.round((sprints.reduce((sum, v) => sum + v.completed, 0) / sprints.length) * 10) / 10 : 0;
  return { sprints, average };
}

/* ------------------------------------------------------------------ */
/* İzlenebilirlik                                                      */
/* ------------------------------------------------------------------ */

export const getWorkItemsByRequirement = (s: DemoState, requirementId: string) =>
  s.workItems.filter((w) => w.requirementIds.includes(requirementId));

export const getWorkItemsByRequest = (s: DemoState, requestId: string) =>
  s.workItems.filter((w) => w.requestId === requestId);

export const getWorkItemForDefect = (s: DemoState, defectId: string) => s.workItems.find((w) => w.defectId === defectId);

/** Projeye ait ve henüz bir işe bağlanmamış hata kayıtları ("Hata" işi oluşturmak için). */
export function getUnlinkedDefectsForProject(s: DemoState, projectId: string) {
  const linked = new Set(s.workItems.flatMap((w) => (w.defectId ? [w.defectId] : [])));
  return s.defects.filter((d) => {
    if (linked.has(d.id) || !d.requirementId) return false;
    const requirement = s.requirements.find((r) => r.id === d.requirementId);
    return !!requirement && s.requests.find((q) => q.id === requirement.requestId)?.projectId === projectId;
  });
}

/** İşin izlenebilirlik zinciri. */
export function getTraceForWorkItem(s: DemoState, workItemId: string) {
  const item = getWorkItem(s, workItemId);
  if (!item) return undefined;
  return {
    request: item.requestId ? s.requests.find((r) => r.id === item.requestId) : undefined,
    analysis: item.analysisId ? s.analyses.find((a) => a.id === item.analysisId) : undefined,
    requirements: s.requirements.filter((r) => item.requirementIds.includes(r.id)),
    defect: item.defectId ? s.defects.find((d) => d.id === item.defectId) : undefined,
    sprint: item.sprintId ? getSprint(s, item.sprintId) : undefined,
  };
}
