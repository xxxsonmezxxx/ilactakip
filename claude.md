Bana bir ilaç takip programı tasarla ilaç isimlerini yazacağım kullanacağım saatlerim olacak alarmla eşleştirilecek veya başka bir bildirimler atacak ve günlük içmediğim ilaçları bildirecek farklı saatlerde ve açlık tokluğa göre bildirim yapacak bir sistem kurmam
İlaç ekleme
Saat bazlı alarm
Aç / tok bildirimleri
Günlük “içmedin” uyarıları
Arka planda çalışan servis
İstatistik ve rapor
SQLite veritabanı
Offline çalışma
İstersen ileride AI destekli hale getirme
safariden ana ekrana indirip uygulama gıbı kullanılacak
telefon kapansa bıle bıldırım verecek ılac saaı bıldırımı
Frontend
Next.js
veya
React
Backend
Firebase
veya
Supabase
Bildirim
Web Push Notification
Database
Firebase Firestore
Gerçek alarm mı?

Web’de:

tam native alarm kadar güçlü değil.

Ama:

Çözüm

Bildirim spam sistemi yaparsın.

Örneğin:

09:00
→ bildirim

09:05
→ hala işaretlenmediyse tekrar

09:15
→ tekrar
EN MANTIKLI STACK

Ben olsam şöyle kurarım:

FRONTEND
Next.js

Next.js

Sebep:

hızlı
SEO
mobil uyumlu
PWA desteği mükemmel
UI
TailwindCSS

Tailwind CSS

DATABASE
Firebase

Firebase

AUTH
Google / Apple Login

Firebase Auth.

PUSH NOTIFICATION
Firebase Cloud Messaging (FCM)

Çok güçlüdür.

HOSTING
Vercel

Ücretsiz başlangıç için mükemmel.

Vercel
Kullanıcı
   ↓
PWA Web App
   ↓
Firebase
   ↓
Push Notification
   ↓
İlaç Takibi
AI Reçete Okuma

Kamera:

reçete fotoğrafı çek
AI ilaçları çıkarsın
Barkod Okuma

İlaç kutusunu okut.

Yakınlarına Bildirim

“Bugün ilacını almadı”

Akıllı Takvim

İlaç bitiş tarihi yaklaşınca:

“Yeni kutu almanız gerekiyor”
Başlangıç:
Vercel + Firebase
SENİN SİSTEMİNİN GERÇEK İHTİYACI

Senin uygulama:

ilaç kayıt
bildirim
kullanıcı hesabı
rapor
push notification
Frontend
Next.js PWA

Hosting:

Vercel
Backend
Firebase

Firebase
Vercel otomatik deploy

GitHub’a kod atarsın.
Kullanıcı
   ↓
PWA Web App (Next.js)
   ↓
Firebase Auth
   ↓
Firestore Database
   ↓
Push Notification
Faz 1
Next.js PWA
Firebase
Push notification
Offline support
Faz 2
AI reçete okuma
Barkod sistemi
Aile paylaşımı

                ┌────────────────────┐
                │     Kullanıcı      │
                │ iPhone / Android   │
                └─────────┬──────────┘
                          │
                 PWA (Web App)
                          │
          ┌───────────────┴───────────────┐
          │                               │
   Next.js Frontend                Service Worker
          │                               │
          │                         Offline Cache
          │                         Push Notify
          │
 ┌────────┴────────┐
 │                 │
Firebase Auth   Firestore DB
 │                 │
 │                 │
 └──────┬──────────┘
        │
Firebase Cloud Messaging
        │
Push Notification System
        │
 ┌──────┴───────────┐
 │                  │
AI Services     Analytics
(OpenAI)        Usage Logs

TEKNOLOJİ STACK
Katman	Teknoloji
Frontend	Next.js
UI	TailwindCSS
PWA	next-pwa
Backend	Firebase
Database	Firestore
Auth	Firebase Auth
Notification	Firebase Cloud Messaging
Hosting	Vercel
Analytics	Firebase Analytics
AI	OpenAI API
Offline	Service Worker

proje yapısı
src/
│
├── app/
│   ├── dashboard/
│   ├── medicines/
│   ├── reports/
│   ├── settings/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── cards/
│   ├── charts/
│   └── notifications/
│
├── services/
│   ├── firebase.ts
│   ├── notification.ts
│   ├── medicine.ts
│   └── ai.ts
│
├── hooks/
├── store/
├── lib/
├── utils/
└── styles/
DATABASE MİMARİSİ
Firebase Firestore
veri yapısı
medicines
medicine_logs
bildirim yapısı 
Saat geldi
    ↓
Cloud Function çalışır
    ↓
İlaç içildi mi?
    ↓
Hayır
    ↓
Push Notification gönder

BİLDİRİM TÜRLERİ
Tür	Örnek
Saat bildirimi	“İlacınızı alma zamanı”
Aç/Tok	“Tok karnına alınız”
Tekrar bildirimi	“Hâlâ içmediniz”
Gün sonu	“Bugün 1 ilaç kaçırıldı”
Stok bildirimi	“İlacınız bitmek üzere”

Güvenlik	Teknoloji
HTTPS	Vercel SSL
Auth	Firebase JWT
Database Rules	Firestore Rules
DDOS koruma	Vercel CDN
hostıng vercel
deploy akısıı
VS Code
   ↓
GitHub Push
   ↓
Vercel Auto Deploy
   ↓
Canlı Sistem

PROFESYONEL UI SAYFALARI
Sayfa	İçerik
Dashboard	Günlük ilaçlar
Takvim	İlaç geçmişi
Raporlar	Uyum oranı
İstatistik	Kaçırılan doz
Profil	Kullanıcı ayarları
AI Asistan	Sağlık sohbeti