import { Bug, FlaskConical, Lightbulb, ListTodo, Telescope, Wrench, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  REQUEST_TYPE_LABELS,
  type AnalysisStatus,
  type MoscowPriority,
  type Priority,
  type RequirementStatus,
  type ProjectStatus,
  type RequestStatus,
  type RequestType,
  type SprintStatus,
  type StoryPoint,
  type WorkItemStatus,
  type WorkItemType,
} from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const tone = {
  slate: "border-transparent bg-slate-500/10 text-slate-700 dark:text-slate-300",
  sky: "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-300",
  indigo: "border-transparent bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  violet: "border-transparent bg-violet-500/10 text-violet-700 dark:text-violet-300",
  amber: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  orange: "border-transparent bg-orange-500/10 text-orange-700 dark:text-orange-300",
  emerald: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "border-transparent bg-rose-500/10 text-rose-700 dark:text-rose-300",
} as const;

const projectStatusTone: Record<ProjectStatus, keyof typeof tone> = {
  Planlandı: "slate",
  Aktif: "sky",
  Beklemede: "amber",
  Tamamlandı: "emerald",
};

const requestStatusTone: Record<RequestStatus, keyof typeof tone> = {
  Taslak: "slate",
  Değerlendirmede: "violet",
  Analizde: "sky",
  Onaylandı: "indigo",
  Geliştirmede: "amber",
  Testte: "orange",
  Tamamlandı: "emerald",
  Reddedildi: "rose",
};

const priorityTone: Record<Priority, keyof typeof tone> = {
  Düşük: "slate",
  Orta: "sky",
  Yüksek: "amber",
  Kritik: "rose",
};

const analysisStatusTone: Record<AnalysisStatus, keyof typeof tone> = {
  Taslak: "slate",
  İncelemede: "violet",
  Onaylandı: "emerald",
};

const requirementStatusTone: Record<RequirementStatus, keyof typeof tone> = {
  Taslak: "slate",
  Onaylandı: "emerald",
  Değişti: "amber",
};

const moscowTone: Record<MoscowPriority, keyof typeof tone> = {
  Must: "rose",
  Should: "amber",
  Could: "sky",
  "Won't": "slate",
};

export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  return <Badge className={tone[analysisStatusTone[status]]}>{status}</Badge>;
}

export function RequirementStatusBadge({ status }: { status: RequirementStatus }) {
  return <Badge className={tone[requirementStatusTone[status]]}>{status}</Badge>;
}

export function MoscowBadge({ priority }: { priority: MoscowPriority }) {
  return (
    <Badge variant="outline" className={tone[moscowTone[priority]]}>
      {priority}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge className={tone[projectStatusTone[status]]}>{status}</Badge>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge className={tone[requestStatusTone[status]]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("gap-1", tone[priorityTone[priority]])}>
      {priority}
    </Badge>
  );
}

export function RequestTypeBadge({ type, short = false }: { type: RequestType; short?: boolean }) {
  const Icon = type === "new" ? Lightbulb : Wrench;
  const label = short ? (type === "new" ? "Yeni İş" : "Değişiklik") : REQUEST_TYPE_LABELS[type];
  return (
    <Badge variant="outline" className="gap-1 bg-background" title={REQUEST_TYPE_LABELS[type]}>
      <Icon aria-hidden="true" className={type === "new" ? "text-indigo-500" : "text-amber-600"} />
      {label}
    </Badge>
  );
}

/* ---------------- Agile ---------------- */

const workItemTypeStyle: Record<WorkItemType, { icon: LucideIcon; className: string }> = {
  Story: { icon: FlaskConical, className: "text-indigo-500" },
  Görev: { icon: ListTodo, className: "text-sky-600" },
  Hata: { icon: Bug, className: "text-rose-600" },
  Spike: { icon: Telescope, className: "text-violet-600" },
};

export function WorkItemTypeBadge({ type }: { type: WorkItemType }) {
  const { icon: Icon, className } = workItemTypeStyle[type];
  return (
    <Badge variant="outline" className="gap-1 bg-background">
      <Icon aria-hidden="true" className={className} />
      {type}
    </Badge>
  );
}

const sprintStatusTone: Record<SprintStatus, keyof typeof tone> = {
  Planlandı: "slate",
  Aktif: "sky",
  Tamamlandı: "emerald",
};

export function SprintStatusBadge({ status }: { status: SprintStatus }) {
  return <Badge className={tone[sprintStatusTone[status]]}>{status}</Badge>;
}

const workItemStatusTone: Record<WorkItemStatus, keyof typeof tone> = {
  Backlog: "slate",
  Yapılacak: "slate",
  "Devam Ediyor": "sky",
  İncelemede: "violet",
  Tamamlandı: "emerald",
};

export function WorkItemStatusBadge({ status }: { status: WorkItemStatus }) {
  return <Badge className={tone[workItemStatusTone[status]]}>{status}</Badge>;
}

export function StoryPointBadge({ points }: { points: StoryPoint | null }) {
  return (
    <Badge
      variant="outline"
      className={cn("tabular-nums", points === null && "border-dashed text-muted-foreground")}
      title={points === null ? "Story Point tahmini yok" : `${points} Story Point`}
    >
      {points === null ? "– SP" : `${points} SP`}
    </Badge>
  );
}
