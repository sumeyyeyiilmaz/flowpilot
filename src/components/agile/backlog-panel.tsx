"use client";

import { ArrowDown, ArrowUp, Link2, ListPlus, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { StoryPointBadge, WorkItemTypeBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssignableSprints, getBacklog, getTeamMember, workItemDeleteBlocker } from "@/lib/demo/agile-selectors";
import { demoActions } from "@/lib/demo/store";
import type { DemoState, WorkItem } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { agileSelectClass } from "./work-item-dialog";

export type PanelMessage = (kind: "ok" | "error", text: string) => void;

type Props = {
  state: DemoState;
  projectId: string;
  onCreate: () => void;
  onEdit: (item: WorkItem) => void;
  onMessage: PanelMessage;
};

export function BacklogPanel({ state, projectId, onCreate, onEdit, onMessage }: Props) {
  const backlog = getBacklog(state, projectId);
  const sprints = getAssignableSprints(state, projectId);
  const totalPoints = backlog.reduce((sum, w) => sum + (w.storyPoints ?? 0), 0);
  const unestimated = backlog.filter((w) => w.storyPoints === null).length;

  const addToSprint = (item: WorkItem, sprintId: string) => {
    const sprint = sprints.find((s) => s.id === sprintId);
    if (demoActions.addWorkItemToSprint(item.id, sprintId)) onMessage("ok", `${item.code}, ${sprint?.code ?? "sprint"} sprintine eklendi.`);
    else onMessage("error", `${item.code} sprinte eklenemedi.`);
  };

  const remove = (item: WorkItem) => {
    if (!window.confirm(`"${item.code} · ${item.title}" kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;
    if (demoActions.deleteWorkItem(item.id)) onMessage("ok", `${item.code} silindi.`);
    else onMessage("error", `${item.code} silinemedi.`);
  };

  return (
    <Card data-panel="backlog">
      <CardHeader>
        <CardTitle>Product Backlog</CardTitle>
        <CardDescription>
          {backlog.length} iş · {totalPoints} SP{unestimated > 0 && ` · ${unestimated} iş tahminsiz`}
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={onCreate}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Yeni iş
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {backlog.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Product Backlog boş. “Yeni iş” ile ilk işi ekleyin.
          </p>
        ) : (
          <ol className="flex flex-col divide-y" aria-label="Product Backlog (öncelik sırasıyla)">
            {backlog.map((item, index) => {
              const assignee = getTeamMember(state, item.assigneeId);
              const deleteBlocker = workItemDeleteBlocker(state, item);
              const linkCount = (item.requestId ? 1 : 0) + (item.analysisId ? 1 : 0) + item.requirementIds.length;
              return (
                <li key={item.id} data-work-item-id={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <div className="flex shrink-0 flex-col">
                      <Button variant="ghost" size="icon-xs" disabled={index === 0} aria-label={`${item.code} önceliğini yükselt`}
                        onClick={() => demoActions.rankWorkItem(item.id, "up")}>
                        <ArrowUp />
                      </Button>
                      <Button variant="ghost" size="icon-xs" disabled={index === backlog.length - 1} aria-label={`${item.code} önceliğini düşür`}
                        onClick={() => demoActions.rankWorkItem(item.id, "down")}>
                        <ArrowDown />
                      </Button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="tabular-nums">#{index + 1}</span> · {item.code}
                      </p>
                      <p className="text-sm font-medium">{item.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <WorkItemTypeBadge type={item.type} />
                        <StoryPointBadge points={item.storyPoints} />
                        <span className="inline-flex items-center gap-1">
                          <UserRound className="size-3.5" aria-hidden="true" />
                          {assignee?.name ?? "Atanmamış"}
                        </span>
                        {linkCount > 0 && (
                          <span className="inline-flex items-center gap-1" title="Talep, analiz ve gereksinim bağlantıları">
                            <Link2 className="size-3.5" aria-hidden="true" />
                            {linkCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-8">
                    <label className="sr-only" htmlFor={`sprinte-ekle-${item.id}`}>{item.code} için sprint seçin</label>
                    <div className="relative">
                      <ListPlus className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <select id={`sprinte-ekle-${item.id}`} className={cn(agileSelectClass, "h-7 w-44 pl-7 text-xs")} value=""
                        disabled={sprints.length === 0} onChange={(e) => e.target.value && addToSprint(item, e.target.value)}>
                        <option value="">{sprints.length === 0 ? "Uygun sprint yok" : "Sprinte ekle…"}</option>
                        {sprints.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name} ({s.status})</option>)}
                      </select>
                    </div>
                    <Button variant="ghost" size="xs" onClick={() => onEdit(item)} aria-label={`${item.code} düzenle`}>
                      <Pencil data-icon="inline-start" aria-hidden="true" />
                      Düzenle
                    </Button>
                    <span title={deleteBlocker ?? undefined}>
                      <Button variant="ghost" size="xs" disabled={!!deleteBlocker} onClick={() => remove(item)} aria-label={`${item.code} sil`}
                        className="text-muted-foreground hover:text-destructive">
                        <Trash2 data-icon="inline-start" aria-hidden="true" />
                        Sil
                      </Button>
                    </span>
                  </div>
                  {deleteBlocker && <p className="pl-8 text-[11px] text-muted-foreground">{deleteBlocker}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
