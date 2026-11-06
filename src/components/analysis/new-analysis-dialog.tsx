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
import { DEFAULT_SECTIONS_BY_REQUEST_TYPE } from "@/lib/demo/section-presets";
import { demoActions } from "@/lib/demo/store";
import { REQUEST_TYPE_LABELS, type WorkRequest } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const DEMO_AUTHOR = "Demo Kullanıcı";

type Props = {
  open: boolean;
  request: WorkRequest;
  onOpenChange: (open: boolean) => void;
  onCreated: (analysisId: string) => void;
};

export function NewAnalysisDialog({ open, request, onOpenChange, onCreated }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        {open && <NewAnalysisForm request={request} onCancel={() => onOpenChange(false)} onCreated={onCreated} />}
      </DialogContent>
    </Dialog>
  );
}

function NewAnalysisForm({
  request,
  onCancel,
  onCreated,
}: {
  request: WorkRequest;
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [usePresets, setUsePresets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presets = DEFAULT_SECTIONS_BY_REQUEST_TYPE[request.type];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Analiz başlığı en az 3 karakter olmalıdır.");
      document.getElementById("yeni-analiz-baslik")?.focus();
      return;
    }
    const id = demoActions.createAnalysis({
      requestId: request.id,
      title,
      description,
      author: DEMO_AUTHOR,
      usePresetSections: usePresets,
    });
    if (!id) return setError("Analiz oluşturulamadı. Talep demo verisinde bulunamadı.");
    onCreated(id);
  };

  const options = [
    {
      value: true,
      title: "Önerilen bölümlerle başla",
      text: `${REQUEST_TYPE_LABELS[request.type]} için: ${presets.map((p) => p.title).join(", ")}`,
    },
    { value: false, title: "Boş başla", text: "Bölümleri kendiniz ekleyin; hiçbir şablon zorunlu değildir." },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Yeni analiz</DialogTitle>
        <DialogDescription>
          {request.code} · {request.title}. Önceki analizler korunur.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="yeni-analiz-baslik">Başlık</Label>
        <Input id="yeni-analiz-baslik" value={title} aria-invalid={!!error}
          placeholder="Örn. Detaylı iş analizi"
          onChange={(e) => { setTitle(e.target.value); setError(null); }} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="yeni-analiz-aciklama">Açıklama (isteğe bağlı)</Label>
        <Textarea id="yeni-analiz-aciklama" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Başlangıç</legend>
        {options.map((o) => (
          <label
            key={String(o.value)}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              usePresets === o.value ? "border-primary bg-primary/5" : "hover:bg-muted/60"
            )}
          >
            <input type="radio" name="analiz-baslangic" checked={usePresets === o.value}
              onChange={() => setUsePresets(o.value)} className="mt-1 accent-(--primary)" />
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{o.title}</span>
              <span className="text-xs text-muted-foreground">{o.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Vazgeç</Button>
        <Button type="submit">Analizi oluştur</Button>
      </DialogFooter>
    </form>
  );
}
