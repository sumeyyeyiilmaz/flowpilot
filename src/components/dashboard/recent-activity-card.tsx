import { Bug, FlaskConical, FolderKanban, ListChecks, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity, ActivityType } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const activityStyles: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  requirement: { icon: ListChecks, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  test: { icon: FlaskConical, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  bug: { icon: Bug, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  project: { icon: FolderKanban, className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
};

export function RecentActivityCard({ activities }: { activities: Activity[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
        <CardDescription>Ekipten son güncellemeler</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative flex flex-col gap-5">
          {activities.map((activity, index) => {
            const { icon: Icon, className } = activityStyles[activity.type];
            return (
              <li key={activity.id} className="relative flex gap-3">
                {index < activities.length - 1 && (
                  <span className="absolute top-9 bottom-[-1.25rem] left-4 w-px bg-border" aria-hidden="true" />
                )}
                <span className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-full", className)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{activity.actor}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="truncate text-sm font-medium text-foreground/90">{activity.target}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
