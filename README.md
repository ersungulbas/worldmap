# worldmap.tech

Gittiğin ülkeleri haritada işaretle, dünyanın yüzde kaçını gördüğünü öğren, görselini kaydet ve arkadaşınla karşılaştır.

- `src.html`: uygulamanın tamamı (harita, arama, kaydetme, QR, geri yükleme kodu, izin çubuğu)
- `build.js`: `site/` (Cloudflare Workers, ayarlar `wrangler.jsonc` içinde) ve `worldmapnet.html` (tek dosyalık önizleme) üretir
- `server/_worker.js`: `/api/code` geri yükleme kodu servisi (Cloudflare D1)
- `content/`: SSS, meta metinleri, gizlilik ve koşullar, hakkında sayfası
- `content/guides/`: rehber yazıları (`<anahtar>.tr.md` ve `<anahtar>.en.md`, başta slug/title/description)
- `data/`: harita (Natural Earth / world-atlas, Türkiye Cumhuriyeti'nin resmi tutumlarına göre sınırlar), ülke adları, önceden hesaplanmış etiketler
- `prep2.js`, `names.js`: harita verisini kaynaktan yeniden üretir (Natural Earth dosyaları gerekir)

Yayına alma adımları: [DEPLOY.md](DEPLOY.md)
