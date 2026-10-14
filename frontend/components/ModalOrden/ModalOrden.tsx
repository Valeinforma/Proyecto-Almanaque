'use client';

// ============================================================
// components/ModalOrden/ModalOrden.tsx — ORDEN RELACIONADA DE UN EQUIPO
// ------------------------------------------------------------
// Modal "ver orden relacionada" de /equipos. Se carga AL ABRIR
// (equipo != null). El endpoint /api/ordenes no filtra por
// equipoId, así que trae la lista y elige la última del equipo.
// ============================================================

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import { EstadoBadge } from '@/components/Badge/Badge';
import useOrdenesApi from '@/hooks/useOrdenesApi';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import type { IEquipo } from '@/interfaces/IEquipo';
import type { IOrden } from '@/interfaces/IOrden';

interface ModalOrdenProps {
  equipo: IEquipo | null;
  onCerrar: () => void;
}

export default function ModalOrden({ equipo, onCerrar }: ModalOrdenProps) {
  // El listado completo pasa por el hook (sin auto-carga: éste es
  // el instance propio de este modal).
  const { obtenerOrdenes } = useOrdenesApi({ autoCargar: false });

  const [orden, setOrden] = useState<IOrden | null>(null);
  const [cargando, setCargando] = useState(false);

  // Reset al cambiar de equipo: patrón adjust-during-render
  // (setState en render condicional está permitido; en effect no).
  const [equipoPrevio, setEquipoPrevio] = useState(equipo);
  if (equipoPrevio !== equipo) {
    setEquipoPrevio(equipo);
    setOrden(null);
    setCargando(true);
  }

  useEffect(() => {
    if (!equipo) return; // modal cerrado → nada que hacer

    // No tocamos estado acá: el bloque de arriba (adjust-during-render)
    // ya puso cargando=true y orden=null cuando equipo cambió.
    obtenerOrdenes()
      .then((lista) => {
        if (!lista) {
          // La API falló: mismo final que el .catch original.
          setOrden(null);
          return;
        }
        // Órdenes de ESTE equipo, más reciente primero.
        const propias = lista
          .filter((o) => o.equipoId === equipo.id)
          .sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
        setOrden(propias[0] ?? null);
      })
      .finally(() => setCargando(false));
  }, [equipo, obtenerOrdenes]);

  return (
    <Modal abierto={equipo !== null} onCerrar={onCerrar} titulo="Orden relacionada">
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-texto-2">
          <span className="size-5 animate-spin rounded-full border-2 border-primario border-t-transparent" />
          Buscando la orden de este equipo…
        </div>
      ) : orden === null ? (
        <p className="py-4 text-center text-sm text-texto-2">
          Este equipo todavía no tiene una orden de servicio.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-primario">{orden.numeroOrden}</span>
            <EstadoBadge estado={orden.estado} />
          </div>

          <div className="rounded-lg bg-panel-2 p-3 text-sm text-texto-2">
            <p>
              <span className="text-texto">Cliente:</span> {orden.clienteNombre}
            </p>
            <p>
              <span className="text-texto">Ingreso:</span>{' '}
              {formatearFecha(orden.fechaIngreso)}
            </p>
            <p>
              <span className="text-texto">Costo:</span> {formatearPesos(orden.costo)}
            </p>
            {orden.problemaReportado && (
              <p className="mt-2">
                <span className="text-texto">Problema:</span> {orden.problemaReportado}
              </p>
            )}
          </div>

          <p className="text-xs text-texto-2">
            El detalle completo se abre desde el listado de órdenes.
          </p>
        </div>
      )}
    </Modal>
  );
}
