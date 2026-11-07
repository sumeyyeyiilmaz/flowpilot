"use client";

/**
 * Demo store: tarayıcıda çalışan, sentetik veriyi tutan basit dış (external) store.
 *
 * - React'e `useSyncExternalStore` ile bağlanır. Sunucu ve ilk hidrasyon her zaman
 *   başlangıç verisini (seed) kullanır; tarayıcıdaki kayıtlı veri hidrasyondan sonra
 *   devreye girer. Böylece hidrasyon uyumsuzluğu oluşmaz.
 * - Her değişiklik tarayıcıya kaydedilir ve diğer sekmelerle eşitlenir.
 * - Kayıt durumu (`useDemoStorageStatus`) bileşenlere bildirilir: kaydedilemeyen
 *   değişiklik "kaydedildi" gibi gösterilmez.
 * - Okunamayan kayıtlı veri silinmez veya üzerine yazılmaz: yedeklenir, store
 *   "kurtarma" moduna geçer ve sıfırlama yalnızca kullanıcının açık eylemiyle yapılır.
 * - Veritabanı, API veya harici servis kullanılmaz.
 */
import { useSyncExternalStore } from "react";
import type { AnalysisSection, DemoState, SectionKind, WorkItemStatus } from "../domain/types";
import {
  demoReducer,
  normalizeDemoState,
  type ActionMeta,
  type AnalysisChanges,
  type RequirementChanges,
  type DemoAction,
  type NewAnalysisInput,
  type NewRequestInput,
  type NewRequirementInput,
  type RequestChanges,
} from "./reducer";
import {
  agileReducer,
  isAgileAction,
  type AgileAction,
  type DailyScrumInput,
  type NewSprintInput,
  type NewWorkItemInput,
  type SprintChanges,
  type WorkItemChanges,
} from "./agile-reducer";
import { createSeedState } from "./seed";
import {
  clearDemoStorage,
  DEMO_STORAGE_KEY,
  deleteBackup,
  listBackups,
  readBackup,
  readCurrentRaw,
  readDemoStorage,
  writeDemoStorage,
  type BackupInfo,
  type BackupOutcome,
  type StorageReadResult,
  type StorageWriteResult,
} from "./storage";

/* ------------------------------------------------------------------ */
/* Kayıt durumu                                                        */
/* ------------------------------------------------------------------ */

export type DemoStorageStatus =
  /** Değişiklikler tarayıcıya kaydediliyor. */
  | { kind: "ok" }
  /** Kayıtlı veri okunamadı; veri korunuyor, değişiklikler kaydedilmiyor. */
  | { kind: "recovery"; problem: string; backup: BackupOutcome }
  /** Tarayıcı depolamasına erişilemiyor; değişiklikler kaydedilmiyor. */
  | { kind: "unavailable" }
  /** Son değişiklik kaydedilemedi (ör. depolama dolu). */
  | { kind: "save-error" };

const OK_STATUS: DemoStorageStatus = { kind: "ok" };

/* ------------------------------------------------------------------ */
/* Store çekirdeği                                                     */
/* ------------------------------------------------------------------ */

/** Sunucu ve hidrasyon için sabit başlangıç verisi. */
const SERVER_SNAPSHOT: DemoState = createSeedState();

let clientState: DemoState | null = null;
let status: DemoStorageStatus = OK_STATUS;
const listeners = new Set<() => void>();

/** Okuma sonucuna göre state ve durumu belirler. Bozuk veride depolamaya yazma yapılmaz. */
function applyReadResult(result: StorageReadResult) {
  switch (result.kind) {
    case "ok":
      clientState = normalizeDemoState(result.state);
      status = OK_STATUS;
      break;
    case "empty":
      clientState = createSeedState();
      status = OK_STATUS;
      break;
    case "invalid":
      clientState = createSeedState();
      status = { kind: "recovery", problem: result.problem, backup: result.backup };
      break;
    case "unavailable":
      clientState = createSeedState();
      status = { kind: "unavailable" };
      break;
  }
}

function getClientState(): DemoState {
  if (clientState === null) applyReadResult(readDemoStorage());
  return clientState as DemoState;
}

function getStatus(): DemoStorageStatus {
  getClientState();
  return status;
}

function emit() {
  for (const listener of listeners) listener();
}

function statusForWrite(result: StorageWriteResult): DemoStorageStatus {
  if (result.ok) return OK_STATUS;
  return result.reason === "unavailable" ? { kind: "unavailable" } : { kind: "save-error" };
}

/** Mevcut state'i depolamaya yazar ve durumu günceller. Kurtarma modunda yazmaz. */
function persist(state: DemoState): StorageWriteResult | null {
  // Kurtarma modunda okunamayan veri korunur: üzerine yazılmaz.
  if (status.kind === "recovery") return null;
  const result = writeDemoStorage(state);
  const nextStatus = statusForWrite(result);
  if (nextStatus.kind !== status.kind) status = nextStatus;
  return result;
}

