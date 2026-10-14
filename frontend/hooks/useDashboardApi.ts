'use client';

// ============================================================
// hooks/useDashboardApi.ts — RESUMEN DEL PANEL PRINCIPAL
// ------------------------------------------------------------
// Patrón de carga del repo de referencia, pero sin operaciones:
// el dashboard es de SOLO LECTURA (GET /dashboard/resumen arma
// todo el resumen en el backend — DashboardDtos.cs).
//
// Sin Context: no comparte estado entre componentes; la página
// /dashboard consume este hook directamente.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { OpcionesHook } from './opciones';
import type { IDashboard } from '@/interfaces/IDashboard';

export default function useDashboardApi({ autoCargar = true }: OpcionesHook = {}) {
  const [resumen, setResumen] = useState<IDashboard | null>(null);
  const [cargando, setCargando] = useState(autoCargar);
  const [error, setError] = useState<string | null>(null);

  const obtenerResumen = useCallback((): Promise<IDashboard | undefined> => {
    // Forma .then() por react-hooks/set-state-in-effect: ver el
    // patrón completo en useClientesApi.
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => api.get<IDashboard>('/dashboard/resumen'))
      .then((datos) => {
        setResumen(datos);
        setCargando(false);
        return datos;
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
        setCargando(false);
        return undefined;
      });
  }, []);

  useEffect(() => {
    if (autoCargar) obtenerResumen();
  }, [autoCargar, obtenerResumen]);

  return { resumen, cargando, error, obtenerResumen };
}
