# Xentora Design — Yayınlama & Kullanım Rehberi

Bu site artık **kalıcı bir backend** (Turso veritabanı + Netlify Functions) kullanır.
Admin panelinden eklediğin tasarım **anında yayına girer, herkes görür ve asla kaybolmaz.**
Eskisi gibi "designs.json indir → tekrar yükle" derdi YOK.

---

## Admin Giriş Bilgin
```
Kullanıcı adı : ozantaskin1491
Şifre         : (Netlify'da ADMIN_PASSWORD olarak ayarladığın şifre)
```
Panele giriş: **siten.netlify.app/admin/**

> Şifre artık kod dosyasında DEĞİL, Netlify'ın gizli ortam değişkenlerinde (`ADMIN_PASSWORD`)
> tutulur — çok daha güvenli. Şifreyi değiştirmek: Netlify → Site settings →
> Environment variables → `ADMIN_PASSWORD` değerini düzenle → yeniden deploy.
> Kullanıcı adını değiştirmek: `admin/admin.js` en üstteki `USERNAME` satırı.

═══════════════════════════════════════════════
## Günlük Kullanım (Tasarım Ekleme)
═══════════════════════════════════════════════
1. **siten.netlify.app/admin/** → kullanıcı adı + şifre ile gir.
2. Başlık yaz → Kategori seç → Resmi/GIF'i sürükle veya seç → **"Tasarımı Ekle"**.
3. Bitti. Tasarım **anında** ana sitede ve herkeste görünür. Başka hiçbir şey yapmana gerek yok.

Silmek için: listede tasarımın yanındaki 🗑 → onayla. O da anında kalkar.

═══════════════════════════════════════════════
## İLK KURULUM (yalnızca 1 kez)
═══════════════════════════════════════════════
Backend çalışsın diye şu tek seferlik adımlar gerekiyor:

### 1) Turso veritabanı oluştur (ücretsiz)
En kolayı **https://turso.tech** → giriş yap → yeni database oluştur
(örn. adı: `xentora-design`). Sonra sana lazım iki değer:
- **Database URL** (`libsql://...`)
- **Auth Token** (uzun bir anahtar)

> Terminalden yapmak istersen (Turso CLI kuruluysa):
> ```
> turso db create xentora-design
> turso db show xentora-design --url        # URL'yi verir
> turso db tokens create xentora-design     # token'ı verir
> ```

### 2) Projeyi GitHub'a yükle
Bu klasör bir git deposu. GitHub'da boş bir repo aç, sonra:
```
git remote add origin https://github.com/KULLANICI/xentora-design.git
git push -u origin main
```

### 3) Netlify'ı GitHub'a bağla
Netlify → **Add new site → Import from Git** → bu repoyu seç.
- Build command: **boş bırak**
- Publish directory: **.**  (netlify.toml zaten ayarlı, fonksiyonlar otomatik bulunur)

### 4) Ortam değişkenlerini (secrets) gir
Netlify → **Site settings → Environment variables** → şunları ekle:
| İsim | Değer |
|------|-------|
| `TURSO_DATABASE_URL` | Turso'dan aldığın `libsql://...` URL |
| `TURSO_AUTH_TOKEN`   | Turso'dan aldığın auth token |
| `ADMIN_PASSWORD`     | Panele girişte kullanacağın şifre |

### 5) Deploy et
Netlify otomatik deploy eder. İlk açılışta veritabanı tablosu kendiliğinden oluşur ve
repodaki 4 örnek tasarım otomatik yüklenir. Hazırsın.

> Bundan sonra kod değişikliği yaptığında sadece `git push` yeter — Netlify otomatik yeniler.
> Tasarım eklemek için ise koda dokunmana bile gerek yok, panelden ekliyorsun.

═══════════════════════════════════════════════
## Özellikler
═══════════════════════════════════════════════
- Tasarımlar ve görseller **Turso'da kalıcı** — tarayıcı temizlense/cihaz değişse de durur.
- Eklenen tasarım anında herkeste görünür (backend sayesinde).
- Resim oranı korunur, kırpılmaz (afiş, dikey, kare, banner uyum sağlar).
- GIF/MP4 otomatik oynar, "GIF" rozeti çıkar.
- Kategori filtreleri, lightbox, ok tuşlarıyla gezinme, koyu premium tema, mobil uyumlu.

## Notlar
- Görseller veritabanında base64 saklanır — tek tek **~4.3MB altında** tut (çok büyük dosyalar reddedilir).
- İletişim linkleri (Discord / WhatsApp) `index.html` içindeki iletişim bölümünde.
