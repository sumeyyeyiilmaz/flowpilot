"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Info, Plus, X } from "lucide-react";
import { SaveNotice } from "@/components/common/save-notice";
import { AnalysisStatusBadge, RequestStatusBadge, RequestTypeBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAnalysesByRequest,
  getProject,
  getRequest,
  getRequirementsByAnalysis,
  getRequirementsByRequest,
} from "@/lib/demo/selectors";
import { useDemoHydrated, useDemoState } from "@/lib/demo/store";
import { formatShortDate } from "@/lib/format";
import { analysisHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AnalysisEditor, nativeSelectClass } from "./analysis-editor";
import { NewAnalysisDialog } from "./new-analysis-dialog";
import { RequirementDialog, type RequirementDialogState } from "./requirement-dialog";
import { RequirementsPanel } from "./requirements-panel";

const MISSING_ANALYSIS_WARNING = "analiz-bulunamadi";

export function AnalysisWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = useDemoState();
  const hydrated = useDemoHydrated();

  const [newOpen, setNewOpen] = useState(false);
  const [reqDialog, setReqDialog] = useState<RequirementDialogState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const requestId = searchParams.get("talep") ?? "";
  const analysisParam = searchParams.get("analiz");
  const missingAnalysisWarning = searchParams.get("uyari") === MISSING_ANALYSIS_WARNING;
  const request = requestId ? getRequest(state, requestId) : undefined;
  const analyses = request ? getAnalysesByRequest(state, request.id) : [];
  const fallbackAnalysisId = analyses[0]?.id;

  // Adresteki analiz kimliği geçersizse adresi geçerli analizle (yoksa analizsiz) düzelt.
  // Kullanıcının oluşturduğu analizler tarayıcı verisi yüklenince görünür; bu yüzden hidrasyon beklenir.
  const invalidAnalysisParam =
    hydrated && !!request && analysisParam !== null && !analyses.some((a) => a.id === analysisParam);
  const resolvedRequestId = request?.id;
  useEffect(() => {
    if (!invalidAnalysisParam || !resolvedRequestId) return;
    router.replace(`${analysisHref(resolvedRequestId, fallbackAnalysisId)}&uyari=${MISSING_ANALYSIS_WARNING}`, {
      scroll: false,
    });
  }, [invalidAnalysisParam, resolvedRequestId, fallbackAnalysisId, router]);

  if (!request) {
    // Kullanıcının oluşturduğu talepler tarayıcı verisi yüklenince görünür.
    if (!hydrated) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-medium">Talep bulunamadı</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Bağlantıdaki talep bu tarayıcının demo verisinde yok. Demo verisi sıfırlanmış olabilir.
          </p>
          <Button asChild variant="outline">
            <Link href="/talepler">Taleplere dön</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const project = getProject(state, request.projectId);
  const selected = analyses.find((a) => a.id === analysisParam) ?? analyses[0];
  const requirements = selected ? getRequirementsByAnalysis(state, selected.id) : [];
  const requestRequirementCount = getRequirementsByRequest(state, request.id).length;

  const select = (analysisId: string) => router.replace(analysisHref(request.id, analysisId), { scroll: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/talepler" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Talepler
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {request.code}
              {project && ` · ${project.name}`} · Analiz çalışma alanı
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{request.title}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <RequestTypeBadge type={request.type} />
              <RequestStatusBadge status={request.status} />
            </div>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Yeni analiz
          </Button>
        </div>
      </div>

      {missingAnalysisWarning && (
        <div
          role="status"
          data-warning="analiz-bulunamadi"
          className="flex items-start gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-900 dark:text-sky-200"
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            Bağlantıdaki analiz bu talepte bulunamadı.{" "}
            {analyses.length > 0 ? "Talebin en güncel analizi gösteriliyor." : "Bu talebin henüz analizi yok."}
          </span>
          <button
            type="button"
            onClick={() => router.replace(analysisHref(request.id, selected?.id), { scroll: false })}
            aria-label="Uyarıyı kapat"
            className="rounded p-0.5 outline-none hover:bg-sky-500/15 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div role="status" aria-live="polite" className="empty:hidden">
        {notice && <SaveNotice message={notice} onDismiss={() => setNotice(null)} />}
      </div>

      {analyses.length === 0 || !selected ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <p className="font-medium">Bu talep için henüz analiz yok</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Boş bir analizle veya talep türüne uygun önerilen bölümlerle başlayabilirsiniz.
            </p>
            <Button onClick={() => setNewOpen(true)}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              İlk analizi oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
          {/* Analiz listesi */}
          <nav aria-label="Talebin analizleri" className="flex flex-col gap-2 lg:sticky lg:top-20">
            <label htmlFor="analiz-sec" className="text-xs font-medium text-muted-foreground lg:hidden">
              Analiz ({analyses.length})
            </label>
            <select id="analiz-sec" className={cn(nativeSelectClass, "bg-background lg:hidden")} value={selected.id}
              onChange={(e) => select(e.target.value)}>
              {analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.title || "Adsız analiz"} ({a.status})
                </option>
              ))}
            </select>
            <p className="hidden px-1 text-xs font-medium text-muted-foreground lg:block">Analizler ({analyses.length})</p>
            <ul className="hidden flex-col gap-1.5 lg:flex">
              {analyses.map((a) => {
                const active = a.id === selected.id;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => select(a.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                        active ? "border-primary/40 bg-primary/5" : "bg-background hover:bg-muted/60"
                      )}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        {a.code}
                        <AnalysisStatusBadge status={a.status} />
                      </span>
                      <span className={cn("line-clamp-2 font-medium", active && "text-primary")}>{a.title || "Adsız analiz"}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.sections.length} bölüm · {formatShortDate(a.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <AnalysisEditor
            key={selected.id}
            analysis={selected}
            requirements={requirements}
            onAddRequirement={(sectionId) => setReqDialog({ mode: "create", sectionId })}
          />

          <div className="lg:col-start-2 xl:col-start-auto">
            <RequirementsPanel
              analysis={selected}
              requirements={requirements}
              requestRequirementCount={requestRequirementCount}
              onAdd={() => setReqDialog({ mode: "create", sectionId: null })}
              onEdit={(requirement) => setReqDialog({ mode: "edit", requirement })}
            />
          </div>
        </div>
      )}

      <NewAnalysisDialog
        open={newOpen}
        request={request}
        onOpenChange={setNewOpen}
        onCreated={(id) => {
          setNewOpen(false);
          setNotice("Yeni analiz oluşturuldu. Önceki analizler korunuyor.");
          select(id);
        }}
      />

      {selected && (
        <RequirementDialog
          state={reqDialog}
          analysis={selected}
          onClose={() => setReqDialog(null)}
          onSaved={(message) => {
            setReqDialog(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}
