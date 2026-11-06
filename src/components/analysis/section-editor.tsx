"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ListPlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createId, demoActions } from "@/lib/demo/store";
import { SECTION_KIND_LABELS, type AnalysisSection } from "@/lib/domain/types";

type Props = {
  analysisId: string;
  section: AnalysisSection;
  index: number;
  total: number;
  requirementCount: number;
  onAddRequirement: (sectionId: string) => void;
};

/** Tek bir analiz bölümü. Değişiklikler yazıldıkça demo store'a kaydedilir. */
export function SectionEditor({ analysisId, section, index, total, requirementCount, onAddRequirement }: Props) {
  const save = (next: AnalysisSection) => demoActions.updateSection(analysisId, next);
  const titleId = `bolum-${section.id}-baslik`;

  const handleRemove = () => {
    const extra = requirementCount > 0 ? ` Bağlı ${requirementCount} gereksinim korunur, yalnızca bölüm bağlantısı kaldırılır.` : "";
    if (window.confirm(`"${section.title || "Adsız bölüm"}" bölümü silinsin mi?${extra}`)) {
      demoActions.removeSection(analysisId, section.id);
    }
  };

  return (
    <Card
      size="sm"
      data-section-id={section.id}
      onBlur={(e) => {
        // Odak bölümün dışına çıkınca bu bölümü temizle (bölüm içinde gezinirken değil).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          demoActions.normalizeSection(analysisId, section.id);
        }
      }}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary tabular-nums">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <label htmlFor={titleId} className="sr-only">
              Bölüm başlığı
            </label>
            <Input
              id={titleId}
              value={section.title}
              placeholder="Bölüm başlığı"
              onChange={(e) => save({ ...section, title: e.target.value })}
              className="h-8 border-transparent px-1.5 text-[15px] font-medium shadow-none hover:border-input focus-visible:border-ring"
            />
            <span className="px-1.5 text-[11px] text-muted-foreground">
              {SECTION_KIND_LABELS[section.kind]}
              {requirementCount > 0 && ` · ${requirementCount} bağlı gereksinim`}
            </span>
          </div>
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon-sm" disabled={index === 0} aria-label="Bölümü yukarı taşı"
              onClick={() => demoActions.moveSection(analysisId, section.id, "up")}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-sm" disabled={index === total - 1} aria-label="Bölümü aşağı taşı"
              onClick={() => demoActions.moveSection(analysisId, section.id, "down")}>
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Bu bölümden gereksinim ekle" title="Bu bölümden gereksinim ekle"
              onClick={() => onAddRequirement(section.id)}>
              <ListPlus />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Bölümü sil" onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive">
              <Trash2 />
            </Button>
          </div>
        </div>

        {section.kind === "text" && (
          <Textarea
            aria-label={`${section.title} içeriği`}
            value={section.content}
            rows={3}
            placeholder="Bu bölümün içeriğini yazın…"
            onChange={(e) => save({ ...section, content: e.target.value })}
          />
        )}

        {section.kind === "list" && (
          <div className="flex flex-col gap-1">
            <Textarea
              aria-label={`${section.title} maddeleri`}
              value={section.items.join("\n")}
              rows={Math.max(3, section.items.length + 1)}
              placeholder="Her satıra bir madde yazın"
              onChange={(e) => save({ ...section, items: e.target.value.split("\n") })}
            />
            <span className="text-[11px] text-muted-foreground">
              Her satır bir madde olarak kaydedilir; boş satırlar bölümden çıkınca temizlenir.
            </span>
          </div>
        )}

        {section.kind === "checklist" && <ChecklistEditor section={section} save={save} />}
      </CardContent>
    </Card>
  );
}

function ChecklistEditor({
  section,
  save,
}: {
  section: Extract<AnalysisSection, { kind: "checklist" }>;
  save: (s: AnalysisSection) => void;
}) {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const text = draft.trim();
    if (!text) return;
    save({ ...section, items: [...section.items, { id: createId(), text, done: false }] });
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      {section.items.length === 0 && <p className="text-xs text-muted-foreground">Henüz madde yok.</p>}
      <ul className="flex flex-col gap-1.5">
        {section.items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              aria-label={`${item.text || "Madde"} tamamlandı`}
              onChange={(e) =>
                save({ ...section, items: section.items.map((i) => (i.id === item.id ? { ...i, done: e.target.checked } : i)) })
              }
              className="size-4 shrink-0 accent-(--primary)"
            />
            <Input
              value={item.text}
              aria-label="Madde metni"
              onChange={(e) =>
                save({ ...section, items: section.items.map((i) => (i.id === item.id ? { ...i, text: e.target.value } : i)) })
              }
              className={item.done ? "h-8 text-muted-foreground line-through" : "h-8"}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Maddeyi kaldır"
              onClick={() => save({ ...section, items: section.items.filter((i) => i.id !== item.id) })}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder="Yeni madde ekle"
          aria-label="Yeni madde"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="h-8"
        />
        <Button variant="outline" size="sm" onClick={addItem} disabled={!draft.trim()}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Ekle
        </Button>
      </div>
    </div>
  );
}
