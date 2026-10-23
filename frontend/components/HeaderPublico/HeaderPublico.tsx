'use client';

// ============================================================
// components/HeaderPublico/HeaderPublico.tsx — HEADER LANDING
// ------------------------------------------------------------
// Barra superior de la pantalla de inicio PÚBLICA (no confundir
// con components/Header, que es el del sistema logueado).
//
//   · marca TECHFIX (misma identidad que Sidebar y Login)
//   · anclas a las secciones de la propia página
//   · botón "Ingresar" → /login
//
// En móvil las anclas se ocultan (la landing es de scroll
// vertical; el usuario llega a las secciones bajando).
// ============================================================

import Link from 'next/link';
import { Wrench, LogIn } from 'lucide-react';
import Button from '@/components/Button/Button';

// Anclas de secciones: centralizadas para que el orden del menú
// y los ids del HTML no se desincronicen.
const ANCLAS = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#repuestos', label: 'Repuestos' },
  { href: '#contacto', label: 'Contacto' },
];

export default function HeaderPublico() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-fondo/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Marca (misma identidad que el Sidebar del sistema). */}
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primario text-fondo">
            <Wrench className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-wide">TECHFIX</span>
        </a>

        {/* Anclas (solo desde md: en chico se baja scrolleando). */}
        <nav className="hidden items-center gap-6 md:flex">
          {ANCLAS.map((ancla) => (
            <a
              key={ancla.href}
              href={ancla.href}
              className="text-sm text-texto-2 transition-colors hover:text-texto"
            >
              {ancla.label}
            </a>
          ))}
        </nav>

        {/* Acceso al sistema. */}
        <Link href="/login">
          <Button variante="secondary" tamano="sm">
            <LogIn className="size-4" />
            Ingresar
          </Button>
        </Link>
      </div>
    </header>
  );
}
