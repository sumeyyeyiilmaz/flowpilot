"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { SaveNotice } from "@/components/common/save-notice";
import { PageHeader } from "@/components/layout/page-header";
import { getActiveSprint, getBacklog } from "@/lib/demo/agile-selectors";
import { useDemoState } from "@/lib/demo/store";
import type { Sprint, WorkItem } from "@/lib/domain/types";
import { sprintPlanningHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BacklogPanel } from "./backlog-panel";
import { SprintDialog } from "./sprint-dialog";
import { SprintPanel } from "./sprint-panel";
import { agileSelectClass, WorkItemDialog } from "./work-item-dialog";

type Message = { kind: "ok" | "error"; text: string } | null;

export function PlanningWorkspace() {
  const state = useDemoState();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Proje: adresteki geçerli proje, yoksa Agile verisi olan ilk proje, yoksa ilk proje.
  const requested = searchParams.get("proje");
  const projectId =
    state.projects.find((p) => p.id === requested)?.id ??
    state.projects.find((p) => state.sprints.some((s) => s.projectId === p.id) || state.workItems.some((w) => w.projectId === p.id))?.id ??
    state.projects[0]?.id ??
    "";

  const [message, setMessage] = useState<Message>(null);
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: WorkItem | null }>({ open: false, item: null });
  const [sprintDialog, setSprintDialog] = useState<{ open: boolean; sprint: Sprint | null }>({ open: false, sprint: null });

  const notify = (kind: "ok" | "error", text: string) => setMessage({ kind, text });
  const active = getActiveSprint(state, projectId);
  const backlog = getBacklog(state, projectId);

  return (
    <>
      <PageHeader title="Sprint Planlama" description="Product Backlog'u önceliklendirin, sprintleri planlayın ve işleri atayın." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:w-80">
          <label htmlFor="planlama-proje" className="text-xs font-medium text-muted-foreground">Proje</label>
          <select id="planlama-proje" className={cn(agileSelectClass, "bg-background")} value={projectId}
            onChange={(e) => { setMessage(null); router.replace(sprintPlanningHref(e.target.value), { scroll: false }); }}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </div>
        <p className="text-sm text-muted-foreground" data-project-summary>
          {active ? `Aktif sprint: ${active.code} · ${active.name}` : "Aktif sprint yok"} · Backlog: {backlog.length} iş
        </p>
      </div>

      <div role="status" aria-live="polite" className="empty:hidden">
        {message?.kind === "ok" && (
          <div className="mb-4"><SaveNotice message={message.text} onDismiss={() => setMessage(null)} /></div>
        )}
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

      {/* Proje değişince panelleri yeniden kur (sekme seçimi vb. sıfırlanır). */}
      <div key={projectId} className="grid items-start gap-6 xl:grid-cols-2">
        <BacklogPanel
          state={state}
          projectId={projectId}
          onCreate={() => setItemDialog({ open: true, item: null })}
          onEdit={(item) => setItemDialog({ open: true, item })}
          onMessage={notify}
        />
        <SprintPanel
          state={state}
          projectId={projectId}
          onCreateSprint={() => setSprintDialog({ open: true, sprint: null })}
          onEditSprint={(sprint) => setSprintDialog({ open: true, sprint })}
          onEditItem={(item) => setItemDialog({ open: true, item })}
          onMessage={notify}
        />
      </div>

      <WorkItemDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((d) => ({ ...d, open }))}
        projectId={projectId}
        item={itemDialog.item}
        onSaved={(text) => { setItemDialog({ open: false, item: null }); notify("ok", text); }}
      />
      <SprintDialog
        open={sprintDialog.open}
        onOpenChange={(open) => setSprintDialog((d) => ({ ...d, open }))}
        projectId={projectId}
        sprint={sprintDialog.sprint}
        onSaved={(text) => { setSprintDialog({ open: false, sprint: null }); notify("ok", text); }}
      />
    </>
  );
}
