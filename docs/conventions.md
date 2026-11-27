# Conventions

> Yalnızca gerçek kurallar: her kural ya araçla zorlanır (tercih edilen) ya da review'da kontrol edilir.

## Language
- Chat language (interviews, sessions): **Turkish** (`tr`)
- Document language (docs/, specs, plans, ADRs, review and verify reports): **Turkish** (`tr`)
- Always English (protocol, not prose): ANEW core files, template headings and field labels,
  `Status:` values (Draft / Approved / In progress / Shipped), `Approved by / on:`, `Source:`.
- Code identifiers, branch names, commit messages: kod tanımlayıcıları ve dal adları
  **İngilizce**; commit mesajlarında tip/kapsam İngilizce, açıklama **Türkçe**
  (`docs/git.md`). Arayüz metinleri ve kod yorumları **Türkçe**.
- Agent messages (handoff summaries, refusals, `Next:` lines): chat language; command names, file
  paths and protocol fields verbatim.

## Language & framework versions
- Node 24, npm 11, Next.js 16.4.5, React 19.3.0, TypeScript 5 (`strict`), Tailwind 4, ESLint 9 —
  ayrıntı `docs/architecture.md` (Stack). `next`, `react`, `react-dom` tam sürümle sabitli.

## Naming
- Dosyalar kebab-case (`backlog-panel.tsx`); React bileşenleri PascalCase; hook'lar `use…`.
- Alan terimleri için `docs/domain.md` tablosundaki İngilizce tip adı kullanılır
  (Talep → `WorkRequest`, Sprint işi → `WorkItem`, Hata Kaydı → `Defect`).
- Değer kümeleri: `as const` dizi + türetilmiş tip (`PRIORITIES` / `Priority`); arayüz etiketi
  gerekiyorsa `…_LABELS` kaydı.
- Kayıt kodları: `PRJ-`, `TLP-`, `ANL-`, `REQ-`, `PBI-`, `SPR-`, `TC-`, `RUN-`, `BUG-`.
- Rotalar Türkçe ve kebab-case (`/sprintler/pano`, `/hata-yonetimi`).
- Testler: test edilen dosyanın yanında `<ad>.test.ts(x)` (`docs/testing.md`).

## Error handling
- **Reducer'lar exception fırlatmaz.** Geçersiz veya kurala aykırı eylemde `state` aynen döner.
  Arayüz yapılamayacak eylemi önceden engeller ve nedenini gösterir (selector'daki
  `…Blocker` yardımcıları gibi).
- Kullanıcı girdisi hataları doğrulama fonksiyonlarından (`validate…`) alan bazında, Türkçe ve
  anlaşılır mesajla gelir.
- Kayıt hatası gizlenmez: `useDemoStorageStatus` uyarı ve tekrar kaydetme seçeneği gösterir;
  kaydedilemeyen değişiklik "kaydedildi" gibi gösterilmez.
- Beklenmeyen rota hataları `app/error.tsx`'e düşer; kullanıcıya stack trace gösterilmez.

## Data rules
- Zaman damgaları ISO 8601 UTC metni (`ISODateString`); takvim günleri `YYYY-MM-DD` metni.
- Görüntüleme ve gün hesapları her zaman **Europe/Istanbul** + `tr-TR` ile, `src/lib/format.ts`
  üzerinden. Çalışma ortamının yerel saat dilimine güvenilmez (hidrasyon uyumu).
- Story Point yalnızca `STORY_POINTS` (1, 2, 3, 5, 8, 13); tahmini efor ≥ 0 sonlu sayı.
- İlişkiler `xxxId` alanlarıyla kurulur; her kaydın `id`'si vardır.
- Şema her değiştiğinde `DEMO_SCHEMA_VERSION` artırılır ve `migrations.ts`'e geçiş yazılır;
  geçişten önce yedek alınır (hassas alan, BR-9).

## Known traps
- Next.js 16, eğitim verisindeki Next.js'ten farklıdır (`proxy.ts`, `cacheComponents`,
  Partial Prefetching…) — kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberi
  oku, deprecation uyarılarına uy — from bootstrap 2026-11-27.
- `next dev`, `AGENTS.md`'ye kendi "nextjs-agent-rules" bloğunu yeniden ekler — bu değişikliği
  commit'leme, geri al (bilgi zaten bu dosyada ve AGENTS.md'de) — from bootstrap 2026-11-27.
- `tsc --noEmit` öncesinde `next typegen` çalışmazsa rota tipleri eksik kalır ve tip kontrolü
  yanıltır — check bu sırayı uygular — from bootstrap 2026-11-27.
- Hidrasyon: sunucu ve ilk istemci render'ı her zaman seed verisini kullanır; tarayıcı verisi
  hidrasyondan sonra devreye girer. İlk render'da `localStorage`, `Date.now()` veya yerel saat
  dilimine bağlı çıktı üretme — from bootstrap 2026-11-27.

## Enforced by tooling
- TypeScript `strict` (`tsc --noEmit`, check `typecheck` adımı).
- ESLint `next/core-web-vitals` + `next/typescript` (check `lint` adımı).
- `next build` (check `build` adımı, yalnızca full).
