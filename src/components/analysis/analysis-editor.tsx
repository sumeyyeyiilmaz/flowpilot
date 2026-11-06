"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SECTION_PRESET_LIBRARY } from "@/lib/demo/section-presets";
import { demoActions, useDemoStorageStatus } from "@/lib/demo/store";
import {
  ANALYSIS_STATUSES,
  SECTION_KINDS,
  SECTION_KIND_LABELS,
  type Analysis,
  type AnalysisStatus,
  type Requirement,
  type SectionKind,
} from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { SectionEditor } from "./section-editor";

export const nativeSelectClass =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

type Props = {
  analysis: Analysis;
  requirements: Requirement[];
  onAddRequirement: (sectionId: string | null) => void;
};

export function AnalysisEditor({ analysis, requirements, onAddRequirement }: Props) {
  const titleEmpty = !analysis.title.trim();
  const storageStatus = useDemoStorageStatus();
  const analysisId = analysis.id;

  // Temizlik yalnızca blur'a bağlı değil: analiz değiştirilince/sayfadan çıkınca (unmount)
  // ve sekme gizlenince/kapanırken de boş başlık ve maddeler temizlenir.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") demoActions.normalizeAnalysis(analysisId);
    };
    const onPageHide = () => demoActions.normalizeAnalysis(analysisId);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      demoActions.normalizeAnalysis(analysisId);
    };
  }, [analysisId]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {analysis.code} · {analysis.author}
            </span>
            {storageStatus.kind === "ok" ? (
              <span data-autosave="ok">Otomatik kaydedilir · Son güncelleme {formatDateTime(analysis.updatedAt)}</span>
            ) : (
              <span data-autosave="failed" className="font-medium text-amber-700 dark:text-amber-300">
                Değişiklikler tarayıcıya kaydedilmiyor
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="analiz-baslik">Analiz başlığı</Label>
              <Input
                id="analiz-baslik"
                value={analysis.title}
                aria-invalid={titleEmpty}
                aria-describedby={titleEmpty ? "analiz-baslik-hata" : undefined}
                onChange={(e) => demoActions.updateAnalysis(analysis.id, { title: e.target.value })}
                onBlur={() => demoActions.normalizeAnalysis(analysis.id)}
                className="text-base font-medium"
              />
              {titleEmpty && (
                <p id="analiz-baslik-hata" className="text-xs text-destructive">
                  Başlık boş bırakılamaz; alandan çıkınca “Adsız analiz” olarak kaydedilir.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="analiz-durum">Durum</Label>
              <select
                id="analiz-durum"
                className={nativeSelectClass}
                value={analysis.status}
                onChange={(e) => demoActions.updateAnalysis(analysis.id, { status: e.target.value as AnalysisStatus })}
              >
                {ANALYSIS_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="analiz-aciklama">Açıklama</Label>
            <Textarea
              id="analiz-aciklama"
              value={analysis.description ?? ""}
              rows={2}
              placeholder="Bu analizin amacı ve kapsamı (isteğe bağlı)"
              onChange={(e) => demoActions.updateAnalysis(analysis.id, { description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">
          Bölümler <span className="font-normal text-muted-foreground">({analysis.sections.length})</span>
        </h2>
      </div>

      {analysis.sections.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Bu analizde henüz bölüm yok. Aşağıdan hazır bir başlık seçin veya kendi bölümünüzü ekleyin.
        </p>
      )}

      {analysis.sections.map((section, index) => (
        <SectionEditor
          key={section.id}
          analysisId={analysis.id}
          section={section}
          index={index}
          total={analysis.sections.length}
          requirementCount={requirements.filter((r) => r.sectionId === section.id).length}
          onAddRequirement={onAddRequirement}
        />
      ))}

      <AddSectionPanel analysis={analysis} />
    </div>
  );
}

function AddSectionPanel({ analysis }: { analysis: Analysis }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<SectionKind>("text");
  const [error, setError] = useState<string | null>(null);

  const existing = new Set(analysis.sections.map((s) => s.title.trim().toLocaleLowerCase("tr-TR")));
  const suggestions = SECTION_PRESET_LIBRARY.filter((p) => !existing.has(p.title.toLocaleLowerCase("tr-TR")));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setError("Bölüm başlığı en az 2 karakter olmalıdır.");
      return;
    }
    demoActions.addSection(analysis.id, trimmed, kind);
    setTitle("");
    setError(null);
  };

  return (
    <Card size="sm" className="bg-muted/30">
      <CardHeader>
        <CardTitle>Bölüm ekle</CardTitle>
        <CardDescription>Şablon zorunlu değildir. Hazır başlıklardan birini seçin veya kendi bölümünüzü oluşturun.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Hazır bölüm başlıkları">
            {suggestions.map((preset) => (
              <Button
                key={preset.title}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => demoActions.addSection(analysis.id, preset.title, preset.kind)}
              >
                <Plus data-icon="inline-start" aria-hidden="true" />
                {preset.title}
              </Button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex flex-1 flex-col gap-1">
            <Input
              value={title}
              placeholder="Özel bölüm başlığı"
              aria-label="Özel bölüm başlığı"
              aria-invalid={!!error}
              aria-describedby={error ? "yeni-bolum-hata" : undefined}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
            />
            {error && (
              <p id="yeni-bolum-hata" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <select
            aria-label="Bölüm türü"
            className={`${nativeSelectClass} sm:w-40`}
            value={kind}
            onChange={(e) => setKind(e.target.value as SectionKind)}
          >
            {SECTION_KINDS.map((k) => (
              <option key={k} value={k}>
                {SECTION_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <Button type="submit">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Bölüm ekle
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
