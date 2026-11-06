/**
 * Demo store'un saf (yan etkisiz) çekirdeği.
 * Kimlik ve zaman bilgisi dışarıdan (`meta`) gelir; böylece reducer test edilebilir kalır.
 */
import type {
  Analysis,
  AnalysisSection,
  ChangeDetails,
  DemoState,
  MoscowPriority,
  NewWorkDetails,
  Priority,
  RequestStatus,
  RequirementStatus,
  RequirementType,
  SectionKind,
  WorkRequest,
  AnalysisStatus,
} from "../domain/types";
import { DEFAULT_SECTIONS_BY_REQUEST_TYPE } from "./section-presets";

export type ActionMeta = {
  /** ISO tarih-saat. */
  now: string;
  /** Yeni kayıt kimliği üretir. */
  newId: () => string;
};

type RequestCommon = {
  projectId: string;
  title: string;
  description: string;
  requester: string;
  priority: Priority;
  /** Verilmezse "Taslak". */
  status?: RequestStatus;
  dueDate?: string;
};

export type NewRequestInput =
  | (RequestCommon & { type: "new"; details: NewWorkDetails })
  | (RequestCommon & { type: "change"; details: ChangeDetails });

export type RequestChanges = Partial<
  Pick<WorkRequest, "projectId" | "type" | "title" | "description" | "requester" | "priority" | "status" | "dueDate">
>;

/** Tür değiştiğinde kullanılan boş türe özel ayrıntılar. */
export const EMPTY_NEW_WORK_DETAILS: NewWorkDetails = { businessGoal: "", targetUsers: "", expectedBenefit: "" };
export const EMPTY_CHANGE_DETAILS: ChangeDetails = {
  affectedSystem: "",
  currentBehavior: "",
  desiredBehavior: "",
  changeReason: "",
  impactLevel: "Orta",
};

function applyRequestChanges(request: WorkRequest, changes: RequestChanges, now: string): WorkRequest {
  const { type, ...rest } = changes;
  const trimmed = {
    ...rest,
    ...(rest.title !== undefined ? { title: rest.title.trim() } : {}),
    ...(rest.description !== undefined ? { description: rest.description.trim() } : {}),
    ...(rest.requester !== undefined ? { requester: rest.requester.trim() } : {}),
    updatedAt: now,
  };
  if (type === undefined || type === request.type) {
    return { ...request, ...trimmed } as WorkRequest;
  }
  // Tür değişti: önceki türün ayrıntıları yeni türe uymadığı için boş varsayılanlarla başlanır.
  return type === "new"
    ? { ...request, ...trimmed, type: "new", details: { ...EMPTY_NEW_WORK_DETAILS } }
    : { ...request, ...trimmed, type: "change", details: { ...EMPTY_CHANGE_DETAILS } };
}

export type NewAnalysisInput = {
  requestId: string;
  title: string;
  description?: string;
  author: string;
  /** true: talep türüne göre önerilen bölümlerle başlar; false: boş başlar. */
  usePresetSections: boolean;
};

export type NewRequirementInput = {
  requestId: string;
  analysisId: string;
  sectionId?: string | null;
  title: string;
  description: string;
  type: RequirementType;
  priority: MoscowPriority;
  acceptanceCriteria?: string[];
};

