/**
 * SENTETİK AGILE BAŞLANGIÇ VERİSİ
 *
 * Ekip, sprint, iş ve Daily Scrum kayıtları kurgusaldır; gerçek kişi veya kurumla ilişkisi yoktur.
 * İzlenebilirlik bağlantıları mevcut sentetik proje/talep/analiz/gereksinim/hata kayıtlarına işaret eder.
 * Tarihler sabittir (sunucu ve tarayıcı aynı veriyi üretmelidir).
 *
 * Tamamlanan sprint özetleri işlerle tutarlıdır:
 * - SPR-001: taahhüt 10 (PBI-001:5, PBI-002:3, PBI-003:2), tamamlanan 8; PBI-003 sonraki sprinte taşındı.
 * - SPR-002: taahhüt 15 (PBI-003:2, PBI-004:8, PBI-005:3, PBI-006:2), tamamlanan 13; PBI-006 backlog'a döndü.
 */
import type { DailyScrumEntry, DemoState, Sprint, TeamMember, WorkItem } from "../domain/types";

export const AGILE_SEED_TEAM: TeamMember[] = [
  { id: "tm-1", name: "Elif A.", role: "İş Analisti" },
  { id: "tm-2", name: "Burak T.", role: "Ürün Sahibi" },
  { id: "tm-3", name: "Zeynep K.", role: "Test Uzmanı" },
  { id: "tm-4", name: "Can Y.", role: "Yazılım Geliştirici" },
  { id: "tm-5", name: "Deniz Ö.", role: "Yazılım Geliştirici" },
];

const AGILE_SEED_SPRINTS: Sprint[] = [
  {
    id: "spr-001",
    code: "SPR-001",
    projectId: "prj-101",
    name: "Sprint 1",
    goal: "Fatura listesinin temelini oluşturmak",
    startDate: "2026-10-05",
    endDate: "2026-10-16",
    status: "Tamamlandı",
    completedAt: "2026-10-16T15:00:00.000Z",
    summary: {
      committedPoints: 10,
      completedPoints: 8,
      completedItems: [
        { workItemId: "pbi-001", storyPoints: 5 },
        { workItemId: "pbi-002", storyPoints: 3 },
      ],
      carriedOverItemIds: ["pbi-003"],
    },
  },
  {
    id: "spr-002",
    code: "SPR-002",
    projectId: "prj-101",
    name: "Sprint 2",
    goal: "Çok faktörlü doğrulamanın tamamlanması",
    startDate: "2026-10-19",
    endDate: "2026-10-30",
    status: "Tamamlandı",
    completedAt: "2026-10-30T15:00:00.000Z",
    summary: {
      committedPoints: 15,
      completedPoints: 13,
      completedItems: [
        { workItemId: "pbi-003", storyPoints: 2 },
        { workItemId: "pbi-004", storyPoints: 8 },
        { workItemId: "pbi-005", storyPoints: 3 },
      ],
      carriedOverItemIds: ["pbi-006"],
    },
  },
  {
    id: "spr-003",
    code: "SPR-003",
    projectId: "prj-101",
    name: "Sprint 3",
    goal: "Fatura indirme ve doğrulama hatalarının giderilmesi",
    startDate: "2026-11-02",
    endDate: "2026-11-13",
    status: "Aktif",
  },
  {
    id: "spr-004",
    code: "SPR-004",
    projectId: "prj-101",
    name: "Sprint 4",
    goal: "Fatura bildirimleri ve erişilebilirlik",
    startDate: "2026-11-16",
    endDate: "2026-11-27",
    status: "Planlandı",
  },
  {
    id: "spr-005",
    code: "SPR-005",
    projectId: "prj-104",
    name: "Sipariş Sprint 1",
    goal: "Otomatik onayın ilk sürümü",
    startDate: "2026-11-16",
    endDate: "2026-11-27",
    status: "Planlandı",
  },
];

type ItemSeed = Omit<WorkItem, "createdAt" | "updatedAt" | "requirementIds" | "defectId" | "assigneeId"> &
  Partial<Pick<WorkItem, "requirementIds" | "defectId" | "assigneeId">> & { createdAt: string; updatedAt?: string };

const item = (seed: ItemSeed): WorkItem => ({
  requirementIds: [],
  defectId: null,
  assigneeId: null,
  ...seed,
  updatedAt: seed.updatedAt ?? seed.completedAt ?? seed.createdAt,
});

