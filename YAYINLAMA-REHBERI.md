# Xentora Design — Yayınlama & Kullanım Rehberi

## Admin Giriş Bilgin
```
Kullanıcı adı : ozantaskin1491
Şifre         : Oozan4651.
```
Panele giriş: **siten.netlify.app/admin/**
> Not: Bu giriş bilgisi sitenin kod dosyasında saklıdır (statik hosting'in doğası).
> Kişisel portföy için yeterli ama "banka güvenliği" değildir. Şifreyi değiştirmek
> istersen `admin/admin.js` dosyasının en üstündeki `AUTH` satırını düzenle.

═══════════════════════════════════════════════
## Netlify'a Yükleme (Sürükle-Bırak)
═══════════════════════════════════════════════
1. https://app.netlify.com → giriş yap.
2. **"Add new site" → "Deploy manually"** (veya sağ paneldeki "Drag and drop" alanı).
3. `tasarım site` KLASÖRÜNÜ olduğu gibi bu alana sürükle-bırak.
4. Birkaç saniyede site yayında. Adres örn: `xentora-design.netlify.app`
   - Adı değiştir: **Site configuration → Change site name**

Not: Netlify Identity / giriş ayarı YAPMANA GEREK YOK. Kaldırıldı.

═══════════════════════════════════════════════
## Tasarım Ekleme (Günlük Kullanım)
═══════════════════════════════════════════════
1. **siten.netlify.app/admin/** → kullanıcı adı + şifre ile gir.
2. Soldaki formdan: Başlık yaz → Kategori seç → Resmi/GIF'i sürükle veya seç → **"Tasarımı Ekle"**.
3. Eklediğin tasarım **hemen senin bilgisayarında** sitede görünür.

### Herkesin görmesi için (YAYINLAMA):
4. Panelde sağ üstteki **"⬇ Yayınla (designs.json indir)"** butonuna bas.
5. İnen **designs.json** dosyasını `tasarım site/data/` klasörüne koy
   (eskisinin üzerine yaz).
6. `tasarım site` klasörünü tekrar Netlify'a sürükle-bırak yap.
   → Artık tüm ziyaretçiler yeni tasarımı görür.

> Kısaca: Ekle → (kendi ekranında görürsün) → Yayınla → data/ içine koy →
> tekrar sürükle-bırak → herkes görür.

═══════════════════════════════════════════════
## Özellikler
═══════════════════════════════════════════════
- Resim boyutu ne olursa olsun **kırpılmadan, oranı korunarak** gösterilir (afiş, dikey, kare, banner hepsi uyum sağlar).
- GIF ve MP4 otomatik oynar, üstünde "GIF" rozeti çıkar.
- Kategori filtreleri, tıklayınca büyüten görüntüleyici (lightbox), ok tuşlarıyla gezinme.
- Koyu premium tema, animasyonlar, mobil uyumlu.

## İletişim Bilgilerini Değiştirme
`index.html` içinde `iletisim@xentora.design` ve Discord linkini kendi bilgilerinle değiştir.
