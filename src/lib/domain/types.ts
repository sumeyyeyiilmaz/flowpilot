/**
 * FlowPilot alan modeli.
 *
 * İlişki zinciri:
 *   Project → WorkRequest → Analysis (→ AnalysisSection) → Requirement
 *     → TestCase → TestRun → Defect
 *
 * Tipler ileride veritabanı tablolarına birebir karşılık gelecek şekilde
 * tasarlanmıştır: her kaydın bir `id`'si vardır, ilişkiler `xxxId` alanlarıyla kurulur.
 */

/* ------------------------------------------------------------------ */
/* Ortak değer kümeleri                                                */
/* ------------------------------------------------------------------ */

export const PRIORITIES = ["Düşük", "Orta", "Yüksek", "Kritik"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const IMPACT_LEVELS = ["Düşük", "Orta", "Yüksek"] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

/** ISO 8601 tarih-saat metni (ör. "2026-11-06T09:30:00.000Z"). */
export type ISODateString = string;

/* ------------------------------------------------------------------ */
/* Proje                                                               */
/* ------------------------------------------------------------------ */

export const PROJECT_STATUSES = ["Planlandı", "Aktif", "Beklemede", "Tamamlandı"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  code: string; // PRJ-101
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  startDate: ISODateString;
  targetDate: ISODateString;
};

/* ------------------------------------------------------------------ */
/* Talep                                                               */
/* ------------------------------------------------------------------ */

export const REQUEST_TYPES = ["new", "change"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  new: "Yeni İş Talebi",
  change: "Mevcut Sistem Değişikliği",
};

export const REQUEST_STATUSES = [
  "Taslak",
  "Değerlendirmede",
  "Analizde",
  "Onaylandı",
  "Geliştirmede",
  "Testte",
  "Tamamlandı",
  "Reddedildi",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

type WorkRequestBase = {
  id: string;
  code: string; // TLP-001
  projectId: string;
  title: string;
  description: string;
  /** Talebi yapan birim veya rol (kişi adı yerine). */
  requester: string;
  priority: Priority;
  status: RequestStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  dueDate?: ISODateString;
};

export type NewWorkDetails = {
  businessGoal: string;
  targetUsers: string;
  expectedBenefit: string;
};

export type ChangeDetails = {
  affectedSystem: string;
  currentBehavior: string;
  desiredBehavior: string;
  changeReason: string;
  impactLevel: ImpactLevel;
};

export type NewWorkRequest = WorkRequestBase & { type: "new"; details: NewWorkDetails };
export type ChangeRequest = WorkRequestBase & { type: "change"; details: ChangeDetails };

/** Talep. (Tarayıcıdaki global `Request` tipiyle çakışmaması için `WorkRequest`.) */
export type WorkRequest = NewWorkRequest | ChangeRequest;

/* ------------------------------------------------------------------ */
/* Analiz                                                              */
/* ------------------------------------------------------------------ */

export const ANALYSIS_STATUSES = ["Taslak", "İncelemede", "Onaylandı"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

/** MVP bölüm türleri. Tablo türü sonraki aşamada eklenecek. */
export const SECTION_KINDS = ["text", "list", "checklist"] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

export const SECTION_KIND_LABELS: Record<SectionKind, string> = {
  text: "Metin",
  list: "Liste",
  checklist: "Kontrol listesi",
};

type SectionBase = { id: string; title: string };

export type ChecklistItem = { id: string; text: string; done: boolean };

export type TextSection = SectionBase & { kind: "text"; content: string };
export type ListSection = SectionBase & { kind: "list"; items: string[] };
export type ChecklistSection = SectionBase & { kind: "checklist"; items: ChecklistItem[] };

/** Analiz bölümü. Bölümlerin sırası `Analysis.sections` dizisindeki sıradır. */
export type AnalysisSection = TextSection | ListSection | ChecklistSection;

/**
 * Analiz çalışması. Bir talebin birden fazla analizi olabilir;
 * önceki analizler silinmeden korunur (MVP'de tam sürümleme yoktur).
 */
export type Analysis = {
  id: string;
  code: string; // ANL-001
  requestId: string;
  title: string;
  /** İsteğe bağlı özet/açıklama (eski kayıtlarda bulunmayabilir). */
  description?: string;
  author: string;
  status: AnalysisStatus;
  sections: AnalysisSection[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

/* ------------------------------------------------------------------ */
/* Gereksinim                                                          */
/* ------------------------------------------------------------------ */

export const REQUIREMENT_TYPES = ["Fonksiyonel", "Fonksiyonel Olmayan"] as const;
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];

export const MOSCOW_PRIORITIES = ["Must", "Should", "Could", "Won't"] as const;
export type MoscowPriority = (typeof MOSCOW_PRIORITIES)[number];

export const REQUIREMENT_STATUSES = ["Taslak", "Onaylandı", "Değişti"] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUSES)[number];

/** Gereksinim: talebe ve analize bağlıdır; analiz bölümü bağlantısı isteğe bağlıdır. */
export type Requirement = {
  id: string;
  code: string; // REQ-001
  requestId: string;
  analysisId: string;
  sectionId: string | null;
  title: string;
  description: string;
  type: RequirementType;
  priority: MoscowPriority;
  status: RequirementStatus;
  acceptanceCriteria: string[];
  createdAt: ISODateString;
};

/* ------------------------------------------------------------------ */
/* Test ve hata                                                        */
/* ------------------------------------------------------------------ */

export type TestCase = {
  id: string;
  code: string; // TC-001
  requirementIds: string[];
  title: string;
  steps: string[];
  expectedResult: string;
  priority: Priority;
};

export const TEST_RESULTS = ["Geçti", "Kaldı", "Bloke"] as const;
export type TestResult = (typeof TEST_RESULTS)[number];

export type TestRun = {
  id: string;
  code: string; // RUN-001
  testCaseId: string;
  result: TestResult;
  executedBy: string;
  executedAt: ISODateString;
  note?: string;
};

export const DEFECT_STATUSES = ["Açık", "Atandı", "Çözüldü", "Kapandı"] as const;
export type DefectStatus = (typeof DEFECT_STATUSES)[number];

export type Defect = {
  id: string;
  code: string; // BUG-001
  title: string;
  severity: Priority;
  status: DefectStatus;
  requirementId?: string;
  testRunId?: string;
  assignee?: string;
  createdAt: ISODateString;
};

/* ------------------------------------------------------------------ */
/* Agile / Sprint                                                      */
/* ------------------------------------------------------------------ */

/** Sentetik ekip üyesi (kişi adları kurgusaldır). */
export type TeamMember = {
  id: string;
  name: string;
  role: string;
};

export const WORK_ITEM_TYPES = ["Story", "Görev", "Hata", "Spike"] as const;
export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

/** Kanban sütunları. "Backlog" durumu Product Backlog'daki işleri temsil eder. */
export const WORK_ITEM_STATUSES = ["Backlog", "Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"] as const;
export type WorkItemStatus = (typeof WORK_ITEM_STATUSES)[number];

/**
 * Sprint panosundaki (Kanban) durumlar. "Backlog" bir Kanban durumu değildir:
 * sprintsiz işler (`sprintId === null`) her zaman "Backlog", sprintteki işler her zaman bu dört durumdan birindedir.
 */
export const SPRINT_BOARD_STATUSES = ["Yapılacak", "Devam Ediyor", "İncelemede", "Tamamlandı"] as const satisfies readonly WorkItemStatus[];
export type SprintBoardStatus = (typeof SPRINT_BOARD_STATUSES)[number];

/** Fibonacci story point ölçeği. */
export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;
export type StoryPoint = (typeof STORY_POINTS)[number];

/**
 * Backlog / sprint işi.
 * - `sprintId === null` ise iş Product Backlog'dadır.
 * - "Hata" türündeki iş mevcut bir Defect kaydına (`defectId`) bağlıdır; diğer türlerde `defectId` null'dır.
 *   Bir Defect en fazla bir işe bağlanabilir (mükerrer hata kaydı oluşmaz).
 */
export type WorkItem = {
  id: string;
  code: string; // PBI-001
  projectId: string;
  type: WorkItemType;
  title: string;
  description: string;
  status: WorkItemStatus;
  /** Product Backlog sırası (küçük olan üstte). */
  rank: number;
  storyPoints: StoryPoint | null;
  estimateHours?: number;
  assigneeId: string | null;
  sprintId: string | null;
  /** İzlenebilirlik (isteğe bağlı). */
  requestId?: string;
  analysisId?: string;
  requirementIds: string[];
  defectId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  /** "Tamamlandı" durumuna geçtiği an (Burndown/Velocity için). */
  completedAt?: ISODateString;
};

export const SPRINT_STATUSES = ["Planlandı", "Aktif", "Tamamlandı"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];

/**
 * Sprint kapatıldığı andaki değişmez özet. Sonradan işlerin puanı değişse veya bitmemiş işler
 * backlog'a dönse de tamamlanan sprintin geçmiş işleri ve puanları korunur.
 */
export type SprintSummary = {
  committedPoints: number;
  completedPoints: number;
  completedItems: { workItemId: string; storyPoints: number }[];
  carriedOverItemIds: string[];
};

export type Sprint = {
  id: string;
  code: string; // SPR-01
  projectId: string;
  name: string;
  goal: string;
  /** Takvim günü, YYYY-MM-DD. */
  startDate: string;
  endDate: string;
  status: SprintStatus;
  completedAt?: ISODateString;
  /** Yalnızca "Tamamlandı" durumunda bulunur. */
  summary?: SprintSummary;
};

/** Daily Scrum kaydı. Sprint + kişi + tarih bazında tekildir; tekrar girişte güncellenir. */
export type DailyScrumEntry = {
  id: string;
  sprintId: string;
  memberId: string;
  /** Takvim günü, YYYY-MM-DD. */
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  updatedAt: ISODateString;
};

/* ------------------------------------------------------------------ */
/* Demo durumu                                                         */
/* ------------------------------------------------------------------ */

export const DEMO_SCHEMA_VERSION = 2;

/** Şema v1 (Agile modülünden önce). Geçiş (migration) için korunur. */
export type DemoStateV1 = {
  schemaVersion: 1;
  projects: Project[];
  requests: WorkRequest[];
  analyses: Analysis[];
  requirements: Requirement[];
  testCases: TestCase[];
  testRuns: TestRun[];
  defects: Defect[];
};

export type DemoState = Omit<DemoStateV1, "schemaVersion"> & {
  schemaVersion: typeof DEMO_SCHEMA_VERSION;
  teamMembers: TeamMember[];
  workItems: WorkItem[];
  sprints: Sprint[];
  dailyScrums: DailyScrumEntry[];
};