function setClientState(next: DemoState) {
  if (next === clientState) return;
  clientState = next;
  persist(next);
  emit();
}

function onStorage(event: StorageEvent) {
  // Başka bir sekmede yapılan değişiklikleri (veya sıfırlamayı) al.
  if (event.key !== DEMO_STORAGE_KEY && event.key !== null) return;
  applyReadResult(readDemoStorage());
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** Yeni kayıt/öğe kimliği (ör. kontrol listesi maddeleri için). */
export function createId(): string {
  return newId();
}

function newId(): string {
  // randomUUID yalnızca güvenli bağlamlarda (https, localhost) vardır; diğer durumlar için yedek.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMeta(): ActionMeta {
  return { now: new Date().toISOString(), newId };
}

/** Agile işlemleri agile reducer'a, diğerleri mevcut demo reducer'a yönlendirilir. */
function dispatch(action: DemoAction | AgileAction) {
  const current = getClientState();
  setClientState(isAgileAction(action) ? agileReducer(current, action) : demoReducer(current, action));
}

/** İşlem state'i değiştirdiyse true döndürür (geçersiz işlem state'i değiştirmez). */
function dispatchChanged(action: DemoAction | AgileAction): boolean {
  const before = getClientState();
  dispatch(action);
  return getClientState() !== before;
}

/** Son eklenen kaydın kimliğini döndürmek için yardımcı. */
function dispatchAndGetNewId<K extends "requests" | "analyses" | "requirements" | "workItems" | "sprints">(
  collection: K,
  action: DemoAction | AgileAction
): string | null {
  const before = getClientState()[collection].length;
  dispatch(action);
  const after = getClientState()[collection];
  return after.length > before ? after[after.length - 1].id : null;
}

/* ------------------------------------------------------------------ */
/* React hook'ları                                                     */
/* ------------------------------------------------------------------ */

/** Demo verisinin tamamı. Değişikliklerde bileşen yeniden çizilir. */
export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getClientState, () => SERVER_SNAPSHOT);
}

/** Tarayıcıya kayıt durumu. Sunucuda ve hidrasyonda "ok". */
export function useDemoStorageStatus(): DemoStorageStatus {
  return useSyncExternalStore(subscribe, getStatus, () => OK_STATUS);
}

const noopSubscribe = () => () => {};

/**
 * Tarayıcıdaki kayıtlı verinin yüklenip yüklenmediği.
 * Sunucuda ve hidrasyon sırasında `false`, sonrasında `true` döner.
 */
export function useDemoHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/* ------------------------------------------------------------------ */
/* İşlemler                                                            */
/* ------------------------------------------------------------------ */

