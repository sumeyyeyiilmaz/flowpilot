# Domain

> İş tarafı, insanlar ve ajanlar arasındaki ortak dil. Bir terim burada yoksa yapay zekâ kendi
> anlamını uydurur. Ürünün tam kapsamı: [`PRODUCT_OVERVIEW.md`](PRODUCT_OVERVIEW.md) — bu dosya
> onu tekrar etmez, yalnızca terimleri ve test edilebilir kuralları tutar.

**Ürün.** FlowPilot, Agile odaklı bir proje yönetim sistemidir: **Proje → Talep → Analiz →
Gereksinim → Sprint işi** zincirini izlenebilir tutar; teslimatı Product Backlog, sprint planlama,
Kanban, Daily Scrum, Burndown ve Velocity ile yönetir.
**Durum:** demo MVP (v0.1.0) — sentetik veri, yalnızca tarayıcıda (`localStorage`); sunucu,
veritabanı, kimlik doğrulama yok. Sunucu tarafı ileride; geldiğinde bu dosya ve
`docs/security.md` bir ADR ile güncellenir.
**Sıradaki hedef:** zincirin kalan halkaları — Test Senaryosu, Test Sonucu, Hata Kaydı ekranları
(veri modeli hazır).

## Ubiquitous language
<!-- Ekranda Türkçe terim, kodda İngilizce tip adı. Aynı kelime her yerde aynı anlam. -->

| Term | Meaning | Notes / not to be confused with |
|---|---|---|
| Proje (`Project`) | Kök kayıt; kod `PRJ-xxx`. Durum: Planlandı / Aktif / Beklemede / Tamamlandı. | Demoda arayüzden proje oluşturulmaz; projeler seed verisinden gelir. |
| Talep (`WorkRequest`) | Bir projeye bağlı iş isteği; kod `TLP-xxx`. Tür: **Yeni İş Talebi** (`new`) veya **Mevcut Sistem Değişikliği** (`change`). | Tarayıcının global `Request` tipiyle çakışmasın diye `WorkRequest`. Talep sahibi (`requester`) kişi değil birim/rol. |
| Analiz (`Analysis`) | Bir talebe ait analiz çalışması; kod `ANL-xxx`. Durum: Taslak / İncelemede / Onaylandı. Bir talebin birden fazla analizi olabilir. | Sabit şablon yok; bölümlerden oluşur. |
| Analiz bölümü (`AnalysisSection`) | Analizin bir parçası: Metin (`text`), Liste (`list`), Kontrol listesi (`checklist`). Sıra = dizideki sıra. | — |
| Gereksinim (`Requirement`) | Talebe ve o talebin bir analizine bağlı ihtiyaç; kod `REQ-xxx`. Tür: Fonksiyonel / Fonksiyonel Olmayan; öncelik MoSCoW; kabul kriterleri içerir. | Talep önceliği (Düşük…Kritik) ile MoSCoW önceliği farklı ölçeklerdir. |
| Sprint işi / PBI (`WorkItem`) | Backlog veya sprintteki iş; kod `PBI-xxx`. Tür: Story / Görev / Hata / Spike. | "Hata" türü iş ≠ Hata Kaydı (`Defect`); iş, kayda bağlanır. |
| Product Backlog | Sprinte atanmamış işler (`sprintId === null`, durum "Backlog"), `rank` sırasıyla. | "Backlog" bir Kanban sütunu değildir. |
| Sprint (`Sprint`) | Projeye bağlı zaman kutusu; kod `SPR-xx`. Durum: Planlandı / Aktif / Tamamlandı. | — |
| Kapanış özeti (`SprintSummary`) | Sprint kapanırken kaydedilen değişmez özet: taahhüt edilen / tamamlanan puan, tamamlanan işler, taşınan işler. | Sonradan değişen iş puanları özeti etkilemez. |
| Story Point (`StoryPoint`) | Tahmin ölçeği: yalnızca 1, 2, 3, 5, 8, 13. | Tahmini efor (saat) ayrı ve isteğe bağlıdır. |
| Kanban durumları | Yapılacak / Devam Ediyor / İncelemede / Tamamlandı (`SPRINT_BOARD_STATUSES`). | Sprintteki iş her zaman bu dördünden birindedir. |
| Daily Scrum kaydı (`DailyScrumEntry`) | Sprint + ekip üyesi + gün için dün / bugün / engeller. Bu üçlü için tekildir. | Tekrar giriş yeni kayıt açmaz, mevcut kaydı günceller. |
| Ekip üyesi (`TeamMember`) | Sentetik, kurgusal kişi. | Gerçek kişi adı kullanılmaz. |
| Test Senaryosu / Test Sonucu / Hata Kaydı (`TestCase` / `TestRun` / `Defect`) | Kodlar `TC-xxx` / `RUN-xxx` / `BUG-xxx`. Yalnızca veri modelinde ve seed'de; ekranları yok. | — |
| Velocity / Burndown | Sprint metrikleri; hesaplama BR-8. | — |
| Demo durumu (`DemoState`) | Tarayıcıda saklanan tüm veri; şema sürümü `DEMO_SCHEMA_VERSION`. | Hassas alan (aşağıda). |

