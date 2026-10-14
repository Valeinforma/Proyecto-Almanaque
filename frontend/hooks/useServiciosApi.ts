'use client';

// ============================================================
// hooks/useServiciosApi.ts — CATÁLOGO DE SERVICIOS
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia (ver ese archivo
// para la semántica de cargando/error y de las operaciones).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { IServicio, IServicioInput } from '@/interfaces/IServicio';

export default function useServiciosApi({ autoCargar = true }: OpcionesHook = {}) {
  const [servicios, setServicios] = useState<IServicio[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerServicios = useCallback((): Promise<IServicio[] | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IServicio[]>('/servicios'))
      .then((lista) => {
        setServicios(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  const agregarServicio = useCallback(
    async (datos: IServicioInput): Promise<IServicio> => {
      const nuevo = await api.post<IServicio>('/servicios', datos);
      setServicios((prev) => [...prev, nuevo]);
      return nuevo;
    },
    []
  );

  const editarServicio = useCallback(
    async (id: number, datos: IServicioInput): Promise<void> => {
      await api.put(`/servicios/${id}`, datos);
      setServicios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...datos } : s))
      );
    },
    []
  );

  const eliminarServicio = useCallback(
    async (id: number): Promise<void> => {
      await api.delete(`/servicios/${id}`);
      setServicios((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  useEffect(() => {
    if (autoCargar) obtenerServicios();
  }, [autoCargar, obtenerServicios]);

  return {
    servicios,
    cargando,
    error,
    obtenerServicios,
    agregarServicio,
    editarServicio,
    eliminarServicio,
  };
}
