'use client';

// ============================================================
// components/ServiciosContext/ServiciosContext.tsx — ESTADO DE SERVICIOS
// ------------------------------------------------------------
// Patrón ClientesContext aplicado al catálogo de servicios
// (ROOM_MAP §9): Provider dueño de la lista, la búsqueda y los
// modales de editar/eliminar.
//   · capa de datos → hooks/useServiciosApi (sobre lib/api.ts)
//   · el ROL (Admin/Tecnico escriben; Recepcion solo mira) es
//     comodidad visual de la vista — la API igual valida 403.
//
// Consumo (dentro del Provider, si no lanza):
//   const { serviciosVisibles, setServicioAEditar } = useServicios();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useServiciosApi from '@/hooks/useServiciosApi';
import type { IServicio, IServicioInput } from '@/interfaces/IServicio';

interface ServiciosContextValue {
  // datos (del hook)
  servicios: IServicio[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda
  busqueda: string;
  setBusqueda: (texto: string) => void;
  serviciosVisibles: IServicio[];
  // modales (null = cerrado)
  servicioAEditar: IServicio | null;
  setServicioAEditar: (servicio: IServicio | null) => void;
  servicioAEliminar: IServicio | null;
  setServicioAEliminar: (servicio: IServicio | null) => void;
  // operaciones
  guardarEdicion: (datos: IServicioInput) => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const ServiciosContext = createContext<ServiciosContextValue | null>(null);

export function ServiciosProvider({ children }: { children: ReactNode }) {
  const {
    servicios,
    cargando,
    error,
    obtenerServicios,
    editarServicio,
    eliminarServicio,
  } = useServiciosApi();

  const [busqueda, setBusqueda] = useState('');
  const [servicioAEditar, setServicioAEditar] = useState<IServicio | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<IServicio | null>(null);

  // Filtrado en cliente (nombre o descripción).
  const t = busqueda.trim().toLowerCase();
  const serviciosVisibles = t
    ? servicios.filter(
        (s) =>
          s.nombre.toLowerCase().includes(t) ||
          (s.descripcion ?? '').toLowerCase().includes(t)
      )
    : servicios;

  // EDITAR: si el PUT falla, el form muestra el error y el
  // modal queda abierto.
  async function guardarEdicion(datos: IServicioInput) {
    await editarServicio(servicioAEditar!.id, datos);
    setServicioAEditar(null);
  }

  // ELIMINAR: el backend conserva las líneas de órdenes que ya
  // usaron este servicio (aviso en el modal de confirmación).
  async function confirmarEliminacion() {
    await eliminarServicio(servicioAEliminar!.id);
    setServicioAEliminar(null);
  }

  const value: ServiciosContextValue = {
    servicios,
    cargando,
    error,
    recargar: () => {
      obtenerServicios();
    },
    busqueda,
    setBusqueda,
    serviciosVisibles,
    servicioAEditar,
    setServicioAEditar,
    servicioAEliminar,
    setServicioAEliminar,
    guardarEdicion,
    confirmarEliminacion,
  };

  return (
    <ServiciosContext.Provider value={value}>{children}</ServiciosContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useServicios(): ServiciosContextValue {
  const ctx = useContext(ServiciosContext);
  if (!ctx) {
    throw new Error('useServicios() debe usarse dentro de <ServiciosProvider>');
  }
  return ctx;
}
