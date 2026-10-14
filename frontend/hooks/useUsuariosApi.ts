'use client';

// ============================================================
// hooks/useUsuariosApi.ts — USUARIOS DEL SISTEMA
// ------------------------------------------------------------
// Patrón useClientesApi del repo de referencia (ver ese archivo
// para la semántica de cargando/error y de las operaciones).
//
// Nota: GET/POST/PUT/DELETE /api/usuarios exige rol Admin en el
// backend; este hook no agrega autorización, solo refleja lo que
// la API responda.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { IUsuario, IUsuarioInput } from '@/interfaces/IUsuario';

export default function useUsuariosApi({ autoCargar = true }: OpcionesHook = {}) {
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerUsuarios = useCallback((): Promise<IUsuario[] | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IUsuario[]>('/usuarios'))
      .then((lista) => {
        setUsuarios(lista);
        setCargando(false);
        return lista;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  const agregarUsuario = useCallback(
    async (datos: IUsuarioInput): Promise<IUsuario> => {
      const nuevo = await api.post<IUsuario>('/usuarios', datos);
      setUsuarios((prev) => [...prev, nuevo]);
      return nuevo;
    },
    []
  );

  // Edición: merge de lo enviado. `password` opcional viene solo
  // si el operador quiso cambiarla (regla del backend).
  const editarUsuario = useCallback(
    async (id: number, datos: IUsuarioInput): Promise<void> => {
      await api.put(`/usuarios/${id}`, datos);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...datos } : u))
      );
    },
    []
  );

  const eliminarUsuario = useCallback(
    async (id: number): Promise<void> => {
      await api.delete(`/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    },
    []
  );

  useEffect(() => {
    if (autoCargar) obtenerUsuarios();
  }, [autoCargar, obtenerUsuarios]);

  return {
    usuarios,
    cargando,
    error,
    obtenerUsuarios,
    agregarUsuario,
    editarUsuario,
    eliminarUsuario,
  };
}
