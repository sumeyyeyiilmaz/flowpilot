import type { RequestType, SectionKind } from "../domain/types";

/**
 * Analiz bölümü önerileri. Bunlar yalnızca başlangıç kolaylığıdır;
 * kullanıcı her bölümü yeniden adlandırabilir, silebilir veya yeni bölüm ekleyebilir.
 */
export type SectionPreset = { title: string; kind: SectionKind };

/** "Bölüm ekle" menüsünde listelenecek hazır bölüm başlıkları. */
export const SECTION_PRESET_LIBRARY: SectionPreset[] = [
  { title: "İş Hedefi", kind: "text" },
  { title: "Kapsam", kind: "list" },
  { title: "Kapsam Dışı", kind: "list" },
  { title: "Paydaşlar", kind: "list" },
  { title: "Süreç Akışı", kind: "list" },
  { title: "Mevcut Durum", kind: "text" },
  { title: "İstenen Değişiklik", kind: "text" },
  { title: "Etki Analizi", kind: "text" },
  { title: "Etkilenen Modüller", kind: "list" },
  { title: "Geri Dönüş Planı", kind: "text" },
  { title: "Riskler", kind: "list" },
  { title: "Varsayımlar", kind: "list" },
  { title: "Açık Sorular", kind: "checklist" },
  { title: "Kabul Kriterleri", kind: "checklist" },
];

/** Talep türüne göre "önerilen bölümlerle başla" seçeneğinin getirdiği bölümler. */
export const DEFAULT_SECTIONS_BY_REQUEST_TYPE: Record<RequestType, SectionPreset[]> = {
  new: [
    { title: "İş Hedefi", kind: "text" },
    { title: "Kapsam", kind: "list" },
    { title: "Kapsam Dışı", kind: "list" },
    { title: "Paydaşlar", kind: "list" },
    { title: "Süreç Akışı", kind: "list" },
    { title: "Kabul Kriterleri", kind: "checklist" },
  ],
  change: [
    { title: "Mevcut Durum", kind: "text" },
    { title: "İstenen Değişiklik", kind: "text" },
    { title: "Etki Analizi", kind: "text" },
    { title: "Etkilenen Modüller", kind: "list" },
    { title: "Geri Dönüş Planı", kind: "text" },
    { title: "Kabul Kriterleri", kind: "checklist" },
  ],
};
