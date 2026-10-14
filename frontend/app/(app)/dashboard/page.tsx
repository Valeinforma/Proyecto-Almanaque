'use client';

// ============================================================
// app/(app)/dashboard/page.tsx — DASHBOARD (SDD §6, ROOM_MAP §5)
// ------------------------------------------------------------
// Pantalla principal después del login. Muestra:
//   · saludo personalizado
//   · 5 tarjetas de estadísticas (StatCard)
//   · órdenes recientes (OrdenCard)
//   · equipos listos para entregar
//
// Flujo de datos: useDashboardApi (sin Context — el estado no
// se comparte con otras pantallas) → la API arma TODO
// (contadores, sumas y listas en una sola consulta) → render.
//
// 'use client' porque consume localStorage (sesión) y usa estado.
// ============================================================

import {
  ClipboardList,
  Stethoscope,
  Hammer,
  PackageCheck,
  CircleDollarSign,
  RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/StatCard/StatCard';
import OrdenCard from '@/components/OrdenCard/OrdenCard';
import Button from '@/components/Button/Button';
import useDashboardApi from '@/hooks/useDashboardApi';
import { useSesion } from '@/lib/auth';
import { formatearPesos } from '@/lib/formato';

// Saludo según la hora del día.
function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const sesion = useSesion();
  const { resumen, cargando, error, obtenerResumen } = useDashboardApi();

  // ---------- estados de la pantalla ----------

  if (cargando && !resumen) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  if (error && !resumen) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">No se pudo cargar el dashboard.</p>
        <p className="mt-1 text-xs text-texto-2">{error}</p>
        <Button
          variante="secondary"
          tamano="sm"
          className="mt-4"
          onClick={() => obtenerResumen()}
        >
          <RefreshCw className="size-3.5" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!resumen) return null;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---------- Saludo ---------- */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-texto">
          {saludo()}, {sesion?.nombre?.split(' ')[0] ?? ''}
        </h2>
        <p className="text-sm text-texto-2">
          Esto es lo que está pasando en el taller hoy.
        </p>
      </div>

      {/* ---------- 5 estadísticas (SDD §6) ---------- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          titulo="Órdenes abiertas"
          valor={resumen.ordenesAbiertas}
          Icono={ClipboardList}
          tono="primario"
          detalle="no entregadas ni canceladas"
        />
        <StatCard
          titulo="En diagnóstico"
          valor={resumen.enDiagnostico}
          Icono={Stethoscope}
          tono="presupuesto"
        />
        <StatCard
          titulo="En reparación"
          valor={resumen.enReparacion}
          Icono={Hammer}
          tono="reparacion"
        />
        <StatCard
          titulo="Listas para entregar"
          valor={resumen.listasParaEntregar}
          Icono={PackageCheck}
          tono="aviso"
        />
        <StatCard
          titulo="Ingresos estimados"
          valor={formatearPesos(resumen.ingresosEstimados)}
          Icono={CircleDollarSign}
          tono="exito"
          detalle="de órdenes no canceladas"
        />
      </div>

      {/* ---------- Dos columnas ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Órdenes recientes */}
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-texto">Órdenes recientes</h3>
            <span className="text-xs text-texto-2">{resumen.ordenesRecientes.length}</span>
          </div>

          {resumen.ordenesRecientes.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-2">
              Todavía no hay órdenes.
            </p>
          ) : (
            <div>
              {resumen.ordenesRecientes.map((orden) => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </section>

        {/* Equipos listos */}
        <section className="rounded-xl border border-white/10 bg-panel p-4">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-texto">Equipos listos</h3>
            <span className="text-xs text-texto-2">{resumen.equiposListos.length}</span>
          </div>

          {resumen.equiposListos.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-2">
              No hay equipos esperando entrega.
            </p>
          ) : (
            <div>
              {resumen.equiposListos.map((orden) => (
                <OrdenCard key={orden.id} orden={orden} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
