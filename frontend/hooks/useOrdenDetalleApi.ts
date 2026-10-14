'use client';

// ============================================================
// hooks/useOrdenDetalleApi.ts — DETALLE DE UNA ORDEN
// ------------------------------------------------------------
// A diferencia del hook de LISTADO (useOrdenesApi), éste carga
// UNA orden por id + los catálogos que el detalle necesita, y
// tras cada operación RECARGA (el backend recalcula costo,
// fechas y stock — la única fuente de verdad es la API).
//
//   · Tres requests en paralelo: orden + servicios + repuestos.
//     /repuestos puede dar 403 (rol Recepcion) → .catch entrega
//     lista vacía y la pantalla no se rompe: el panel de
//     repuestos simplemente no se muestra.
//   · El spinner (cargando) solo aplica a la PRIMERA carga; las
//     recargas posteriores a un guardado son silenciosas (misma
//     UX que la página original).
//
// Los detalles se editan REEMPLAZANDO los dos listados: el
// backend exige que el PUT lleve detallesServicios y
// detallesRepuestos juntos (si falta uno, lo vacía).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type {
  IOrden,
  IOrdenEstadoInput,
  IDetalleServicioInput,
  IDetalleRepuestoInput,
} from '@/interfaces/IOrden';
import type { IRepuesto } from '@/interfaces/IRepuesto';
import type { IServicio } from '@/interfaces/IServicio';

export default function useOrdenDetalleApi(id: number) {
  const [orden, setOrden] = useState<IOrden | null>(null);
  const [servicios, setServicios] = useState<IServicio[]>([]);
  const [repuestos, setRepuestos] = useState<IRepuesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trae todo sin tocar el spinner (recargas silenciosas).
  // Forma .then(): TODOS los callbacks — es la única que acepta la
  // regla react-hooks/set-state-in-effect cuando el efecto de carga
  // invoca `obtener` (que llama a éste).
  const traerTodo = useCallback((): Promise<void> => {
    return Promise.all([
      api.get<IOrden>(`/ordenes/${id}`),
      api.get<IServicio[]>('/servicios'),
      api.get<IRepuesto[]>('/repuestos').catch(() => [] as IRepuesto[]),
    ])
      .then(([o, s, r]) => {
        setOrden(o);
        setServicios(s);
        setRepuestos(r);
        setError(null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Ocurrió un error desconocido');
      });
  }, [id]);

  // Carga inicial (con spinner) + recarga pública (Reintentar).
  const obtener = useCallback((): Promise<void> => {
    return Promise.resolve()
      .then(() => {
        setCargando(true);
        setError(null);
      })
      .then(() => traerTodo())
      .finally(() => {
        setCargando(false);
      });
  }, [traerTodo]);

  useEffect(() => {
    obtener();
  }, [obtener]);

  // Edición de cabecera: sin listados en el body → el backend
  // NO toca los detalles (regla del OrdenUpdateDto).
  const actualizarCabecera = useCallback(
    async (datos: {
      problemaReportado: string | null;
      fechaEstimada: string | null;
      observaciones: string | null;
    }): Promise<void> => {
      await api.put(`/ordenes/${id}`, datos);
      await traerTodo();
    },
    [id, traerTodo]
  );

  // Cambio de estado (validado por el backend contra TRANSICIONES).
  const cambiarEstado = useCallback(
    async (datos: IOrdenEstadoInput): Promise<void> => {
      await api.put(`/ordenes/${id}/estado`, datos);
      await traerTodo();
    },
    [id, traerTodo]
  );

  // Clave del negocio: el PUT reemplaza AMBOS listados de
  // detalles → siempre se mandan los dos arrays juntos. El
  // backend recalcula el costo y descuenta/restaura stock.
  const reemplazarDetalles = useCallback(
    async (
      detallesServicios: IDetalleServicioInput[],
      detallesRepuestos: IDetalleRepuestoInput[]
    ): Promise<void> => {
      await api.put(`/ordenes/${id}`, { detallesServicios, detallesRepuestos });
      await traerTodo();
    },
    [id, traerTodo]
  );

  // Baja: la vista navega de vuelta al listado; no hay nada que
  // recargar.
  const eliminarOrden = useCallback(async (): Promise<void> => {
    await api.delete(`/ordenes/${id}`);
  }, [id]);

  return {
    orden,
    servicios,
    repuestos,
    cargando,
    error,
    obtener,
    actualizarCabecera,
    cambiarEstado,
    reemplazarDetalles,
    eliminarOrden,
  };
}
