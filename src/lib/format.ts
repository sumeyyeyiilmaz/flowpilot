/**
 * Tarih biçimlendirme. Sunucu ve tarayıcı aynı çıktıyı üretsin diye
 * saat dilimi sabit olarak Europe/Istanbul kullanılır (hidrasyon uyumu).
 */
const TIME_ZONE = "Europe/Istanbul";

const longDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const shortDate = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

/** Örn. "6 Kas 14:30" */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** Örn. "28 Kasım 2026" */
export function formatDate(iso: string): string {
  return longDate.format(new Date(iso));
}

/** Örn. "28 Kas" */
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}
