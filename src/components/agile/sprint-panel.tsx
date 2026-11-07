"use client";

import { useState } from "react";
import { CalendarRange, Flag, Lock, Pencil, Play, Plus, Target, Undo2, UserRound } from "lucide-react";
import { SprintStatusBadge, StoryPointBadge, WorkItemStatusBadge, WorkItemTypeBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProjectSprintsByStatus,
  getSprintItems,
  getSprintPoints,
  getTeamMember,
  getWorkItem,
  isWorkItemLocked,
  sprintStartBlocker,
} from "@/lib/demo/agile-selectors";
import { demoActions } from "@/lib/demo/store";
import { SPRINT_STATUSES, type DemoState, type Sprint, type SprintStatus, type WorkItem } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PanelMessage } from "./backlog-panel";

const TAB_LABELS: Record<SprintStatus, string> = { Aktif: "Aktif", Planlandı: "Planlanan", Tamamlandı: "Tamamlanan" };
const TAB_ORDER: SprintStatus[] = ["Aktif", "Planlandı", "Tamamlandı"];

type Props = {
  state: DemoState;
  projectId: string;
  onCreateSprint: () => void;
  onEditSprint: (sprint: Sprint) => void;
  onEditItem: (item: WorkItem) => void;
  onMessage: PanelMessage;
};

