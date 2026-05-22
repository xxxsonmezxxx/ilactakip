'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export type FoodInstruction = 'Aç' | 'Tok' | 'Farketmez';
export type ReminderType = 'Alarm' | 'Bildirim' | 'İkisi de';
export type DayKey = 'Pzt' | 'Sal' | 'Çar' | 'Per' | 'Cum' | 'Cmt' | 'Paz';

export interface MedicineRecord {
  id: string;
  name: string;
  description: string;
  dosage?: string;
  schedule: string[]; // ['08:00', '20:00']
  foodInstruction: FoodInstruction;
  days: DayKey[];
  reminderType: ReminderType;
  reminder: boolean;
  color: string;
  createdAt: string;
  taken: Record<string, boolean>; // key: 'YYYY-MM-DD-HH:MM'
  userEmail: string;
}

export interface User {
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface DailyLog {
  medicineId: string;
  scheduleTime: string;
  date: string; // YYYY-MM-DD
  status: 'taken' | 'skipped' | 'pending';
  takenAt?: string;
  userEmail: string;
}

interface AppContextType {
  user: User | null;
  medicines: MedicineRecord[]; // Filtered for current user (or all if admin)
  dailyLogs: DailyLog[]; // Filtered for current user (or all if admin)
  allUsers: User[];
  login: (user: User) => void;
  logout: () => void;
  addMedicine: (medicine: Omit<MedicineRecord, 'id' | 'createdAt' | 'taken' | 'userEmail'>) => void;
  updateMedicine: (id: string, updates: Partial<MedicineRecord>) => void;
  deleteMedicine: (id: string) => void;
  markTaken: (medicineId: string, scheduleTime: string, date: string) => void;
  markSkipped: (medicineId: string, scheduleTime: string, date: string) => void;
  getTodayLogs: () => { medicine: MedicineRecord; time: string; status: 'taken' | 'skipped' | 'pending' }[];
  getAllMedicines: () => MedicineRecord[]; // For admin
}

const AppContext = createContext<AppContextType | null>(null);

const PILL_COLORS = ['pill-red', 'pill-blue', 'pill-green', 'pill-amber', 'pill-purple', 'pill-teal', 'pill-pink'];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function todayDayKey(): DayKey {
  const days: DayKey[] = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  return days[new Date().getDay()];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allMedicines, setAllMedicines] = useState<MedicineRecord[]>([]);
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Derived state based on user
  const medicines = user?.isAdmin ? allMedicines : allMedicines.filter(m => m.userEmail === user?.email);
  const dailyLogs = user?.isAdmin ? allDailyLogs : allDailyLogs.filter(l => l.userEmail === user?.email);

  // Load from localStorage & Register Service Worker
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('lit_user');
      const storedMeds = localStorage.getItem('lit_medicines');
      const storedLogs = localStorage.getItem('lit_daily_logs');
      const storedUsersList = localStorage.getItem('lit_all_users');

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedMeds) setAllMedicines(JSON.parse(storedMeds));
      if (storedLogs) setAllDailyLogs(JSON.parse(storedLogs));
      if (storedUsersList) setAllUsers(JSON.parse(storedUsersList));
    } catch {}

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => {
          console.log('SW Registered:', reg.scope);
          // Request notification permission if user is logged in
          if (localStorage.getItem('lit_user') && 'Notification' in window) {
            Notification.requestPermission();
          }
        })
        .catch((err) => console.error('SW Registration failed:', err));
    }

    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    if (user) localStorage.setItem('lit_user', JSON.stringify(user));
    else localStorage.removeItem('lit_user');
  }, [user, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lit_medicines', JSON.stringify(allMedicines));

    // Send current user's medicines list to service worker for background alarm notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && user && !user.isAdmin) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'SCHEDULE_NOTIFICATIONS',
            medicines
          });
        }
      }).catch((err) => console.warn('Could not sync medicines with SW:', err));
    }
  }, [allMedicines, loaded, user, medicines]);

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
    setUser(u);
    setAllUsers(prev => {
      if (prev.some(p => p.email === u.email)) return prev;
      return [...prev, u];
    });
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('lit_user');
  }, []);

  const addMedicine = useCallback((med: Omit<MedicineRecord, 'id' | 'createdAt' | 'taken' | 'userEmail'>) => {
    if (!user) return;
    const newMed: MedicineRecord = {
      ...med,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      taken: {},
      userEmail: user.email,
    };
    setAllMedicines(prev => [...prev, newMed]);

    // Schedule notifications if supported
    if (typeof window !== 'undefined' && 'Notification' in window && med.reminder) {
      Notification.requestPermission();
    }
  }, [user]);

  const updateMedicine = useCallback((id: string, updates: Partial<MedicineRecord>) => {
    setAllMedicines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setAllMedicines(prev => prev.filter(m => m.id !== id));
  }, []);

  const markTaken = useCallback((medicineId: string, scheduleTime: string, date: string) => {
    if (!user) return;
    const key = `${date}-${scheduleTime}`;
    setAllMedicines(prev => prev.map(m => {
      if (m.id !== medicineId) return m;
      return { ...m, taken: { ...m.taken, [key]: true } };
    }));
    setAllDailyLogs(prev => {
      const existing = prev.findIndex(l => l.medicineId === medicineId && l.scheduleTime === scheduleTime && l.date === date);
      const log: DailyLog = { medicineId, scheduleTime, date, status: 'taken', takenAt: new Date().toISOString(), userEmail: user.email };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = log;
        return updated;
      }
      return [...prev, log];
    });
  }, []);

  const markSkipped = useCallback((medicineId: string, scheduleTime: string, date: string) => {
    if (!user) return;
    setAllDailyLogs(prev => {
      const existing = prev.findIndex(l => l.medicineId === medicineId && l.scheduleTime === scheduleTime && l.date === date);
      const log: DailyLog = { medicineId, scheduleTime, date, status: 'skipped', userEmail: user.email };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = log;
        return updated;
      }
      return [...prev, log];
    });
  }, []);

  const getTodayLogs = useCallback(() => {
    const today = getToday();
    const todayDay = todayDayKey();
    const results: { medicine: MedicineRecord; time: string; status: 'taken' | 'skipped' | 'pending' }[] = [];

    for (const med of medicines) {
      if (!med.days.includes(todayDay)) continue;
      for (const time of med.schedule) {
        const log = dailyLogs.find(l => l.medicineId === med.id && l.scheduleTime === time && l.date === today);
        results.push({
          medicine: med,
          time,
          status: log?.status ?? 'pending',
        });
      }
    }

    // Sort by time
    results.sort((a, b) => a.time.localeCompare(b.time));
    return results;
  }, [medicines, dailyLogs]);

  const getAllMedicines = useCallback(() => allMedicines, [allMedicines]);

  if (!loaded) return null;

  return (
    <AppContext.Provider value={{
      user, medicines, dailyLogs, allUsers,
      login, logout, addMedicine, updateMedicine, deleteMedicine,
      markTaken, markSkipped, getTodayLogs, getAllMedicines
    }}>
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
