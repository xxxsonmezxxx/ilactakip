'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function MedicinesPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/ilaclarim'); }, [router]);
  return null;
}
