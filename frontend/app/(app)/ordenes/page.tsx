'use client';

// ============================================================
// app/(app)/ordenes/page.tsx — LISTADO DE ÓRDENES (ROOM_MAP §4)
// ------------------------------------------------------------
// Buscar + filtrar por estado (chips) + crear + ver detalle +
// eliminar. El CAMBIO DE ESTADO y la edición viven en el
// detalle (/ordenes/[id]) porque son tareas de una orden
// concreta, no del listado.
//
// Chips de estado: el backend acepta ?estado=, pero traemos la
// lista completa y filtramos en cliente (mismo criterio que
// Clientes/Equipos). Si crece, se pasa el query param.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EstadoBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import {
  FLUJO_ESTADOS,
  ETIQUETAS_ESTADO,
  type EstadoOrden,
  type Orden,
} from '@/types';

// Chips: "Todos" + los 6 del flujo + "Cancelado" (rama lateral).
const CHIPS: Array<EstadoOrden | 'Todos'> = ['Todos', ...FLUJO_ESTADOS, 'Cancelado'];

export default function OrdenesPage() {
  const router = useRouter();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<EstadoOrden | 'Todos'>('Todos');

  const [ordenAEliminar, setOrdenAEliminar] = useState<Orden | null>(null);

  const cargar = useCallback(() => {
    api
      .get<Orden[]>('/ordenes')
      .then((lista) => {
        setOrdenes(lista);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error desconocido');
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarEliminacion() {
    const id = ordenAEliminar!.id;
    await api.delete(`/ordenes/${id}`);
    setOrdenes((prev) => prev.filter((o) => o.id !== id));
    setOrdenAEliminar(null);
  }

  // ---------- filtros en cliente ----------
  const visibles = ordenes.filter((o) => {
    if (filtro !== 'Todos' && o.estado !== filtro) return false;

    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return (
      o.numeroOrden.toLowerCase().includes(t) ||
      o.clienteNombre.toLowerCase().includes(t) ||
      (o.equipoNumeroSerie ?? '').toLowerCase().includes(t) ||
      (o.equipoTipo ?? '').toLowerCase().includes(t) ||
      (o.equipoMarca ?? '').toLowerCase().includes(t)
    );
  });

  // ---------- render ----------
  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">No se pudieron cargar las órdenes.</p>
        <p className="mt-1 text-xs text-texto-2">{error}</p>
        <Button variante="secondary" tamano="sm" className="mt-4" onClick={cargar}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Buscador + crear */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
          <input
            type="search"
            placeholder="Buscar N° de orden, cliente o serie…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

        <Button onClick={() => router.push('/ordenes/nueva')}>
          <Plus className="size-4" />
          Nueva orden
        </Button>
      </div>

      {/* Chips de estado con conteos */}
      <div className="mb-5 flex flex-wrap gap-2">
        {CHIPS.map((estado) => {
          const conteo =
            estado === 'Todos'
              ? ordenes.length
              : ordenes.filter((o) => o.estado === estado).length;
          const activo = filtro === estado;

          return (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltro(estado)}
              className={`
                cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors
                ${
                  activo
                    ? 'border-primario bg-primario/15 text-primario'
                    : 'border-white/10 bg-panel text-texto-2 hover:border-white/25'
                }
              `.replace(/\s+/g, ' ')}
            >
              {estado === 'Todos' ? 'Todos' : ETIQUETAS_ESTADO[estado]}{' '}
              <span className={activo ? 'text-primario' : 'text-texto-2/70'}>({conteo})</span>
            </button>
          );
        })}
      </div>

      {/* Vacío */}
      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda || filtro !== 'Todos'
              ? 'Ninguna orden coincide con el filtro actual.'
              : 'Todavía no hay órdenes de servicio.'}
          </p>
        </div>
      )}

      {/* Tarjetas */}
      <div className="flex flex-col gap-2.5">
        {visibles.map((orden) => (
          <div
            key={orden.id}
            // Toda la tarjeta abre el detalle; los botones internos
            // frenan la propagación para no navegar sin querer.
            onClick={() => router.push(`/ordenes/${orden.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') router.push(`/ordenes/${orden.id}`);
            }}
            className="group cursor-pointer rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-primario">
                    {orden.numeroOrden}
                  </span>
                  <EstadoBadge estado={orden.estado} />
                </div>
                <p className="mt-1 truncate text-sm font-medium text-texto">
                  {orden.clienteNombre}
                </p>
                <p className="truncate text-xs text-texto-2">
                  {[orden.equipoTipo, orden.equipoMarca, orden.equipoModelo]
                    .filter(Boolean)
                    .join(' ')}
                  {orden.equipoNumeroSerie && (
                    <span className="font-mono"> · S/N {orden.equipoNumeroSerie}</span>
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="text-sm font-semibold text-texto">
                    {formatearPesos(orden.costo)}
                  </p>
                  <p className="text-xs text-texto-2">
                    {formatearFecha(orden.fechaIngreso)}
                  </p>
                </div>

                <button
                  type="button"
                  title="Eliminar orden"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOrdenAEliminar(orden);
                  }}
                  className="rounded-lg p-1.5 text-texto-2 opacity-100 transition-colors hover:bg-error/10 hover:text-error sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmación de borrado */}
      <Modal
        abierto={ordenAEliminar !== null}
        onCerrar={() => setOrdenAEliminar(null)}
        titulo="Eliminar orden"
      >
        {ordenAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar la orden{' '}
              <span className="font-mono font-semibold text-texto">
                {ordenAEliminar.numeroOrden}
              </span>{' '}
              de {ordenAEliminar.clienteNombre}? Si tiene repuestos cargados,
              su stock se restaura. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variante="ghost" onClick={() => setOrdenAEliminar(null)}>
                Cancelar
              </Button>
              <Button variante="danger" onClick={confirmarEliminacion}>
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
