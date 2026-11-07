/**
 * Agile / Sprint işlemlerinin saf (yan etkisiz) reducer'ı.
 *
 * Ayrı işlemler:
 * - workItem/create            → Product Backlog'a alma (yeni iş, sprintsiz, durum "Backlog")
 * - workItem/addToSprint       → sprinte ekleme
 * - workItem/removeFromSprint  → sprintten çıkarma (backlog'a döner)
 * - workItem/setStatus         → Kanban durum değiştirme (yalnızca aktif sprintte)
 * - workItem/update / rank     → içerik düzenleme / backlog sıralama
 *
 * Kurallar:
 * - Tamamlanan sprintteki işler kilitlidir (geçmiş korunur): durum/sprint değişmez, puan/tür düzenlenmez.
 * - "Hata" türü yalnızca aynı projeye ait, başka bir işe bağlı olmayan mevcut bir Defect ile oluşur.
 * - Bağlantılar (talep/analiz/gereksinim) işin projesine ait olmalıdır.
 * - Daily Scrum sprint + kişi + tarih bazında tekildir; tekrar girişte mevcut kayıt güncellenir.
 * Geçersiz bir işlem state'i değiştirmez (aynı referans döner).
 */
import {
  SPRINT_BOARD_STATUSES,
  STORY_POINTS,
  type DemoState,
  type Sprint,
  type StoryPoint,
  type WorkItem,
  type SprintBoardStatus,
  type WorkItemType,
} from "../domain/types";
import { nextCode, type ActionMeta } from "./reducer";

export type WorkItemLinks = {
  requestId?: string | null;
  analysisId?: string | null;
  requirementIds?: string[];
};

export type NewWorkItemInput = WorkItemLinks & {
  projectId: string;
  type: WorkItemType;
  title: string;
  description: string;
  storyPoints: StoryPoint | null;
  estimateHours?: number;
  assigneeId: string | null;
  /** Yalnızca "Hata" türünde ve zorunlu. */
  defectId?: string | null;
};

export type WorkItemChanges = WorkItemLinks &
  Partial<{
    title: string;
    description: string;
    type: WorkItemType;
    storyPoints: StoryPoint | null;
    estimateHours: number | null;
    assigneeId: string | null;
    defectId: string | null;
  }>;

export type NewSprintInput = { projectId: string; name: string; goal: string; startDate: string; endDate: string };
export type SprintChanges = Partial<Omit<NewSprintInput, "projectId">>;

export type DailyScrumInput = {
  sprintId: string;
  memberId: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
};

export type AgileAction =
  | { type: "workItem/create"; meta: ActionMeta; input: NewWorkItemInput }
  | { type: "workItem/update"; meta: ActionMeta; workItemId: string; changes: WorkItemChanges }
  | { type: "workItem/rank"; meta: ActionMeta; workItemId: string; direction: "up" | "down" }
  | { type: "workItem/addToSprint"; meta: ActionMeta; workItemId: string; sprintId: string }
  | { type: "workItem/removeFromSprint"; meta: ActionMeta; workItemId: string }
  | { type: "workItem/setStatus"; meta: ActionMeta; workItemId: string; status: SprintBoardStatus }
  | { type: "sprint/create"; meta: ActionMeta; input: NewSprintInput }
  | { type: "sprint/update"; meta: ActionMeta; sprintId: string; changes: SprintChanges }
  | { type: "sprint/start"; meta: ActionMeta; sprintId: string }
  | { type: "sprint/complete"; meta: ActionMeta; sprintId: string }
  | { type: "daily/upsert"; meta: ActionMeta; input: DailyScrumInput };

const AGILE_PREFIXES = ["workItem/", "sprint/", "daily/"];
export const isAgileAction = (action: { type: string }): action is AgileAction =>
  AGILE_PREFIXES.some((prefix) => action.type.startsWith(prefix));

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

const isCalendarDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isStoryPoint = (v: unknown): v is StoryPoint | null => v === null || (STORY_POINTS as readonly unknown[]).includes(v);

const projectOfRequest = (s: DemoState, requestId: string) => s.requests.find((r) => r.id === requestId)?.projectId;

function projectOfDefect(s: DemoState, defectId: string): string | undefined | null {
  const defect = s.defects.find((d) => d.id === defectId);
  if (!defect) return undefined; // yok
  if (!defect.requirementId) return null; // projesi belirlenemiyor
  const requirement = s.requirements.find((r) => r.id === defect.requirementId);
  return requirement ? projectOfRequest(s, requirement.requestId) : null;
}

