---
slug: harita-projeksiyonlari
title: Harita Projeksiyonları: Grönland Neden Bu Kadar Büyük?
description: Grönland neden Afrika kadar görünür? Mercator, Gall-Peters ve Robinson neyi doğru, neyi yanlış gösterir; worldmap.tech hangi projeksiyonu kullanır?
---
Düz bir dünya haritası mutlaka bir şeyi bozar, çünkü bir kürenin yüzeyi esnetilmeden ya da yırtılmadan düzleştirilemez. Harita projeksiyonu, haritacının neyden vazgeçeceğine dair verdiği karardır: şekillerin doğruluğundan mı, büyüklüklerin doğruluğundan mı, yoksa ikisinden biraz biraz mı? Grönland'ın bir haritada kıta gibi, başka bir haritada büyükçe bir ada gibi durmasının sebebi bu. worldmap.tech'teki harita Natural Earth projeksiyonunu kullanır: bütün dünyayı tek bakışta, hiçbir bölgeyi aşırı şişirmeden göstermek için tasarlanmış bir uzlaşma projeksiyonu.

## Kusursuz bir düz harita neden yok?

Bir portakalı soy ve kabuğunu masaya dümdüz bastırmayı dene. Ya yırtılır ya da bazı yerlerini esnetmen gerekir. Matematikçi Carl Friedrich Gauss bunun matematiksel karşılığını kanıtladı: bir kürenin yüzeyi, bozulma olmadan bir düzleme aktarılamaz. Bu yüzden her dünya haritası bir takastır ve projeksiyonlar kabaca üç aileye ayrılır:

- **Açı koruyan (konform)** projeksiyonlar açıları ve küçük alanların şeklini doğru tutar, ama büyüklükler kayar.
- **Alan koruyan (eşit alanlı)** projeksiyonlar her bölgeyi gerçek oranıyla gösterir, ama bunun için şekilleri büker.
- **Uzlaşma** projeksiyonları ikisinde de kusursuzluktan vazgeçer ve her türlü hatayı makul düzeyde tutmaya çalışır.

Bunların hiçbiri "doğru harita" değil. Her biri farklı bir soruya cevap veriyor.

## Mercator: Grönland ve Rusya neden dev gibi?

Flaman haritacı Gerardus Mercator projeksiyonunu 1569'da tanıttı. Açı koruyan bir projeksiyondur ve denizcilerin çok sevdiği bir özelliği vardır: pusulada sabit bir yönü izleyen rota, haritada düz bir çizgi olarak görünür. Pusulayla yön bulan biri için tam aranan şey.

Bedeli ise büyüklük. Mercator karaları ekvatordan uzaklaştıkça giderek daha çok büyütür. 60. enlemde, kabaca Helsinki'nin bulunduğu yerde, her şey hem enine hem boyuna iki kat uzar; yani bir alan, ekvatordaki aynı büyüklükteki alana göre dört kat büyük görünür. Kutuplara doğru bu uzama hiç durmaz. Antarktika'nın haritanın altında uçsuz bucaksız beyaz bir şerit gibi durması bundan. Birkaç gerçek rakam farkı netleştiriyor:

- **Grönland ve Afrika:** Grönland yaklaşık 2,17 milyon km², Afrika yaklaşık 30,4 milyon km². Yani Afrika aşağı yukarı 14 kat büyük, ama Mercator haritasında ikisi neredeyse aynı boyda görünür.
- **Rusya ve Afrika:** Rusya yaklaşık 17,1 milyon km². Mercator'da Afrika'dan büyük görünür, oysa Afrika onun neredeyse iki katı.
- **Grönland ve Türkiye:** Türkiye'nin yüzölçümü yaklaşık 783 bin km². Grönland bunun üç katından biraz az; Cezayir (yaklaşık 2,38 milyon km²) ve Kongo Demokratik Cumhuriyeti (yaklaşık 2,34 milyon km²) ise Grönland'dan biraz daha büyük.

Peki Mercator internette neden hâlâ her yerde? Google Haritalar 2005'te onun bir türevini benimsedi (genellikle Web Mercator denir) ve bu, web haritalarının standardı hâline geldi; OpenStreetMap, Bing Haritalar ve Mapbox da aynısını kullanıyor. Bir şehre yakınlaştığında önemli olan, sokakların doğru açılarla kesişmesi ve bir dönel kavşağın yuvarlak görünmesidir. Neredeyse açı koruyan bir projeksiyon her yakınlaştırma düzeyinde tam bunu sağlar. Bu servisler, kutuplar sonsuz uzakta kalacağı için haritayı kuzeyde ve güneyde yaklaşık 85. enlemde keser. Kısacası Mercator, yakındaki bir kafeyi bulmak için harika; gezegenin bütününü anlamak içinse yanıltıcı.

## Eşit alanlı haritalar: gerçek büyüklük, alışılmadık şekiller