export type DemoAction =
  | { type: "request/create"; meta: ActionMeta; input: NewRequestInput }
  | { type: "request/update"; meta: ActionMeta; requestId: string; changes: RequestChanges }
  | { type: "request/setStatus"; meta: ActionMeta; requestId: string; status: RequestStatus }
  | { type: "analysis/create"; meta: ActionMeta; input: NewAnalysisInput }
  | {
      type: "analysis/update";
      meta: ActionMeta;
      analysisId: string;
      changes: AnalysisChanges;
    }
  | {
      type: "section/add";
      meta: ActionMeta;
      analysisId: string;
      title: string;
      kind: SectionKind;
      /** Eklenecek konum; verilmezse sona eklenir. */
      index?: number;
    }
  | { type: "section/update"; meta: ActionMeta; analysisId: string; section: AnalysisSection }
  | { type: "section/remove"; meta: ActionMeta; analysisId: string; sectionId: string }
  | { type: "section/move"; meta: ActionMeta; analysisId: string; sectionId: string; direction: "up" | "down" }
  | { type: "requirement/create"; meta: ActionMeta; input: NewRequirementInput }
  | {
      type: "requirement/setStatus";
      meta: ActionMeta;
      requirementId: string;
      status: RequirementStatus;
    }
  | { type: "requirement/update"; meta: ActionMeta; requirementId: string; changes: RequirementChanges }
  /** Analizin tamamını temizler (analiz değiştirilirken, sayfa gizlenirken). */
  | { type: "analysis/normalize"; meta: ActionMeta; analysisId: string }
  /** Tek bölümü temizler (odak bölümden çıkınca). */
  | { type: "section/normalize"; meta: ActionMeta; analysisId: string; sectionId: string };

export type AnalysisChanges = { title?: string; description?: string; status?: AnalysisStatus };

export type RequirementChanges = Partial<{
  title: string;
  description: string;
  type: RequirementType;
  priority: MoscowPriority;
  status: RequirementStatus;
  /** null: bölüm bağlantısını kaldırır. */
  sectionId: string | null;
  acceptanceCriteria: string[];
}>;

