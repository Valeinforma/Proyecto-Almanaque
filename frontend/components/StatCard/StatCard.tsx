// ============================================================
// components/ui/StatCard.tsx — TARJETA DE ESTADÍSTICA
// ------------------------------------------------------------
// Caja del dashboard con: ícono, número grande y etiqueta
// (SDD §12: StatCard / SDD §6).
//
// Es "tonto" (sin estado ni eventos) → no necesita 'use client'.
//
// Uso:
//   <StatCard titulo="Órdenes abiertas" valor={7}
//             Icono={ClipboardList} tono="primario" />
// ============================================================

import type { LucideIcon } from 'lucide-react';

type Tono = 'primario' | 'presupuesto' | 'reparacion' | 'aviso' | 'exito';

// Color del ícono/fondo translúcido por tono.
const TONOS: Record<Tono, string> = {
  primario: 'text-primario bg-primario/10 ring-primario/25',
  presupuesto: 'text-estado-presupuesto bg-estado-presupuesto/10 ring-estado-presupuesto/25',
  reparacion: 'text-estado-reparacion bg-estado-reparacion/10 ring-estado-reparacion/25',
  aviso: 'text-aviso bg-aviso/10 ring-aviso/25',
  exito: 'text-exito bg-exito/10 ring-exito/25',
};

interface StatCardProps {
  titulo: string;
  valor: string | number;
  Icono: LucideIcon;
  tono: Tono;
  detalle?: string; // aclaración chiquita debajo del número
}

export default function StatCard({ titulo, valor, Icono, tono, detalle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-texto-2">{titulo}</p>

        {/* Ícono en un cuadrado translúcido del mismo tono. */}
        <span className={`rounded-lg p-1.5 ring-1 ${TONOS[tono]}`}>
          <Icono className="size-4" />
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-texto">
        {valor}
      </p>

      {detalle && <p className="mt-1 text-xs text-texto-2">{detalle}</p>}
    </div>
  );
}
