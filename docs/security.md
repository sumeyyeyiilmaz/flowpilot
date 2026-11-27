# Security

> Ajanların her plan ve review'da uyduğu temel kurallar. Bugünkü duruş: sunucu, kimlik doğrulama,
> gerçek veri ve dış servis olmayan bir tarayıcı demosu — saldırı yüzeyi küçük, kurallar hafif.
> Sunucu tarafı, kimlik doğrulama veya gerçek veri geldiğinde bu doküman bir ADR ile yeniden yazılır.

## Secrets
- Secrets never enter the repo, specs, prompts, or chat. `.env` is gitignored; provide `.env.example`.
- Agents never print secret values, even when debugging.
- Bugün uygulamanın hiçbir gizli bilgiye ihtiyacı yoktur; kodda anahtar/token bulunmaz.

## Data
- Yalnızca **sentetik veri**. Gerçek kişi, kurum veya müşteri verisi seed dosyalarına, test
  fixture'larına ve ekran görüntülerine girmez.
- Ekip üyesi adları kurgusaldır; talep sahibi (`requester`) kişi adı değil birim/rol tutar.

## Input & output
- `localStorage`'dan okunan veri **güvenilmez girdi**dir: her okumada `src/lib/demo/validation.ts`
  ile doğrulanır; geçersizse BR-9 uygulanır (`docs/domain.md`).
- URL parametreleri güvenilmez girdidir: çözümleme hata fırlatmamalı, geçersiz değer 404'e düşer
  (`src/proxy.ts`).
- `dangerouslySetInnerHTML`, `eval`, `new Function` kullanılmaz; kullanıcı metni her zaman React'in
  kaçışlamasıyla gösterilir.
- Kullanıcıya stack trace veya ham hata metni gösterilmez (`app/error.tsx`).

## AuthN / AuthZ
- Yok (bilinçli kapsam dışı, `docs/architecture.md`). Uygulama tek kullanıcılı bir tarayıcı
  demosudur. Kimlik doğrulama eklenmesi hassas alan + ADR gerektirir.

## Dependencies
- Yeni bir bağımlılık yalnızca PLAN aşamasında gerekçesiyle (ne için, alternatif, lisans,
  bakım durumu) önerilir ve plan onayıyla eklenir.
- `package-lock.json` her zaman commit'lenir; CI `npm ci` kullanır.
- `next`, `react`, `react-dom` tam sürümle sabitli kalır; yükseltme kendi spec'iyle yapılır.
- `npm audit --omit=dev` high/critical bulgusu `specs/backlog.md`'ye yazılır; ağa bağımlı ve
  günden güne değiştiği için check/CI'ı kırmaz.

## Review lens
Security is a mandatory dimension of every independent review (see `prompts/review.md`), not a
separate afterthought phase.
