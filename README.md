# FlowPilot

**Agile odaklı Proje Yönetim Sistemi — demo MVP**

FlowPilot; projeleri, talepleri, analiz çalışmalarını, gereksinimleri ve sprint süreçlerini birbirine bağlı olarak tek bir uygulamada yöneten, Agile odaklı bir proje yönetim sistemidir.

> **Demo sürümü:** Uygulamadaki tüm proje, talep, analiz, ekip ve sprint kayıtları sentetik demo verisidir; gerçek bir kurum, müşteri veya kişiyle ilişkisi yoktur. Veriler yalnızca kullanılan tarayıcıda saklanır. Uygulamaya gerçek veya hassas veri girmeyin.

---

## FlowPilot nedir?

FlowPilot, bir işin talep olarak ortaya çıkmasından sprintte tamamlanmasına kadar geçen süreci izlenebilir biçimde yönetir. Bir proje altında açılan talepler, bu taleplere ait analiz çalışmaları, analizlerden doğan gereksinimler ve bu gereksinimleri karşılayan sprint işleri birbirine bağlıdır.

Hedeflenen ilişki zinciri:

```
Proje → Talep → Analiz → Gereksinim → Sprint işi → Test Senaryosu → Test Sonucu → Hata Kaydı
```

Zincirin **proje, talep, analiz, gereksinim ve sprint işi** halkaları kullanılabilir durumdadır. Test senaryosu, test sonucu ve hata kaydı veri modelinde ve sentetik verilerde yer alır; bunlara ait yönetim ekranları henüz geliştirilmemiştir.

## Projenin amacı ve hedefi

- **Tek kaynak:** Talep, analiz, gereksinim ve sprint bilgisini dağınık dokümanlar yerine tek bir yerde, birbirine bağlı olarak tutmak.
- **Esnek analiz:** Analiz dokümanını sabit bir şablona bağlamadan, ihtiyaca göre bölüm eklenip çıkarılabilen bir çalışma alanında hazırlamak.
- **İzlenebilirlik:** Bir sprint işinin hangi talepten, hangi analizden ve hangi gereksinimden geldiğini görebilmek.
- **Agile teslimat:** Product Backlog, sprint planlama, Kanban, Daily Scrum, Burndown ve Velocity ile teslimatı yönetmek.
- **Güvenilir demo:** Gerçek veriye ihtiyaç duymadan tarayıcıda çalışan ve kayıtlı veriyi koruyan bir MVP sunmak.

---

## Mevcut özellikler

Bu bölümdeki özelliklerin tamamı geliştirilmiş ve kullanılabilir durumdadır.

### Uygulama kabuğu
- Masaüstünde sabit, mobilde açılır sol menü ve mobil uyumlu arayüz.
- **Genel Bakış** sayfası: istatistik kartları, proje ilerlemesi ve son aktiviteler. Bu sayfadaki göstergeler sabit sentetik değerlerdir; demo veri deposuna bağlı değildir.

### Projeler — `/projeler`
- Proje listesi: durum, sorumlu, hedef tarih ve proje başına talep, analiz, gereksinim ve açık hata sayıları.
- Proje detayı: proje özeti ve projeye bağlı talepler (talep türü filtresiyle).
- Bilinmeyen proje adresleri için HTTP 404 yanıtı.

### Talepler — `/talepler`
- Tüm projelerin taleplerini listeleme; talep türü, proje, durum ve metin aramasıyla filtreleme.
- İki talep türü: **yeni iş ihtiyacı** ve **mevcut sistem değişikliği**.
- Doğrulamalı talep oluşturma ve düzenleme (başlık, açıklama, proje, tür, öncelik, durum).

### Analiz çalışma alanı — `/talepler/analiz`
- Bir talep için birden fazla analiz; önceki analizler korunur.
- Analiz başlığı, açıklaması ve durumu; değişiklikler otomatik olarak kaydedilir.
- Sabit şablon gerektirmeyen bölümler: metin, liste ve kontrol listesi bölümleri eklenebilir, düzenlenebilir, silinebilir ve sıralanabilir. Talep türüne göre isteğe bağlı başlangıç bölümleri sunulur.
- Boş başlık ve maddelerin güvenli temizliği.
- **Gereksinimler:** analiz içinden oluşturma ve düzenleme. Her gereksinim talebe ve analize bağlıdır; analiz bölümüne bağlantı isteğe bağlıdır.

