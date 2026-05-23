import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onSchedule } from "firebase-functions/v2/scheduler";

initializeApp();

type Rule = "manual" | "q24h" | "q12h" | "q8h" | "q6h" | "q4h" | "q3h" | "q2h" | "q1h" | "every2days" | "weekly1" | "weekly2" | "monthly1";

function isDueToday(med: any, date: string): boolean {
  const rule: Rule = med.repeatRule ?? "manual";
  const anchor = med.anchorDate ?? date;
  const ad = new Date(`${anchor}T00:00:00`);
  const dd = new Date(`${date}T00:00:00`);
  const diff = Math.floor((dd.getTime() - ad.getTime()) / 86400000);
  if (diff < 0) return false;

  if (rule === "every2days") return diff % 2 === 0;
  if (rule === "weekly1") return diff % 7 === 0;
  if (rule === "weekly2") return diff % 7 === 0 || diff % 7 === 3;
  if (rule === "monthly1") return ad.getDate() === dd.getDate();

  const dayMap = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const todayDay = dayMap[dd.getDay()];
  const days = (med.days ?? []).map((d: string) => (d === "Ã‡ar" ? "Çar" : d));
  return days.includes(todayDay);
}

export const checkMedicineReminders = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Europe/Istanbul",
    region: "europe-west1",
    memory: "256MiB",
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const schedules = await db.collection("reminderSchedules").get();
    for (const doc of schedules.docs) {
      const data = doc.data() as any;
      const email = data.email as string;
      const meds = (data.medicines ?? []) as any[];
      const tokenDoc = await db.collection("pushTokens").doc(doc.id).get();
      const tokenMap = (tokenDoc.data()?.tokens ?? {}) as Record<string, boolean>;
      const tokens = Object.keys(tokenMap).filter((t) => tokenMap[t]);
      if (!tokens.length) continue;

      for (const med of meds) {
        if (!med.reminder) continue;
        if (!isDueToday(med, date)) continue;
        if (!(med.schedule ?? []).includes(hhmm)) continue;

        const dispatchId = `${doc.id}_${med.id}_${date}_${hhmm}`.replace(/[^a-zA-Z0-9_,-]/g, "_");
        const dispatchRef = db.collection("notificationDispatchLog").doc(dispatchId);
        const already = await dispatchRef.get();
        if (already.exists) continue;

        const foodMsg = med.foodInstruction === "Aç" ? "Aç karnına alın." : med.foodInstruction === "Tok" ? "Tok karnına alın." : "";
        const body = `İlaç zamanı geldi!${med.dosage ? ` Dozaj: ${med.dosage}.` : ""} ${foodMsg}`.trim();

        await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: `💊 ${med.name} - ${hhmm}`,
            body,
          },
          webpush: {
            notification: {
              icon: "/icons/icon-192x192.png",
              requireInteraction: true,
              actions: [
                { action: "taken", title: "İçtim" },
                { action: "skipped", title: "Atla" },
                { action: "snooze", title: "Hatırlat" },
              ],
              tag: `${med.id}-${hhmm}-${date}`,
            },
          },
          data: {
            tag: `${med.id}-${hhmm}-${date}`,
            email,
            medicineId: med.id,
            scheduleTime: hhmm,
            date,
          },
        });

        await dispatchRef.set({
          email,
          medicineId: med.id,
          scheduleTime: hhmm,
          date,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
);
