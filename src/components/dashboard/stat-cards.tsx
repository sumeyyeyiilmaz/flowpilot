import { Bug, FlaskConical, FolderKanban, ListChecks, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStat } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const statStyles: Record<DashboardStat["key"], { icon: typeof Bug; className: string }> = {
  projects: { icon: FolderKanban, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  requirements: { icon: ListChecks, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  tests: { icon: FlaskConical, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  bugs: { icon: Bug, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

export function StatCards({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const { icon: Icon, className } = statStyles[stat.key];
        const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : null;
        return (
          <Card key={stat.key}>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <span className={cn("flex size-9 items-center justify-center rounded-lg", className)}>
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-medium",
                      stat.positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {TrendIcon && <TrendIcon className="size-3.5" aria-hidden="true" />}
                    {stat.change}
                  </span>
                  {stat.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
