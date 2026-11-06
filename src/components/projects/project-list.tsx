"use client";

import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { ProjectStatusBadge } from "@/components/common/status-badges";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectStats } from "@/lib/demo/selectors";
import { useDemoState } from "@/lib/demo/store";
import { formatDate } from "@/lib/format";

export function ProjectList() {
  const state = useDemoState();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {state.projects.map((project) => {
        const stats = getProjectStats(state, project.id);
        const metrics = [
          { label: "Talep", value: stats.requests },
          { label: "Analiz", value: stats.analyses },
          { label: "Gereksinim", value: stats.requirements },
          { label: "Açık hata", value: stats.openDefects },
        ];
        return (
          <Link
            key={project.id}
            href={`/projeler/${project.id}`}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-shadow group-hover:shadow-md group-hover:ring-primary/30">
              <CardContent className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{project.code}</p>
                    <h2 className="truncate font-semibold group-hover:text-primary">{project.name}</h2>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="size-3.5" aria-hidden="true" />
                    {project.owner}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    Hedef: {formatDate(project.targetDate)}
                  </span>
                </div>

                <dl className="mt-auto grid grid-cols-4 gap-2 border-t pt-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col gap-0.5">
                      <dt className="text-[11px] text-muted-foreground">{metric.label}</dt>
                      <dd className="text-lg font-semibold tabular-nums">{metric.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="text-xs text-muted-foreground">
                  {stats.requests === 0
                    ? "Henüz talep yok"
                    : `${stats.newWorkRequests} yeni iş · ${stats.changeRequests} değişiklik`}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
