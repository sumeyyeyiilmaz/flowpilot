# FlowPilot — Ürün Genel Bakışı

**Agile odaklı Proje Yönetim Sistemi · Demo MVP · Sürüm 0.1.0**

Bu doküman FlowPilot'un mevcut ürün kapsamını açıklar. Yalnızca uygulamada geliştirilmiş ve kullanılabilir durumdaki özellikler "Mevcut kapsam" altında yer alır; henüz geliştirilmemiş alanlar "Gelecek geliştirmeler" bölümünde ayrıca listelenir.

> **Demo sürümü:** Uygulamadaki tüm proje, talep, analiz, ekip ve sprint kayıtları sentetik demo verisidir; gerçek bir kurum, müşteri veya kişiyle ilişkisi yoktur. Veriler yalnızca kullanılan tarayıcıda saklanır. Uygulamaya gerçek veya hassas veri girilmemelidir.

---

## 1. Ürün tanımı

FlowPilot, projeleri, talepleri, analiz çalışmalarını, gereksinimleri ve sprint süreçlerini birbirine bağlı olarak tek bir uygulamada yöneten, **Agile odaklı bir Proje Yönetim Sistemi**dir.

Ürünün temel yaklaşımı, kayıtlar arasındaki ilişkilerin izlenebilir olmasıdır. Bu ilişkiler sabit, adım adım ilerleyen bir iş akışı dayatmaz. Bazı bağlantılar zorunlu, bazıları isteğe bağlıdır:

| Kayıt | Zorunlu bağlantı | İsteğe bağlı bağlantı |
|---|---|---|
| Talep | Bir proje | — |
| Analiz | Bir talep | — |
| Gereksinim | Bir talep ve o talebe ait bir analiz | Analizin bir bölümü |
| Sprint | Bir proje | — |
| Sprint işi | Bir proje; "Hata" türündeyse aynı projeye ait ve başka bir işe bağlı olmayan bir hata kaydı | Aynı projedeki bir talep, analiz ve/veya gereksinimler; bir sprint |

Buna göre:
- Bir talep için analiz yapılması zorunlu değildir; bir talebin birden fazla analizi olabilir.
- Sprint işleri talep, analiz veya gereksinim olmadan doğrudan Product Backlog'da oluşturulabilir.
- Bir sprint işi bağlandığı kayıtlar ile aynı projede olmalıdır.
- Bir sprinte atanmamış iş Product Backlog'da yer alır.

