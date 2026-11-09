import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectProgressCard } from "@/components/dashboard/project-progress-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { StatCards } from "@/components/dashboard/stat-cards";
import { PageHeader } from "@/components/layout/page-header";
import { dashboardStats, projectProgress, recentActivities } from "@/lib/demo-data";

export default function OverviewPage() {
  return (
    <>
      <PageHeader title="Genel Bakış" description="Proje portföyünüzün teslimat ve ilerleme durumu">
        <Button asChild>
          <Link href="/projeler">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Yeni Proje
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-6">
        <StatCards stats={dashboardStats} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectProgressCard projects={projectProgress} />
          </div>
          <RecentActivityCard activities={recentActivities} />
        </div>
      </div>
    </>
  );
}
