'use client';

// ============================================================
// hooks/useClientesApi.ts — DATOS DE CLIENTES
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia, adaptado a la
// lógica de este proyecto:
//
//   · el HTTP pasa por lib/api.ts → header X-Usuario-Id,
//     ApiError con el { mensaje } del backend y borrado de
//     sesión en 401 (el fetch crudo del repo no lo resuelve)
//   · cargando/error → estado de la CARGA de la lista; los
//     errores de carga NO lanzan: quedan en `error` para que
//     la vista muestre el estado de reintento
//   · las operaciones CRUD LANZAN: el formulario que las
//     invoca las captura y muestra el mensaje bajo los campos
//
// Uso:
//   const { clientes, cargando, error, obtenerClientes,
//           agregarCliente, editarCliente, eliminarCliente } = useClientesApi();
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { ICliente, IClienteInput } from '@/interfaces/ICliente';

export default function useClientesApi({ autoCargar = true }: OpcionesHook = {}) {
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerClientes = useCallback((): Promise<ICliente[] | undefined> => {
    // Forma .then(): TODOS los callbacks — es la única que acepta la
    // regla react-hooks/set-state-in-effect cuando la auto-carga
    // invoca este método desde su effect (un setState "a secas" en el
    // cuerpo cuenta como síncrono dentro del effect, incluso detrás
    // de un await).
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<ICliente[]>('/clientes'))
      .then((lista) => {
        setClientes(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  // Lectura puntual: no toca la lista ni el spinner.
  const obtenerClientePorId = useCallback(
    async (id: number): Promise<ICliente | undefined> => {
      try {
        return await api.get<ICliente>(`/clientes/${id}`);
      } catch {
        return undefined;
      }
    },
    []
  );

  // Alta: si el backend respondió OK, el DTO nuevo entra a la lista.
  const agregarCliente = useCallback(
    async (datos: IClienteInput): Promise<ICliente> => {
      const nuevo = await api.post<ICliente>('/clientes', datos);
      setClientes((prev) => [...prev, nuevo]);
      return nuevo;
    },
    []
  );

  // Edición: merge de lo enviado sobre la copia local (mismo
  // criterio que las pantallas originales del sistema).
  const editarCliente = useCallback(
    async (id: number, datos: IClienteInput): Promise<void> => {
      await api.put(`/clientes/${id}`, datos);
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...datos } : c))
      );
    },
    []
  );

  const eliminarCliente = useCallback(async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    if (autoCargar) obtenerClientes();
  }, [autoCargar, obtenerClientes]);

  return {
    clientes,
    cargando,
    error,
    obtenerClientes,
    obtenerClientePorId,
    agregarCliente,
    editarCliente,
    eliminarCliente,
  };
}
