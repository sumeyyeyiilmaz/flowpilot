/**
 * SENTETİK DEMO VERİSİ
 * Bu dosyadaki tüm proje, kişi ve sayı bilgileri kurgusaldır.
 * Gerçek bir şirket, müşteri veya kişiyle ilişkisi yoktur.
 */

export type StatTrend = "up" | "down";

export type DashboardStat = {
  key: "projects" | "requirements" | "tests" | "bugs";
  label: string;
  value: string;
  change: string;
  /** Gerçek bir değişim verisi yoksa (ör. sabit oranlar) boş bırakılır; ok simgesi gösterilmez. */
  trend?: StatTrend;
  /** Trend yönünün iyi mi kötü mü olduğu (ör. hata sayısındaki düşüş olumludur). */
  positive: boolean;
  hint: string;
};

export const dashboardStats: DashboardStat[] = [
  {
    key: "projects",
    label: "Aktif Projeler",
    value: "12",
    change: "+2",
    trend: "up",
    positive: true,
    hint: "geçen aya göre",
  },
  {
    key: "requirements",
    label: "Gereksinimler",
    value: "348",
    change: "+24",
    trend: "up",
    positive: true,
    hint: "bu sprintte eklendi",
  },
  {
    key: "tests",
    label: "Test Senaryoları",
    value: "1.276",
    change: "%92,4",
    positive: true,
    hint: "başarı oranı",
  },
  {
    key: "bugs",
    label: "Açık Hatalar",
    value: "37",
    change: "-8",
    trend: "down",
    positive: true,
    hint: "geçen haftaya göre",
  },
];

export type ProjectStatus = "Planlandı" | "Devam Ediyor" | "Riskli" | "Tamamlanıyor";

export type ProjectProgress = {
  id: string;
  name: string;
  owner: string;
  progress: number;
  status: ProjectStatus;
  dueDate: string;
  openBugs: number;
};

export const projectProgress: ProjectProgress[] = [
  {
    id: "PRJ-101",
    name: "Müşteri Portalı v2",
    owner: "Elif A.",
    progress: 78,
    status: "Devam Ediyor",
    dueDate: "28 Kasım",
    openBugs: 6,
  },
  {
    id: "PRJ-104",
    name: "Sipariş Yönetim Sistemi",
    owner: "Burak T.",
    progress: 45,
    status: "Riskli",
    dueDate: "12 Aralık",
    openBugs: 14,
  },
  {
    id: "PRJ-107",
    name: "Mobil Saha Uygulaması",
    owner: "Zeynep K.",
    progress: 91,
    status: "Tamamlanıyor",
    dueDate: "19 Kasım",
    openBugs: 2,
  },
  {
    id: "PRJ-112",
    name: "Raporlama Modülü",
    owner: "Can Y.",
    progress: 62,
    status: "Devam Ediyor",
    dueDate: "5 Aralık",
    openBugs: 9,
  },
  {
    id: "PRJ-115",
    name: "Entegrasyon Katmanı",
    owner: "Deniz Ö.",
    progress: 18,
    status: "Planlandı",
    dueDate: "16 Ocak",
    openBugs: 0,
  },
];

export type ActivityType = "requirement" | "test" | "bug" | "project";

export type Activity = {
  id: string;
  type: ActivityType;
  actor: string;
  action: string;
  target: string;
  time: string;
};

export const recentActivities: Activity[] = [
  {
    id: "a1",
    type: "test",
    actor: "Zeynep K.",
    action: "test koşumunu tamamladı",
    target: "TC-482 Ödeme akışı",
    time: "8 dk önce",
  },
  {
    id: "a2",
    type: "bug",
    actor: "Burak T.",
    action: "kritik hata bildirdi",
    target: "BUG-219 Sipariş onayı zaman aşımı",
    time: "24 dk önce",
  },
  {
    id: "a3",
    type: "requirement",
    actor: "Elif A.",
    action: "gereksinimi onayladı",
    target: "REQ-1043 Çok faktörlü giriş",
    time: "1 saat önce",
  },
  {
    id: "a4",
    type: "bug",
    actor: "Can Y.",
    action: "hatayı çözüldü olarak işaretledi",
    target: "BUG-204 Rapor dışa aktarma",
    time: "2 saat önce",
  },
  {
    id: "a5",
    type: "project",
    actor: "Deniz Ö.",
    action: "yeni proje oluşturdu",
    target: "PRJ-115 Entegrasyon Katmanı",
    time: "3 saat önce",
  },
  {
    id: "a6",
    type: "requirement",
    actor: "Elif A.",
    action: "gereksinimi teste bağladı",
    target: "REQ-1038 → TC-477",
    time: "5 saat önce",
  },
];
