"use client";

import { useState } from "react";
import type { Sprint } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { CHART_VARS, niceScale, useElementWidth } from "./chart-utils";

const HEIGHT = 220;
const M = { top: 20, right: 12, bottom: 30, left: 36 };
const BAR = 22;
const GAP = 2;

type Row = { sprint: Sprint; committed: number; completed: number };
type Props = { rows: Row[]; average: number };

/** Velocity: tamamlanan sprintlerde taahhüt edilen ve tamamlanan Story Point (yalnızca kapanış özetleri). */
export function VelocityChart({ rows, average }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ index: number; series: "committed" | "completed" } | null>(null);

  const innerW = width - M.left - M.right;
  const innerH = HEIGHT - M.top - M.bottom;
  const { max, step } = niceScale(Math.max(...rows.map((r) => Math.max(r.committed, r.completed)), 1));
  const y = (v: number) => M.top + innerH - (v / max) * innerH;
  const band = innerW / rows.length;
  const groupX = (i: number) => M.left + band * i + band / 2;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  // Üstü 4px yuvarlak, tabanı düz çubuk.
  const bar = (cx: number, value: number) => {
    const top = y(value), base = y(0), w = BAR, r = Math.min(4, (base - top) / 2);
    return `M${cx - w / 2},${base}V${top + r}Q${cx - w / 2},${top} ${cx - w / 2 + r},${top}H${cx + w / 2 - r}Q${cx + w / 2},${top} ${cx + w / 2},${top + r}V${base}Z`;
  };
  const tip = hover ? rows[hover.index] : null;

  return (
    <div className={cn("flex flex-col gap-3", CHART_VARS)}>
      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Lejant">
        <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-(--viz-1)" aria-hidden="true" />Taahhüt</li>
        <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-(--viz-2)" aria-hidden="true" />Tamamlanan</li>
        <li className="inline-flex items-center gap-1.5"><span className="w-4 border-t border-foreground/50" aria-hidden="true" />Ortalama (tamamlanan)</li>
      </ul>
      <div ref={ref} className="relative w-full">
        <svg width={width} height={HEIGHT} role="img" className="block overflow-visible"
          aria-label={`Velocity grafiği: ${rows.length} tamamlanan sprint, ortalama ${average} SP. Değerler tablo görünümünde de var.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">{t}</text>
            </g>
          ))}
          {rows.map((row, i) => {
            const cx = groupX(i);
            const left = cx - BAR / 2 - GAP / 2, right = cx + BAR / 2 + GAP / 2;
            return (
              <g key={row.sprint.id} data-velocity-sprint={row.sprint.code}>
                {row.committed > 0 && (
                  <path d={bar(left, row.committed)} fill="var(--viz-1)" tabIndex={0} role="img"
                    aria-label={`${row.sprint.code} taahhüt ${row.committed} SP`} className="outline-none focus-visible:opacity-80"
                    onPointerEnter={() => setHover({ index: i, series: "committed" })} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover({ index: i, series: "committed" })} onBlur={() => setHover(null)} />
                )}
                {row.completed > 0 && (
                  <path d={bar(right, row.completed)} fill="var(--viz-2)" tabIndex={0} role="img"
                    aria-label={`${row.sprint.code} tamamlanan ${row.completed} SP`} className="outline-none focus-visible:opacity-80"
                    onPointerEnter={() => setHover({ index: i, series: "completed" })} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover({ index: i, series: "completed" })} onBlur={() => setHover(null)} />
                )}
                <text x={right} y={y(row.completed) - 6} textAnchor="middle" className="fill-foreground text-[11px] font-medium tabular-nums">{row.completed}</text>
                <text x={cx} y={HEIGHT - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">{row.sprint.code}</text>
              </g>
            );
          })}
          {rows.length > 0 && (
            <g pointerEvents="none">
              <line x1={M.left} x2={width - M.right} y1={y(average)} y2={y(average)} className="stroke-foreground/50" strokeWidth={1} />
              {/* Etiket eksen yanında (çubuk gruplarının boş kenarında) durur; çubuk etiketleriyle çakışmaz. */}
              <text x={M.left + 4} y={y(average) - 5} textAnchor="start" className="fill-muted-foreground text-[11px] tabular-nums">Ort. {average.toLocaleString("tr-TR")} SP</text>
            </g>
          )}
        </svg>
        {tip && hover && (
          <div role="status" className="pointer-events-none absolute top-0 z-10 min-w-40 rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md"
            style={{ left: Math.min(Math.max(groupX(hover.index) - 80, 0), width - 170) }}>
            <p className="mb-1 font-medium">{tip.sprint.code} · {tip.sprint.name}</p>
            <p className="flex justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-sm bg-(--viz-1)" aria-hidden="true" />Taahhüt</span><strong className="tabular-nums">{tip.committed} SP</strong></p>
            <p className="flex justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="size-2 rounded-sm bg-(--viz-2)" aria-hidden="true" />Tamamlanan</span><strong className="tabular-nums">{tip.completed} SP</strong></p>
          </div>
        )}
      </div>
      <details className="text-xs">
        <summary className="w-fit cursor-pointer text-muted-foreground hover:text-foreground">Tablo görünümü</summary>
        <table className="mt-2 w-full rounded-md border text-left tabular-nums">
          <thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-2 py-1 font-medium">Sprint</th><th className="px-2 py-1 font-medium">Taahhüt</th><th className="px-2 py-1 font-medium">Tamamlanan</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.sprint.id} className="border-t"><td className="px-2 py-1">{r.sprint.code} · {r.sprint.name}</td><td className="px-2 py-1">{r.committed} SP</td><td className="px-2 py-1">{r.completed} SP</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}
