'use client';

// ============================================================
// app/(app)/layout.tsx — LAYOUT PROTEGIDO
// ------------------------------------------------------------
// Todas las rutas internas (/dashboard, /clientes, …) viven dentro
// de la carpeta (app) — el paréntesis es un "route group": agrupa
// rutas bajo un layout COMÚN sin afectar la URL.
//
// Responsabilidades:
//   1. GUARD: si no hay sesión → redirigir a /login (SDD §11)
//   2. Armar el shell: Sidebar + Header + contenido de la página
//   3. Estado móvil: abrir/cerrar el sidebar con la hamburguesa
//
// La sesión se lee con useSesion() (reactiva): cuando cambia
// (login, logout, 401) este layout se actualiza solo.
// ============================================================

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSesion, obtenerSesion } from '@/lib/auth';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';

// El route group (app) no aparece en las rutas generadas por
// Next, así que no podemos usar LayoutProps<'/(app)'>: declaramos
// las props a mano (igual que hace Next por debajo).
interface Props {
  children: ReactNode;
}

export default function AppLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Sesión reactiva: null = sin sesión (o todavía no leída).
  const sesion = useSesion();

  // Estado del menú móvil.
  const [menuAbierto, setMenuAbierto] = useState(false);

  // GUARD (SDD §11): si no hay sesión → afuera.
  // Volvemos a leer localStorage acá mismo (y no usamos el valor
  // del render) porque al montar podría estar "stale" un instante:
  // leer la fuente directa es siempre correcto.
  // replace() en vez de push(): "atrás" no debe volver acá.
  useEffect(() => {
    if (obtenerSesion() === null) {
      router.replace('/login');
    }
  }, [router, sesion]);

  // Cerramos el menú móvil cuando cambia la ruta (patrón oficial
  // "adjust state during render": mejor que un setState en un
  // effect, que React desaconseja).
  const [rutaPrevia, setRutaPrevia] = useState(pathname);
  if (rutaPrevia !== pathname) {
    setRutaPrevia(pathname);
    setMenuAbierto(false);
  }

  // ¿Sin sesión? → pantalla de carga mientras el guard redirige.
  // (evita el "flash" de ver contenido protegido un instante)
  if (sesion === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
          <p className="text-sm text-texto-2">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  // Sesión OK → el shell de la aplicación.
  return (
    <div className="flex min-h-screen bg-fondo">
      <Sidebar
        sesion={sesion}
        abierto={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          sesion={sesion}
          ruta={pathname}
          onMenu={() => setMenuAbierto((v) => !v)}
        />

        {/* Contenido de la página actual. */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