export const demoActions = {
  /** Yeni talep oluşturur; oluşan talebin kimliğini ve kodunu döndürür. */
  createRequest(input: NewRequestInput): { id: string; code: string } | null {
    const id = dispatchAndGetNewId("requests", { type: "request/create", meta: createMeta(), input });
    const created = id ? getClientState().requests.find((r) => r.id === id) : undefined;
    return created ? { id: created.id, code: created.code } : null;
  },

  /** Talebi günceller; değişiklik uygulandıysa true döndürür. */
  updateRequest(requestId: string, changes: RequestChanges): boolean {
    const before = getClientState();
    dispatch({ type: "request/update", meta: createMeta(), requestId, changes });
    return getClientState() !== before;
  },

  /** Yeni analiz oluşturur; önceki analizler korunur. Oluşan analizin kimliğini döndürür. */
  createAnalysis(input: NewAnalysisInput): string | null {
    return dispatchAndGetNewId("analyses", { type: "analysis/create", meta: createMeta(), input });
  },

  updateAnalysis(analysisId: string, changes: AnalysisChanges) {
    dispatch({ type: "analysis/update", meta: createMeta(), analysisId, changes });
  },

  addSection(analysisId: string, title: string, kind: SectionKind, index?: number) {
    dispatch({ type: "section/add", meta: createMeta(), analysisId, title, kind, index });
  },

  updateSection(analysisId: string, section: AnalysisSection) {
    dispatch({ type: "section/update", meta: createMeta(), analysisId, section });
  },

  removeSection(analysisId: string, sectionId: string) {
    dispatch({ type: "section/remove", meta: createMeta(), analysisId, sectionId });
  },

  moveSection(analysisId: string, sectionId: string, direction: "up" | "down") {
    dispatch({ type: "section/move", meta: createMeta(), analysisId, sectionId, direction });
  },

  /** Yeni gereksinim oluşturur; oluşan gereksinimin kimliğini döndürür. */
  createRequirement(input: NewRequirementInput): string | null {
    return dispatchAndGetNewId("requirements", { type: "requirement/create", meta: createMeta(), input });
  },

  /** Gereksinimi günceller; değişiklik uygulandıysa true döndürür. */
  updateRequirement(requirementId: string, changes: RequirementChanges): boolean {
    const before = getClientState();
    dispatch({ type: "requirement/update", meta: createMeta(), requirementId, changes });
    return getClientState() !== before;
  },

  /* ---------------- Agile / Sprint ---------------- */

  /** Product Backlog'a yeni iş alır; oluşan işin kimliğini döndürür (geçersizse null). */
  createWorkItem(input: NewWorkItemInput): string | null {
    return dispatchAndGetNewId("workItems", { type: "workItem/create", meta: createMeta(), input });
  },

  updateWorkItem(workItemId: string, changes: WorkItemChanges): boolean {
    return dispatchChanged({ type: "workItem/update", meta: createMeta(), workItemId, changes });
  },

  rankWorkItem(workItemId: string, direction: "up" | "down"): boolean {
    return dispatchChanged({ type: "workItem/rank", meta: createMeta(), workItemId, direction });
  },

  addWorkItemToSprint(workItemId: string, sprintId: string): boolean {
    return dispatchChanged({ type: "workItem/addToSprint", meta: createMeta(), workItemId, sprintId });
  },

  removeWorkItemFromSprint(workItemId: string): boolean {
    return dispatchChanged({ type: "workItem/removeFromSprint", meta: createMeta(), workItemId });
  },

  setWorkItemStatus(workItemId: string, status: WorkItemStatus): boolean {
    return dispatchChanged({ type: "workItem/setStatus", meta: createMeta(), workItemId, status });
  },

  /** Yeni sprint oluşturur (Planlandı); oluşan sprintin kimliğini döndürür (geçersizse null). */
  createSprint(input: NewSprintInput): string | null {
    return dispatchAndGetNewId("sprints", { type: "sprint/create", meta: createMeta(), input });
  },

  updateSprint(sprintId: string, changes: SprintChanges): boolean {
    return dispatchChanged({ type: "sprint/update", meta: createMeta(), sprintId, changes });
  },

  startSprint(sprintId: string): boolean {
    return dispatchChanged({ type: "sprint/start", meta: createMeta(), sprintId });
  },

  completeSprint(sprintId: string): boolean {
    return dispatchChanged({ type: "sprint/complete", meta: createMeta(), sprintId });
  },

  /** Daily Scrum kaydı ekler veya (sprint + kişi + tarih aynıysa) günceller. */
  upsertDailyScrum(input: DailyScrumInput): boolean {
    return dispatchChanged({ type: "daily/upsert", meta: createMeta(), input });
  },

  /* ---------------- Analiz temizliği ---------------- */

  /** Analizdeki boş başlık/madde ve boşlukları temizler (geçerli içerik korunur). */
  normalizeAnalysis(analysisId: string) {
    dispatch({ type: "analysis/normalize", meta: createMeta(), analysisId });
  },

  /** Tek bölümü temizler. */
  normalizeSection(analysisId: string, sectionId: string) {
    dispatch({ type: "section/normalize", meta: createMeta(), analysisId, sectionId });
  },

  /**
   * Kullanıcının açık eylemiyle demo verisini siler ve başlangıç verisine döner.
   * Okunamayan verinin yedeği (varsa) korunur. Silme başarılıysa true döndürür.
   */
  resetDemoData(): boolean {
    const result = clearDemoStorage();
    clientState = createSeedState();
    status = result.ok ? OK_STATUS : { kind: "unavailable" };
    emit();
    return result.ok;
  },

  /** Kayıtlı veriyi yeniden okumayı dener (ör. kurtarma modunda). */
  retryLoad() {
    applyReadResult(readDemoStorage());
    emit();
  },

  /**
   * Kayıt hatası sonrası mevcut store verisini tarayıcıya yeniden yazar.
   * Kurtarma modunda okunamayan veriyi korumak için yazmaz ve "recovery" döndürür.
   */
  retrySave(): "saved" | "failed" | "recovery" {
    if (status.kind === "recovery") return "recovery";
    const result = persist(getClientState());
    emit();
    return result?.ok ? "saved" : "failed";
  },

  /** Ana anahtardaki mevcut kayıtlı ham veri (yedeklere bakmaz). */
  getCurrentRawData(): string | null {
    return readCurrentRaw();
  },

  /** Mevcut yedekler, en yeniden eskiye. */
  listBackups(): BackupInfo[] {
    return listBackups();
  },

  /** Belirtilen yedeğin ham verisi (yalnızca yedek anahtarları okunur). */
  readBackup(key: string): string | null {
    return readBackup(key);
  },

  /** Yedeği siler. Yalnızca kullanıcının açık onayından sonra çağrılmalıdır. */
  deleteBackup(key: string): boolean {
    return deleteBackup(key);
  },
};
