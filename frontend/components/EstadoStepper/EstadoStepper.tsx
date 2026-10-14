'use client';

// ============================================================
// components/EstadoStepper.tsx — LÍNEA DE PROGRESO DE ESTADOS
// ------------------------------------------------------------
// SDD §8: barra de progreso Recibido → … → Entregado.
// Usa FLUJO_ESTADOS (el camino principal) y ETIQUETAS_ESTADO.
//
// Cancelado NO está en el flujo: es una rama lateral, así que
// el stepper muestra un aviso aparte (se ve en la Parte 5).
//
// Uso:
//   <EstadoStepper estado={orden.estado} />
// ============================================================

import { Check } from 'lucide-react';
import { FLUJO_ESTADOS, ETIQUETAS_ESTADO, type EstadoOrden } from '@/types/estados';

export default function EstadoStepper({ estado }: { estado: EstadoOrden }) {
  // Rama lateral: fuera del flujo principal.
  if (estado === 'Cancelado') {
    return (
      <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
        Orden cancelada — no avanza más por el flujo principal
        (Recibido → Entregado).
      </div>
    );
  }

  const posicion = FLUJO_ESTADOS.indexOf(estado);

  return (
    <ol className="flex items-start">
      {FLUJO_ESTADOS.map((etapa, i) => {
        const hecho = i < posicion;
        const actual = i === posicion;
        const etiqueta = ETIQUETAS_ESTADO[etapa];

        return (
          <li key={etapa} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 last:flex-none">
            {/* Fila de línea-punto-línea */}
            <div className="flex w-full items-center">
              {/* Línea entrante (se colorea si el tramo ya se completó) */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${hecho ? 'bg-primario' : 'bg-white/10'}`}
                />
              )}

              <span
                title={etiqueta}
                className={`
                  flex size-8 shrink-0 items-center justify-center rounded-full
                  text-xs font-semibold transition-colors
                  ${
                    hecho
                      ? 'bg-primario text-fondo'
                      : actual
                        ? 'border-2 border-primario text-primario'
                        : 'border border-white/10 bg-panel-2 text-texto-2'
                  }
                `.replace(/\s+/g, ' ')}
              >
                {hecho ? <Check className="size-4" /> : i + 1}
              </span>

              {/* Línea saliente (oculta en el último paso) */}
              {i < FLUJO_ESTADOS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${i < posicion ? 'bg-primario' : 'bg-white/10'}`}
                />
              )}
            </div>

            {/* Etiqueta debajo del punto */}
            <span
              title={etiqueta}
              className={`max-w-full truncate px-1 text-center text-[10px] sm:text-xs ${
                actual ? 'font-semibold text-primario' : hecho ? 'text-texto' : 'text-texto-2'
              }`}
            >
              {etiqueta}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