Test senaryosu, test sonucu ve hata kaydı veri modelinde ve sentetik verilerde yer alır; bunlara ait yönetim ekranları henüz geliştirilmemiştir (bkz. [Gelecek geliştirmeler](#3-gelecek-geliştirmeler)).

### Hedef kullanım
- Talep, analiz, gereksinim ve sprint bilgisini tek bir yerde, birbirine bağlı olarak tutmak.
- Bağlantı kurulmuş sprint işlerinin hangi talep, analiz ve gereksinimlerle ilişkili olduğunu görebilmek.
- Teslimatı Product Backlog, sprint planlama, Kanban, Daily Scrum, Burndown ve Velocity ile yönetmek.

---

## 2. Mevcut kapsam

Bu bölümdeki özelliklerin tamamı geliştirilmiş ve kullanılabilir durumdadır.

### 2.1 Proje Yönetimi
**Ekran:** `/projeler`

| Özellik | Açıklama |
|---|---|
| Proje listesi | Her proje için durum, sorumlu kişi ve hedef tarih; proje başına talep, analiz, gereksinim ve açık hata sayıları. |
| Proje detayı | Proje özeti, başlangıç ve hedef tarihleri, projeye bağlı talepler. Talepler türe göre filtrelenebilir. |
| Geçersiz adres yönetimi | Bulunmayan proje adresleri için HTTP 404 yanıtı döner. |

Demo sürümünde projeler sentetik başlangıç verisinden gelir; arayüzden proje oluşturma bulunmamaktadır.

### 2.2 Talep Yönetimi
**Ekranlar:** `/talepler`, `/talepler/analiz`

**Talepler**

| Özellik | Açıklama |
|---|---|
| Talep listesi | Tüm projelerin talepleri tek listede gösterilir; talep türü, proje, durum ve metin aramasıyla filtrelenebilir. |
| Talep türleri | **Yeni İş Talebi** ve **Mevcut Sistem Değişikliği**. |
| Oluşturma ve düzenleme | Başlık, açıklama, proje, tür, öncelik ve durum alanları; alan doğrulaması ve anlaşılır hata mesajları. |
| Proje bağlantısı | Her talep bir projeye bağlıdır ve ilgili proje detayında listelenir. |

**Analiz çalışma alanı**

| Özellik | Açıklama |
|---|---|
| Çoklu analiz | Bir talep için birden fazla analiz oluşturulabilir; önceki analizler korunur. |
| Esnek bölümler | Analiz sabit bir şablona bağlı değildir. Metin, liste ve kontrol listesi bölümleri eklenebilir, düzenlenebilir, silinebilir ve sıralanabilir. Talep türüne göre isteğe bağlı başlangıç bölümleri sunulur. |
| Otomatik kayıt | Analiz başlığı, açıklaması, durumu ve bölüm içerikleri yazıldıkça kaydedilir. |
| Gereksinim bağlantısı | Gereksinimler analiz içinden oluşturulur ve düzenlenir. Her gereksinim talebe ve analize bağlıdır; analiz bölümüne bağlantı isteğe bağlıdır. |

### 2.3 Product Backlog ve Sprint Yönetimi
**Ekran:** `/sprintler`

**Product Backlog**

| Özellik | Açıklama |
|---|---|
| İş yönetimi | İş oluşturma, düzenleme ve kullanıcı onayıyla silme. |
| Önceliklendirme | İşler öncelik sırasına göre listelenir ve yukarı/aşağı taşınarak sıralanır. |
| İş türleri | Story, Görev, Hata, Spike. |
| Tahminleme | Story Point (1, 2, 3, 5, 8, 13) ve isteğe bağlı tahmini efor (saat). |
| Atama | İşler sentetik ekip üyelerine atanabilir. |
| İzlenebilirlik | İşler isteğe bağlı olarak aynı projedeki talep, analiz ve gereksinimlere bağlanabilir. "Hata" türündeki iş, aynı projedeki mevcut bir hata kaydına bağlanmak zorundadır; aynı hata kaydı ikinci bir işe bağlanamaz. |

**Sprint yönetimi**

| Özellik | Açıklama |
|---|---|
| Sprint yaşam döngüsü | Sprint oluşturma, düzenleme, başlatma ve kapatma. Yeni sprint "Planlandı" durumunda oluşturulur. |
| Sprint planlama | Backlog işleri planlanan veya aktif sprinte eklenir; sprintten çıkarılan iş Product Backlog'a döner. |
| Görünümler | Aktif, planlanan ve tamamlanan sprintler ayrı sekmelerde listelenir; her sprint için planlanan, tamamlanan ve kalan Story Point gösterilir. |
| Proje filtresi | Backlog ve sprintler proje bazında görüntülenir. |

**İş kuralları**
- Bir projede aynı anda yalnızca bir aktif sprint bulunabilir.
- Sprint kapatıldığında taahhüt edilen ve tamamlanan puanları içeren **değişmez bir özet** kaydedilir.
- Sprint kapatıldığında tamamlanmamış işler Product Backlog'a döner; tamamlanan işler sprintte kalır.
- Tamamlanmış sprintlerdeki işler kilitlidir; tür, Story Point, efor ve hata bağlantısı değiştirilemez, iş silinemez.
- Tamamlanmış bir sprintin kapanış özetinde yer alan işler, sonradan Product Backlog'a dönmüş olsalar bile silinemez.

### 2.4 Kanban ve Daily Scrum
**Ekran:** `/sprintler/pano`

**Kanban panosu**

| Özellik | Açıklama |
|---|---|
| Sütunlar | Yapılacak, Devam Ediyor, İncelemede, Tamamlandı. Her sütunda iş sayısı ve toplam Story Point gösterilir. |
| İş kartları | Kod, başlık, iş türü, Story Point ve atanan kişi. |
| Durum değişikliği | Önceki/sonraki sütuna taşıma veya doğrudan durum seçimi. |
| Erişim kuralı | Durum değişikliği yalnızca **aktif sprintte** yapılabilir. Tamamlanmış sprintler salt okunurdur; planlanan sprintlerde pano düzenlenemez. |

**Daily Scrum**

| Özellik | Açıklama |
|---|---|
| Kayıt içeriği | Her ekip üyesi için *dün*, *bugün* ve *engeller* alanları. |
| Gün seçimi | Sprint günleri arasında geçiş; her günün kayıt sayısı gösterilir. Engeller ayrıca vurgulanır. |
| Tekil kayıt | Aynı sprint, kişi ve tarih için yeni kayıt oluşturulmaz; mevcut kayıt güncellenir. |
| Erişim kuralı | Kayıt yalnızca aktif sprintte ve sprint tarih aralığında girilebilir; tamamlanmış sprintlerin kayıtları salt okunurdur. |

### 2.5 Burndown ve Velocity metrikleri
**Ekran:** `/sprintler/metrikler`

| Metrik | Açıklama |
|---|---|
| Burndown | Seçilen sprint için gerçekleşen kalan Story Point ve ideal çizgi. Grafik, fare veya klavye ile gün gün incelenebilir; değerler tablo görünümünde de sunulur. |
| Velocity | Tamamlanmış sprintlerde taahhüt edilen ve tamamlanan Story Point ile ortalama. |
| Sprint karşılaştırması | Tamamlanmış sprintlerin taahhüt edilen ve tamamlanan puanları, tamamlanma oranı ve sonraki döneme taşınan iş sayısı. Aktif sprint ayrı satırda gösterilir. |
| Proje özeti | Velocity ortalaması, tamamlanmış sprint sayısı, aktif sprint puanları ve Product Backlog büyüklüğü. |

**Hesaplama ilkeleri**
- **Burndown hesabı günlük geçmiş anlık görüntülerine dayanmaz.** Her günün kalan puanı, sprint kapsamından o güne kadar tamamlanan işlerin puanı düşülerek hesaplanır. Kapsam olarak tamamlanmış sprintte kapanış özeti, aktif sprintte sprintin mevcut içeriği kullanılır. Sprint içinde eklenen veya çıkarılan işler geçmiş günlere ayrıca yansıtılmaz. Bu durum ekranda belirtilir.
- Gelecek günler için değer üretilmez.
- **Velocity yalnızca tamamlanmış sprintlerin kapanış özetlerinden hesaplanır;** aktif sprintteki ilerleme Velocity'yi etkilemez. Üçten az tamamlanmış sprint olduğunda ortalamanın henüz güvenilir bir gösterge olmadığı belirtilir.
- Veri yetersiz olduğunda (sprint başlamamışsa, puanlanmış iş yoksa, tamamlanmış sprint yoksa) grafik yerine açıklayıcı bir boş durum gösterilir.
- Tarih ve gün hesapları **Europe/Istanbul** saat dilimine göre yapılır.

### 2.6 Ortak özellikler

| Alan | Açıklama |
|---|---|
| Arayüz | Türkçe, mobil ve masaüstü uyumlu arayüz; masaüstünde sabit, mobilde açılır menü. |
| Genel Bakış | İstatistik kartları, proje ilerlemesi ve son aktiviteler. Bu sayfadaki göstergeler sabit sentetik değerlerdir; demo veri deposuna bağlı değildir. |
| Veri saklama | Veriler tarayıcının `localStorage` alanında saklanır; sunucu, veritabanı veya harici servis kullanılmaz. |
| Veri koruma | Okunan veri doğrulanır. Okunamayan veri silinmez ve üzerine yazılmaz; yedeklenir (en fazla üç yedek) ve uygulama kurtarma moduna geçer. Eski şemadaki veri, geçişten önce yedeklenerek güncel şemaya geçirilir. |
| Veri yönetimi | Mevcut veri ve yedekler indirilebilir; demo verisi kullanıcı onayıyla sıfırlanabilir. Kayıt başarısız olursa kullanıcı açıkça uyarılır ve tekrar kaydetme seçeneği sunulur. |

---

## 3. Gelecek geliştirmeler

Aşağıdaki alanlar **mevcut sürümde bulunmamaktadır.** Menüde yer alan ilgili sayfalar şu an "geliştirme aşamasında" bilgisini gösterir.

| Alan | Mevcut durum |
|---|---|
| **Merkezi talep havuzu** | Taleplerin projeye atanmadan önce toplandığı, değerlendirildiği ve önceliklendirildiği ortak bir giriş noktası yoktur. Mevcut sürümde her talep oluşturulurken bir projeye bağlanır. |
| **Gereksinim yönetimi** | Gereksinimlerin tüm projeler genelinde listelendiği ve yönetildiği bağımsız ekran (`/gereksinimler`) geliştirilmemiştir. Gereksinimler yalnızca analiz çalışma alanı içinden yönetilebilir. |
| **Test yönetimi** | Test senaryoları ve test sonuçlarının yönetimi (`/test-yonetimi`) geliştirilmemiştir. |
| **Hata yönetimi** | Hata kayıtlarının oluşturulduğu ve izlendiği ekran (`/hata-yonetimi`) geliştirilmemiştir. Mevcut hata kayıtları yalnızca sentetik veride bulunur ve "Hata" türündeki sprint işlerine bağlanabilir. |
| **İzlenebilirlik görünümü** | Talep, analiz, gereksinim, sprint işi, test ve hata kayıtları arasındaki ilişkilerin tek ekranda gösterildiği görünüm (`/izlenebilirlik`) ve gereksinimden doğrudan sprint işi oluşturma geliştirilmemiştir. |
| **Dış entegrasyonlar** | Uygulama herhangi bir harici sistem veya servisle bağlantı kurmaz; dış entegrasyon bulunmamaktadır. |
| **Kalıcı altyapı** | Sunucu tarafında kalıcı veri saklama, kimlik doğrulama ve yetkilendirme bulunmamaktadır. |
| **Genel Bakış verisi** | Genel Bakış sayfası demo veri deposundaki kayıtlara bağlı değildir; göstergeler sabit sentetik değerlerdir. |
| **Tema değiştirici** | Koyu tema stilleri mevcuttur ancak kullanıcı tarafından seçilememektedir. |
| **İleri seviye Agile** | Kanban'da sürükle-bırak, sprint içi kapsam değişikliklerini gösteren Burndown ve iş günü takvimi bulunmamaktadır. |

---

## 4. Bilinen sınırlar

- Veriler yalnızca kullanılan tarayıcıda saklanır; farklı tarayıcı veya cihazlar arasında paylaşılmaz.
- Aynı anda birden fazla sekmede düzenleme yapıldığında son kaydedilen değişiklik geçerli olur.
- Burndown, sprint içi kapsam değişikliklerini geçmiş günlere yansıtmaz; hafta sonları dahil tüm takvim günlerini sayar.
- Depoda otomatik test altyapısı bulunmamaktadır.

---

*Kurulum ve teknik bilgiler için proje kök dizinindeki [README.md](../README.md) dosyasına bakınız.*
