# Architecture

> Kararlaştırılmış mimari — hedef değil, bugünkü gerçek. Ajanlar plan yapmadan önce bunu okur.

## System overview

FlowPilot, tek bir **Next.js 16 (App Router)** uygulamasıdır; sunucu tarafı veri katmanı, API veya
veritabanı yoktur. Tüm durum tarayıcıda tutulur: `lib/demo` içindeki dış (external) store,
`useSyncExternalStore` ile React'e bağlanır, değişiklikleri saf reducer'lar üretir, okumaları
selector'lar yapar ve `localStorage`'a yalnızca `storage.ts` yazar. Stil **katmanlı bir
modüler monolit**tir: rotalar ince, ekranlar özellik modüllerinde, mantık `lib/` altında. Seçim
nedeni: demo MVP için en az hareketli parça; `lib/demo` sınırı, ileride bir sunucu veri
katmanının yerine geçebileceği tek nokta olarak tutulur.

**Stack (onaylı, bootstrap 2026-11-27).**

| Katman | Sürüm / araç |
|---|---|
| Çalışma ortamı | Node **24** (LTS), npm 11, `package-lock.json` |
| Framework | **Next.js 16.4.5** — App Router, `src/`, `cacheComponents`, `partialPrefetching`, `src/proxy.ts` (Next 16'da middleware'in yerini alır) |
| UI | **React 19.3.0**, Tailwind CSS 4 (Turbopack loader), shadcn/ui + Radix, lucide-react |
| Dil | **TypeScript 5**, `strict`, alias `@/*` → `src/*` |
| Kalite | ESLint 9 (`next/core-web-vitals` + `next/typescript`), `next typegen` + `tsc --noEmit` |
| Test | Vitest + Testing Library + jsdom (ilk spec ile kurulacak — `docs/testing.md`) |
| Veri | Tarayıcı `localStorage`; sunucu / veritabanı / dış servis yok |

## Modules / components and ownership

```
app/ (rotalar, ince) → components/<özellik> → lib/demo (store, reducer, selectors, storage) → lib/domain (tipler, saf)
                         ↘ components/common · layout · ui
```

| Module | Single responsibility | Owns |
|---|---|---|
| `src/app/` | Rotalar, layout'lar, `error.tsx`; sayfayı özellik bileşenine bağlar. İş mantığı yok. | URL yapısı (Türkçe rotalar) |
| `src/proxy.ts` | Bilinmeyen proje adreslerinde gerçek HTTP 404. | — |
| `src/components/agile` | Backlog, sprint planlama, Kanban, Daily Scrum, Burndown/Velocity ekranları. | Agile ekran durumu (yalnızca UI) |
| `src/components/analysis` | Analiz çalışma alanı, bölüm editörü, gereksinim diyalogları. | — |
| `src/components/projects` · `requests` · `dashboard` | Proje listesi/detayı · talep listesi/formu · Genel Bakış kartları. | — |
| `src/components/common` · `layout` | Paylaşılan parçalar · uygulama kabuğu, menü, demo veri/yedek kontrolleri. | — |
| `src/components/ui` | shadcn temel bileşenleri. | — |
| `src/lib/demo` | Store, reducer'lar (`reducer.ts`, `agile-reducer.ts`), selector'lar, seed, doğrulama, migration, `storage.ts`. | **Demo durumu** (`DemoState`) ve tarayıcı kaydı |
| `src/lib/domain` | Alan tipleri ve değer kümeleri. | Alan modeli |
| `src/lib/format.ts` · `utils` | Tarih biçimlendirme (Europe/Istanbul, `tr-TR`) · `cn` yardımcıları. | — |

## Communication rules

- Bileşenler durumu yalnızca store'un dışa açtığı eylemlerle (reducer) değiştirir, yalnızca
  selector'larla okur. Doğrudan durum mutasyonu yoktur.
- Reducer'lar saftır ve exception fırlatmaz (`docs/conventions.md`, Error handling).
- Sekmeler arası eşitleme ve kayıt durumu store üzerinden yürür; bileşen `localStorage`'a dokunmaz.

## Forbidden dependencies (make them testable)

1. `src/lib/**` hiçbir zaman `src/components/**` veya `src/app/**` import etmez.
2. `src/lib/domain/**` projeden hiçbir modülü import etmez (React, tarayıcı API'si de yok).
3. `src/components/ui/**` yalnızca `components/ui` ve `lib/utils` import eder — özellik
   bileşenlerini veya `lib/demo`'yu asla.
4. `localStorage` erişimi yalnızca `src/lib/demo/storage.ts` içindedir (hassas alan sınırı).
5. Bileşenler durumu doğrudan değiştirmez; yalnızca store/reducer eylemleriyle.
6. Bir özellik modülü (`agile`, `analysis`, `projects`, `requests`, `dashboard`) başka bir özellik
   modülünü import etmez; paylaşılan parça `components/common`'a taşınır.
   **Bilinen istisna:** `projects` → `requests` (bootstrap'ta tespit edildi; düzeltme
   `specs/backlog.md`'de).

Bu kurallar şimdilik review ile uygulanır; ESLint `no-restricted-imports` ile otomatikleştirme
`specs/backlog.md`'de.

## Deliberately out of scope

- Sunucu tarafı kalıcı veri, API, veritabanı, kimlik doğrulama ve yetkilendirme.
- Dış entegrasyonlar.
- Cihazlar/tarayıcılar arası veri paylaşımı; çoklu sekmede eşzamanlı düzenleme çatışma çözümü
  (son yazan kazanır).
- Arayüzden proje oluşturma.
