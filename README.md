# Leoparlı İlaç Takibi

Next.js tabanlı ilaç takip uygulaması.

## Çalıştırma

1. `npm install`
2. `.env.local` dosyasını doldurun (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_VAPID_KEY`)
3. `npm run dev`

## Kapalı Ekranda Bildirim (Gerçek Push)

Kapalı ekran bildirimi için sadece tarayıcı zamanlayıcısı yeterli değildir.
Bu projede gerçek çözüm olarak Firebase Cloud Functions + FCM eklendi.

### Gerekenler

1. Firebase projesi
2. Cloud Messaging aktif
3. Web push VAPID key
4. Functions deploy

### Functions kurulumu

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

`functions/src/index.ts` içinde dakikalık cron çalışır ve `reminderSchedules` koleksiyonuna göre FCM push yollar.

## Veri Akışı

- İstemci giriş yapınca cihaz token'ı `pushTokens` koleksiyonuna yazılır.
- İlaçlar değişince program `reminderSchedules` koleksiyonuna senkronlanır.
- Sunucu cron'u saati gelen ilaçları bulur ve push gönderir.
- Bildirim aksiyonları (`İçtim`, `Atla`, `Hatırlat`) uygulamada log'a işlenir.

## Not

- iOS PWA tarafında bildirim davranışı Apple limitlerine bağlıdır.
- Kapalı ekranda güvenilir bildirim için sunucu tarafı push zorunludur.
