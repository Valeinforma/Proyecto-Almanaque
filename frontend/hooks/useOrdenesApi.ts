'use client';

// ============================================================
// hooks/useOrdenesApi.ts — DATOS DE ÓRDENES DE SERVICIO
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia (ver ese archivo
// para la semántica de cargando/error y de las operaciones).
//
// Extras de este módulo:
//   · cambiarEstado(id, datos) → PUT /ordenes/{id}/estado con
//     las transiciones validadas por el backend; además refleja
//     el nuevo estado en la copia local de la lista
//   · editarOrden → PUT /ordenes/{id} (cabecera y detalles)
//
// El DETALLE de una orden usa useOrdenDetalleApi (carga por id),
// no este hook de lista.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type {
  IOrden,
  IOrdenEstadoInput,
  IOrdenInput,
  IOrdenUpdateInput,
} from '@/interfaces/IOrden';

export default function useOrdenesApi({ autoCargar = true }: OpcionesHook = {}) {
  const [ordenes, setOrdenes] = useState<IOrden[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerOrdenes = useCallback((): Promise<IOrden[] | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IOrden[]>('/ordenes'))
      .then((lista) => {
        setOrdenes(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  const agregarOrden = useCallback(
    async (datos: IOrdenInput): Promise<IOrden> => {
      const nueva = await api.post<IOrden>('/ordenes', datos);
      setOrdenes((prev) => [...prev, nueva]);
      return nueva;
    },
    []
  );

  // Edición de cabecera/detalle: el backend recalcula costo y
  // stock, así que NO se hace merge local del input sobre la
  // copia (rompería los tipos: input ≠ DTO de respuesta). Quien
  // edita (detalle de la orden) recarga con useOrdenDetalleApi.
  const editarOrden = useCallback(
    async (id: number, datos: IOrdenUpdateInput): Promise<void> => {
      await api.put(`/ordenes/${id}`, datos);
    },
    []
  );

  // Cambio de estado (validado por el backend): si la lista está
  // cargada, el chip/badge de esa orden se actualiza al instante.
  const cambiarEstado = useCallback(
    async (id: number, datos: IOrdenEstadoInput): Promise<void> => {
      await api.put(`/ordenes/${id}/estado`, datos);
      setOrdenes((prev) =>
        prev.map((o) => (o.id === id ? { ...o, estado: datos.estado } : o))
      );
    },
    []
  );

  const eliminarOrden = useCallback(async (id: number): Promise<void> => {
    await api.delete(`/ordenes/${id}`);
    setOrdenes((prev) => prev.filter((o) => o.id !== id));
  }, []);

  useEffect(() => {
    if (autoCargar) obtenerOrdenes();
  }, [autoCargar, obtenerOrdenes]);

  return {
    ordenes,
    cargando,
    error,
    obtenerOrdenes,
    agregarOrden,
    editarOrden,
    cambiarEstado,
    eliminarOrden,
  };
}
