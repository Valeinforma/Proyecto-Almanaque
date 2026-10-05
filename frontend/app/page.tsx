'use client';

// ============================================================
// app/page.tsx — RAÍZ "/"
// ------------------------------------------------------------
// ROOM_MAP §2: "/" = "Redirección según sesión".
//
// No es una pantalla: solo decide a dónde va quien entra a la raíz.
//   · con sesión    → /dashboard
//   · sin sesión    → /login
// ============================================================

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { haySesion } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(haySesion() ? '/dashboard' : '/login');
  }, [router]);

  // Momento breve de transición (casi invisible).
  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo">
      <span className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent" />
    </div>
  );
}
