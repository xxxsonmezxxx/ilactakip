'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type FoodInstruction = 'Aç' | 'Tok' | 'Farketmez';
export type ReminderType = 'Alarm' | 'Bildirim' | 'İkisi de';
export type DayKey = 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';

export type RepeatRule =
  | 'manual'
  | 'q24h'
  | 'q12h'
  | 'q8h'
  | 'q6h'
  | 'q4h'
  | 'q3h'
  | 'q2h'
  | 'q1h'
  | 'every2days'
  | 'weekly1'
  | 'weekly2'
  | 'monthly1';

export interface MedicineRecord {
  id: string;
  name: string;
  description: string;
  dosage?: string;
  schedule: string[];
  foodInstruction: FoodInstruction;
  days: DayKey[];
  reminderType: ReminderType;
  reminder: boolean;
  color: string;
  createdAt: string;
  taken: Record<string, boolean>;
  userEmail: string;
  repeatRule?: RepeatRule;
  anchorDate?: string;
  firstDoseTime?: string;
}

export interface User {
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface DailyLog {
  medicineId: string;
  scheduleTime: string;
  date: string;
  status: 'taken' | 'skipped' | 'pending' | 'snoozed';
  takenAt?: string;
  snoozeNext?: string;
  userEmail: string;
}

interface AppContextType {
  user: User | null;
  medicines: MedicineRecord[];
  dailyLogs: DailyLog[];
  allUsers: User[];
  login: (user: User) => void;
  logout: () => void;
  addMedicine: (medicine: Omit<MedicineRecord, 'id' | 'createdAt' | 'taken' | 'userEmail'>) => void;
  updateMedicine: (id: string, updates: Partial<MedicineRecord>) => void;
  deleteMedicine: (id: string) => void;
  markTaken: (medicineId: string, scheduleTime: string, date: string) => void;
  markSkipped: (medicineId: string, scheduleTime: string, date: string) => void;
  markSnoozed: (medicineId: string, scheduleTime: string, date: string, next?: string) => void;
  getTodayLogs: () => { medicine: MedicineRecord; time: string; status: 'taken' | 'skipped' | 'pending' | 'snoozed' }[];
  getAllMedicines: () => MedicineRecord[];
}

const AppContext = createContext<AppContextType | null>(null);

const PILL_COLORS = [
  'pill-red',
  'pill-blue',
  'pill-green',
  'pill-amber',
  'pill-purple',
  'pill-teal',
  'pill-pink',
  'pill-indigo',
  'pill-orange',
  'pill-cyan',
];

const normalizeEmail = (value?: string | null) => (value ?? '').trim().toLowerCase();
const safeEmailId = (email: string) => normalizeEmail(email).replace(/\./g, ',');

function normalizeDay(day: string): DayKey {
  if (day === 'Ã‡ar') return 'Çar';
  return day as DayKey;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function dayKeyFromDate(date: Date): DayKey {
  const days: DayKey[] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return days[date.getDay()];
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`);
}

function daysBetween(anchor: string, date: string) {
  const a = parseDate(anchor).getTime();
  const d = parseDate(date).getTime();
  return Math.floor((d - a) / 86400000);
}

export function isMedicineDueOnDate(med: MedicineRecord, date: string): boolean {
  const rule = med.repeatRule ?? 'manual';
  const anchor = med.anchorDate ?? med.createdAt?.slice(0, 10) ?? date;
  const diff = daysBetween(anchor, date);
  if (diff < 0) return false;

  const day = dayKeyFromDate(parseDate(date));
  const medDays = (med.days ?? []).map(normalizeDay);

  if (rule === 'every2days') return diff % 2 === 0;
  if (rule === 'weekly1') return diff % 7 === 0;
  if (rule === 'weekly2') return diff % 7 === 0 || diff % 7 === 3;
  if (rule === 'monthly1') {
    return parseDate(anchor).getDate() === parseDate(date).getDate();
  }

  if (!medDays.length) return false;
  return medDays.includes(day);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allMedicines, setAllMedicines] = useState<MedicineRecord[]>([]);
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  const medicines = user?.isAdmin ? allMedicines : allMedicines.filter((m) => normalizeEmail(m.userEmail) === normalizeEmail(user?.email));
  const dailyLogs = user?.isAdmin ? allDailyLogs : allDailyLogs.filter((l) => normalizeEmail(l.userEmail) === normalizeEmail(user?.email));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedUser = localStorage.getItem('lit_user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {
      localStorage.removeItem('lit_user');
    }

    try {
      const storedMeds = localStorage.getItem('lit_medicines');
      if (storedMeds) setAllMedicines(JSON.parse(storedMeds));
    } catch {
      localStorage.removeItem('lit_medicines');
    }

    try {
      const storedLogs = localStorage.getItem('lit_daily_logs');
      if (storedLogs) setAllDailyLogs(JSON.parse(storedLogs));
    } catch {
      localStorage.removeItem('lit_daily_logs');
    }

    try {
      const storedUsersList = localStorage.getItem('lit_all_users');
      if (storedUsersList) setAllUsers(JSON.parse(storedUsersList));
    } catch {
      localStorage.removeItem('lit_all_users');
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          if (localStorage.getItem('lit_user') && 'Notification' in window) Notification.requestPermission();
          console.log('SW Registered:', reg.scope);
        })
        .catch((err) => console.error('SW Registration failed:', err));
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (user) localStorage.setItem('lit_user', JSON.stringify(user));
    else localStorage.removeItem('lit_user');
  }, [user, loaded]);

  useEffect(() => {
    if (!loaded || !db || !user || user.isAdmin) return;
    const email = normalizeEmail(user.email);
    if (!email) return;

    getDoc(doc(db, 'userProfiles', safeEmailId(email)))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { medicines?: MedicineRecord[]; dailyLogs?: DailyLog[] };
        const cloudMeds = (data.medicines ?? []).filter((m) => normalizeEmail(m.userEmail) === email);
        const cloudLogs = (data.dailyLogs ?? []).filter((l) => normalizeEmail(l.userEmail) === email);

        if (cloudMeds.length) {
          setAllMedicines((prev) => {
            const others = prev.filter((m) => normalizeEmail(m.userEmail) !== email);
            return [...others, ...cloudMeds];
          });
        }
        if (cloudLogs.length) {
          setAllDailyLogs((prev) => {
            const others = prev.filter((l) => normalizeEmail(l.userEmail) !== email);
            return [...others, ...cloudLogs];
          });
        }
      })
      .catch(() => {});
  }, [loaded, user]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lit_medicines', JSON.stringify(allMedicines));

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user && !user.isAdmin) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (registration.active) registration.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', medicines });
        })
        .catch(() => {});
    }

    // Sync schedules for server-side cron push (works even when phone screen is off)
    if (db && user && !user.isAdmin) {
      const email = normalizeEmail(user.email);
      if (email) {
        const safeId = safeEmailId(email);
        const data = allMedicines
          .filter((m) => normalizeEmail(m.userEmail) === email)
          .map((m) => ({
            id: m.id,
            name: m.name,
            dosage: m.dosage ?? '',
            schedule: m.schedule ?? [],
            foodInstruction: m.foodInstruction,
            reminder: m.reminder,
            reminderType: m.reminderType,
            days: m.days ?? [],
            repeatRule: m.repeatRule ?? 'manual',
            anchorDate: m.anchorDate ?? m.createdAt?.slice(0, 10) ?? getToday(),
          }));

        setDoc(
          doc(db, 'reminderSchedules', safeId),
          {
            email,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul',
            medicines: data,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});

        const profileMedicines = allMedicines.filter((m) => normalizeEmail(m.userEmail) === email);
        const profileLogs = allDailyLogs.filter((l) => normalizeEmail(l.userEmail) === email);
        setDoc(
          doc(db, 'userProfiles', safeId),
          {
            email,
            medicines: profileMedicines,
            dailyLogs: profileLogs,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }
  }, [allMedicines, allDailyLogs, loaded, user, medicines]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lit_daily_logs', JSON.stringify(allDailyLogs));
  }, [allDailyLogs, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lit_all_users', JSON.stringify(allUsers));
  }, [allUsers, loaded]);

  const login = useCallback((u: User) => {
    if (u.email === 'admin' && u.name === 'admin' && u.isAdmin) {
      setUser(u);
      return;
    }
    const normalizedUser = { ...u, email: normalizeEmail(u.email) };
    setUser(normalizedUser);
    setAllUsers((prev) => {
      if (prev.some((p) => normalizeEmail(p.email) === normalizedUser.email)) return prev;
      return [...prev, normalizedUser];
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lit_user');
  }, []);

  const addMedicine = useCallback(
    (med: Omit<MedicineRecord, 'id' | 'createdAt' | 'taken' | 'userEmail'>) => {
      if (!user) return;
      const newMed: MedicineRecord = {
        ...med,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        taken: {},
        userEmail: normalizeEmail(user.email),
      };
      setAllMedicines((prev) => [...prev, newMed]);
      if (typeof window !== 'undefined' && 'Notification' in window && med.reminder) Notification.requestPermission();
    },
    [user]
  );

  const updateMedicine = useCallback((id: string, updates: Partial<MedicineRecord>) => {
    setAllMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setAllMedicines((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const markTaken = useCallback((medicineId: string, scheduleTime: string, date: string) => {
    if (!user) return;
    const key = `${date}-${scheduleTime}`;
    setAllMedicines((prev) => prev.map((m) => (m.id !== medicineId ? m : { ...m, taken: { ...m.taken, [key]: true } })));
    setAllDailyLogs((prev) => {
      const existing = prev.findIndex((l) => l.medicineId === medicineId && l.scheduleTime === scheduleTime && l.date === date);
      const log: DailyLog = { medicineId, scheduleTime, date, status: 'taken', takenAt: new Date().toISOString(), userEmail: normalizeEmail(user.email) };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = log;
        return updated;
      }
      return [...prev, log];
    });
  }, [user]);

  const markSkipped = useCallback((medicineId: string, scheduleTime: string, date: string) => {
    if (!user) return;
    setAllDailyLogs((prev) => {
      const existing = prev.findIndex((l) => l.medicineId === medicineId && l.scheduleTime === scheduleTime && l.date === date);
      const log: DailyLog = { medicineId, scheduleTime, date, status: 'skipped', userEmail: normalizeEmail(user.email) };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = log;
        return updated;
      }
      return [...prev, log];
    });
  }, [user]);

  const markSnoozed = useCallback((medicineId: string, scheduleTime: string, date: string, next?: string) => {
    if (!user) return;
    const nextTime = next ?? new Date(Date.now() + 5 * 60000).toISOString();
    setAllDailyLogs((prev) => {
      const existing = prev.findIndex((l) => l.medicineId === medicineId && l.scheduleTime === scheduleTime && l.date === date);
      const log: DailyLog = { medicineId, scheduleTime, date, status: 'snoozed', snoozeNext: nextTime, userEmail: normalizeEmail(user.email) };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...log };
        return updated;
      }
      return [...prev, log];
    });
  }, [user]);

  const getTodayLogs = useCallback(() => {
    const today = getToday();
    const results: { medicine: MedicineRecord; time: string; status: 'taken' | 'skipped' | 'pending' | 'snoozed' }[] = [];

    for (const med of medicines) {
      if (!isMedicineDueOnDate(med, today)) continue;
      for (const time of med.schedule) {
        const log = dailyLogs.find((l) => l.medicineId === med.id && l.scheduleTime === time && l.date === today);
        results.push({ medicine: med, time, status: log?.status ?? 'pending' });
      }
    }

    results.sort((a, b) => a.time.localeCompare(b.time));
    return results;
  }, [medicines, dailyLogs]);

  const getAllMedicines = useCallback(() => allMedicines, [allMedicines]);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        user,
        medicines,
        dailyLogs,
        allUsers,
        login,
        logout,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        markTaken,
        markSkipped,
        markSnoozed,
        getTodayLogs,
        getAllMedicines,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export const PILL_COLOR_LIST = PILL_COLORS;
