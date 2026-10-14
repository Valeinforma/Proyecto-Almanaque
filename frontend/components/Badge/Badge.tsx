// ============================================================
// components/ui/Badge.tsx
// ------------------------------------------------------------
// Insignias de estado/rol (SDD §12: Badge y StatusBadge).
//
// Badge        → genérico: le pasás texto + tono
// EstadoBadge  → inteligente: conoce los estados de orden
//                (usa ETIQUETAS_ESTADO de types/)
//
// Es un componente "tonto" (sin estado ni eventos), por eso NO
// lleva 'use client': puede renderizarse en el servidor.
// ============================================================

import type { ReactNode } from 'react';
import type { EstadoOrden } from '@/types/estados';
import { ETIQUETAS_ESTADO } from '@/types/estados';

type Tono = 'primario' | 'exito' | 'aviso' | 'error' | 'neutro' | 'presupuesto' | 'reparacion';

// Color por variante: texto + fondo translúcido + borde tenue.
// El fondo con /10 sobre el panel oscuro da el efecto "glass".
const TONOS: Record<Tono, string> = {
  primario: 'text-primario bg-primario/10 border-primario/30',
  exito: 'text-exito bg-exito/10 border-exito/30',
  aviso: 'text-aviso bg-aviso/10 border-aviso/30',
  error: 'text-error bg-error/10 border-error/30',
  neutro: 'text-texto-2 bg-white/5 border-white/10',
  presupuesto: 'text-estado-presupuesto bg-estado-presupuesto/10 border-estado-presupuesto/30',
  reparacion: 'text-estado-reparacion bg-estado-reparacion/10 border-estado-reparacion/30',
};

interface BadgeProps {
  children: ReactNode;
  tono?: Tono;
  className?: string;
}

export function Badge({ children, tono = 'neutro', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5
        text-xs font-medium whitespace-nowrap
        ${TONOS[tono]}
        ${className}
      `.replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
}

// Cada estado tiene su color (y texto legible del dominio).
const COLOR_POR_ESTADO: Record<EstadoOrden, Tono> = {
  Recibido: 'neutro',
  EnDiagnostico: 'primario',
  Presupuestado: 'presupuesto',
  EnReparacion: 'reparacion',
  Listo: 'aviso',
  Entregado: 'exito',
  Cancelado: 'error',
};

interface EstadoBadgeProps {
  estado: EstadoOrden;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  return <Badge tono={COLOR_POR_ESTADO[estado]}>{ETIQUETAS_ESTADO[estado]}</Badge>;
}
