'use client';

// ============================================================
// components/OrdenesContext/OrdenesContext.tsx — ESTADO DE ÓRDENES
// ------------------------------------------------------------
// Patrón ClientesContext aplicado al listado de órdenes de
// servicio (ROOM_MAP §4): lista + búsqueda + chips de estado +
// modal de eliminar. El CAMBIO DE ESTADO y la edición viven en
// el detalle (/ordenes/[id] → OrdenDetalleContext, fase
// siguiente) porque son tareas de una orden concreta.
//
// Los chips aceptan ?estado= en la API, pero traemos la lista
// completa y filtramos en cliente (mismo criterio que el resto).
// El paginado también es visual: cortamos de a POR_PAGINA órdenes
// sobre `ordenesVisibles` (la API sigue devolviendo la lista completa).
//
// Consumo (dentro del Provider, si no lanza):
//   const { ordenesPaginadas, pagina, totalPaginas, irAPagina } = useOrdenes();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useOrdenesApi from '@/hooks/useOrdenesApi';
import type { EstadoOrden } from '@/types/estados';
import type { IOrden } from '@/interfaces/IOrden';

interface OrdenesContextValue {
  // datos (del hook) — `ordenes` completo alimenta los conteos
  ordenes: IOrden[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda + filtro de estado
  busqueda: string;
  setBusqueda: (texto: string) => void;
  filtro: EstadoOrden | 'Todos';
  setFiltro: (estado: EstadoOrden | 'Todos') => void;
  ordenesVisibles: IOrden[];
  // paginado visual (POR_PAGINA items sobre `ordenesVisibles`)
  ordenesPaginadas: IOrden[];
  pagina: number;
  totalPaginas: number;
  irAPagina: (pagina: number) => void;
  // modal eliminar (null = cerrado)
  ordenAEliminar: IOrden | null;
  setOrdenAEliminar: (orden: IOrden | null) => void;
  // operaciones
  confirmarEliminacion: () => Promise<void>;
}

const OrdenesContext = createContext<OrdenesContextValue | null>(null);

/** Cantidad de órdenes visibles por página. */
export const POR_PAGINA = 8;

export function OrdenesProvider({ children }: { children: ReactNode }) {
  const { ordenes, cargando, error, obtenerOrdenes, eliminarOrden } = useOrdenesApi();

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<EstadoOrden | 'Todos'>('Todos');
  const [pagina, setPagina] = useState(1);
  const [ordenAEliminar, setOrdenAEliminar] = useState<IOrden | null>(null);

  // Filtro doble en cliente: estado del chip + texto libre
  // (n° de orden, cliente, serie/tipo/marca del equipo).
  const t = busqueda.trim().toLowerCase();
  const ordenesVisibles = ordenes.filter((o) => {
    if (filtro !== 'Todos' && o.estado !== filtro) return false;
    if (!t) return true;
    return (
      o.numeroOrden.toLowerCase().includes(t) ||
      o.clienteNombre.toLowerCase().includes(t) ||
      (o.equipoNumeroSerie ?? '').toLowerCase().includes(t) ||
      (o.equipoTipo ?? '').toLowerCase().includes(t) ||
      (o.equipoMarca ?? '').toLowerCase().includes(t)
    );
  });

  // Paginado visual: el hook sigue trayendo TODAS las órdenes;
  // acá solo cortamos de a 8 las que pasaron el filtro.
  const totalPaginas = Math.max(
    1,
    Math.ceil(ordenesVisibles.length / POR_PAGINA)
  );

  // Ajuste durante el render (patrón "adjust state during render",
  // ver ModalEquipos): si se borra la última orden de la última
  // página, no queremos dejar una página vacía.
  const paginaActual = Math.min(pagina, totalPaginas);
  if (pagina !== paginaActual) setPagina(paginaActual);

  const ordenesPaginadas = ordenesVisibles.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA
  );

  // Cambiar el texto o el chip vuelve a la página 1 (si no, un
  // filtro con pocos resultados podría mostrar una página vacía).
  function cambiarBusqueda(texto: string) {
    setBusqueda(texto);
    setPagina(1);
  }

  function cambiarFiltro(estado: EstadoOrden | 'Todos') {
    setFiltro(estado);
    setPagina(1);
  }

  function irAPagina(nuevaPagina: number) {
    setPagina(Math.min(Math.max(nuevaPagina, 1), totalPaginas));
  }

  // ELIMINAR: el backend restaura el stock de los repuestos que
  // usaba la orden (aviso en el modal de confirmación).
  async function confirmarEliminacion() {
    await eliminarOrden(ordenAEliminar!.id);
    setOrdenAEliminar(null);
  }

  const value: OrdenesContextValue = {
    ordenes,
    cargando,
    error,
    recargar: () => {
      obtenerOrdenes();
    },
    busqueda,
    setBusqueda: cambiarBusqueda,
    filtro,
    setFiltro: cambiarFiltro,
    ordenesVisibles,
    ordenesPaginadas,
    pagina: paginaActual,
    totalPaginas,
    irAPagina,
    ordenAEliminar,
    setOrdenAEliminar,
    confirmarEliminacion,
  };

  return (
    <OrdenesContext.Provider value={value}>{children}</OrdenesContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useOrdenes(): OrdenesContextValue {
  const ctx = useContext(OrdenesContext);
  if (!ctx) {
    throw new Error('useOrdenes() debe usarse dentro de <OrdenesProvider>');
  }
  return ctx;
}