/** Bağlantıların işin projesine ait ve birbiriyle tutarlı olduğunu doğrular. */
function linksAreValid(s: DemoState, projectId: string, links: { requestId?: string; analysisId?: string; requirementIds: string[] }) {
  if (links.requestId !== undefined && projectOfRequest(s, links.requestId) !== projectId) return false;
  if (links.analysisId !== undefined) {
    const analysis = s.analyses.find((a) => a.id === links.analysisId);
    if (!analysis || projectOfRequest(s, analysis.requestId) !== projectId) return false;
    if (links.requestId !== undefined && analysis.requestId !== links.requestId) return false;
  }
  for (const id of links.requirementIds) {
    const requirement = s.requirements.find((r) => r.id === id);
    if (!requirement || projectOfRequest(s, requirement.requestId) !== projectId) return false;
    if (links.requestId !== undefined && requirement.requestId !== links.requestId) return false;
  }
  return new Set(links.requirementIds).size === links.requirementIds.length;
}

/** "Hata" işi için Defect bağının geçerli ve tekil olduğunu doğrular. */
function defectLinkIsValid(s: DemoState, projectId: string, defectId: string, selfId?: string) {
  const defectProject = projectOfDefect(s, defectId);
  if (defectProject === undefined) return false;
  if (defectProject !== null && defectProject !== projectId) return false;
  return !s.workItems.some((w) => w.defectId === defectId && w.id !== selfId);
}

const sprintOf = (s: DemoState, item: WorkItem): Sprint | undefined =>
  item.sprintId ? s.sprints.find((sp) => sp.id === item.sprintId) : undefined;

/** Tamamlanan sprintteki işler kilitlidir. */
const isLocked = (s: DemoState, item: WorkItem) => sprintOf(s, item)?.status === "Tamamlandı";

const nextBacklogRank = (s: DemoState, projectId: string) =>
  s.workItems.filter((w) => w.projectId === projectId).reduce((max, w) => Math.max(max, w.rank), 0) + 1;

function replaceItem(s: DemoState, id: string, update: (item: WorkItem) => WorkItem | null): DemoState {
  const index = s.workItems.findIndex((w) => w.id === id);
  if (index === -1) return s;
  const next = update(s.workItems[index]);
  if (!next) return s;
  const workItems = [...s.workItems];
  workItems[index] = next;
  return { ...s, workItems };
}

function replaceSprint(s: DemoState, id: string, update: (sprint: Sprint) => Sprint | null): DemoState {
  const index = s.sprints.findIndex((sp) => sp.id === id);
  if (index === -1) return s;
  const next = update(s.sprints[index]);
  if (!next) return s;
  const sprints = [...s.sprints];
  sprints[index] = next;
  return { ...s, sprints };
}

