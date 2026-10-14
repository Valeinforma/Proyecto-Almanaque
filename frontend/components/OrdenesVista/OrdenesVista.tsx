'use client';

// ============================================================
// components/OrdenesVista/OrdenesVista.tsx — LISTADO DE ÓRDENES
// ------------------------------------------------------------
// Vista del módulo Órdenes (ROOM_MAP §4): consume el Context —
// NO hace fetch ni tiene lógica de negocio propia.
//
// Buscar + filtrar por estado (chips con conteo) + crear + ver
// detalle + eliminar. Toda la tarjeta abre el detalle; los
// botones internos frenan la propagación para no navegar.
// ============================================================

import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { EstadoBadge } from '@/components/Badge/Badge';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import ChipsEstado from '@/components/ChipsEstado/ChipsEstado';
import type { Chip } from '@/components/ChipsEstado/ChipsEstado';
import { useOrdenes } from '@/components/OrdenesContext/OrdenesContext';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import { FLUJO_ESTADOS, ETIQUETAS_ESTADO } from '@/types/estados';
import type { EstadoOrden } from '@/types/estados';

// Chips: "Todos" + los 6 del flujo + "Cancelado" (rama lateral).
const CHIPS: Array<EstadoOrden | 'Todos'> = ['Todos', ...FLUJO_ESTADOS, 'Cancelado'];

export default function OrdenesVista() {
  const router = useRouter();

  const {
    ordenes,
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    ordenesVisibles,
    ordenAEliminar,
    setOrdenAEliminar,
    confirmarEliminacion,
  } = useOrdenes();

  // Etiquetas y conteos salen de la lista COMPLETA (el chip
  // muestra cuántas hay en cada estado aunque haya otro filtro).
  const chips: Chip[] = CHIPS.map((estado) => ({
    valor: estado,
    etiqueta: estado === 'Todos' ? 'Todos' : ETIQUETAS_ESTADO[estado],
    conteo:
      estado === 'Todos'
        ? ordenes.length
        : ordenes.filter((o) => o.estado === estado).length,
  }));

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar las órdenes."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Buscador + crear */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar N° de orden, cliente o serie…"
        />

        <Button onClick={() => router.push('/ordenes/nueva')}>
          <Plus className="size-4" />
          Nueva orden
        </Button>
      </div>

      {/* Chips de estado con conteos */}
      <ChipsEstado chips={chips} activo={filtro} onSeleccionar={(v) => setFiltro(v as EstadoOrden | 'Todos')} />

      {/* Vacío */}
      {ordenesVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda || filtro !== 'Todos'
              ? 'Ninguna orden coincide con el filtro actual.'
              : 'Todavía no hay órdenes de servicio.'
          }
        />
      )}

      {/* Tarjetas */}
      <div className="flex flex-col gap-2.5">
        {ordenesVisibles.map((orden) => (
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
