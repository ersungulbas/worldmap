# worldmap.tech yayına alma (Cloudflare Workers)

Site, bu depodaki `site/` klasörüdür ve önceden derlenmiştir. Cloudflare bir şey derlemez, yalnızca
`npx wrangler deploy` çalıştırır. Bütün ayarlar `wrangler.jsonc` dosyasındadır:
- `site/` klasörü statik dosya olarak yayınlanır.
- `/api/*` istekleri `server/_worker.js` ile karşılanır (geri yükleme kodu).
- `worldmap` adlı D1 veritabanı ilk yayında kendiliğinden oluşturulur, sonraki yayınlarda aynısı kullanılır.
- İstek kayıtları (Workers Logs) kapalıdır.

Panelden binding veya değişken ekleme: her yayında `wrangler.jsonc` esas alınır, panelde elle eklenenler silinir.

## 1. Worker'ı GitHub'a bağla (yapıldı: 20 Ekim 2026)
Workers & Pages → Create → Import a repository → `ersungulbas/worldmap`.
- Project name: `worldmap` (`wrangler.jsonc` içindeki adla aynı olmalı)
- Build command: boş
- Deploy command: `npx wrangler deploy`
- Non-production branch deploy command: `npx wrangler versions upload`
- Variables: `SKIP_DEPENDENCY_INSTALL` = `1` (isteğe bağlı, kurulumu hızlandırır)

`main` dalına her gönderim canlıya çıkar. Diğer dallar yalnızca önizleme adresi alır.

## 2. Kapalı devre test
- Worker sayfası → **Settings** → **Domains & Routes** bölümünde `worldmap.<hesap>.workers.dev` adresi görünür.
- Bu adres yalnızca bilenler tarafından açılabilir. Tamamen kapatmak için aynı yerde workers.dev satırındaki
  **Cloudflare Access** seçeneğini aç ve yalnızca kendi e-postana izin ver.
- Testler bitene kadar alan adını bağlama.

## 3. Alan adı (yapıldı: 20 Ekim 2026)
`wrangler.jsonc` içindeki `routes` satırları `worldmap.tech` ve `www.worldmap.tech` adreslerini Worker'a bağlar;
Cloudflare DNS kayıtlarını ve sertifikaları yayında kendisi kurar.
`www` adresini ana adrese yönlendirmek için: worldmap.tech → **Rules** → **Overview** → **Create rule** →
**Redirect Rule** → şablon *Redirect from WWW to root* → **Deploy**. Bu kural Worker'dan önce çalışır.

## 4. İletişim adresi
**Email** → **Email Routing** → `iletisim@worldmap.tech` adresini kendi e-postana yönlendir.
Bu adres gizlilik politikasında ve koşullarda yazıyor (KVKK başvuruları ve 5651 iletişim yükümlülüğü).

## 5. Kötüye kullanım sınırı (kodda)
`server/_worker.js`, aynı bağlantıdan 10 saniyede 20'den fazla `/api/` isteğini ve 5'ten fazla yeni kodu 429 ile reddeder.
Sayaçlar yalnızca birkaç saniye bellekte tutulur, IP adresi hiçbir yere yazılmaz. Ücretli WAF kuralı gerekmez.

## 6. Ziyaretçi istatistiği
**Analytics & Logs** → **Web Analytics** → **Add a site** → `worldmap.tech` → otomatik kurulum. Çerezsizdir, onay gerektirmez.

## 7. AdSense (site alan adında yayına girdikten sonra)
1. https://adsense.google.com → site olarak `worldmap.tech` ekle ve başvur.
2. **Ads** → **By ad unit** → **Display ads** → yatay, responsive bir birim oluştur.
3. Yayıncı kimliğini (`ca-pub-…`) ve birim numarasını (slot) Claude'a yaz. `site.config.json` → `ads`
   alanına girilir ve site yeniden yayınlanır; `ads.txt` ve doğrulama etiketi kendiliğinden oluşur.
4. **Privacy & messaging** → *European regulations* ve *US state regulations* mesajlarını oluşturup yayınla.
   AB/İngiltere/İsviçre ve ABD ziyaretçilerine Google'ın onaylı izin penceresi çıkar; diğer ülkelerde
   (Türkiye dahil) sitenin kendi izin çubuğu çıkar ve reklam yalnızca "Kabul et" sonrası yüklenir.
5. **Auto ads**'i kapalı tut: reklam yalnızca "Kaydet" ekranındaki birimde görünür, haritanın üstüne ve
   indirilen görsele asla gelmez.

## Veritabanı notları
Saklanan tek şey: 8 haneli kod, ülke listesi, zaman damgaları. IP adresi ve tarayıcı bilgisi saklanmaz.
24 ay kullanılmayan kodlar kendiliğinden silinir. D1'in *Time Travel* yedeği silinen kayıtları 7 gün
(ücretli planda 30 gün) daha tutar ve kapatılamaz; gizlilik metninde "en fazla 30 gün" olarak yazıyor.

## Geliştirme
```
npm install
npm run build          # site/ ve önizleme dosyasını üretir
npm run dev            # http://127.0.0.1:8788 (wrangler dev, yerel D1 ile)
npm run labels         # harita etiketlerini yeniden hesaplar (dev sunucusu açıkken)
npm test               # dev sunucusu açıkken uçtan uca testler (Playwright)
npm run test:consent   # izin çubuğu ve reklam yüklemesi testi (deneme kimlikleriyle)
```
Kaynak değişince `npm run build` çalıştırıp `site/` klasörünü de commit et; Cloudflare derleme yapmaz.

`site.config.json`: alan adı, iletişim adresi, veri sorumlusu adı/şehri/telefonu (`owner`), AdSense kimlikleri.
`owner.phone` doluysa İletişim bölümüne telefon satırı eklenir.

## Yayından önce yasal kontrol listesi
- `owner` bilgileri dolduruldu (5651: ad soyad, yerleşim yeri, e-posta; telefon için avukata danış).
- `iletisim@worldmap.tech` yönlendirmesi çalışıyor (adım 4).
- Cloudflare'a KVKK standart sözleşmesi (veri sorumlusundan veri işleyene) soruldu. İmzalanırsa
  5 iş günü içinde KVKK'ya *Standart Sözleşme Bildirim Modülü* veya KEP ile bildirilir.
- Metinler bir avukata bir kez okutuldu; AdSense geliri için mali müşavire danışıldı.