/** İsteğe bağlı bağlantıları uygular: undefined → değişmez, null → kaldırılır. */
function applyLinks(item: WorkItem, links: WorkItemLinks): WorkItem {
  const next = { ...item };
  if (links.requestId !== undefined) {
    if (links.requestId === null) delete next.requestId;
    else next.requestId = links.requestId;
  }
  if (links.analysisId !== undefined) {
    if (links.analysisId === null) delete next.analysisId;
    else next.analysisId = links.analysisId;
  }
  if (links.requirementIds !== undefined) next.requirementIds = [...links.requirementIds];
  return next;
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function agileReducer(state: DemoState, action: AgileAction): DemoState {
  const { meta } = action;

  switch (action.type) {
    case "workItem/create": {
      const input = action.input;
      const title = input.title.trim();
      if (!title || !state.projects.some((p) => p.id === input.projectId)) return state;
      if (!isStoryPoint(input.storyPoints)) return state;
      if (input.estimateHours !== undefined && !(Number.isFinite(input.estimateHours) && input.estimateHours >= 0)) return state;
      if (input.assigneeId !== null && !state.teamMembers.some((m) => m.id === input.assigneeId)) return state;
      const links = {
        requestId: input.requestId ?? undefined,
        analysisId: input.analysisId ?? undefined,
        requirementIds: input.requirementIds ?? [],
      };
      if (!linksAreValid(state, input.projectId, links)) return state;
      const defectId = input.defectId ?? null;
      if (input.type === "Hata" ? !defectId || !defectLinkIsValid(state, input.projectId, defectId) : defectId !== null) return state;

      const item: WorkItem = {
        id: meta.newId(),
        code: nextCode(state.workItems, "PBI"),
        projectId: input.projectId,
        type: input.type,
        title,
        description: input.description.trim(),
        status: "Backlog",
        rank: nextBacklogRank(state, input.projectId),
        storyPoints: input.storyPoints,
        ...(input.estimateHours !== undefined ? { estimateHours: input.estimateHours } : {}),
        assigneeId: input.assigneeId,
        sprintId: null,
        ...(links.requestId ? { requestId: links.requestId } : {}),
        ...(links.analysisId ? { analysisId: links.analysisId } : {}),
        requirementIds: [...links.requirementIds],
        defectId,
        createdAt: meta.now,
        updatedAt: meta.now,
      };
      return { ...state, workItems: [...state.workItems, item] };
    }

    case "workItem/update":
      return replaceItem(state, action.workItemId, (item) => {
        const c = action.changes;
        const locked = isLocked(state, item);
        // Kilitli işte yalnızca başlık ve açıklama düzenlenebilir.
        if (locked && (c.type !== undefined || c.storyPoints !== undefined || c.estimateHours !== undefined || c.defectId !== undefined)) return null;

        let next = applyLinks(item, c);
        if (!linksAreValid(state, item.projectId, { requestId: next.requestId, analysisId: next.analysisId, requirementIds: next.requirementIds })) return null;
        if (c.title !== undefined) {
          const title = c.title.trim();
          if (!title) return null;
          next.title = title;
        }
        if (c.description !== undefined) next.description = c.description.trim();
        if (c.storyPoints !== undefined) {
          if (!isStoryPoint(c.storyPoints)) return null;
          next.storyPoints = c.storyPoints;
        }
        if (c.estimateHours !== undefined) {
          if (c.estimateHours === null) delete next.estimateHours;
          else if (Number.isFinite(c.estimateHours) && c.estimateHours >= 0) next.estimateHours = c.estimateHours;
          else return null;
        }
        if (c.assigneeId !== undefined) {
          if (c.assigneeId !== null && !state.teamMembers.some((m) => m.id === c.assigneeId)) return null;
          next.assigneeId = c.assigneeId;
        }
        // Tür ve Defect bağı birlikte değerlendirilir.
        const type = c.type ?? item.type;
        const defectId = type === "Hata" ? (c.defectId !== undefined ? c.defectId : item.defectId) : null;
        if (type !== "Hata" && c.defectId) return null;
        if (type === "Hata" && (!defectId || !defectLinkIsValid(state, item.projectId, defectId, item.id))) return null;
        next = { ...next, type, defectId, updatedAt: meta.now };
        return next;
      });

    case "workItem/rank": {
      const item = state.workItems.find((w) => w.id === action.workItemId);
      if (!item || item.sprintId !== null) return state;
      const backlog = state.workItems
        .filter((w) => w.projectId === item.projectId && w.sprintId === null)
        .sort((a, b) => a.rank - b.rank);
      const from = backlog.findIndex((w) => w.id === item.id);
      const to = action.direction === "up" ? from - 1 : from + 1;
      if (to < 0 || to >= backlog.length) return state;
      const other = backlog[to];
      return {
        ...state,
        workItems: state.workItems.map((w) =>
          w.id === item.id ? { ...w, rank: other.rank, updatedAt: meta.now } : w.id === other.id ? { ...w, rank: item.rank, updatedAt: meta.now } : w
        ),
      };
    }

    case "workItem/addToSprint": {
      const sprint = state.sprints.find((sp) => sp.id === action.sprintId);
      if (!sprint || sprint.status === "Tamamlandı") return state;
      return replaceItem(state, action.workItemId, (item) => {
        if (item.projectId !== sprint.projectId || item.sprintId === sprint.id || isLocked(state, item)) return null;
        const { completedAt: _completed, ...rest } = item;
        void _completed;
        return { ...rest, sprintId: sprint.id, status: "Yapılacak", updatedAt: meta.now };
      });
    }

    case "workItem/removeFromSprint":
      return replaceItem(state, action.workItemId, (item) => {
        if (item.sprintId === null || isLocked(state, item)) return null;
        const { completedAt: _completed, ...rest } = item;
        void _completed;
        return { ...rest, sprintId: null, status: "Backlog", rank: nextBacklogRank(state, item.projectId), updatedAt: meta.now };
      });

    case "workItem/setStatus":
      return replaceItem(state, action.workItemId, (item) => {
        // Tip SprintBoardStatus ile sınırlı; tip dışı çağrılara karşı çalışma anında da doğrulanır.
        if (item.status === action.status || !(SPRINT_BOARD_STATUSES as readonly string[]).includes(action.status)) return null;
        const sprint = sprintOf(state, item);
        if (!sprint || sprint.status !== "Aktif") return null; // Kanban yalnızca aktif sprintte
        const { completedAt: _completed, ...rest } = item;
        void _completed;
        return {
          ...rest,
          status: action.status,
          ...(action.status === "Tamamlandı" ? { completedAt: meta.now } : {}),
          updatedAt: meta.now,
        };
      });

    case "sprint/create": {
      const input = action.input;
      const name = input.name.trim();
      if (!name || !state.projects.some((p) => p.id === input.projectId)) return state;
      if (!isCalendarDate(input.startDate) || !isCalendarDate(input.endDate) || input.startDate > input.endDate) return state;
      const sprint: Sprint = {
        id: meta.newId(),
        code: nextCode(state.sprints, "SPR"),
        projectId: input.projectId,
        name,
        goal: input.goal.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        status: "Planlandı",
      };
      return { ...state, sprints: [...state.sprints, sprint] };
    }

    case "sprint/update":
      return replaceSprint(state, action.sprintId, (sprint) => {
        if (sprint.status === "Tamamlandı") return null;
        const c = action.changes;
        const next = {
          ...sprint,
          ...(c.name !== undefined ? { name: c.name.trim() } : {}),
          ...(c.goal !== undefined ? { goal: c.goal.trim() } : {}),
          ...(c.startDate !== undefined ? { startDate: c.startDate } : {}),
          ...(c.endDate !== undefined ? { endDate: c.endDate } : {}),
        };
        if (!next.name || !isCalendarDate(next.startDate) || !isCalendarDate(next.endDate) || next.startDate > next.endDate) return null;
        return next;
      });

    case "sprint/start": {
      const sprint = state.sprints.find((sp) => sp.id === action.sprintId);
      if (!sprint || sprint.status !== "Planlandı") return state;
      if (state.sprints.some((sp) => sp.projectId === sprint.projectId && sp.status === "Aktif")) return state;
      return replaceSprint(state, sprint.id, (sp) => ({ ...sp, status: "Aktif" }));
    }

    case "sprint/complete": {
      const sprint = state.sprints.find((sp) => sp.id === action.sprintId);
      if (!sprint || sprint.status !== "Aktif") return state;
      const items = state.workItems.filter((w) => w.sprintId === sprint.id);
      const done = items.filter((w) => w.status === "Tamamlandı");
      const notDone = items.filter((w) => w.status !== "Tamamlandı");
      const points = (list: WorkItem[]) => list.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0);
      let rank = nextBacklogRank(state, sprint.projectId);
      const carried = new Map(notDone.map((w) => [w.id, rank++]));
      return {
        ...state,
        sprints: state.sprints.map((sp) =>
          sp.id === sprint.id
            ? {
                ...sp,
                status: "Tamamlandı",
                completedAt: meta.now,
                // Değişmez özet: sonradan puan değişse veya işler taşınsa da geçmiş korunur.
                summary: {
                  committedPoints: points(items),
                  completedPoints: points(done),
                  completedItems: done.map((w) => ({ workItemId: w.id, storyPoints: w.storyPoints ?? 0 })),
                  carriedOverItemIds: notDone.map((w) => w.id),
                },
              }
            : sp
        ),
        // Bitmemiş işler Product Backlog'a döner; tamamlananlar sprintte kalır.
        workItems: state.workItems.map((w) => {
          if (!carried.has(w.id)) return w;
          const { completedAt: _completed, ...rest } = w;
          void _completed;
          return { ...rest, sprintId: null, status: "Backlog", rank: carried.get(w.id)!, updatedAt: meta.now };
        }),
      };
    }

    case "daily/upsert": {
      const input = action.input;
      const sprint = state.sprints.find((sp) => sp.id === input.sprintId);
      if (!sprint || sprint.status !== "Aktif") return state;
      if (!state.teamMembers.some((m) => m.id === input.memberId)) return state;
      if (!isCalendarDate(input.date) || input.date < sprint.startDate || input.date > sprint.endDate) return state;
      const texts = { yesterday: input.yesterday.trim(), today: input.today.trim(), blockers: input.blockers.trim() };
      if (!texts.yesterday && !texts.today && !texts.blockers) return state;

      const index = state.dailyScrums.findIndex(
        (d) => d.sprintId === input.sprintId && d.memberId === input.memberId && d.date === input.date
      );
      if (index !== -1) {
        // Tekrar giriş: aynı kayıt güncellenir (kimlik korunur).
        const dailyScrums = [...state.dailyScrums];
        dailyScrums[index] = { ...dailyScrums[index], ...texts, updatedAt: meta.now };
        return { ...state, dailyScrums };
      }
      return {
        ...state,
        dailyScrums: [
          ...state.dailyScrums,
          { id: meta.newId(), sprintId: input.sprintId, memberId: input.memberId, date: input.date, ...texts, updatedAt: meta.now },
        ],
      };
    }
  }
}
