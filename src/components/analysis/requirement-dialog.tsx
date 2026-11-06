"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoActions } from "@/lib/demo/store";
import {
  MOSCOW_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  type Analysis,
  type MoscowPriority,
  type Requirement,
  type RequirementStatus,
  type RequirementType,
} from "@/lib/domain/types";
import { nativeSelectClass } from "./analysis-editor";

export type RequirementDialogState =
  | { mode: "create"; sectionId: string | null }
  | { mode: "edit"; requirement: Requirement };

type Props = {
  state: RequirementDialogState | null;
  analysis: Analysis;
  onClose: () => void;
  onSaved: (message: string) => void;
};

export function RequirementDialog({ state, analysis, onClose, onSaved }: Props) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {state && (
          <RequirementForm
            key={state.mode === "edit" ? state.requirement.id : `yeni-${state.sectionId ?? "yok"}`}
            state={state}
            analysis={analysis}
            onCancel={onClose}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RequirementForm({
  state,
  analysis,
  onCancel,
  onSaved,
}: {
  state: RequirementDialogState;
  analysis: Analysis;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const editing = state.mode === "edit" ? state.requirement : null;
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<RequirementType>(editing?.type ?? "Fonksiyonel");
  const [priority, setPriority] = useState<MoscowPriority>(editing?.priority ?? "Should");
  const [status, setStatus] = useState<RequirementStatus>(editing?.status ?? "Taslak");
  const [sectionId, setSectionId] = useState(editing ? (editing.sectionId ?? "") : (state.mode === "create" ? (state.sectionId ?? "") : ""));
  const [criteria, setCriteria] = useState((editing?.acceptanceCriteria ?? []).join("\n"));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3) {
      setError("Gereksinim başlığı en az 3 karakter olmalıdır.");
      document.getElementById("gereksinim-baslik")?.focus();
      return;
    }
    if (t.length > 120) {
      setError("Gereksinim başlığı en fazla 120 karakter olabilir.");
      return;
    }
    const acceptanceCriteria = criteria.split("\n");
    if (editing) {
      const ok = demoActions.updateRequirement(editing.id, {
        title: t, description, type, priority, status, sectionId: sectionId || null, acceptanceCriteria,
      });
      if (!ok) return setError("Gereksinim güncellenemedi.");
      onSaved(`${editing.code} güncellendi.`);
    } else {
      const id = demoActions.createRequirement({
        requestId: analysis.requestId,
        analysisId: analysis.id,
        sectionId: sectionId || null,
        title: t,
        description,
        type,
        priority,
        acceptanceCriteria,
      });
      if (!id) return setError("Gereksinim oluşturulamadı.");
      onSaved("Gereksinim oluşturuldu.");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{editing ? `Gereksinimi düzenle · ${editing.code}` : "Yeni gereksinim"}</DialogTitle>
        <DialogDescription>
          Gereksinim bu talebe ve “{analysis.title}” analizine bağlanır. Bölüm bağlantısı isteğe bağlıdır.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="gereksinim-baslik">Başlık</Label>
        <Input id="gereksinim-baslik" value={title} aria-invalid={!!error && title.trim().length < 3}
          onChange={(e) => { setTitle(e.target.value); setError(null); }} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gereksinim-aciklama">Açıklama</Label>
        <Textarea id="gereksinim-aciklama" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Sistem … yapabilmelidir." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="gereksinim-tur">Tür</Label>
          <select id="gereksinim-tur" className={nativeSelectClass} value={type} onChange={(e) => setType(e.target.value as RequirementType)}>
            {REQUIREMENT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gereksinim-oncelik">Öncelik (MoSCoW)</Label>
          <select id="gereksinim-oncelik" className={nativeSelectClass} value={priority} onChange={(e) => setPriority(e.target.value as MoscowPriority)}>
            {MOSCOW_PRIORITIES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gereksinim-bolum">Analiz bölümü (isteğe bağlı)</Label>
          <select id="gereksinim-bolum" className={nativeSelectClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Bölüme bağlı değil</option>
            {analysis.sections.map((s, i) => <option key={s.id} value={s.id}>{i + 1}. {s.title || "Adsız bölüm"}</option>)}
          </select>
        </div>
        {editing && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="gereksinim-durum">Durum</Label>
            <select id="gereksinim-durum" className={nativeSelectClass} value={status} onChange={(e) => setStatus(e.target.value as RequirementStatus)}>
              {REQUIREMENT_STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="gereksinim-kriter">Kabul kriterleri</Label>
        <Textarea id="gereksinim-kriter" rows={3} value={criteria} onChange={(e) => setCriteria(e.target.value)}
          placeholder="Her satıra bir kriter yazın" />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Vazgeç</Button>
        <Button type="submit">{editing ? "Değişiklikleri kaydet" : "Gereksinimi ekle"}</Button>
      </DialogFooter>
    </form>
  );
}
