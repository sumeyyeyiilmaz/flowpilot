# Backlog — deferred findings

Findings a human triaged as **defer**: real, but fixed later by decision (`workflows/feature-development.md`,
step 7). Nothing lands here without that decision; noise is rejected in the triage record, not parked here.

- A criterion moved out at the ship gate (R-08, `→ moved to B-<n>`) lands here too, by the
  human's ship decision; the entry names the spec and criterion.
- One entry per finding, newest last. Delete the entry in the commit of the work that closes it.
- An entry that grows into new behavior becomes a spec (`specs/active/`), not a fix.

<!-- Format (labels stay English):
- **B-<n>** — <finding, one line> — Source: spec <NNNN>, review round <n> (<file:line>) — Severity: <…>
  — Recommendation: <the reviewer's action> — Deferred by: <name>, <YYYY-MM-DD>, <why>
  A decision deferred at bootstrap (its REPORT) uses Source: bootstrap <YYYY-MM-DD>.
-->

- **B-1** — Node sürümü `package.json` `engines` / `.nvmrc` ile sabitlenmemiş (yalnızca check.conf `requires` ve CI denetliyor) — Source: bootstrap 2026-11-27 — Severity: Low
  — Recommendation: `engines.node: ">=24"` ve `.nvmrc` (24) ekleyen küçük bir CHANGE — Deferred by: Sümeyye Yılmaz, 2026-11-27, kod/paket değişikliği bootstrap kapsamı dışında (kural 1)
- **B-2** — Özellik modülü sınırı istisnası: `src/components/projects` → `src/components/requests` import ediyor (docs/architecture.md, yasak bağımlılık 6) — Source: bootstrap 2026-11-27 — Severity: Low
  — Recommendation: paylaşılan parçayı `components/common`'a taşıyan refactor (davranış değişmez) — Deferred by: Sümeyye Yılmaz, 2026-11-27, mevcut kod; bootstrap'ta yalnızca kayda geçirildi
- **B-3** — Yasak bağımlılıklar (docs/architecture.md 1–6) yalnızca review ile uygulanıyor — Source: bootstrap 2026-11-27 — Severity: Medium
  — Recommendation: ESLint `no-restricted-imports` / `no-restricted-globals` (localStorage) kuralları; sonra docs/conventions.md "Enforced by tooling"e taşı — Deferred by: Sümeyye Yılmaz, 2026-11-27, lint yapılandırması kod değişikliği
- **B-4** — GitHub'da `main` için dal koruması yok (PR ve yeşil CI zorunlu değil) — Source: bootstrap 2026-11-27 — Severity: Medium
  — Recommendation: GitHub ayarlarında `main` koruması: PR zorunlu, `check` ve `doctor` işleri zorunlu durum kontrolü — Deferred by: Sümeyye Yılmaz, 2026-11-27, GitHub ayarı insanın yapacağı iş
