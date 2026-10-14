'use client';

// ============================================================
// components/RepuestosContext/RepuestosContext.tsx — ESTADO DE REPUESTOS
// ------------------------------------------------------------
// Patrón ClientesContext aplicado al inventario de repuestos
// (ROOM_MAP §8) + la guarda de rol propia del módulo:
//
//   · TODOS los endpoints /api/repuestos exigen Admin/Tecnico
//     (incluso el GET) → si el rol no alcanza, NI SE PIDE la
//     lista (autoCargar: acceso) y la vista muestra "sin acceso"
//     sin generar un 403 (esto es solo UX: el backend también
//     rechazaría).
//
// Consumo (dentro del Provider, si no lanza):
//   const { repuestosVisibles, setRepuestoAEditar } = useRepuestos();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useRepuestosApi from '@/hooks/useRepuestosApi';
import { tieneRol } from '@/lib/auth';
import type { IRepuesto, IRepuestoInput } from '@/interfaces/IRepuesto';

interface RepuestosContextValue {
  /** false → rol sin acceso (Recepcion): no hay request ni lista. */
  acceso: boolean;
  // datos (del hook)
  repuestos: IRepuesto[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda
  busqueda: string;
  setBusqueda: (texto: string) => void;
  repuestosVisibles: IRepuesto[];
  // modales (null = cerrado)
  repuestoAEditar: IRepuesto | null;
  setRepuestoAEditar: (repuesto: IRepuesto | null) => void;
  repuestoAEliminar: IRepuesto | null;
  setRepuestoAEliminar: (repuesto: IRepuesto | null) => void;
  // operaciones
  guardarEdicion: (datos: IRepuestoInput) => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const RepuestosContext = createContext<RepuestosContextValue | null>(null);

export function RepuestosProvider({ children }: { children: ReactNode }) {
  // Guarda de rol ANTES de tocar la API (el backend también
  // rechazaría con 403 — esto ahorra el request y da mejor UX).
  const acceso = tieneRol('Admin', 'Tecnico');

  const {
    repuestos,
    cargando,
    error,
    obtenerRepuestos,
    editarRepuesto,
    eliminarRepuesto,
  } = useRepuestosApi({ autoCargar: acceso });

  const [busqueda, setBusqueda] = useState('');
  const [repuestoAEditar, setRepuestoAEditar] = useState<IRepuesto | null>(null);
  const [repuestoAEliminar, setRepuestoAEliminar] = useState<IRepuesto | null>(null);

  // Filtrado en cliente (nombre o descripción).
  const t = busqueda.trim().toLowerCase();
  const repuestosVisibles = t
    ? repuestos.filter(
        (r) =>
          r.nombre.toLowerCase().includes(t) ||
          (r.descripcion ?? '').toLowerCase().includes(t)
      )
    : repuestos;

  async function guardarEdicion(datos: IRepuestoInput) {
    await editarRepuesto(repuestoAEditar!.id, datos);
    setRepuestoAEditar(null);
  }

  // ELIMINAR: el backend conserva las líneas de órdenes que ya
  // usaron este repuesto (aviso en el modal de confirmación).
  async function confirmarEliminacion() {
    await eliminarRepuesto(repuestoAEliminar!.id);
    setRepuestoAEliminar(null);
  }

  const value: RepuestosContextValue = {
    acceso,
    repuestos,
    cargando,
    error,
    recargar: () => {
      obtenerRepuestos();
    },
    busqueda,
    setBusqueda,
    repuestosVisibles,
    repuestoAEditar,
    setRepuestoAEditar,
    repuestoAEliminar,
    setRepuestoAEliminar,
    guardarEdicion,
    confirmarEliminacion,
  };

  return (
    <RepuestosContext.Provider value={value}>{children}</RepuestosContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useRepuestos(): RepuestosContextValue {
  const ctx = useContext(RepuestosContext);
  if (!ctx) {
    throw new Error('useRepuestos() debe usarse dentro de <RepuestosProvider>');
  }
  return ctx;
}