Eşit alanlı projeksiyonlar büyüklük sorununu çözer: küre üzerinde aynı büyüklükte olan iki bölge, haritada da aynı yeri kaplar. En bilineni **Gall-Peters** projeksiyonudur. İlk kez 1855'te James Gall tarafından tanımlandı, 1973'ten itibaren de Arno Peters onu dünyanın daha adil bir resmi olarak tanıttı. Afrika'yı ve Güney Amerika'yı gerçek büyüklükleriyle gösterir, ama tropik bölgeler o kadar uzar ki Afrika kuzey-güney yönünde aşırı uzun görünür. ABD'de Boston devlet okulları Mart 2017'de sınıflarda Gall-Peters haritalarına geçmeye başlayınca tartışma yeniden gündeme geldi.

Daha doğal görünen eşit alanlı projeksiyonlar da var. İlk kez 1805'te yayımlanan **Mollweide**, dünyayı 2'ye 1 oranında bir elips içinde gösterir; büyüklükler doğrudur, ama kenarlara yaklaştıkça şekiller belirgin biçimde bozulur. 2018'de Bojan Šavrič, Bernhard Jenny ve Tom Patterson tarafından yayımlanan **Equal Earth** ise Boston haberlerinin ardından Gall-Peters'a göze daha hoş gelen bir alternatif olarak tasarlandı. Popüler Robinson haritasına epey benzer, ama her alanı gerçek oranında tutar.

## Uzlaşma haritaları: Robinson, Winkel Tripel ve Natural Earth

Atlasların çoğu uzlaşma projeksiyonlarını tercih eder. Arthur H. Robinson, **Robinson** projeksiyonunu 1963'te geliştirdi; National Geographic de 1988'den itibaren dünya haritalarında bunu kullandı. 1998'de ise Oswald Winkel'in 1921'de önerdiği **Winkel Tripel** projeksiyonuna geçti. Almancada "üçlü" anlamına gelen "Tripel", Winkel'in üç tür bozulmayı birden azaltma hedefinden geliyor: alan, yön ve mesafe.

**Natural Earth** projeksiyonu bu ailenin daha genç bir üyesi. ABD Ulusal Park Servisi'nden haritacı Tom Patterson onu 2007'de tasarladı; Robinson projeksiyonundan yola çıktı ve haritayı biraz daha yüksek yaptı. Ne açı koruyan ne de eşit alanlıdır. Onu, haritanın yan kenarlarının düz kutup çizgileriyle buluştuğu yuvarlatılmış köşelerinden tanıyabilirsin; Dünya'nın yuvarlak olduğunu hatırlatan küçük bir ayrıntı. Robinson gibi o da yüksek enlemleri biraz büyütür, ama bu büyütme Mercator'dakinin yanında çok hafif kalır.

## worldmap.tech hangisini kullanıyor ve neden?

worldmap.tech'teki [dünya haritası](/tr/), Natural Earth projeksiyonuyla çiziliyor (d3'ün geoNaturalEarth1 projeksiyonu). Ülke sınırları da Natural Earth'ten geliyor: gönüllülerin hazırladığı, Kuzey Amerikalı kartografların derneği NACIS'in desteklediği, kamu malı bir harita veri seti. Biz onun orta ölçekli 1:50m sürümünü kullanıyoruz. İsim benzerliği tesadüf değil: projeksiyonu tasarlayan Tom Patterson, veri setinin ilk yazarlarından biri. Yine de ikisi ayrı şeyler: biri kürenin nasıl düzleştirildiği, öteki ülkelerin şekilleri.

Gezdiğin ülkeleri gösteren bir harita için uzlaşma mantıklı bir seçim. Bütün dünyayı tek ekranda görmek, her kıtayı bir bakışta tanımak istersin ve Grönland'ın ya da Rusya'nın resmin yarısını yutmasını istemezsin. Küçük ülkeler elbette yine küçük kalır; arama kutusu tam da bunun için var.

## Büyük mavi alan, dünyadan büyük pay demek değil

Bu fark, kendi haritana bakarken önemli. Büyük bir ülke ekranın büyük kısmını kaplar, ama uygulamada yine tek bir ülkedir. Yüzde, toprak büyüklüğünü değil ülke sayısını ölçer: işaretlediğin ülke sayısı 195'e bölünür, yani BM'ye üye 193 ülke artı Vatikan ve Filistin. Rusya dünyadaki karaların yaklaşık %11'ini kaplar, ama onu işaretlemek de Vatikan'ı işaretlemek de sana aynı 1/195'i, yani yaklaşık 0,5 puanı kazandırır.

Bu iki yönlü işler. Rusya, Kanada, Çin, ABD, Brezilya ve Avustralya'yı, yani yüzölçümü en büyük altı ülkeyi gezersen haritan göz alıcı biçimde maviye boyanır, ama dünyanın yalnızca %3'ünü görmüş olursun. Birkaç yazı Avrupa'da yirmi ülke gezerek geçirirsen mavi alan oldukça küçük kalır, ama %10'a ulaşmış ve Dünya Gezgini olmuşsundur. 195 sayısının nereden geldiğini [dünyada kaç ülke var](/rehber/dunyada-kac-ulke-var/) yazısında, her eşiği de [gezgin seviyeleri](/rehber/gezgin-seviyeleri/) rehberinde bulabilirsin.

Haritayı aç, gittiğin ülkelere dokun ve ekranın ne kadarının maviye döndüğünü gerçek ülke sayınla bir karşılaştır.
