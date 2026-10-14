'use client';

// ============================================================
// components/Sidebar.tsx — NAVEGACIÓN LATERAL (ROOM_MAP §3)
// ------------------------------------------------------------
// Menú agrupado (General / Gestión / Catálogo / Sistema) filtrado
// por DOS criterios:
//
//   1. `parte` → solo muestra los módulos ya implementados.
//      Al terminar cada parte del desarrollo se sube PARTE_ACTUAL.
//   2. `roles` → oculta lo que ese usuario no podría usar
//      (ej: Usuarios solo Admin). OJO: esto es COMODIDAD visual;
//      la autorización real la hace el backend (403).
//
// Responsive: en desktop (md+) siempre visible; en móvil se
// superpone (controlado por `abierto` desde el layout).
// ============================================================

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  Laptop,
  Wrench,
  Package,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Rol } from '@/types/roles';
import type { ISesionUsuario } from '@/interfaces/IUsuario';
import { cerrarSesion } from '@/lib/auth';

// ► Se incrementa al finalizar cada parte del desarrollo.
//   Parte 8 (FINAL): Configuración — datos del taller
//   (localStorage), cambio de contraseña (Admin) y estado
//   del sistema.
const PARTE_ACTUAL = 8;

interface ItemMenu {
  href: string;
  label: string;
  icono: LucideIcon;
  parte: number; // desde qué parte existe
  roles?: Rol[]; // undefined = todos
}

interface GrupoMenu {
  titulo: string;
  items: ItemMenu[];
}

// Menú COMPLETO según ROOM_MAP §3. A medida que avancen las
// partes, irá apareciendo solo (mirar PARTE_ACTUAL arriba).
const MENU: GrupoMenu[] = [
  {
    titulo: 'General',
    items: [{ href: '/dashboard', label: 'Dashboard', icono: LayoutDashboard, parte: 1 }],
  },
  {
    titulo: 'Gestión',
    items: [
      { href: '/ordenes', label: 'Órdenes', icono: ListOrdered, parte: 5 },
      { href: '/clientes', label: 'Clientes', icono: Users, parte: 3 },
      { href: '/equipos', label: 'Equipos', icono: Laptop, parte: 4 },
    ],
  },
  {
    titulo: 'Catálogo',
    items: [
      { href: '/servicios', label: 'Servicios', icono: Wrench, parte: 6 },
      // Repuestos es Admin/Tecnico hasta en el GET (inventory).
      { href: '/repuestos', label: 'Repuestos', icono: Package, parte: 6, roles: ['Admin', 'Tecnico'] },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { href: '/usuarios', label: 'Usuarios', icono: UserCog, parte: 7, roles: ['Admin'] },
      { href: '/configuracion', label: 'Configuración', icono: Settings, parte: 8 },
    ],
  },
];

interface SidebarProps {
  sesion: ISesionUsuario | null;
  abierto: boolean; // menú móvil visible
  onCerrar: () => void; // para navegar y cerrar el menú móvil
}

export default function Sidebar({ sesion, abierto, onCerrar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const alSalir = () => {
    cerrarSesion();
    router.replace('/login');
  };

  return (
    <>
      {/* Fondo para cerrar el menú en móvil (solo visible si abierto). */}
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onCerrar}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-64 flex-col
          border-r border-white/10 bg-panel
          transition-transform duration-200
          md:static md:translate-x-0
          ${abierto ? 'translate-x-0' : '-translate-x-full'}
        `.replace(/\s+/g, ' ')}
      >
        {/* Marca */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primario text-fondo">
            <Wrench className="size-4" />
          </span>
          <span className="text-lg font-bold tracking-wide">TECHFIX</span>
        </div>

        {/* Grupos de items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {MENU.map((grupo) => {
            // Items disponibles (por parte implementada) y visibles (por rol).
            const items = grupo.items.filter(
              (item) =>
                item.parte <= PARTE_ACTUAL &&
                (!item.roles || !sesion || item.roles.includes(sesion.rol))
            );

            // Si el grupo quedó vacío, no mostramos el título.
            if (items.length === 0) return null;

            return (
              <div key={grupo.titulo} className="mb-5">
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-texto-2/60">
                  {grupo.titulo}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    // Ruta activa: resalta el item seleccionado.
                    const activo = pathname === item.href;
                    const Icono = item.icono;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onCerrar} // cerrar menú móvil al navegar
                          className={`
                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                            transition-colors
                            ${activo
                              ? 'bg-primario/10 text-primario font-medium'
                              : 'text-texto-2 hover:bg-white/5 hover:text-texto'}
                          `.replace(/\s+/g, ' ')}
                        >
                          <Icono className="size-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Pie: usuario + salir */}
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={alSalir}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-texto-2 transition-colors hover:bg-error/10 hover:text-error cursor-pointer"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        </div>
      </aside>
    </>
  );
}