### Agile ve sprint yönetimi — `/sprintler`
- **Product Backlog:** iş oluşturma, düzenleme, onaylı silme ve öncelik sıralama; iş türü (Story, Görev, Hata, Spike), Story Point (1, 2, 3, 5, 8, 13), tahmini efor ve kişi atama.
- **Bağlantılar:** işler talep, analiz ve gereksinimlere bağlanabilir. "Hata" türündeki iş, mevcut bir hata kaydına bağlanır; aynı hata kaydı ikinci bir işe bağlanamaz.
- **Sprint planlama:** sprint oluşturma, düzenleme, başlatma ve kapatma; işleri sprinte ekleme ve sprintten çıkarma; aktif, planlanan ve tamamlanan sprint görünümü. Bir projede aynı anda tek aktif sprint bulunur.
- **Sprint geçmişi:** sprint kapatılırken değişmez bir özet kaydedilir; tamamlanmamış işler Product Backlog'a döner; tamamlanmış sprintlerdeki işler kilitlenir.
- **Sprint panosu — `/sprintler/pano`:** dört sütunlu Kanban (Yapılacak, Devam Ediyor, İncelemede, Tamamlandı). Durum değişikliği yalnızca aktif sprintte yapılabilir; tamamlanmış sprintler salt okunurdur.
- **Daily Scrum:** kişi ve gün bazında dün, bugün ve engeller kaydı. Aynı sprint, kişi ve tarih için mevcut kayıt güncellenir.
- **Metrikler — `/sprintler/metrikler`:**
  - **Burndown:** gerçekleşen kalan puan ve ideal çizgi. Gelecek günler için değer üretilmez. Hesaplama günlük geçmiş anlık görüntülerine dayanmaz; bu durum ekranda belirtilir.
  - **Velocity:** yalnızca tamamlanmış sprintlerin kapanış özetlerinden hesaplanır.
  - Tamamlanan sprint karşılaştırması ve proje özet kartları. Veri yetersiz olduğunda grafik yerine açıklayıcı bir boş durum gösterilir.
  - Tarih hesapları Europe/Istanbul saat dilimine göre yapılır.

### Demo verisi, saklama ve kurtarma
- Veriler tarayıcının `localStorage` alanında saklanır; sunucu, veritabanı veya harici servis kullanılmaz.
- Okunan veri yapısıyla ve kayıtlar arası kurallarla doğrulanır. Eski şemadaki (v1) veri, geçişten önce yedeklenerek güncel şemaya (v2) geçirilir.
- Okunamayan veri silinmez ve üzerine yazılmaz; yedeklenir ve uygulama kurtarma moduna geçer. En fazla üç yedek saklanır; yedekler kullanıcı onayı olmadan silinmez.
- Mevcut veri ve yedekler, kaynağı belirtilen dosya adlarıyla indirilebilir. Demo verisi kullanıcı onayıyla sıfırlanabilir.
- Kayıt başarısız olursa açık bir uyarı ve "Tekrar kaydet" seçeneği gösterilir. Sayfa hatalarında uygulama menüsü içinde bir hata ekranı açılır.

---

## Gelecek geliştirmeler

Bu bölümdeki alanlar henüz geliştirilmemiştir. Menüde yer alan ilgili sayfalar şu an "geliştirme aşamasında" bilgisini gösterir.

- **Merkezi talep havuzu:** taleplerin projeye atanmadan önce toplandığı, değerlendirildiği ve önceliklendirildiği ortak giriş noktası.
- **Gereksinim yönetimi:** gereksinimlerin tüm projeler genelinde listelendiği ve yönetildiği bağımsız ekran (`/gereksinimler`). Gereksinimler şu an yalnızca analiz çalışma alanı içinden yönetilebilmektedir.
- **Test yönetimi:** test senaryoları ve test sonuçlarının yönetimi (`/test-yonetimi`).
- **Hata yönetimi:** hata kayıtlarının oluşturulduğu ve izlendiği ekran (`/hata-yonetimi`).
- **İzlenebilirlik görünümü:** talepten hata kaydına kadar zincirin tek ekranda gösterimi (`/izlenebilirlik`) ve gereksinimden doğrudan sprint işi oluşturma.
- **Genel Bakış** sayfasının demo veri deposundaki kayıtlara bağlanması.
- Arayüzde **tema değiştirici** (koyu tema stilleri mevcuttur; kullanıcı tarafından seçilememektedir).
- Sunucu tarafında kalıcı veri saklama, kimlik doğrulama ve yetkilendirme.
- İleri seviye Agile özellikleri: sürükle-bırak, kapsam değişikliklerini gösteren Burndown, iş günü takvimi.