const AGILE_SEED_ITEMS: WorkItem[] = [
  // --- SPR-001 (tamamlandı)
  item({ id: "pbi-001", code: "PBI-001", projectId: "prj-101", type: "Story", title: "Fatura listesi servisi", description: "Son 24 aylık faturaları döndüren servis.", status: "Tamamlandı", rank: 1, storyPoints: 5, assigneeId: "tm-4", sprintId: "spr-001", requestId: "tlp-001", analysisId: "anl-001", requirementIds: ["req-001"], createdAt: "2026-10-02T08:00:00.000Z", completedAt: "2026-10-14T14:00:00.000Z" }),
  item({ id: "pbi-002", code: "PBI-002", projectId: "prj-101", type: "Story", title: "Fatura listesi ekranı", description: "Faturaların tarih sırasıyla listelendiği ekran.", status: "Tamamlandı", rank: 2, storyPoints: 3, assigneeId: "tm-5", sprintId: "spr-001", requestId: "tlp-001", analysisId: "anl-001", requirementIds: ["req-001"], createdAt: "2026-10-02T08:10:00.000Z", completedAt: "2026-10-16T10:00:00.000Z" }),
  // --- SPR-001'den taşındı, SPR-002'de tamamlandı
  item({ id: "pbi-003", code: "PBI-003", projectId: "prj-101", type: "Görev", title: "Fatura test verisinin hazırlanması", description: "Test ortamı için sentetik fatura verisi.", status: "Tamamlandı", rank: 3, storyPoints: 2, assigneeId: "tm-3", sprintId: "spr-002", requestId: "tlp-001", createdAt: "2026-10-02T08:20:00.000Z", completedAt: "2026-10-22T11:00:00.000Z" }),
  // --- SPR-002 (tamamlandı)
  item({ id: "pbi-004", code: "PBI-004", projectId: "prj-101", type: "Story", title: "Tek kullanımlık kod ekranı", description: "Parola sonrası kod doğrulama adımı.", status: "Tamamlandı", rank: 4, storyPoints: 8, assigneeId: "tm-4", sprintId: "spr-002", requestId: "tlp-002", analysisId: "anl-002", requirementIds: ["req-004"], createdAt: "2026-10-15T09:00:00.000Z", completedAt: "2026-10-27T16:00:00.000Z" }),
  item({ id: "pbi-005", code: "PBI-005", projectId: "prj-101", type: "Story", title: "İkinci doğrulama yapılandırma anahtarı", description: "İkinci doğrulamanın yapılandırma ile kapatılabilmesi.", status: "Tamamlandı", rank: 5, storyPoints: 3, assigneeId: "tm-5", sprintId: "spr-002", requestId: "tlp-002", analysisId: "anl-002", requirementIds: ["req-005"], createdAt: "2026-10-15T09:10:00.000Z", completedAt: "2026-10-29T13:00:00.000Z" }),
  // --- SPR-002'den backlog'a döndü
  item({ id: "pbi-006", code: "PBI-006", projectId: "prj-101", type: "Spike", title: "Kod gönderim yöntemlerinin araştırılması", description: "Tek kullanımlık kod gönderimi için seçeneklerin karşılaştırılması.", status: "Backlog", rank: 1, storyPoints: 2, assigneeId: "tm-1", sprintId: null, requestId: "tlp-002", createdAt: "2026-10-15T09:20:00.000Z", updatedAt: "2026-10-30T15:00:00.000Z" }),
  // --- SPR-003 (aktif)
  item({ id: "pbi-007", code: "PBI-007", projectId: "prj-101", type: "Story", title: "Fatura PDF indirme", description: "Seçilen faturanın PDF olarak indirilmesi.", status: "Devam Ediyor", rank: 7, storyPoints: 5, assigneeId: "tm-4", sprintId: "spr-003", requestId: "tlp-001", analysisId: "anl-001", requirementIds: ["req-002"], createdAt: "2026-10-29T10:00:00.000Z", updatedAt: "2026-11-04T09:00:00.000Z" }),
  item({ id: "pbi-008", code: "PBI-008", projectId: "prj-101", type: "Hata", title: "Süresi dolan kodda genel hata mesajı", description: "Süresi dolan kod için anlaşılır uyarı gösterilmeli.", status: "Tamamlandı", rank: 8, storyPoints: 2, assigneeId: "tm-5", sprintId: "spr-003", requestId: "tlp-002", requirementIds: ["req-004"], defectId: "bug-001", createdAt: "2026-10-31T08:00:00.000Z", completedAt: "2026-11-04T13:00:00.000Z" }),
  item({ id: "pbi-009", code: "PBI-009", projectId: "prj-101", type: "Story", title: "Fatura listesi performans iyileştirmesi", description: "Liste 2 saniye içinde yüklenmeli.", status: "İncelemede", rank: 9, storyPoints: 3, assigneeId: "tm-4", sprintId: "spr-003", requestId: "tlp-001", analysisId: "anl-001", requirementIds: ["req-003"], createdAt: "2026-10-29T10:10:00.000Z", updatedAt: "2026-11-05T10:00:00.000Z" }),
  item({ id: "pbi-010", code: "PBI-010", projectId: "prj-101", type: "Görev", title: "Fatura ekranı uçtan uca testleri", description: "Liste ve indirme senaryolarının test edilmesi.", status: "Yapılacak", rank: 10, storyPoints: 3, assigneeId: "tm-3", sprintId: "spr-003", requestId: "tlp-001", requirementIds: ["req-001", "req-002"], createdAt: "2026-10-29T10:20:00.000Z" }),
  item({ id: "pbi-011", code: "PBI-011", projectId: "prj-101", type: "Hata", title: "Test ortamında fatura verisi eksik", description: "Test ortamına fatura verisi yüklenmeli.", status: "Tamamlandı", rank: 11, storyPoints: 1, assigneeId: "tm-3", sprintId: "spr-003", requestId: "tlp-001", requirementIds: ["req-001"], defectId: "bug-003", createdAt: "2026-11-02T09:00:00.000Z", completedAt: "2026-11-03T11:00:00.000Z" }),
  // --- PRJ-101 Product Backlog
  item({ id: "pbi-012", code: "PBI-012", projectId: "prj-101", type: "Story", title: "Yeni fatura e-posta bildirimi", description: "Yeni fatura oluştuğunda e-posta ile bilgilendirme.", status: "Backlog", rank: 2, storyPoints: null, sprintId: null, requestId: "tlp-001", createdAt: "2026-11-03T14:00:00.000Z" }),
  item({ id: "pbi-013", code: "PBI-013", projectId: "prj-101", type: "Görev", title: "Fatura ekranları erişilebilirlik denetimi", description: "Klavye ve ekran okuyucu ile kullanım kontrolü.", status: "Backlog", rank: 3, storyPoints: 2, sprintId: null, createdAt: "2026-11-04T09:00:00.000Z" }),
  // --- PRJ-104 Product Backlog
  item({ id: "pbi-014", code: "PBI-014", projectId: "prj-104", type: "Story", title: "Eşik altı otomatik onay kuralı", description: "Eşik tutarın altındaki siparişlerin otomatik onaylanması.", status: "Backlog", rank: 1, storyPoints: 8, sprintId: null, requestId: "tlp-003", analysisId: "anl-004", requirementIds: ["req-006"], createdAt: "2026-10-28T10:00:00.000Z" }),
  item({ id: "pbi-015", code: "PBI-015", projectId: "prj-104", type: "Story", title: "Otomatik onay raporu", description: "Otomatik onayların raporlarda ayrı izlenmesi.", status: "Backlog", rank: 2, storyPoints: 5, sprintId: null, requestId: "tlp-003", analysisId: "anl-004", requirementIds: ["req-007"], createdAt: "2026-10-28T10:10:00.000Z" }),
  item({ id: "pbi-016", code: "PBI-016", projectId: "prj-104", type: "Story", title: "Toplu sipariş dosya şablonu", description: "Kurumsal müşteriler için içe aktarma şablonu.", status: "Backlog", rank: 3, storyPoints: 3, sprintId: null, requestId: "tlp-004", createdAt: "2026-11-02T11:00:00.000Z" }),
];

