"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CalendarRange, ChartLine, Lock, Target, X } from "lucide-react";
import { SaveNotice } from "@/components/common/save-notice";
import { SprintStatusBadge } from "@/components/common/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { boardEditBlocker, getDefaultBoardSprint, getProjectSprints, getSprintPoints } from "@/lib/demo/agile-selectors";
import { useDemoState } from "@/lib/demo/store";
import { formatDate } from "@/lib/format";
import { sprintBoardHref, sprintMetricsHref, sprintPlanningHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { DailyScrumPanel } from "./daily-scrum-panel";
import { KanbanBoard } from "./kanban-board";
import { agileSelectClass } from "./work-item-dialog";

type Message = { kind: "ok" | "error"; text: string } | null;

export function BoardWorkspace() {
  const state = useDemoState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<Message>(null);

  const requestedProject = searchParams.get("proje");
  const projectId =
    state.projects.find((p) => p.id === requestedProject)?.id ??
    state.projects.find((p) => state.sprints.some((s) => s.projectId === p.id))?.id ??
    state.projects[0]?.id ??
    "";
  const sprints = getProjectSprints(state, projectId);
  const sprint = sprints.find((s) => s.id === searchParams.get("sprint")) ?? getDefaultBoardSprint(state, projectId);
  const editBlocker = sprint ? boardEditBlocker(sprint) : null;
  const points = sprint ? getSprintPoints(state, sprint.id) : null;
  const notify = (kind: "ok" | "error", text: string) => setMessage({ kind, text });

  return (
    <>
      <PageHeader title="Sprint Panosu" description="Kanban ile işlerin akışını izleyin ve Daily Scrum kayıtlarını tutun.">
        <Link href={sprintPlanningHref(projectId)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Sprint planlama
        </Link>
        <Link href={sprintMetricsHref(projectId, sprint?.id)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChartLine className="size-4" aria-hidden="true" />
          Metrikler
        </Link>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:w-2/3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pano-proje" className="text-xs font-medium text-muted-foreground">Proje</label>
          <select id="pano-proje" className={cn(agileSelectClass, "bg-background")} value={projectId}
            onChange={(e) => { setMessage(null); router.replace(sprintBoardHref(e.target.value), { scroll: false }); }}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pano-sprint" className="text-xs font-medium text-muted-foreground">Sprint</label>
          <select id="pano-sprint" className={cn(agileSelectClass, "bg-background")} value={sprint?.id ?? ""} disabled={sprints.length === 0}
            onChange={(e) => { setMessage(null); router.replace(sprintBoardHref(projectId, e.target.value), { scroll: false }); }}>
            {sprints.length === 0 && <option value="">Bu projede sprint yok</option>}
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name} ({s.status})</option>)}
          </select>
        </div>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden">
        {message?.kind === "ok" && <div className="mb-4"><SaveNotice message={message.text} onDismiss={() => setMessage(null)} /></div>}
      </div>
      {message?.kind === "error" && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Uyarıyı kapat" className="rounded p-0.5 hover:bg-destructive/10">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {!sprint ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium">Bu projede sprint yok</p>
            <Link href={sprintPlanningHref(projectId)} className="text-sm text-primary hover:underline">Sprint planlama ekranından sprint oluşturun</Link>
          </CardContent>
        </Card>
      ) : (
        <div key={sprint.id} className="flex flex-col gap-6">
          <Card size="sm" data-sprint-info={sprint.id}>
            <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{sprint.code}</p>
                <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">{sprint.name} <SprintStatusBadge status={sprint.status} /></h2>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarRange className="size-3.5" aria-hidden="true" />{formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}</span>
                  {sprint.goal && <span className="inline-flex items-center gap-1"><Target className="size-3.5" aria-hidden="true" />{sprint.goal}</span>}
                </p>
              </div>
              {points && (
                <dl className="grid grid-cols-3 gap-4 text-center">
                  {[["Planlanan", points.committed], ["Tamamlanan", points.completed], ["Kalan", points.remaining]].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-[11px] text-muted-foreground">{label}</dt>
                      <dd className="text-lg font-semibold tabular-nums">{value} <span className="text-xs font-normal text-muted-foreground">SP</span></dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          {editBlocker && (
            <p className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground" data-board-readonly>
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {editBlocker}
              {sprint.status === "Planlandı" && (
                <Link href={sprintPlanningHref(projectId)} className="ml-auto shrink-0 text-primary hover:underline">Planlamaya git</Link>
              )}
            </p>
          )}

          <KanbanBoard state={state} sprint={sprint} editable={!editBlocker} onMessage={notify} />
          <DailyScrumPanel state={state} sprint={sprint} onMessage={notify} />
        </div>
      )}
    </>
  );
}
