import Link from "next/link";
import { FileText, Inbox } from "lucide-react";
import { analysisHref } from "@/lib/routes";
import { PriorityBadge, RequestStatusBadge, RequestTypeBadge } from "@/components/common/status-badges";
import type { WorkRequest } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const GRID = "md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_8rem_5.5rem_6rem] md:items-center md:gap-4";

type Props = {
  requests: WorkRequest[];
  emptyMessage: string;
  /** Boş durumda gösterilecek ek içerik (ör. "Filtreleri temizle"). */
  emptyAction?: React.ReactNode;
  /** Verilirse başlık bir butona dönüşür ve satır seçilebilir olur (ör. düzenleme). */
  onSelect?: (request: WorkRequest) => void;
  /** Verilirse alt satırda proje adı gösterilir. */
  projectNames?: Record<string, string>;
  /** Vurgulanacak satır (ör. son kaydedilen talep). */
  highlightId?: string | null;
  /** Verilirse her satırda analiz çalışma alanına bağlantı ve analiz sayısı gösterilir. */
  analysisCounts?: Record<string, number>;
};

/** Talep satırları. Masaüstünde tablo düzeni, mobilde alt alta kartlar. */
export function RequestList({
  requests,
  emptyMessage,
  emptyAction,
  onSelect,
  projectNames,
  highlightId,
  analysisCounts,
}: Props) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div role="table" aria-label="Talepler" className="flex flex-col">
      <div
        role="row"
        className={`hidden border-b pb-2 text-xs font-medium text-muted-foreground ${GRID}`}
      >
        <span role="columnheader">Talep</span>
        <span role="columnheader">Tür</span>
        <span role="columnheader">Durum</span>
        <span role="columnheader">Öncelik</span>
        <span role="columnheader" className="text-right">
          Güncelleme
        </span>
      </div>
      {requests.map((request) => {
        const subtitle = [request.code, projectNames?.[request.projectId] ?? request.requester].join(" · ");
        return (
          <div
            key={request.id}
            role="row"
            data-request-id={request.id}
            onClick={onSelect ? () => onSelect(request) : undefined}
            className={cn(
              `flex flex-col gap-2 border-b py-3.5 last:border-b-0 md:py-3 ${GRID}`,
              onSelect && "-mx-2 cursor-pointer rounded-lg px-2 hover:bg-muted/50",
              highlightId === request.id && "bg-primary/5 ring-1 ring-primary/30"
            )}
          >
            <div role="cell" className="min-w-0">
              {onSelect ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(request);
                  }}
                  className="block max-w-full truncate rounded text-left text-sm font-medium outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`${request.code} ${request.title} talebini düzenle`}
                >
                  {request.title}
                </button>
              ) : (
                <p className="truncate text-sm font-medium">{request.title}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              {analysisCounts && (
                <Link
                  href={analysisHref(request.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 inline-flex items-center gap-1 rounded text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`${request.code} analizleri (${analysisCounts[request.id] ?? 0})`}
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  Analizler ({analysisCounts[request.id] ?? 0})
                </Link>
              )}
            </div>
            <div role="cell" className="flex flex-wrap items-center gap-1.5 md:contents">
              <span className="md:block">
                <RequestTypeBadge type={request.type} short />
              </span>
              <span className="md:block">
                <RequestStatusBadge status={request.status} />
              </span>
              <span className="md:block">
                <PriorityBadge priority={request.priority} />
              </span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums md:ml-0 md:text-right">
                {formatShortDate(request.updatedAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
