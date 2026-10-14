'use client';

// ============================================================
// components/Header.tsx — BARRA SUPERIOR
// ------------------------------------------------------------
// Muestra:
//   · botón hamburguesa (solo móvil, abre/cierra el Sidebar)
//   · título de la sección actual (derivado de la URL)
//   · usuario: iniciales + nombre + rol
//
// El rol acá es SOLO informativo (badge); quien decide permisos
// reales es el backend en cada request.
// ============================================================

import { Menu, Wrench } from 'lucide-react';
import type { ISesionUsuario } from '@/interfaces/IUsuario';

// Mapa ruta → título de sección (si no está, "TechFix Manager").
const TITULOS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ordenes': 'Órdenes',
  '/clientes': 'Clientes',
  '/equipos': 'Equipos',
  '/servicios': 'Servicios',
  '/repuestos': 'Repuestos',
  '/usuarios': 'Usuarios',
  '/configuracion': 'Configuración',
};

interface HeaderProps {
  sesion: ISesionUsuario | null;
  ruta: string; // pathname actual
  onMenu: () => void; // abre/cierra el sidebar en móvil
}

export default function Header({ sesion, ruta, onMenu }: HeaderProps) {
  // Título de la sección (o el de raíz si la ruta no está en el mapa).
  const titulo = TITULOS[ruta] ?? 'TechFix Manager';

  // Iniciales para el avatar: "Juan Pérez" → "JP".
  const iniciales = sesion
    ? sesion.nombre
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-panel/80 px-4 backdrop-blur md:px-6">
      {/* Izquierda: menú móvil + título */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className="rounded-lg p-2 text-texto-2 transition-colors hover:bg-white/5 hover:text-texto md:hidden cursor-pointer"
        >
          <Menu className="size-5" />
        </button>

        <div className="flex items-center gap-2 md:hidden">
          <Wrench className="size-4 text-primario" />
        </div>
        <h1 className="text-base font-semibold text-texto">{titulo}</h1>
      </div>

      {/* Derecha: usuario */}
      {sesion && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-texto">
              {sesion.nombre}
            </p>
            <p className="text-xs leading-tight text-texto-2">{sesion.rol}</p>
          </div>

          {/* Avatar con iniciales (avatar real: solo UI por ahora). */}
          <span className="flex size-9 items-center justify-center rounded-full bg-primario/15 text-xs font-bold text-primario ring-1 ring-primario/30">
            {iniciales}
          </span>
        </div>
      )}
    </header>
  );
}
