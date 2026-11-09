"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import type { BurndownPoint } from "@/lib/demo/agile-selectors";
import { cn } from "@/lib/utils";
import { CHART_VARS, longDay, niceScale, shortDay, useElementWidth } from "./chart-utils";

const HEIGHT = 240;
const M = { top: 16, right: 16, bottom: 28, left: 36 };

type Props = { points: BurndownPoint[]; total: number };

/** Burndown: kalan Story Point (gerçek, bugüne kadar) ve ideal çizgi. Gelecek günler çizilmez. */
export function BurndownChart({ points, total }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const innerW = width - M.left - M.right;
  const innerH = HEIGHT - M.top - M.bottom;
  const { max, step } = niceScale(total);
  const x = (i: number) => M.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => M.top + innerH - (v / max) * innerH;
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70))));

  const actual = points.map((p, i) => ({ ...p, i })).filter((p) => p.remaining !== null);
  const last = actual.at(-1);
  const idealPath = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.ideal)}`).join("");
  const actualPath = actual.map((p, k) => `${k ? "L" : "M"}${x(p.i)},${y(p.remaining!)}`).join("");

  const pick = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * innerW;
    setActive(Math.max(0, Math.min(points.length - 1, Math.round((rel / innerW) * (points.length - 1)))));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === "ArrowRight") setActive((a) => Math.min(points.length - 1, (a ?? -1) + 1));
    else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? points.length) - 1));
    else return;
    e.preventDefault();
  };
  const tip = active !== null ? points[active] : null;

  return (
    <div className={cn("flex flex-col gap-3", CHART_VARS)}>
      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Lejant">
        <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded-full bg-(--viz-1)" aria-hidden="true" />Kalan (gerçekleşen)</li>
        <li className="inline-flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-muted-foreground/60" aria-hidden="true" />İdeal</li>
      </ul>

      <div ref={ref} className="relative w-full">
        <svg width={width} height={HEIGHT} role="img" tabIndex={0} onKeyDown={onKey} onBlur={() => setActive(null)}
          aria-label={`Burndown grafiği: toplam ${total} SP${last ? `, son ölçüm ${shortDay(last.date)} günü ${last.remaining} SP kalan` : ""}. Değerler tablo görünümünde de var; ok tuşlarıyla günler arasında gezinebilirsiniz.`}
          className="block overflow-visible rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">{t}</text>
            </g>
          ))}
          {/* Son gün her zaman etiketlenir; ona çok yakın ara etiketler çakışmasın diye atlanır. */}
          {points.map((p, i) => (i === points.length - 1 || (i % labelEvery === 0 && points.length - 1 - i >= labelEvery)) && (
            <text key={p.date} x={x(i)} y={HEIGHT - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
              className="fill-muted-foreground text-[11px]">{shortDay(p.date)}</text>
          ))}
          <path d={idealPath} fill="none" className="stroke-muted-foreground/60" strokeWidth={1.5} strokeDasharray="5 4" />
          {actual.length > 1 && <path d={actualPath} fill="none" stroke="var(--viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {last && (
            <g>
              <circle cx={x(last.i)} cy={y(last.remaining!)} r={5} fill="var(--viz-1)" className="stroke-card" strokeWidth={2} />
              <text x={x(last.i)} y={y(last.remaining!) - 12} textAnchor={last.i > points.length * 0.75 ? "end" : "middle"}
                className="fill-foreground text-[11px] font-medium tabular-nums">{last.remaining} SP</text>
            </g>
          )}
          {tip && active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + innerH} className="stroke-foreground/40" strokeWidth={1} />
              {tip.remaining !== null && <circle cx={x(active)} cy={y(tip.remaining)} r={4} fill="var(--viz-1)" className="stroke-card" strokeWidth={2} />}
            </g>
          )}
          <rect x={M.left} y={M.top} width={innerW} height={innerH} fill="transparent" onPointerMove={pick} onPointerLeave={() => setActive(null)} />
        </svg>

        {tip && active !== null && (
          <div role="status" className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-md border bg-popover px-2.5 py-2 text-xs shadow-md"
            style={{ left: Math.min(Math.max(x(active) - 72, 0), width - 150) }}>
            <p className="mb-1 font-medium">{longDay(tip.date)}</p>
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="h-0.5 w-3 bg-(--viz-1)" aria-hidden="true" />Kalan</span>
              <strong className="tabular-nums">{tip.remaining === null ? "henüz veri yok" : `${tip.remaining} SP`}</strong>
            </p>
            <p className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><span className="w-3 border-t border-dashed border-muted-foreground" aria-hidden="true" />İdeal</span>
              <strong className="tabular-nums">{tip.ideal} SP</strong>
            </p>
          </div>
        )}
      </div>

      <details className="text-xs">
        <summary className="w-fit cursor-pointer text-muted-foreground hover:text-foreground">Tablo görünümü</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-md border">
          <table className="w-full text-left tabular-nums">
            <thead className="bg-muted/60 text-muted-foreground"><tr><th className="px-2 py-1 font-medium">Gün</th><th className="px-2 py-1 font-medium">Kalan</th><th className="px-2 py-1 font-medium">İdeal</th></tr></thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.date} className="border-t"><td className="px-2 py-1">{longDay(p.date)}</td><td className="px-2 py-1">{p.remaining === null ? "—" : `${p.remaining} SP`}</td><td className="px-2 py-1">{p.ideal} SP</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
