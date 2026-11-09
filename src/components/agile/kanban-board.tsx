"use client";

import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { StoryPointBadge, WorkItemStatusBadge, WorkItemTypeBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { getSprintBoard, getTeamMember, statusChangeBlocker } from "@/lib/demo/agile-selectors";
import { demoActions } from "@/lib/demo/store";
import { SPRINT_BOARD_STATUSES, type DemoState, type Sprint, type SprintBoardStatus, type WorkItem } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import type { PanelMessage } from "./backlog-panel";
import { agileSelectClass } from "./work-item-dialog";

const COLUMN_ACCENT: Record<SprintBoardStatus, string> = {
  Yapılacak: "border-t-slate-400",
  "Devam Ediyor": "border-t-sky-500",
  İncelemede: "border-t-violet-500",
  Tamamlandı: "border-t-emerald-500",
};

type Props = { state: DemoState; sprint: Sprint; editable: boolean; onMessage: PanelMessage };

export function KanbanBoard({ state, sprint, editable, onMessage }: Props) {
  const columns = getSprintBoard(state, sprint.id);

  const move = (item: WorkItem, status: SprintBoardStatus) => {
    const blocker = statusChangeBlocker(state, item, status);
    if (blocker) return onMessage("error", `${item.code}: ${blocker}`);
    if (demoActions.setWorkItemStatus(item.id, status)) onMessage("ok", `${item.code} → ${status}`);
    else onMessage("error", `${item.code} durumu değiştirilemedi.`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="list" aria-label="Kanban panosu">
      {columns.map((column) => {
        const points = column.items.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0);
        return (
          <section key={column.status} role="listitem" data-column={column.status} aria-label={`${column.status} sütunu`}
            className={cn("flex min-w-0 flex-col gap-3 rounded-xl border border-t-4 bg-muted/30 p-3", COLUMN_ACCENT[column.status])}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{column.status}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {column.items.length} iş · {points} SP
              </span>
            </header>
            {column.items.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Bu sütunda iş yok.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {column.items.map((item) => (
                  <KanbanCard key={item.id} state={state} item={item} editable={editable} onMove={move} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function KanbanCard({ state, item, editable, onMove }: {
  state: DemoState; item: WorkItem; editable: boolean; onMove: (item: WorkItem, status: SprintBoardStatus) => void;
}) {
  const index = SPRINT_BOARD_STATUSES.indexOf(item.status as SprintBoardStatus);
  const prev = index > 0 ? SPRINT_BOARD_STATUSES[index - 1] : null;
  const next = index < SPRINT_BOARD_STATUSES.length - 1 ? SPRINT_BOARD_STATUSES[index + 1] : null;
  const prevBlocker = prev ? statusChangeBlocker(state, item, prev) : "İlk sütun";
  const nextBlocker = next ? statusChangeBlocker(state, item, next) : "Son sütun";
  const assignee = getTeamMember(state, item.assigneeId);

  return (
    <li data-work-item-id={item.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">{item.code}</span>
        <StoryPointBadge points={item.storyPoints} />
      </div>
      <p className="text-sm font-medium leading-snug">{item.title}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <WorkItemTypeBadge type={item.type} />
        <span className="inline-flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden="true" />
          {assignee?.name ?? "Atanmamış"}
        </span>
      </div>
      {editable ? (
        <div className="flex items-center gap-1 border-t pt-2">
          <Button size="icon-xs" variant="ghost" disabled={!!prevBlocker} title={prev ? `${prev} sütununa taşı` : undefined}
            aria-label={`${item.code} işini ${prev ?? "önceki"} sütununa taşı`} onClick={() => prev && onMove(item, prev)}>
            <ChevronLeft />
          </Button>
          <label htmlFor={`durum-${item.id}`} className="sr-only">{item.code} durumu</label>
          <select id={`durum-${item.id}`} className={cn(agileSelectClass, "h-7 flex-1 text-xs")} value={item.status}
            onChange={(e) => onMove(item, e.target.value as SprintBoardStatus)}>
            {SPRINT_BOARD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="icon-xs" variant="ghost" disabled={!!nextBlocker} title={next ? `${next} sütununa taşı` : undefined}
            aria-label={`${item.code} işini ${next ?? "sonraki"} sütununa taşı`} onClick={() => next && onMove(item, next)}>
            <ChevronRight />
          </Button>
        </div>
      ) : (
        <div className="border-t pt-2"><WorkItemStatusBadge status={item.status} /></div>
      )}
    </li>
  );
}
