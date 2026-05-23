# Leoparlý Ýlaç Takibi

Next.js tabanlý ilaç takip uygulamasý.

## Çalýþtýrma

1. `npm install`
2. `.env.local` dosyasýný doldurun (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY`)
3. `npm run dev`

## Kapalý Ekranda Bildirim (Kartsýz Yöntem)

Kapalý ekran bildirimi için sadece açýk sekme zamanlayýcýsý yeterli deðildir.
Bu projede kart zorunluluðu olmadan `GitHub Actions Cron + Web Push` akýþý eklendi.

### Gerekenler

1. Firebase projesi (Firestore)
2. VAPID anahtar çifti
3. GitHub repo secrets
4. PWA'nýn iPhone'da Safari üzerinden ana ekrana eklenmesi

### VAPID üretimi

```bash
npx web-push generate-vapid-keys
```

Public key'i `.env.local` içine `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` olarak yazýn.

### GitHub Secrets

Repo `Settings > Secrets and variables > Actions`:

- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase servis hesabý JSON içeriði (tek satýr)
- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT` (ör: `mailto:you@example.com`)

### Cron

`.github/workflows/reminder-cron.yml` her 5 dakikada bir çalýþýr ve:

- `reminderSchedules` koleksiyonunu okur
- Saati gelen ilaçlarý bulur
- `pushSubscriptions` kaydý olan kullanýcýlara push yollar
- Tekrar gönderimi önlemek için `notificationDispatchLog` yazar

## Veri Akýþý

- Ýstemci izin verince Web Push aboneliði `pushSubscriptions` koleksiyonuna yazýlýr.
- Ýlaçlar deðiþince program `reminderSchedules` koleksiyonuna senkronlanýr.
- GitHub cron saati gelen ilaçlarý bulur ve push gönderir.
- Bildirim aksiyonlarý (`Ýçtim`, `Atla`, `Hatýrlat`) uygulamada log'a iþlenir.

## Not

- iOS'ta push için uygulama Safari'den ana ekrana eklenmiþ olmalý.
- Kapalý ekran bildirimi için sunucu tarafý push zorunludur.