/** Var olan kodlara bakarak bir sonraki kodu üretir (ör. TLP-006 → TLP-007). */
export function nextCode(existing: { code: string }[], prefix: string): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = existing.reduce((acc, item) => {
    const match = pattern.exec(item.code);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Normalleştirme (yazarken bırakılan boşlukların güvenli temizliği)   */
/* ------------------------------------------------------------------ */

export const UNTITLED_ANALYSIS = "Adsız analiz";
export const UNTITLED_SECTION = "Adsız bölüm";

/**
 * Bölümü temizler: başlığı kırpar (boşsa "Adsız bölüm"), boş liste maddelerini ve
 * metni boş kontrol listesi maddelerini kaldırır. Metin bölümü içeriğine dokunmaz.
 * Değişiklik yoksa aynı nesneyi döndürür.
 */
export function normalizeSection(section: AnalysisSection): AnalysisSection {
  const title = section.title.trim() || UNTITLED_SECTION;
  let changed = title !== section.title;
  let next: AnalysisSection = section;

  if (section.kind === "list") {
    const items = section.items.map((i) => i.trim()).filter(Boolean);
    if (items.length !== section.items.length || items.some((v, i) => v !== section.items[i])) {
      next = { ...section, items };
      changed = true;
    }
  } else if (section.kind === "checklist") {
    const items = section.items
      .map((i) => (i.text.trim() === i.text ? i : { ...i, text: i.text.trim() }))
      .filter((i) => i.text !== "");
    if (items.length !== section.items.length || items.some((v, i) => v !== section.items[i])) {
      next = { ...section, items };
      changed = true;
    }
  }
  return changed ? { ...next, title } : section;
}

/** Analizi temizler: başlık/açıklamayı kırpar ve tüm bölümleri normalleştirir. */
export function normalizeAnalysis(analysis: Analysis): Analysis {
  const title = analysis.title.trim() || UNTITLED_ANALYSIS;
  const description = analysis.description === undefined ? undefined : analysis.description.trim();
  const sections = analysis.sections.map(normalizeSection);
  const sectionsChanged = sections.some((s, i) => s !== analysis.sections[i]);
  if (title === analysis.title && description === analysis.description && !sectionsChanged) return analysis;
  return {
    ...analysis,
    title,
    ...(description !== undefined ? { description } : {}),
    sections: sectionsChanged ? sections : analysis.sections,
  };
}

/** Yüklenen verideki tüm analizleri temizler; değişiklik yoksa aynı state'i döndürür. */
export function normalizeDemoState(state: DemoState): DemoState {
  const analyses = state.analyses.map(normalizeAnalysis);
  return analyses.some((a, i) => a !== state.analyses[i]) ? { ...state, analyses } : state;
}

/** Belirtilen türde boş bir bölüm oluşturur. */
export function createEmptySection(id: string, title: string, kind: SectionKind): AnalysisSection {
  switch (kind) {
    case "text":
      return { id, kind, title, content: "" };
    case "list":
      return { id, kind, title, items: [] };
    case "checklist":
      return { id, kind, title, items: [] };
  }
}

function updateAnalysis(
  state: DemoState,
  analysisId: string,
  now: string,
  update: (sections: AnalysisSection[]) => AnalysisSection[] | null
): DemoState {
  let changed = false;
  const analyses = state.analyses.map((analysis) => {
    if (analysis.id !== analysisId) return analysis;
    const sections = update(analysis.sections);
    if (!sections) return analysis;
    changed = true;
    return { ...analysis, sections, updatedAt: now };
  });
  return changed ? { ...state, analyses } : state;
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "request/create": {
      const { input, meta } = action;
      if (!state.projects.some((p) => p.id === input.projectId)) return state;
      const base = {
        id: meta.newId(),
        code: nextCode(state.requests, "TLP"),
        projectId: input.projectId,
        title: input.title.trim(),
        description: input.description.trim(),
        requester: input.requester.trim(),
        priority: input.priority,
        status: input.status ?? "Taslak",
        createdAt: meta.now,
        updatedAt: meta.now,
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
      };
      const request: WorkRequest =
        input.type === "new"
          ? { ...base, type: "new", details: { ...input.details } }
          : { ...base, type: "change", details: { ...input.details } };
      return { ...state, requests: [...state.requests, request] };
    }

    case "request/update":
    case "request/setStatus": {
      const changes: RequestChanges =
        action.type === "request/setStatus" ? { status: action.status } : action.changes;
      if (changes.projectId !== undefined && !state.projects.some((p) => p.id === changes.projectId)) {
        return state;
      }
      let changed = false;
      const requests = state.requests.map((r) => {
        if (r.id !== action.requestId) return r;
        changed = true;
        return applyRequestChanges(r, changes, action.meta.now);
      });
      return changed ? { ...state, requests } : state;
    }

    case "analysis/create": {
      const { input, meta } = action;
      const request = state.requests.find((r) => r.id === input.requestId);
      if (!request) return state;
      const sections = input.usePresetSections
        ? DEFAULT_SECTIONS_BY_REQUEST_TYPE[request.type].map((preset) =>
            createEmptySection(meta.newId(), preset.title, preset.kind)
          )
        : [];
      return {
        ...state,
        analyses: [
          ...state.analyses,
          {
            id: meta.newId(),
            code: nextCode(state.analyses, "ANL"),
            requestId: request.id,
            title: input.title.trim(),
            ...(input.description?.trim() ? { description: input.description.trim() } : {}),
            author: input.author.trim(),
            status: "Taslak",
            sections,
            createdAt: meta.now,
            updatedAt: meta.now,
          },
        ],
      };
    }

    case "analysis/update": {
      let changed = false;
      const analyses = state.analyses.map((a) => {
        if (a.id !== action.analysisId) return a;
        changed = true;
        return { ...a, ...action.changes, updatedAt: action.meta.now };
      });
      return changed ? { ...state, analyses } : state;
    }

    case "section/add":
      return updateAnalysis(state, action.analysisId, action.meta.now, (sections) => {
        const section = createEmptySection(action.meta.newId(), action.title.trim(), action.kind);
        const index =
          action.index === undefined ? sections.length : Math.max(0, Math.min(action.index, sections.length));
        return [...sections.slice(0, index), section, ...sections.slice(index)];
      });

    case "section/update":
      return updateAnalysis(state, action.analysisId, action.meta.now, (sections) =>
        sections.some((s) => s.id === action.section.id)
          ? sections.map((s) => (s.id === action.section.id ? action.section : s))
          : null
      );

    case "section/remove": {
      const next = updateAnalysis(state, action.analysisId, action.meta.now, (sections) =>
        sections.some((s) => s.id === action.sectionId)
          ? sections.filter((s) => s.id !== action.sectionId)
          : null
      );
      if (next === state) return state;
      // Bölüm silinse de gereksinimler korunur; yalnızca bölüm bağlantısı kaldırılır.
      return {
        ...next,
        requirements: next.requirements.map((r) =>
          r.analysisId === action.analysisId && r.sectionId === action.sectionId ? { ...r, sectionId: null } : r
        ),
      };
    }

    case "section/move":
      return updateAnalysis(state, action.analysisId, action.meta.now, (sections) => {
        const from = sections.findIndex((s) => s.id === action.sectionId);
        const to = action.direction === "up" ? from - 1 : from + 1;
        if (from === -1 || to < 0 || to >= sections.length) return null;
        const copy = [...sections];
        [copy[from], copy[to]] = [copy[to], copy[from]];
        return copy;
      });

    case "requirement/create": {
      const { input, meta } = action;
      const analysis = state.analyses.find((a) => a.id === input.analysisId);
      // Gereksinim hem talebe hem analize bağlı olmalı ve analiz o talebe ait olmalı.
      if (!analysis || analysis.requestId !== input.requestId) return state;
      const sectionId =
        input.sectionId && analysis.sections.some((s) => s.id === input.sectionId) ? input.sectionId : null;
      return {
        ...state,
        requirements: [
          ...state.requirements,
          {
            id: meta.newId(),
            code: nextCode(state.requirements, "REQ"),
            requestId: input.requestId,
            analysisId: input.analysisId,
            sectionId,
            title: input.title.trim(),
            description: input.description.trim(),
            type: input.type,
            priority: input.priority,
            status: "Taslak",
            acceptanceCriteria: (input.acceptanceCriteria ?? []).map((c) => c.trim()).filter(Boolean),
            createdAt: meta.now,
          },
        ],
      };
    }

    case "analysis/normalize": {
      let changed = false;
      const analyses = state.analyses.map((a) => {
        if (a.id !== action.analysisId) return a;
        const next = normalizeAnalysis(a);
        if (next === a) return a;
        changed = true;
        return { ...next, updatedAt: action.meta.now };
      });
      return changed ? { ...state, analyses } : state;
    }

    case "section/normalize":
      return updateAnalysis(state, action.analysisId, action.meta.now, (sections) => {
        const index = sections.findIndex((s) => s.id === action.sectionId);
        if (index === -1) return null;
        const next = normalizeSection(sections[index]);
        return next === sections[index] ? null : sections.map((s, i) => (i === index ? next : s));
      });

    case "requirement/update": {
      const { changes } = action;
      let changed = false;
      const requirements = state.requirements.map((r) => {
        if (r.id !== action.requirementId) return r;
        // Bölüm bağlantısı yalnızca gereksinimin kendi analizindeki bir bölüme yapılabilir.
        let sectionId = r.sectionId;
        if (changes.sectionId !== undefined) {
          const analysis = state.analyses.find((a) => a.id === r.analysisId);
          sectionId =
            changes.sectionId && analysis?.sections.some((s) => s.id === changes.sectionId) ? changes.sectionId : null;
        }
        changed = true;
        return {
          ...r,
          ...(changes.title !== undefined ? { title: changes.title.trim() } : {}),
          ...(changes.description !== undefined ? { description: changes.description.trim() } : {}),
          ...(changes.type !== undefined ? { type: changes.type } : {}),
          ...(changes.priority !== undefined ? { priority: changes.priority } : {}),
          ...(changes.status !== undefined ? { status: changes.status } : {}),
          ...(changes.acceptanceCriteria !== undefined
            ? { acceptanceCriteria: changes.acceptanceCriteria.map((c) => c.trim()).filter(Boolean) }
            : {}),
          sectionId,
        };
      });
      return changed ? { ...state, requirements } : state;
    }

    case "requirement/setStatus": {
      let changed = false;
      const requirements = state.requirements.map((r) => {
        if (r.id !== action.requirementId) return r;
        changed = true;
        return { ...r, status: action.status };
      });
      return changed ? { ...state, requirements } : state;
    }
  }
}
