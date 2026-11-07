/** Sprint planlama adresi: /sprintler?proje=… */
export function sprintPlanningHref(projectId: string) {
  return `/sprintler?${new URLSearchParams({ proje: projectId }).toString()}`;
}

/** Analiz çalışma alanı adresi: /talepler/analiz?talep=…[&analiz=…] */
export function analysisHref(requestId: string, analysisId?: string) {
  const params = new URLSearchParams({ talep: requestId });
  if (analysisId) params.set("analiz", analysisId);
  return `/talepler/analiz?${params.toString()}`;
}
