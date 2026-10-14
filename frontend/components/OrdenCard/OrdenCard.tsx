// ============================================================
// components/OrdenCard.tsx — FILA/TARJETA DE ORDEN
// ------------------------------------------------------------
// Resumen de una orden tal como la da el dashboard
// (DTO OrdenResumenDto): número, cliente, equipo, fecha, costo
// y badge de estado (SDD §12: OrdenCard).
//
// Hoy es solo visual; el link a /ordenes/[id] se habilita en la
// Parte 5 (cuando exista la pantalla de detalle).
// ============================================================

import { Monitor } from 'lucide-react';
import { EstadoBadge } from '@/components/Badge/Badge';
import type { IOrdenResumen } from '@/interfaces/IDashboard';
import { formatearPesos, formatearFecha } from '@/lib/formato';

export default function OrdenCard({ orden }: { orden: IOrdenResumen }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-1 py-3 last:border-0 hover:bg-white/[0.02]">
      {/* Iconito del equipo */}
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-panel-2 text-texto-2 ring-1 ring-white/10">
        <Monitor className="size-4" />
      </span>

      {/* Datos principales */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* NumeroOrden en mono: se lee como un "código". */}
          <span className="font-mono text-xs text-primario">{orden.numeroOrden}</span>
          <span className="truncate text-sm font-medium text-texto">
            {orden.clienteNombre}
          </span>
        </div>
        <p className="truncate text-xs text-texto-2">
          {orden.equipo ?? 'Equipo sin detalle'} · {formatearFecha(orden.fechaIngreso)}
        </p>
      </div>

      {/* Estado + costo */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <EstadoBadge estado={orden.estado} />
        <span className="text-xs font-medium text-texto-2 tabular-nums">
          {formatearPesos(orden.costo)}
        </span>
      </div>
    </div>
  );
}
