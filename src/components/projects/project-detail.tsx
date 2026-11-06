"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bug, CalendarDays, FileText, Inbox, ListChecks, UserRound, type LucideIcon } from "lucide-react";
import { ProjectStatusBadge } from "@/components/common/status-badges";
import { RequestList } from "@/components/requests/request-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProject, getProjectStats, getRequestsByProject } from "@/lib/demo/selectors";
import { useDemoState } from "@/lib/demo/store";
import type { RequestType } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter = "all" | RequestType;

export function ProjectDetail({ projectId }: { projectId: string }) {
  const state = useDemoState();
  const [filter, setFilter] = useState<Filter>("all");
  const project = getProject(state, projectId);

  // Proje kimliği sunucuda doğrulanır; bu durum yalnızca bozuk tarayıcı verisinde oluşabilir.
  if (!project) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Proje demo verisinde bulunamadı. Kenar çubuğundaki “Demo verisini sıfırla” ile başlangıç verisine dönebilirsiniz.
        </CardContent>
      </Card>
    );
  }

  const stats = getProjectStats(state, project.id);
  const requests = getRequestsByProject(state, project.id);
  const visible = filter === "all" ? requests : requests.filter((r) => r.type === filter);

  const statCards: { label: string; value: number; icon: LucideIcon; className: string }[] = [
    { label: "Talepler", value: stats.requests, icon: Inbox, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
    { label: "Analizler", value: stats.analyses, icon: FileText, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { label: "Gereksinimler", value: stats.requirements, icon: ListChecks, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
    { label: "Açık hatalar", value: stats.openDefects, icon: Bug, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  ];

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Tümü", count: stats.requests },
    { value: "new", label: "Yeni İş", count: stats.newWorkRequests },
    { value: "change", label: "Değişiklik", count: stats.changeRequests },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/projeler"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Projeler
        </Link>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">{project.description}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">{project.code}</span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-4" aria-hidden="true" />
              {project.owner}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(project.startDate)} – {formatDate(project.targetDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, className }) => (
          <Card key={label} size="sm">
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold tabular-nums">{value}</p>
              </div>
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", className)}>
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Talepler</CardTitle>
          <CardDescription>Bu projeye bağlı yeni iş talepleri ve sistem değişiklikleri</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div role="group" aria-label="Talep türü filtresi" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
            {filters.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? "outline" : "ghost"}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn(filter === f.value ? "bg-background shadow-xs" : "text-muted-foreground")}
              >
                {f.label}
                <span className="text-muted-foreground tabular-nums">{f.count}</span>
              </Button>
            ))}
          </div>
          <RequestList
            requests={visible}
            emptyMessage={
              requests.length === 0 ? "Bu projede henüz talep yok." : "Bu türde talep bulunmuyor."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
