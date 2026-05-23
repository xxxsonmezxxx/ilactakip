import admin from 'firebase-admin';
import webpush from 'web-push';

const tz = 'Europe/Istanbul';

function nowInTzParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const pick = (type) => parts.find((p) => p.type === type)?.value || '';
  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    hhmm: `${pick('hour')}:${pick('minute')}`,
    minuteOfDay: Number(pick('hour')) * 60 + Number(pick('minute')),
  };
}

function dayKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+03:00`);
  return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()];
}

function daysBetween(a, b) {
  const ad = new Date(`${a}T00:00:00+03:00`).getTime();
  const bd = new Date(`${b}T00:00:00+03:00`).getTime();
  return Math.floor((bd - ad) / 86400000);
}

function isDue(med, date) {
  const rule = med.repeatRule || 'manual';
  const anchor = med.anchorDate || date;
  const diff = daysBetween(anchor, date);
  if (diff < 0) return false;
  if (rule === 'every2days') return diff % 2 === 0;
  if (rule === 'weekly1') return diff % 7 === 0;
  if (rule === 'weekly2') return diff % 7 === 0 || diff % 7 === 3;
  if (rule === 'monthly1') return new Date(`${anchor}T00:00:00+03:00`).getDate() === new Date(`${date}T00:00:00+03:00`).getDate();
  return (med.days || []).includes(dayKey(date));
}

function windowMatches(scheduleTime, nowMinute) {
  const [h, m] = scheduleTime.split(':').map(Number);
  const schedMinute = h * 60 + m;
  const diff = nowMinute - schedMinute;
  return diff >= 0 && diff <= 4;
}

async function main() {
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON missing');

  const sa = JSON.parse(serviceAccountRaw);
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
  const db = admin.firestore();

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:admin@example.com';
  if (!publicKey || !privateKey) throw new Error('WEB_PUSH_PUBLIC_KEY / WEB_PUSH_PRIVATE_KEY missing');
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { date, minuteOfDay } = nowInTzParts();
  const schedulesSnap = await db.collection('reminderSchedules').get();

  let sent = 0;
  for (const schedDoc of schedulesSnap.docs) {
    const sched = schedDoc.data();
    const email = (sched.email || '').toLowerCase();
    if (!email) continue;

    const subDoc = await db.collection('pushSubscriptions').doc(email.replace(/\./g, ',')).get();
    const subscription = subDoc.data()?.subscription;
    if (!subscription?.endpoint) continue;

    for (const med of sched.medicines || []) {
      if (!med.reminder || !isDue(med, date)) continue;
      for (const t of med.schedule || []) {
        if (!windowMatches(t, minuteOfDay)) continue;

        const key = `${email}_${date}_${med.id}_${t}`.replace(/[^\w-]/g, '_');
        const lockRef = db.collection('notificationDispatchLog').doc(key);
        const exists = await lockRef.get();
        if (exists.exists) continue;

        const foodMsg = med.foodInstruction === 'Aç' ? 'Aç karnına alınız.' : med.foodInstruction === 'Tok' ? 'Tok karnına alınız.' : '';
        const payload = {
          title: `💊 ${med.name} - ${t}`,
          body: `İlaç zamanı geldi. ${foodMsg}`.trim(),
          tag: `${med.id}-${t}-${date}`,
          data: { medicineId: med.id, scheduleTime: t, date, email },
          actions: [
            { action: 'taken', title: 'İçtim' },
            { action: 'skipped', title: 'Atla' },
            { action: 'snooze', title: 'Hatırlat' },
          ],
        };

        try {
          await webpush.sendNotification(subscription, JSON.stringify(payload));
          await lockRef.set({
            email,
            medicineId: med.id,
            scheduleTime: t,
            date,
            sentAt: new Date().toISOString(),
          });
          sent += 1;
        } catch (err) {
          console.error('push send error', email, med.id, t, err?.statusCode || err?.message || err);
        }
      }
    }
  }

  console.log(`Done. sent=${sent}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

