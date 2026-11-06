"use client";

import { Link2, Link2Off, Plus } from "lucide-react";
import { MoscowBadge, RequirementStatusBadge } from "@/components/common/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Analysis, Requirement } from "@/lib/domain/types";

type Props = {
  analysis: Analysis;
  requirements: Requirement[];
  requestRequirementCount: number;
  onAdd: () => void;
  onEdit: (requirement: Requirement) => void;
};

export function RequirementsPanel({ analysis, requirements, requestRequirementCount, onAdd, onEdit }: Props) {
  const sectionTitle = (id: string | null) => {
    if (!id) return null;
    const index = analysis.sections.findIndex((s) => s.id === id);
    return index === -1 ? null : `${index + 1}. ${analysis.sections[index].title || "Adsız bölüm"}`;
  };
  const otherCount = requestRequirementCount - requirements.length;

  return (
    <Card size="sm" className="xl:sticky xl:top-20">
      <CardHeader>
        <CardTitle>Gereksinimler ({requirements.length})</CardTitle>
        <CardDescription>
          Bu analize bağlı gereksinimler
          {otherCount > 0 && ` · talebin diğer analizlerinde ${otherCount} gereksinim daha var`}
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Ekle
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {requirements.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-5 text-center text-xs text-muted-foreground">
            Henüz gereksinim yok. “Ekle” ile veya bir bölümün <span className="font-medium">gereksinim</span> düğmesiyle oluşturun.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {requirements.map((r) => {
              const section = sectionTitle(r.sectionId);
              return (
                <li key={r.id} data-requirement-id={r.id}>
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="flex w-full flex-col gap-1.5 rounded-md py-2.5 text-left outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={`${r.code} ${r.title} gereksinimini düzenle`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">{r.code}</span>
                        <span className="block text-sm font-medium">{r.title}</span>
                      </span>
                      <MoscowBadge priority={r.priority} />
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <RequirementStatusBadge status={r.status} />
                      <span className="inline-flex items-center gap-1">
                        {section ? <Link2 className="size-3.5" aria-hidden="true" /> : <Link2Off className="size-3.5" aria-hidden="true" />}
                        {section ?? "Bölüme bağlı değil"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