## Business rules

- **BR-1:** Her talep bir projeye, her analiz bir talebe, her gereksinim bir talebe ve o talebin
  bir analizine bağlıdır. Gereksinimin analiz bölümüne bağlanması isteğe bağlıdır.
- **BR-2:** Bir sprint işi yalnızca kendi projesindeki talep, analiz ve gereksinimlere bağlanabilir.
- **BR-3:** "Hata" türündeki iş, aynı projedeki mevcut bir Hata Kaydı'na bağlanmak zorundadır;
  diğer türlerde hata bağlantısı yoktur. Bir Hata Kaydı en fazla bir işe bağlanabilir.
- **BR-4:** Bir projede aynı anda en fazla bir aktif sprint bulunabilir. Yeni sprint
  "Planlandı" durumunda oluşturulur.
- **BR-5:** Sprint kapatılırken değişmez bir kapanış özeti kaydedilir; tamamlanmamış işler Product
  Backlog'a döner, tamamlanan işler sprintte kalır.
- **BR-6:** Tamamlanmış sprintteki işlerde tür, Story Point, efor ve hata bağlantısı değiştirilemez,
  iş silinemez. Tamamlanmış bir sprintin kapanış özetinde yer alan iş, sonradan backlog'a dönmüş
  olsa bile silinemez.
- **BR-7:** Kanban'da durum değişikliği ve Daily Scrum girişi yalnızca aktif sprintte ve sprintin
  tarih aralığında (Daily Scrum) yapılabilir; tamamlanmış sprintler salt okunurdur, planlanan
  sprintin panosu düzenlenemez.
- **BR-8:** Velocity yalnızca tamamlanmış sprintlerin kapanış özetlerinden hesaplanır (aktif sprint
  etkilemez; üçten az sprintte güvenilmez olduğu belirtilir). Burndown'da her günün kalan puanı =
  kapsam − o güne kadar tamamlanan işler; kapsam, tamamlanmış sprintte kapanış özeti, aktif
  sprintte mevcut içeriktir. Gelecek günler için değer üretilmez. Tüm tarih/gün hesapları
  **Europe/Istanbul** saat dilimindedir.
- **BR-9:** Okunamayan kayıtlı veri silinmez ve üzerine yazılmaz: yedeklenir (en fazla 3 yedek)
  ve uygulama kurtarma moduna geçer; sıfırlama yalnızca kullanıcının açık eylemiyle olur. Eski
  şemadaki veri, geçişten önce yedeklenerek güncel şemaya taşınır.

## Key domain invariants

- Kapanış özeti (`SprintSummary`) yazıldıktan sonra hiçbir eylemle değişmez (BR-5, BR-6).
- Kullanıcının tarayıcısındaki veri, kullanıcının açık onayı olmadan kaybolmaz (BR-9).
- Sprint işi ile bağlandığı tüm kayıtlar aynı projededir (BR-2, BR-3).

## Sensitive areas

- **Veri saklama ve şema geçişi** — `src/lib/demo/storage.ts`, `migrations.ts`, `validation.ts`,
  yedekleme ve kurtarma (BR-9). Sunucu yok; tarayıcıdaki `localStorage` tek kopyadır, hatalı bir
  migration veya üzerine yazma veriyi geri dönüşsüz siler.
- Kişisel veri, ödeme, kimlik/yetki: **yok** (sentetik veri, oturum yok). Gerçek veri veya sunucu
  tarafı geldiğinde "Kişisel veri" buraya eklenir (ADR ile).
