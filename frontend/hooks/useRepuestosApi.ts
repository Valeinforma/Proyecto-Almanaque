'use client';

// ============================================================
// hooks/useRepuestosApi.ts — CATÁLOGO DE REPUESTOS
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia (ver ese archivo
// para la semántica de cargando/error y de las operaciones).
//
// Nota de negocio: el backend descuenta stock al agregar un
// repuesto a una orden y lo restaura al quitarlo; por eso una
// edición/eliminación desde esta pantalla puede encontrar el
// stock real distinto del que se muestra.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { IRepuesto, IRepuestoInput } from '@/interfaces/IRepuesto';

export default function useRepuestosApi({ autoCargar = true }: OpcionesHook = {}) {
  const [repuestos, setRepuestos] = useState<IRepuesto[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerRepuestos = useCallback((): Promise<IRepuesto[] | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IRepuesto[]>('/repuestos'))
      .then((lista) => {
        setRepuestos(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  const agregarRepuesto = useCallback(
    async (datos: IRepuestoInput): Promise<IRepuesto> => {
      const nuevo = await api.post<IRepuesto>('/repuestos', datos);
      setRepuestos((prev) => [...prev, nuevo]);
      return nuevo;
    },
    []
  );

  const editarRepuesto = useCallback(
    async (id: number, datos: IRepuestoInput): Promise<void> => {
      await api.put(`/repuestos/${id}`, datos);
      setRepuestos((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...datos } : r))
      );
    },
    []
  );

  const eliminarRepuesto = useCallback(
    async (id: number): Promise<void> => {
      await api.delete(`/repuestos/${id}`);
      setRepuestos((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  useEffect(() => {
    if (autoCargar) obtenerRepuestos();
  }, [autoCargar, obtenerRepuestos]);

  return {
    repuestos,
    cargando,
    error,
    obtenerRepuestos,
    agregarRepuesto,
    editarRepuesto,
    eliminarRepuesto,
  };
}
