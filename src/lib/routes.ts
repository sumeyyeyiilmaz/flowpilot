/** Analiz çalışma alanı adresi: /talepler/analiz?talep=…[&analiz=…] */
export function analysisHref(requestId: string, analysisId?: string) {
  const params = new URLSearchParams({ talep: requestId });
  if (analysisId) params.set("analiz", analysisId);
  return `/talepler/analiz?${params.toString()}`;
}
