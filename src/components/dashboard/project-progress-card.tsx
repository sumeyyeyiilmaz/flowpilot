import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectProgress, ProjectStatus } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<ProjectStatus, string> = {
  Planlandı: "border-transparent bg-slate-500/10 text-slate-700 dark:text-slate-300",
  "Devam Ediyor": "border-transparent bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Riskli: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Tamamlanıyor: "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export function ProjectProgressCard({ projects }: { projects: ProjectProgress[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Proje İlerlemesi</CardTitle>
        <CardDescription>Aktif projelerin tamamlanma durumu</CardDescription>
        <CardAction>
          <Link
            href="/projeler"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Tümü
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {projects.map((project) => (
            <li key={project.id} className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.id} · {project.owner} · Teslim: {project.dueDate}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {project.openBugs > 0 && (
                    <span className="text-xs text-muted-foreground">{project.openBugs} açık hata</span>
                  )}
                  <Badge className={cn(statusStyles[project.status])}>{project.status}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress
                  value={project.progress}
                  aria-label={`${project.name} ilerleme`}
                  className="h-1.5 flex-1 bg-primary/15 dark:bg-primary/25"
                />
                <span className="w-10 text-right text-xs font-medium tabular-nums">%{project.progress}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
