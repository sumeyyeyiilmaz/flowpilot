"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Info, SquareKanban } from "lucide-react";
import { SprintStatusBadge } from "@/components/common/status-badges";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBurndownReport,
  getDefaultBoardSprint,
  getProjectAgileMetrics,
  getProjectSprints,
  getSprintComparison,
  toCalendarDay,
  type BurndownReport,
} from "@/lib/demo/agile-selectors";
import { useDemoHydrated, useDemoState } from "@/lib/demo/store";
import type { Sprint } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { sprintBoardHref, sprintMetricsHref, sprintPlanningHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { BurndownChart } from "./burndown-chart";
import { VelocityChart } from "./velocity-chart";
import { agileSelectClass } from "./work-item-dialog";

const pct = (v: number | null) => (v === null ? "—" : `%${(Math.round(v * 1000) / 10).toLocaleString("tr-TR")}`);
const num = (v: number) => v.toLocaleString("tr-TR");

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-10 text-center" data-empty-state>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

export function MetricsWorkspace() {
  const state = useDemoState();
  const hydrated = useDemoHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requested = searchParams.get("proje");
  const projectId =
    state.projects.find((p) => p.id === requested)?.id ??
    state.projects.find((p) => state.sprints.some((s) => s.projectId === p.id))?.id ??
    state.projects[0]?.id ??
    "";
  const sprints = getProjectSprints(state, projectId);
  const sprint = sprints.find((s) => s.id === searchParams.get("sprint")) ?? getDefaultBoardSprint(state, projectId);
  const metrics = getProjectAgileMetrics(state, projectId);
  const comparison = getSprintComparison(state, projectId);
  // "Bugün" yalnızca tarayıcıda (Europe/Istanbul) belirlenir; sunucuda aktif sprint burndown'u üretilmez.
  const today = hydrated ? toCalendarDay(new Date().toISOString()) : undefined;
  const report = sprint ? getBurndownReport(state, sprint.id, today) : null;
  const velocityRows = [...metrics.velocity.sprints];

  return (
    <>
      <PageHeader title="Agile Metrikleri" description="Burndown, Velocity ve sprint performansı.">
        <Link href={sprintPlanningHref(projectId)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />Sprint planlama
        </Link>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:w-2/3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="metrik-proje" className="text-xs font-medium text-muted-foreground">Proje</label>
          <select id="metrik-proje" className={cn(agileSelectClass, "bg-background")} value={projectId}
            onChange={(e) => router.replace(sprintMetricsHref(e.target.value), { scroll: false })}>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="metrik-sprint" className="text-xs font-medium text-muted-foreground">Burndown sprinti</label>
          <select id="metrik-sprint" className={cn(agileSelectClass, "bg-background")} value={sprint?.id ?? ""} disabled={sprints.length === 0}
            onChange={(e) => router.replace(sprintMetricsHref(projectId, e.target.value), { scroll: false })}>
            {sprints.length === 0 && <option value="">Bu projede sprint yok</option>}
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name} ({s.status})</option>)}
          </select>
        </div>
      </div>

      {/* Proje özeti */}
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4" data-metric-tiles>
        <Tile label="Velocity (ortalama)" value={metrics.velocity.sprints.length ? `${num(metrics.velocity.average)} SP` : "—"}
          hint={metrics.velocity.sprints.length ? `Son ${metrics.velocity.sprints.length} tamamlanan sprint` : "Tamamlanan sprint yok"} />
        <Tile label="Tamamlanan sprint" value={String(metrics.completedSprintCount)} hint="Velocity'nin dayanağı" />
        <Tile label="Aktif sprint" value={metrics.activePoints ? `${metrics.activePoints.completed}/${metrics.activePoints.committed} SP` : "—"}
          hint={metrics.activeSprint ? `${metrics.activeSprint.code} · kalan ${metrics.activePoints!.remaining} SP` : "Aktif sprint yok"} />
        <Tile label="Product Backlog" value={`${metrics.backlogPoints} SP`}
          hint={`${metrics.backlogItems} iş${metrics.backlogUnestimated ? ` · ${metrics.backlogUnestimated} tahminsiz` : ""}`} />
      </dl>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card data-panel="burndown">
          <CardHeader>
            <CardTitle>Burndown</CardTitle>
            <CardDescription>
              {sprint ? <span className="inline-flex flex-wrap items-center gap-1.5">{sprint.code} · {sprint.name} <SprintStatusBadge status={sprint.status} /> · {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}</span> : "Sprint seçilmedi"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BurndownBody sprint={sprint} report={report} hydrated={hydrated} projectId={projectId} />
          </CardContent>
        </Card>

        <Card data-panel="velocity">
          <CardHeader>
            <CardTitle>Velocity</CardTitle>
            <CardDescription>Yalnızca tamamlanan sprintlerin kapanış özetleri esas alınır; aktif sprint dahil değildir.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {velocityRows.length === 0 ? (
              <EmptyState title="Velocity için veri yok" text="Velocity hesaplamak için projede en az bir tamamlanmış sprint gerekir. Sprint kapatıldığında değeri burada görünür." />
            ) : (
              <>
                <VelocityChart rows={velocityRows} average={metrics.velocity.average} />
                {velocityRows.length < 3 && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground" data-velocity-note>
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    Yalnızca {velocityRows.length} tamamlanmış sprint var; ortalama henüz güvenilir bir tahmin göstergesi değildir.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6" data-panel="comparison">
        <CardHeader>
          <CardTitle>Sprint karşılaştırması</CardTitle>
          <CardDescription>Tamamlanan sprintlerin kapanış özetleri (değişmez). Aktif sprint, kapanmadığı için ayrı gösterilir.</CardDescription>
        </CardHeader>
        <CardContent>
          {comparison.length === 0 && !metrics.activeSprint ? (
            <EmptyState title="Karşılaştırılacak sprint yok" text="Bu projede henüz tamamlanmış veya aktif sprint bulunmuyor." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm tabular-nums">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Sprint</th>
                    <th className="py-2 pr-3 font-medium">Tarih</th>
                    <th className="py-2 pr-3 text-right font-medium">Taahhüt</th>
                    <th className="py-2 pr-3 text-right font-medium">Tamamlanan</th>
                    <th className="py-2 pr-3 text-right font-medium">Oran</th>
                    <th className="py-2 text-right font-medium">Taşınan iş</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.activeSprint && metrics.activePoints && (
                    <tr className="border-b bg-muted/40" data-comparison-row={metrics.activeSprint.code}>
                      <td className="py-2 pr-3"><span className="font-medium">{metrics.activeSprint.code}</span> · {metrics.activeSprint.name} <span className="text-xs text-muted-foreground">(devam ediyor)</span></td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDate(metrics.activeSprint.startDate)} – {formatDate(metrics.activeSprint.endDate)}</td>
                      <td className="py-2 pr-3 text-right">{metrics.activePoints.committed} SP</td>
                      <td className="py-2 pr-3 text-right">{metrics.activePoints.completed} SP</td>
                      <td className="py-2 pr-3 text-right text-muted-foreground">—</td>
                      <td className="py-2 text-right text-muted-foreground">—</td>
                    </tr>
                  )}
                  {comparison.map((row) => (
                    <tr key={row.sprint.id} className="border-b last:border-b-0" data-comparison-row={row.sprint.code}>
                      <td className="py-2 pr-3"><span className="font-medium">{row.sprint.code}</span> · {row.sprint.name}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDate(row.sprint.startDate)} – {formatDate(row.sprint.endDate)}</td>
                      <td className="py-2 pr-3 text-right">{row.committed} SP</td>
                      <td className="py-2 pr-3 text-right">{row.completed} SP</td>
                      <td className="py-2 pr-3 text-right">{pct(row.completionRate)}</td>
                      <td className="py-2 text-right">{row.carriedOverCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
      <dd className="text-[11px] text-muted-foreground">{hint}</dd>
    </div>
  );
}

function BurndownBody({ sprint, report, hydrated, projectId }: { sprint?: Sprint; report: BurndownReport | null; hydrated: boolean; projectId: string }) {
  if (!sprint) return <EmptyState title="Sprint yok" text="Burndown için önce sprint planlama ekranından bir sprint oluşturun." />;
  if (!report) return hydrated ? null : <div className="h-60 animate-pulse rounded-lg bg-muted" aria-busy="true" />;
  switch (report.kind) {
    case "not-started":
      return <EmptyState title="Sprint henüz başlamadı" text="Burndown, sprint başladıktan ve işler tamamlanmaya başladıktan sonra hesaplanır." />;
    case "no-points":
      return <EmptyState title="Puanlanmış iş yok"
        text={`Bu sprintte Story Point tahmini olan iş bulunmuyor${report.unestimatedItems ? ` (${report.unestimatedItems} iş tahminsiz)` : ""}. Grafik yanıltıcı olacağı için çizilmedi.`} />;
    case "before-start":
      return <EmptyState title="Sprint günleri başlamadı" text={`Sprint aktif ancak başlangıç tarihi henüz gelmedi; ölçülmüş bir gün yok (toplam ${report.total} SP).`} />;
    case "chart":
      return (
        <>
          <BurndownChart points={report.points} total={report.total} />
          <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground" data-burndown-notes>
            <li className="flex items-start gap-1.5"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-medium text-foreground">Hesaplama yöntemi:</strong> Bu MVP burndown, günlük geçmiş anlık görüntülerine dayanmaz.
                Kalan puan, {report.basis === "summary" ? "sprintin kapanış özetindeki kapsamdan" : "sprintteki işlerin mevcut kapsamından"} o güne kadar tamamlanan işlerin puanı düşülerek hesaplanır;
                sprint içinde eklenen veya çıkarılan işler geçmiş günlere ayrıca yansıtılmaz.{report.basis === "current" ? " Gelecek günler için değer üretilmez." : ""}
              </span>
            </li>
            {report.overdue && <li>Sprintin bitiş tarihi geçti; sprint henüz kapatılmadı.</li>}
            {report.completedBeforeStart > 0 && <li>{report.completedBeforeStart} SP sprint başlangıcından önce tamamlanmış; grafikte ilk güne dahil edildi.</li>}
            {report.completedAfterEnd > 0 && <li>{report.completedAfterEnd} SP sprint bitişinden sonra tamamlanmış; grafiğin günlerine yansıtılmadı.</li>}
            {report.unestimatedItems > 0 && <li>{report.unestimatedItems} iş Story Point tahmini olmadığı için grafiğe yansımıyor.</li>}
          </ul>
          <Link href={sprintBoardHref(projectId, sprint.id)} className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline">
            <SquareKanban className="size-3.5" aria-hidden="true" />Sprint panosunu aç
          </Link>
        </>
      );
  }
}