---

## Kullanılan teknolojiler

| Alan | Teknoloji |
|---|---|
| Uygulama çatısı | Next.js 16.4 — App Router, Turbopack, Cache Components, Partial Prefetching |
| Arayüz kütüphanesi | React 19.3 |
| Programlama dili | TypeScript 5.9 (strict mod) |
| Stil | Tailwind CSS 4 |
| Arayüz bileşenleri | shadcn/ui (Radix UI tabanlı, Nova stili), lucide-react ikonları |
| Kod denetimi | ESLint 9 (`eslint-config-next`) |
| Grafikler | Ek kütüphane kullanılmadan, satır içi SVG |
| Veri katmanı | Tarayıcı içi demo veri deposu (`useSyncExternalStore` ve saf reducer'lar), `localStorage` |
| Paket yöneticisi | npm |

## Mevcut geliştirme aşaması

FlowPilot demo MVP aşamasındadır (sürüm `0.1.0`).

| Alan | Durum |
|---|---|
| Uygulama kabuğu, projeler, talepler, analiz çalışma alanı ve gereksinim bağlantıları | Tamamlandı |
| Demo veri deposu; doğrulama, şema geçişi, yedekleme ve kurtarma | Tamamlandı |
| Agile modülü: Product Backlog, sprint planlama, Kanban, Daily Scrum, Burndown ve Velocity | Tamamlandı |
| Merkezi talep havuzu, gereksinim yönetimi, test yönetimi, hata yönetimi ve izlenebilirlik ekranları | Planlandı |
| Sunucu tarafında kalıcı veri saklama ve kimlik doğrulama | Planlandı |

Bilinen sınırlar:
- Veriler yalnızca kullanılan tarayıcıda saklanır; farklı tarayıcı veya cihazlar arasında paylaşılmaz.
- Aynı anda birden fazla sekmede düzenleme yapıldığında son kaydedilen değişiklik geçerli olur.
- Depoda otomatik test altyapısı bulunmamaktadır.

---

## Kurulum ve yerel ortamda çalıştırma

### Gereksinimler
- Node.js 20.9.0 veya üzeri
- npm

### Kurulum

```bash
git clone <depo-adresi> flowpilot
cd flowpilot
npm ci
```

### Geliştirme sunucusu

```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır. İlk açılışta sentetik demo verisiyle başlar; yapılan değişiklikler tarayıcıda saklanır. Başlangıç verisine dönmek için sol menünün altındaki **Demo verisini sıfırla** düğmesi kullanılabilir.

### Kontroller ve production derlemesi

```bash
npx tsc --noEmit   # TypeScript tip kontrolü
npm run lint       # ESLint denetimi
npm run build      # Production derlemesi
npm run start      # Derlenmiş uygulamayı çalıştırma
```

### Proje yapısı

```
src/
├── app/                  Sayfalar (App Router) ve hata ekranı
│   ├── projeler/         Proje listesi ve proje detayı
│   ├── talepler/         Talepler ve analiz çalışma alanı
│   └── sprintler/        Sprint planlama, sprint panosu ve metrikler
├── components/
│   ├── agile/            Backlog, sprint, Kanban, Daily Scrum ve metrik bileşenleri
│   ├── analysis/         Analiz çalışma alanı bileşenleri
│   ├── requests/         Talep listesi ve formları
│   ├── projects/         Proje bileşenleri
│   ├── layout/           Uygulama kabuğu, kayıt durumu ve yedek bileşenleri
│   └── ui/               shadcn/ui bileşenleri
├── lib/
│   ├── domain/           Alan modeli (tipler)
│   └── demo/             Demo veri deposu, reducer'lar, selector'lar, doğrulama,
│                         şema geçişi, saklama ve sentetik başlangıç verisi
└── proxy.ts              Bilinmeyen proje adresleri için HTTP 404 yanıtı
```
