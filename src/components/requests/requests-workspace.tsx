"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { SaveNotice } from "@/components/common/save-notice";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoState } from "@/lib/demo/store";
import { REQUEST_STATUSES, type RequestStatus, type RequestType, type WorkRequest } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { RequestFormDialog, type RequestFormResult } from "./request-form-dialog";
import { RequestList } from "./request-list";

type TypeFilter = "all" | RequestType;

const selectClass =
  "h-8 min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function RequestsWorkspace() {
  const state = useDemoState();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [query, setQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkRequest | null>(null);
  const [notice, setNotice] = useState<RequestFormResult | null>(null);

  const projectNames = useMemo(
    () => Object.fromEntries(state.projects.map((p) => [p.id, p.name])),
    [state.projects]
  );

  const analysisCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of state.analyses) counts[a.requestId] = (counts[a.requestId] ?? 0) + 1;
    return counts;
  }, [state.analyses]);

  const sorted = useMemo(
    () => [...state.requests].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.requests]
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const filtered = sorted.filter(
    (r) =>
      (typeFilter === "all" || r.type === typeFilter) &&
      (!projectFilter || r.projectId === projectFilter) &&
      (!statusFilter || r.status === statusFilter) &&
      (!normalizedQuery ||
        `${r.code} ${r.title} ${r.description}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
  );

  const counts = {
    all: state.requests.length,
    new: state.requests.filter((r) => r.type === "new").length,
    change: state.requests.filter((r) => r.type === "change").length,
  };
  const hasFilters = typeFilter !== "all" || !!projectFilter || !!statusFilter || !!normalizedQuery;

  const clearFilters = () => {
    setTypeFilter("all");
    setProjectFilter("");
    setStatusFilter("");
    setQuery("");
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (request: WorkRequest) => {
    setEditing(request);
    setDialogOpen(true);
  };

  const handleSaved = (result: RequestFormResult) => {
    setDialogOpen(false);
    setNotice(result);
    // Yeni kayıt filtreler yüzünden gizlenmesin.
    if (result.mode === "create") clearFilters();
  };

  return (
    <>
      <PageHeader title="Talepler" description="Yeni iş taleplerini ve mevcut sistem değişikliklerini yönetin.">
        <Button onClick={openCreate}>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Yeni talep
        </Button>
      </PageHeader>

      <div role="status" aria-live="polite" className="empty:hidden">
        {notice && (
          <div className="mb-4">
            <SaveNotice
              onDismiss={() => setNotice(null)}
              message={
                <>
                  <strong className="font-semibold">{notice.code}</strong>{" "}
                  {notice.mode === "create" ? "oluşturuldu." : "güncellendi."}
                </>
              }
            />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Talep türü filtresi"
              className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1"
            >
              {(
                [
                  { value: "all", label: "Tümü", count: counts.all },
                  { value: "new", label: "Yeni İş", count: counts.new },
                  { value: "change", label: "Değişiklik", count: counts.change },
                ] as const
              ).map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={typeFilter === f.value ? "outline" : "ghost"}
                  aria-pressed={typeFilter === f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(typeFilter === f.value ? "bg-background shadow-xs" : "text-muted-foreground")}
                >
                  {f.label}
                  <span className="text-muted-foreground tabular-nums">{f.count}</span>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <div className="relative col-span-2 sm:w-56">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kod veya başlık ara…"
                  aria-label="Taleplerde ara"
                  className="h-8 pl-8"
                />
              </div>
              <select
                aria-label="Proje filtresi"
                className={selectClass}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">Tüm projeler</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Durum filtresi"
                className={selectClass}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
              >
                <option value="">Tüm durumlar</option>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            {filtered.length} / {state.requests.length} talep gösteriliyor
          </p>

          <RequestList
            requests={filtered}
            projectNames={projectNames}
            analysisCounts={analysisCounts}
            onSelect={openEdit}
            highlightId={notice?.id}
            emptyMessage={hasFilters ? "Filtrelerle eşleşen talep bulunamadı." : "Henüz talep yok. İlk talebi oluşturun."}
            emptyAction={
              hasFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Filtreleri temizle
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Yeni talep
                </Button>
              )
            }
          />
        </CardContent>
      </Card>

      <RequestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={editing}
        defaultProjectId={projectFilter || undefined}
        onSaved={handleSaved}
      />
    </>
  );
}
