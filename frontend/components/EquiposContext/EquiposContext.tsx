'use client';

// ============================================================
// components/EquiposContext/EquiposContext.tsx — ESTADO DE EQUIPOS
// ------------------------------------------------------------
// Patrón ClientesContext aplicado a equipos (ROOM_MAP §7), con
// la particularidad del módulo: el listado necesita DOS datos —
// equipos Y clientes (el form usa el select de clientes) — así
// que el Provider compone DOS hooks:
//
//   · useEquiposApi  → lista principal + CRUD
//   · useClientesApi → el select del EquipoForm y para resolver
//     clienteNombre al editar (sin volver a pedir la tarjeta)
//
// cargando/error combinados: era un solo Promise.all antes y
// ahora son dos requests en paralelo — misma UX.
//
// Consumo (dentro del Provider, si no lanza):
//   const { equiposVisibles, setEquipoAEditar } = useEquipos();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useEquiposApi from '@/hooks/useEquiposApi';
import useClientesApi from '@/hooks/useClientesApi';
import type { ICliente } from '@/interfaces/ICliente';
import type { IEquipo, IEquipoInput } from '@/interfaces/IEquipo';

interface EquiposContextValue {
  // datos (dos hooks combinados)
  equipos: IEquipo[];
  clientes: ICliente[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda
  busqueda: string;
  setBusqueda: (texto: string) => void;
  equiposVisibles: IEquipo[];
  // modales (null = cerrado)
  equipoAEditar: IEquipo | null;
  setEquipoAEditar: (equipo: IEquipo | null) => void;
  equipoAEliminar: IEquipo | null;
  setEquipoAEliminar: (equipo: IEquipo | null) => void;
  equipoOrden: IEquipo | null;
  setEquipoOrden: (equipo: IEquipo | null) => void;
  // operaciones
  guardarEdicion: (datos: IEquipoInput) => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const EquiposContext = createContext<EquiposContextValue | null>(null);

export function EquiposProvider({ children }: { children: ReactNode }) {
  const {
    equipos,
    cargando: cargandoEquipos,
    error: errorEquipos,
    obtenerEquipos,
    editarEquipo,
    actualizarEquipoLocal,
    eliminarEquipo,
  } = useEquiposApi();
  const {
    clientes,
    cargando: cargandoClientes,
    error: errorClientes,
    obtenerClientes,
  } = useClientesApi();

  const [busqueda, setBusqueda] = useState('');
  const [equipoAEditar, setEquipoAEditar] = useState<IEquipo | null>(null);
  const [equipoAEliminar, setEquipoAEliminar] = useState<IEquipo | null>(null);
  const [equipoOrden, setEquipoOrden] = useState<IEquipo | null>(null);

  // Ambas listas cargando → spinner; el primer error (de
  // equipos si lo hay, si no el de clientes) es el que se ve.
  const cargando = cargandoEquipos || cargandoClientes;
  const error = errorEquipos ?? errorClientes;

  // Filtrado en cliente: tipo, marca, modelo, serie o cliente.
  const t = busqueda.trim().toLowerCase();
  const equiposVisibles = t
    ? equipos.filter(
        (eq) =>
          (eq.tipo ?? '').toLowerCase().includes(t) ||
          (eq.marca ?? '').toLowerCase().includes(t) ||
          (eq.modelo ?? '').toLowerCase().includes(t) ||
          (eq.numeroSerie ?? '').toLowerCase().includes(t) ||
          eq.clienteNombre.toLowerCase().includes(t)
      )
    : equipos;

  // EDITAR: el PUT no recalcula clienteNombre en el DTO — el
  // Context lo resuelve desde la lista de clientes en memoria
  // y pisa la tarjeta local completa.
  async function guardarEdicion(datos: IEquipoInput) {
    const equipo = equipoAEditar!;
    await editarEquipo(equipo.id, datos);

    const cliente = clientes.find((c) => c.id === datos.clienteId);
    actualizarEquipoLocal({
      ...equipo,
      ...datos,
      clienteNombre: cliente
        ? `${cliente.nombre} ${cliente.apellido}`
        : equipo.clienteNombre,
    });
    setEquipoAEditar(null);
  }

  async function confirmarEliminacion() {
    await eliminarEquipo(equipoAEliminar!.id);
    setEquipoAEliminar(null);
  }

  const value: EquiposContextValue = {
    equipos,
    clientes,
    cargando,
    error,
    recargar: () => {
      obtenerEquipos();
      obtenerClientes();
    },
    busqueda,
    setBusqueda,
    equiposVisibles,
    equipoAEditar,
    setEquipoAEditar,
    equipoAEliminar,
    setEquipoAEliminar,
    equipoOrden,
    setEquipoOrden,
    guardarEdicion,
    confirmarEliminacion,
  };

  return (
    <EquiposContext.Provider value={value}>{children}</EquiposContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useEquipos(): EquiposContextValue {
  const ctx = useContext(EquiposContext);
  if (!ctx) {
    throw new Error('useEquipos() debe usarse dentro de <EquiposProvider>');
  }
  return ctx;
}