export function SprintPanel({ state, projectId, onCreateSprint, onEditSprint, onEditItem, onMessage }: Props) {
  const groups = Object.fromEntries(SPRINT_STATUSES.map((s) => [s, getProjectSprintsByStatus(state, projectId, s)])) as Record<SprintStatus, Sprint[]>;
  const [tab, setTab] = useState<SprintStatus>(() => TAB_ORDER.find((s) => groups[s].length > 0) ?? "Planlandı");
  const visible = groups[tab];

  return (
    <Card data-panel="sprints">
      <CardHeader>
        <CardTitle>Sprintler</CardTitle>
        <CardDescription>Sprintleri oluşturun, planlayın ve yönetin</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={onCreateSprint}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Yeni sprint
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div role="tablist" aria-label="Sprint durumu" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {TAB_ORDER.map((s) => (
            <Button key={s} role="tab" aria-selected={tab === s} size="sm" variant={tab === s ? "outline" : "ghost"}
              className={cn(tab === s ? "bg-background shadow-xs" : "text-muted-foreground")} onClick={() => setTab(s)}>
              {TAB_LABELS[s]}
              <span className="text-muted-foreground tabular-nums">{groups[s].length}</span>
            </Button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {tab === "Aktif" ? "Aktif sprint yok. Planlanan bir sprinti başlatabilirsiniz." : tab === "Planlandı" ? "Planlanan sprint yok. “Yeni sprint” ile oluşturun." : "Henüz tamamlanmış sprint yok."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {visible.map((sprint) => (
              <SprintCard key={sprint.id} state={state} sprint={sprint} onEditSprint={onEditSprint} onEditItem={onEditItem} onMessage={onMessage} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SprintCard({ state, sprint, onEditSprint, onEditItem, onMessage }: {
  state: DemoState; sprint: Sprint; onEditSprint: (s: Sprint) => void; onEditItem: (i: WorkItem) => void; onMessage: PanelMessage;
}) {
  const items = getSprintItems(state, sprint.id);
  const points = getSprintPoints(state, sprint.id);
  const startBlocker = sprint.status === "Planlandı" ? sprintStartBlocker(state, sprint) : null;
  const completed = sprint.status === "Tamamlandı";

  const start = () => {
    if (demoActions.startSprint(sprint.id)) onMessage("ok", `${sprint.code} başlatıldı.`);
    else onMessage("error", startBlocker ?? `${sprint.code} başlatılamadı.`);
  };

  const complete = () => {
    const open = items.filter((w) => w.status !== "Tamamlandı").length;
    const msg = `${sprint.code} kapatılsın mı?${open > 0 ? ` Tamamlanmamış ${open} iş Product Backlog'a dönecek.` : ""} Kapatılan sprintin özeti kalıcı olarak korunur ve sprint düzenlenemez.`;
    if (!window.confirm(msg)) return;
    if (demoActions.completeSprint(sprint.id)) onMessage("ok", `${sprint.code} tamamlandı.`);
    else onMessage("error", `${sprint.code} kapatılamadı.`);
  };

  const removeItem = (item: WorkItem) => {
    if (demoActions.removeWorkItemFromSprint(item.id)) onMessage("ok", `${item.code} Product Backlog'a geri alındı.`);
    else onMessage("error", `${item.code} sprintten çıkarılamadı.`);
  };

  return (
    <section data-sprint-id={sprint.id} className="flex flex-col gap-3 rounded-xl border p-3 sm:p-4" aria-label={`${sprint.code} ${sprint.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{sprint.code}</p>
          <h3 className="flex flex-wrap items-center gap-2 font-semibold">
            {sprint.name} <SprintStatusBadge status={sprint.status} />
          </h3>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5" aria-hidden="true" />
            {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
          </p>
          {sprint.goal && (
            <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
              <Target className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {sprint.goal}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!completed && (
            <Button size="xs" variant="ghost" onClick={() => onEditSprint(sprint)} aria-label={`${sprint.code} düzenle`}>
              <Pencil data-icon="inline-start" aria-hidden="true" />
              Düzenle
            </Button>
          )}
          {sprint.status === "Planlandı" && (
            <span title={startBlocker ?? undefined}>
              <Button size="xs" variant="outline" disabled={!!startBlocker} onClick={start} aria-label={`${sprint.code} başlat`}>
                <Play data-icon="inline-start" aria-hidden="true" />
                Başlat
              </Button>
            </span>
          )}
          {sprint.status === "Aktif" && (
            <Button size="xs" variant="outline" onClick={complete} aria-label={`${sprint.code} kapat`}>
              <Flag data-icon="inline-start" aria-hidden="true" />
              Sprinti kapat
            </Button>
          )}
        </div>
      </div>
      {startBlocker && <p className="text-[11px] text-muted-foreground">{startBlocker}</p>}

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2 text-center">
        {[
          { label: completed ? "Taahhüt" : "Planlanan", value: points.committed },
          { label: "Tamamlanan", value: points.completed },
          { label: "Kalan", value: points.remaining },
        ].map((m) => (
          <div key={m.label}>
            <dt className="text-[11px] text-muted-foreground">{m.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{m.value} <span className="text-xs font-normal text-muted-foreground">SP</span></dd>
          </div>
        ))}
      </dl>

      {completed && sprint.summary && sprint.summary.carriedOverItemIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Sonraki döneme taşınan: {sprint.summary.carriedOverItemIds.map((id) => getWorkItem(state, id)?.code ?? id).join(", ")}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-5 text-center text-xs text-muted-foreground">
          {completed ? "Bu sprintte tamamlanan iş yok." : "Bu sprintte henüz iş yok. Product Backlog'dan “Sprinte ekle…” ile ekleyin."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y" aria-label={`${sprint.code} işleri`}>
          {items.map((item) => {
            const locked = isWorkItemLocked(state, item);
            return (
              <li key={item.id} data-work-item-id={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {item.code}
                    {locked && <Lock className="size-3" aria-label="Kilitli (tamamlanan sprint)" />}
                  </p>
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <WorkItemTypeBadge type={item.type} />
                  <WorkItemStatusBadge status={item.status} />
                  <StoryPointBadge points={item.storyPoints} />
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    {getTeamMember(state, item.assigneeId)?.name ?? "Atanmamış"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-xs" variant="ghost" onClick={() => onEditItem(item)} aria-label={`${item.code} düzenle`}>
                    <Pencil />
                  </Button>
                  {!locked && (
                    <Button size="icon-xs" variant="ghost" onClick={() => removeItem(item)} aria-label={`${item.code} sprintten çıkar`} title="Sprintten çıkar (Backlog'a geri al)">
                      <Undo2 />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
