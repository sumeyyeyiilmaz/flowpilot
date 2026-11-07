"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProjectRequirements, getUnlinkedDefectsForProject, isWorkItemLocked } from "@/lib/demo/agile-selectors";
import { demoActions, useDemoState } from "@/lib/demo/store";
import { STORY_POINTS, WORK_ITEM_TYPES, type StoryPoint, type WorkItem, type WorkItemType } from "@/lib/domain/types";

export const agileSelectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive dark:bg-input/30";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Oluşturmada işin projesi. */
  projectId: string;
  /** Verilirse düzenleme modu. */
  item?: WorkItem | null;
  onSaved: (message: string) => void;
};

export function WorkItemDialog({ open, onOpenChange, projectId, item, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        {open && (
          <WorkItemForm key={item?.id ?? `yeni-${projectId}`} projectId={item?.projectId ?? projectId} item={item ?? null}
            onCancel={() => onOpenChange(false)} onSaved={onSaved} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WorkItemForm({ projectId, item, onCancel, onSaved }: {
  projectId: string; item: WorkItem | null; onCancel: () => void; onSaved: (message: string) => void;
}) {
  const state = useDemoState();
  const locked = item ? isWorkItemLocked(state, item) : false;

  const [type, setType] = useState<WorkItemType>(item?.type ?? "Story");
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [storyPoints, setStoryPoints] = useState<StoryPoint | null>(item?.storyPoints ?? null);
  const [estimate, setEstimate] = useState(item?.estimateHours !== undefined ? String(item.estimateHours) : "");
  const [assigneeId, setAssigneeId] = useState(item?.assigneeId ?? "");
  const [requestId, setRequestId] = useState(item?.requestId ?? "");
  const [analysisId, setAnalysisId] = useState(item?.analysisId ?? "");
  const [requirementIds, setRequirementIds] = useState<string[]>(item?.requirementIds ?? []);
  const [defectId, setDefectId] = useState(item?.defectId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const project = state.projects.find((p) => p.id === projectId);
  const requests = state.requests.filter((r) => r.projectId === projectId);
  const analyses = requestId ? state.analyses.filter((a) => a.requestId === requestId) : [];
  const requirements = useMemo(() => {
    const all = getProjectRequirements(state, projectId);
    return requestId ? all.filter((r) => r.requestId === requestId) : all;
  }, [state, projectId, requestId]);
  const defectOptions = useMemo(() => {
    const unlinked = getUnlinkedDefectsForProject(state, projectId);
    const current = item?.defectId ? state.defects.find((d) => d.id === item.defectId) : undefined;
    return current && !unlinked.some((d) => d.id === current.id) ? [current, ...unlinked] : unlinked;
  }, [state, projectId, item]);

  const changeRequest = (id: string) => {
    setRequestId(id);
    // Seçilen talebe ait olmayan analiz ve gereksinim seçimlerini bırak (kayıtta reducer da doğrular).
    if (!state.analyses.some((a) => a.id === analysisId && a.requestId === id)) setAnalysisId("");
    if (id) setRequirementIds((ids) => ids.filter((rid) => state.requirements.find((r) => r.id === rid)?.requestId === id));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = "Başlık en az 3 karakter olmalıdır.";
    if (title.trim().length > 140) next.title = "Başlık en fazla 140 karakter olabilir.";
    if (estimate && !(Number(estimate) >= 0)) next.estimate = "Tahmini efor 0 veya daha büyük bir sayı olmalıdır.";
    if (type === "Hata" && !defectId) next.defect = "Hata türündeki iş bir hata kaydına bağlanmalıdır.";
    setErrors(next);
    setSaveError(null);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`is-${first}`)?.focus();
      return;
    }
    const links = { requestId: requestId || null, analysisId: analysisId || null, requirementIds };
    const estimateHours = estimate === "" ? null : Number(estimate);

    if (item) {
      const ok = demoActions.updateWorkItem(item.id, {
        title, description, assigneeId: assigneeId || null, ...links,
        ...(locked ? {} : { type, storyPoints, estimateHours, defectId: type === "Hata" ? defectId : null }),
      });
      if (!ok) return setSaveError("İş güncellenemedi. Bağlantıların projeyle uyumlu olduğundan ve seçilen hata kaydının başka bir işe bağlı olmadığından emin olun.");
      onSaved(`${item.code} güncellendi.`);
    } else {
      const id = demoActions.createWorkItem({
        projectId, type, title, description, storyPoints, assigneeId: assigneeId || null,
        ...(estimateHours !== null ? { estimateHours } : {}),
        requestId: links.requestId, analysisId: links.analysisId, requirementIds,
        defectId: type === "Hata" ? defectId : null,
      });
      if (!id) return setSaveError("İş oluşturulamadı. Bağlantıların projeyle uyumlu olduğundan ve seçilen hata kaydının başka bir işe bağlı olmadığından emin olun.");
      onSaved("İş Product Backlog'a eklendi.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{item ? `İşi düzenle · ${item.code}` : "Yeni iş"}</DialogTitle>
        <DialogDescription>
          {project?.name ?? projectId} · {item ? "Değişiklikler yalnızca bu tarayıcıdaki demo verisine kaydedilir." : "Yeni iş Product Backlog'un sonuna eklenir."}
        </DialogDescription>
      </DialogHeader>

      {locked && (
        <p className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Bu iş tamamlanmış bir sprintte; geçmişi korumak için tür, Story Point, efor ve hata bağlantısı değiştirilemez.
        </p>
      )}
      {saveError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {saveError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="is-type">İş türü</Label>
          <select id="is-type" className={agileSelectClass} value={type} disabled={locked}
            onChange={(e) => { setType(e.target.value as WorkItemType); setErrors({}); }}>
            {WORK_ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="is-assignee">Atanan kişi</Label>
          <select id="is-assignee" className={agileSelectClass} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Atanmamış</option>
            {state.teamMembers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
          </select>
        </div>
      </div>

      {type === "Hata" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="is-defect">Hata kaydı</Label>
          <select id="is-defect" className={agileSelectClass} value={defectId} disabled={locked} aria-invalid={!!errors.defect}
            onChange={(e) => setDefectId(e.target.value)}>
            <option value="">Hata kaydı seçin…</option>
            {defectOptions.map((d) => <option key={d.id} value={d.id}>{d.code} · {d.title}</option>)}
          </select>
          {defectOptions.length === 0 && <p className="text-xs text-muted-foreground">Bu projede bir işe bağlanmamış hata kaydı yok.</p>}
          {errors.defect && <p className="text-xs text-destructive">{errors.defect}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="is-title">Başlık</Label>
        <Input id="is-title" value={title} aria-invalid={!!errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Fatura filtreleme ekranı" />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="is-description">Açıklama</Label>
        <Textarea id="is-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="is-points">Story Point</Label>
          <select id="is-points" className={agileSelectClass} value={storyPoints ?? ""} disabled={locked}
            onChange={(e) => setStoryPoints(e.target.value === "" ? null : (Number(e.target.value) as StoryPoint))}>
            <option value="">Tahmin yok</option>
            {STORY_POINTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="is-estimate">Tahmini efor (saat)</Label>
          <Input id="is-estimate" type="number" min={0} step={0.5} inputMode="decimal" value={estimate} disabled={locked}
            aria-invalid={!!errors.estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="İsteğe bağlı" />
          {errors.estimate && <p className="text-xs text-destructive">{errors.estimate}</p>}
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">İzlenebilirlik (isteğe bağlı)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="is-request">Talep</Label>
            <select id="is-request" className={agileSelectClass} value={requestId} onChange={(e) => changeRequest(e.target.value)}>
              <option value="">Talep yok</option>
              {requests.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.title}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="is-analysis">Analiz</Label>
            <select id="is-analysis" className={agileSelectClass} value={analysisId} disabled={!requestId} onChange={(e) => setAnalysisId(e.target.value)}>
              <option value="">{requestId ? "Analiz yok" : "Önce talep seçin"}</option>
              {analyses.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Gereksinimler</span>
          {requirements.length === 0 ? (
            <p className="text-xs text-muted-foreground">{requestId ? "Bu talepte gereksinim yok." : "Bu projede gereksinim yok."}</p>
          ) : (
            <div className="flex max-h-36 flex-col gap-1 overflow-y-auto pr-1" aria-label="Gereksinimler">
              {requirements.map((r) => (
                <label key={r.id} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 accent-(--primary)" checked={requirementIds.includes(r.id)}
                    onChange={(e) => setRequirementIds((ids) => (e.target.checked ? [...ids, r.id] : ids.filter((x) => x !== r.id)))} />
                  <span><span className="text-xs text-muted-foreground">{r.code}</span> {r.title}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Vazgeç</Button>
        <Button type="submit">{item ? "Değişiklikleri kaydet" : "Backlog'a ekle"}</Button>
      </DialogFooter>
    </form>
  );
}
