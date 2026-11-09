"use client";

import { useEffect, useRef, useState } from "react";

/** Grafik renkleri (veri görselleştirme paleti; açık/koyu tema için doğrulandı). */
export const CHART_VARS =
  "[--viz-1:#2a78d6] [--viz-2:#eb6834] dark:[--viz-1:#3987e5] dark:[--viz-2:#d95926]";

/** Kabın genişliğini izler; grafik piksel ölçüsüyle çizilir (mobilde yazı küçülmez). */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** 0'dan başlayan, okunaklı eksen üst sınırı ve aralığı. */
export function niceScale(max: number, targetTicks = 4) {
  if (max <= 0) return { max: 1, step: 1 };
  const raw = max / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? 10 * magnitude;
  return { max: Math.ceil(max / step) * step, step };
}

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const longDayFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "short", timeZone: "UTC" });
/** Takvim günü (YYYY-MM-DD) → "5 Kas" (UTC ile biçimlendirilir; gün kaymaz). */
export const shortDay = (day: string) => dayFormatter.format(new Date(`${day}T00:00:00Z`));
export const longDay = (day: string) => longDayFormatter.format(new Date(`${day}T00:00:00Z`));
