# Leoparlı İlaç Takibi

Next.js tabanlı temel ilaç takip uygulaması.

## Başlatma

1. Proje dizinine girin:
   ```bash
   cd "C:\Users\sonme\Desktop\leoparlı ilac takibi"
   ```
2. Paketleri yükleyin:
   ```bash
   npm install
   ```
3. Ortam değişkenlerini ekleyin:
   - `.env.local` dosyasını `.env.local.example` dosyasından kopyalayın.
   - Firebase yapılandırma değerlerinizi girin.
4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Proje içeriği

- `src/app`: Next.js App Router sayfaları
- `src/components`: UI bileşenleri
- `src/services/firebase.ts`: Firebase başlangıç kodu
- `src/services/medicine.ts`: ilaç model ve örnek veriler
- `next.config.mjs`: PWA için `next-pwa` konfigürasyonu

## Sonraki adımlar

- Firebase projesi oluşturup `NEXT_PUBLIC_FIREBASE_*` değişkenlerini ayarlayın
- `src/app/medicines/page.tsx` içinde ilaç ekleme formunu geliştirin
- Web push / bildirim servisleri için Firebase Cloud Messaging ekleyin
- Vercel üzerinde deploy ayarlarını yapın

### iOS / PWA ikonları (Add to Home Screen için)

- iOS ana ekrana ekleme deneyimi için `public/icons` içinde PNG ikonlar gereklidir.
- Önerilen dosyalar ve isimleri:
   - `public/icons/icon-192x192.png`
   - `public/icons/icon-512x512.png`
   - (isteğe bağlı) `public/icons/icon-180x180.png` (Apple için)
- Basitçe bir SVG'den PNG üretmek için `inkscape` veya çevrimiçi araçlar kullanabilirsiniz. Örnek komut (Inkscape):

```bash
inkscape -w 192 -h 192 icons/icon.svg --export-type=png --export-filename=public/icons/icon-192x192.png
inkscape -w 512 -h 512 icons/icon.svg --export-type=png --export-filename=public/icons/icon-512x512.png
```

- PNG dosyalarını ekledikten sonra değişiklikleri commit ve push edin; Vercel otomatik deploy başlatacaktır.


### Firebase Cloud Messaging (FCM) hızlı notlar

- Firebase konsolunda proje oluşturun ve `Web` uygulaması ekleyin.
- `NEXT_PUBLIC_FIREBASE_*` değerlerini `.env.local` içine kopyalayın.
- Web push için VAPID anahtarları oluşturun (Firebase > Messaging > Web push certificates).
- `public/firebase-messaging-sw.js` dosyası service worker kökünde olmalıdır (zaten ekledim).
- Tarayıcıda bildirim izni istemek ve `getToken()` almak için `firebase/messaging` kullanın.

Not: FCM ve service worker kurulumunun son adımı olan `getToken` çağrısı ve sunucu tarafı bildirim tetikleme (Cloud Functions veya sunucu) için FCM sunucu anahtarına ihtiyaç vardır. Bu anahtarı asla doğrudan istemciye koymayın.