const AGILE_SEED_DAILY: DailyScrumEntry[] = [
  { id: "ds-001", sprintId: "spr-003", memberId: "tm-3", date: "2026-11-03", yesterday: "Sprint planlamasına katıldım.", today: "Test ortamı fatura verisini yükleyeceğim.", blockers: "", updatedAt: "2026-11-03T09:15:00.000Z" },
  { id: "ds-002", sprintId: "spr-003", memberId: "tm-4", date: "2026-11-03", yesterday: "Sprint planlamasına katıldım.", today: "PDF indirme servisine başlayacağım.", blockers: "", updatedAt: "2026-11-03T09:16:00.000Z" },
  { id: "ds-003", sprintId: "spr-003", memberId: "tm-5", date: "2026-11-04", yesterday: "Hata mesajı düzeltmesini geliştirdim.", today: "Düzeltmeyi incelemeye göndereceğim.", blockers: "", updatedAt: "2026-11-04T09:10:00.000Z" },
  { id: "ds-004", sprintId: "spr-003", memberId: "tm-4", date: "2026-11-05", yesterday: "PDF şablonunu hazırladım.", today: "Performans iyileştirmesini incelemeye alacağım.", blockers: "PDF yazı tipi lisans onayı bekleniyor.", updatedAt: "2026-11-05T09:20:00.000Z" },
];

export type AgileSeed = Pick<DemoState, "teamMembers" | "workItems" | "sprints" | "dailyScrums">;

/** Agile başlangıç verisinin bağımsız bir kopyası. */
export function createAgileSeed(): AgileSeed {
  return structuredClone({
    teamMembers: AGILE_SEED_TEAM,
    workItems: AGILE_SEED_ITEMS,
    sprints: AGILE_SEED_SPRINTS,
    dailyScrums: AGILE_SEED_DAILY,
  });
}
