"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoActions, useDemoState } from "@/lib/demo/store";
import type { Sprint } from "@/lib/domain/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Verilirse düzenleme modu. */
  sprint?: Sprint | null;
  onSaved: (message: string) => void;
};

export function SprintDialog({ open, onOpenChange, projectId, sprint, onSaved }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {open && (
          <SprintForm key={sprint?.id ?? `yeni-${projectId}`} projectId={sprint?.projectId ?? projectId} sprint={sprint ?? null}
            onCancel={() => onOpenChange(false)} onSaved={onSaved} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SprintForm({ projectId, sprint, onCancel, onSaved }: {
  projectId: string; sprint: Sprint | null; onCancel: () => void; onSaved: (message: string) => void;
}) {
  const state = useDemoState();
  const project = state.projects.find((p) => p.id === projectId);
  const [name, setName] = useState(sprint?.name ?? "");
  const [goal, setGoal] = useState(sprint?.goal ?? "");
  const [startDate, setStartDate] = useState(sprint?.startDate ?? "");
  const [endDate, setEndDate] = useState(sprint?.endDate ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Sprint adı en az 2 karakter olmalıdır.";
    if (!startDate) next.start = "Başlangıç tarihi seçin.";
    if (!endDate) next.end = "Bitiş tarihi seçin.";
    if (startDate && endDate && startDate > endDate) next.end = "Bitiş tarihi başlangıçtan önce olamaz.";
    setErrors(next);
    setSaveError(null);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`sprint-${first}`)?.focus();
      return;
    }
    if (sprint) {
      const ok = demoActions.updateSprint(sprint.id, { name, goal, startDate, endDate });
      if (!ok) return setSaveError("Sprint güncellenemedi. Tamamlanmış sprintler düzenlenemez.");
      onSaved(`${sprint.code} güncellendi.`);
    } else {
      const id = demoActions.createSprint({ projectId, name, goal, startDate, endDate });
      if (!id) return setSaveError("Sprint oluşturulamadı. Tarihleri kontrol edin.");
      onSaved("Sprint oluşturuldu (Planlandı).");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{sprint ? `Sprinti düzenle · ${sprint.code}` : "Yeni sprint"}</DialogTitle>
        <DialogDescription>{project?.name ?? projectId}{sprint ? "" : " · Yeni sprint “Planlandı” durumunda oluşturulur."}</DialogDescription>
      </DialogHeader>
      {saveError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {saveError}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="sprint-name">Sprint adı</Label>
        <Input id="sprint-name" value={name} aria-invalid={!!errors.name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Sprint 5" />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sprint-goal">Sprint hedefi</Label>
        <Textarea id="sprint-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="sprint-start">Başlangıç</Label>
          <Input id="sprint-start" type="date" value={startDate} aria-invalid={!!errors.start} onChange={(e) => setStartDate(e.target.value)} />
          {errors.start && <p className="text-xs text-destructive">{errors.start}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sprint-end">Bitiş</Label>
          <Input id="sprint-end" type="date" value={endDate} aria-invalid={!!errors.end} onChange={(e) => setEndDate(e.target.value)} />
          {errors.end && <p className="text-xs text-destructive">{errors.end}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Vazgeç</Button>
        <Button type="submit">{sprint ? "Değişiklikleri kaydet" : "Sprinti oluştur"}</Button>
      </DialogFooter>
    </form>
  );
}
