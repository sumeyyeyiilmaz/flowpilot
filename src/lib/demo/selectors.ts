/**
 * Demo verisi üzerinde ilişki sorguları. Hepsi saf fonksiyondur.
 */
import type { Analysis, DemoState, Requirement } from "../domain/types";

const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export const getProject = (state: DemoState, projectId: string) =>
  state.projects.find((p) => p.id === projectId);

export const getRequest = (state: DemoState, requestId: string) =>
  state.requests.find((r) => r.id === requestId);

export const getAnalysis = (state: DemoState, analysisId: string) =>
  state.analyses.find((a) => a.id === analysisId);

export const getRequestsByProject = (state: DemoState, projectId: string) =>
  state.requests.filter((r) => r.projectId === projectId).sort(byNewest);

/** Talebin analizleri, en yeniden eskiye. Önceki analizler de listelenir. */
export const getAnalysesByRequest = (state: DemoState, requestId: string): Analysis[] =>
  state.analyses.filter((a) => a.requestId === requestId).sort(byNewest);

export const getRequirementsByRequest = (state: DemoState, requestId: string): Requirement[] =>
  state.requirements.filter((r) => r.requestId === requestId);

export const getRequirementsByAnalysis = (state: DemoState, analysisId: string): Requirement[] =>
  state.requirements.filter((r) => r.analysisId === analysisId);

export const getTestCasesByRequirement = (state: DemoState, requirementId: string) =>
  state.testCases.filter((t) => t.requirementIds.includes(requirementId));

export const getTestRunsByTestCase = (state: DemoState, testCaseId: string) =>
  state.testRuns.filter((r) => r.testCaseId === testCaseId).sort((a, b) => b.executedAt.localeCompare(a.executedAt));

export const getDefectsByRequirement = (state: DemoState, requirementId: string) =>
  state.defects.filter((d) => d.requirementId === requirementId);

/** Bir projeye ait talep, analiz, gereksinim ve açık hata sayıları. */
export function getProjectStats(state: DemoState, projectId: string) {
  const requestIds = new Set(state.requests.filter((r) => r.projectId === projectId).map((r) => r.id));
  const requirementIds = new Set(state.requirements.filter((q) => requestIds.has(q.requestId)).map((q) => q.id));
  const projectRequests = state.requests.filter((r) => requestIds.has(r.id));
  return {
    requests: projectRequests.length,
    newWorkRequests: projectRequests.filter((r) => r.type === "new").length,
    changeRequests: projectRequests.filter((r) => r.type === "change").length,
    analyses: state.analyses.filter((a) => requestIds.has(a.requestId)).length,
    requirements: requirementIds.size,
    openDefects: state.defects.filter(
      (d) => d.requirementId && requirementIds.has(d.requirementId) && (d.status === "Açık" || d.status === "Atandı")
    ).length,
  };
}

/** Dashboard ve özet ekranlar için sayımlar. */
export function getDemoSummary(state: DemoState) {
  return {
    activeProjects: state.projects.filter((p) => p.status === "Aktif").length,
    requests: state.requests.length,
    newWorkRequests: state.requests.filter((r) => r.type === "new").length,
    changeRequests: state.requests.filter((r) => r.type === "change").length,
    analyses: state.analyses.length,
    requirements: state.requirements.length,
    testCases: state.testCases.length,
    openDefects: state.defects.filter((d) => d.status === "Açık" || d.status === "Atandı").length,
  };
}
