'use client';

// ============================================================
// hooks/useEquiposApi.ts — DATOS DE EQUIPOS
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia (ver ese archivo
// para la semántica de cargando/error y de las operaciones).
//
// Extras de este módulo:
//   · obtenerEquiposPorCliente(clienteId) → lista del modal
//     "ver equipos" de /clientes (GET /equipos?clienteId=);
//     devuelve la lista sin tocar el listado principal
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { IEquipo, IEquipoInput } from '@/interfaces/IEquipo';

export default function useEquiposApi({ autoCargar = true }: OpcionesHook = {}) {
  const [equipos, setEquipos] = useState<IEquipo[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerEquipos = useCallback((): Promise<IEquipo[] | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IEquipo[]>('/equipos'))
      .then((lista) => {
        setEquipos(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  // Equipos de UN cliente (modal de /clientes). No modifica la
  // lista principal ni el spinner: es una lectura aparte.
  const obtenerEquiposPorCliente = useCallback(
    async (clienteId: number): Promise<IEquipo[]> =>
      api.get<IEquipo[]>(`/equipos?clienteId=${clienteId}`),
    []
  );

  const agregarEquipo = useCallback(
    async (datos: IEquipoInput): Promise<IEquipo> => {
      const nuevo = await api.post<IEquipo>('/equipos', datos);
      setEquipos((prev) => [...prev, nuevo]);
      return nuevo;
    },
    []
  );

  const editarEquipo = useCallback(
    async (id: number, datos: IEquipoInput): Promise<void> => {
      await api.put(`/equipos/${id}`, datos);
      setEquipos((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...datos } : e))
      );
    },
    []
  );

  // Actualización puntual de una tarjeta: tras editar, el
  // Context resuelve datos calculados (ej: clienteNombre desde
  // la lista de clientes) y pisa la copia local completa.
  const actualizarEquipoLocal = useCallback((equipo: IEquipo) => {
    setEquipos((prev) => prev.map((e) => (e.id === equipo.id ? equipo : e)));
  }, []);

  const eliminarEquipo = useCallback(async (id: number): Promise<void> => {
    await api.delete(`/equipos/${id}`);
    setEquipos((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    if (autoCargar) obtenerEquipos();
  }, [autoCargar, obtenerEquipos]);

  return {
    equipos,
    cargando,
    error,
    obtenerEquipos,
    obtenerEquiposPorCliente,
    agregarEquipo,
    editarEquipo,
    actualizarEquipoLocal,
    eliminarEquipo,
  };
}
