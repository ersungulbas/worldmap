# worldmap.tech yayına alma (Cloudflare Pages)

Site, bu depodaki `site/` klasörüdür. Cloudflare bir şey derlemez, klasörü olduğu gibi yayınlar.
`site/_worker.js` yalnızca `/api/*` isteklerini (geri yükleme kodu) karşılar, geri kalan her şey statik dosyadır.

## 1. Pages projesini GitHub'a bağla
1. Cloudflare paneli → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → GitHub → `ersungulbas/worldmap`.
2. Ayarlar:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(boş bırak)*
   - Build output directory: `site`
   - **Environment variables** → `SKIP_DEPENDENCY_INSTALL` = `1` (site önceden derlenmiş; gereksiz paket kurulumunu atlar)
3. **Save and Deploy**. Site `https://<proje>.pages.dev` adresinde açılır.

## 2. Geri yükleme kodu veritabanı (D1)
1. **Workers & Pages** → **D1 SQL Database** → **Create** → ad: `worldmap`.
   *Location* seçeneği varsa **Eastern Europe** seç (Türkiye'ye en yakın bölge).
2. Pages projesi → **Settings** → **Bindings** → **Add** → **D1 database**
   - Variable name: `DB`
   - D1 database: `worldmap`
   - Production ve Preview için ayrı ayrı ekle.
3. **Deployments** → en son yayın → **Retry deployment** (bağlantının devreye girmesi için).
Tablo ilk istekte kendiliğinden oluşur. Saklanan tek şey: 8 haneli kod, ülke listesi, zaman damgaları.
IP adresi ve tarayıcı bilgisi saklanmaz. 24 ay kullanılmayan kodlar kendiliğinden silinir.
Not: D1'in *Time Travel* yedeği silinen kayıtları 7 gün (ücretli planda 30 gün) daha tutar ve kapatılamaz;
gizlilik metninde "en fazla 30 gün" olarak yazıyor.

4. Pages projesi → **Settings** → **Functions** (veya *Observability*) bölümünde **Workers Logs** / kalıcı
   istek kayıtları açıksa kapat. Kendi tarafımızda IP kaydı tutmamak gizlilik metnindeki sözümüz.

## 3. Kapalı devre test
- `main` dışındaki her dal ayrı bir önizleme adresi alır (ör. `test` dalı → `https://test.<proje>.pages.dev`).
  Önizleme adreslerini Cloudflare arama motorlarına kapatır.
- Önizlemeleri yalnızca sana açmak için: Pages projesi → **Settings** → **General** → **Access policy** →
  *Enable access policy*. Cloudflare Access'te yalnızca kendi e-posta adresine izin ver.
- Testler bitene kadar alan adını bağlama (adım 4).

## 4. Alan adı
1. Pages projesi → **Custom domains** → **Set up a custom domain** → `worldmap.tech`.
   Alan adı Cloudflare'da olduğu için DNS kaydı kendiliğinden eklenir.
2. `www.worldmap.tech` için de aynısını yap, sonra **Rules** → **Redirect Rules** → şablon
   *Redirect from WWW to root* ile `www` → `worldmap.tech` (301).

## 5. İletişim adresi
**Email** → **Email Routing** → `iletisim@worldmap.tech` adresini kendi e-postana yönlendir.
Bu adres gizlilik politikasında ve koşullarda yazıyor (KVKK başvuruları ve 5651 iletişim yükümlülüğü).

## 6. Ziyaretçi istatistiği
Pages projesi → **Metrics** → **Web Analytics** → **Enable**. Çerezsizdir, onay gerektirmez.

## 7. Kötüye kullanım sınırı (zorunlu)
**Security** → **WAF** → **Rate limiting rules** → yeni kural:
URI Path *starts with* `/api/code` → IP başına 10 saniyede 20 istek → Block (10 saniye).
Bu kural olmadan biri kodları deneme yoluyla tahmin etmeye çalışabilir veya veritabanını doldurabilir.

## 8. AdSense (site alan adında yayına girdikten sonra)
1. https://adsense.google.com → site olarak `worldmap.tech` ekle ve başvur.
2. **Ads** → **By ad unit** → **Display ads** → yatay, responsive bir birim oluştur.
3. Yayıncı kimliğini (`ca-pub-…`) ve birim numarasını (slot) Claude'a yaz. `site.config.json` → `ads`
   alanına girilir ve site yeniden yayınlanır; `ads.txt` ve doğrulama etiketi kendiliğinden oluşur.
4. **Privacy & messaging** → *European regulations* ve *US state regulations* mesajlarını oluşturup yayınla.
   AB/İngiltere/İsviçre ve ABD ziyaretçilerine Google'ın onaylı izin penceresi çıkar; diğer ülkelerde
   (Türkiye dahil) sitenin kendi izin çubuğu çıkar ve reklam yalnızca "Kabul et" sonrası yüklenir.
5. **Auto ads**'i kapalı tut: reklam yalnızca "Kaydet" ekranındaki birimde görünür, haritanın üstüne ve
   indirilen görsele asla gelmez.

## Geliştirme
```
npm install
npm run build          # site/ ve önizleme dosyasını üretir
npm run dev            # http://127.0.0.1:8788 (yerel D1 ile)
npm run labels         # harita etiketlerini yeniden hesaplar (dev sunucusu açıkken)
npm test               # dev sunucusu açıkken uçtan uca testler (Playwright)
npm run test:consent   # izin çubuğu ve reklam yüklemesi testi (deneme kimlikleriyle)
```
`site.config.json`: alan adı, iletişim adresi, veri sorumlusu adı/şehri/telefonu (`owner`), AdSense kimlikleri.
`owner.name` ve `owner.city` boşken gizlilik ve koşul sayfalarında sarı "eklenecek" işareti görünür;
alan adı herkese açılmadan önce doldurulmalı. `owner.phone` doluysa İletişim bölümüne telefon satırı eklenir.

## Yayından önce yasal kontrol listesi
- `owner` bilgileri dolduruldu (5651: ad soyad, yerleşim yeri, e-posta; telefon için avukata danış).
- `iletisim@worldmap.tech` yönlendirmesi çalışıyor (adım 5).
- Cloudflare'a KVKK standart sözleşmesi (veri sorumlusundan veri işleyene) soruldu. İmzalanırsa
  5 iş günü içinde KVKK'ya *Standart Sözleşme Bildirim Modülü* veya KEP ile bildirilir.
- WAF kuralı (adım 7) açık, Workers Logs kapalı (adım 2.4).
- Metinler bir avukata bir kez okutuldu; AdSense geliri için mali müşavire danışıldı.
