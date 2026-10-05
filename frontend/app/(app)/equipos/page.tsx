'use client';

// ============================================================
// app/(app)/equipos/page.tsx — LISTADO DE EQUIPOS (ROOM_MAP §7)
// ------------------------------------------------------------
// Mismo patrón CRUD que Clientes (Parte 3):
//   buscar · crear · editar · eliminar · VER ORDEN RELACIONADA
//
// Tarjeta con lo que pide SDD §8: tipo, marca, modelo, número
// de serie, cliente, descripción y estado de su orden (badge).
//
// Diferencia con Clientes: el listado necesita DOS datos —
// equipos Y clientes (el form usa el select de clientes).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EstadoBadge } from '@/components/ui/Badge';
import EquipoForm from '@/components/forms/EquipoForm';
import { api } from '@/lib/api';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import type { Cliente, Equipo, EquipoInput, Orden } from '@/types';

export default function EquiposPage() {
  // ---------- estado ----------
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [equipoAEditar, setEquipoAEditar] = useState<Equipo | null>(null);
  const [equipoAEliminar, setEquipoAEliminar] = useState<Equipo | null>(null);
  const [equipoOrden, setEquipoOrden] = useState<Equipo | null>(null);

  // ---------- carga (las dos listas en paralelo) ----------
  const cargar = useCallback(() => {
    Promise.all([
      api.get<Equipo[]>('/equipos'),
      api.get<Cliente[]>('/clientes'),
    ])
      .then(([listaEquipos, listaClientes]) => {
        setEquipos(listaEquipos);
        setClientes(listaClientes);
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

  // ---------- acciones ----------
  async function guardarEdicion(datos: EquipoInput) {
    const id = equipoAEditar!.id;
    await api.put<Equipo>(`/equipos/${id}`, datos);

    // Reconstruimos la tarjeta actualizada: el cliente lo
    // resolvemos desde la lista que ya tenemos en memoria.
    const cliente = clientes.find((c) => c.id === datos.clienteId);
    setEquipos((prev) =>
      prev.map((eq) =>
        eq.id === id
          ? {
              ...eq,
              ...datos,
              clienteNombre: cliente
                ? `${cliente.nombre} ${cliente.apellido}`
                : eq.clienteNombre,
            }
          : eq
      )
    );
    setEquipoAEditar(null);
  }

  async function confirmarEliminacion() {
    const id = equipoAEliminar!.id;
    await api.delete(`/equipos/${id}`);
    setEquipos((prev) => prev.filter((eq) => eq.id !== id));
    setEquipoAEliminar(null);
  }

  // ---------- filtrado en cliente (igual que Clientes) ----------
  const visibles = equipos.filter((eq) => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return (
      (eq.tipo ?? '').toLowerCase().includes(t) ||
      (eq.marca ?? '').toLowerCase().includes(t) ||
      (eq.modelo ?? '').toLowerCase().includes(t) ||
      (eq.numeroSerie ?? '').toLowerCase().includes(t) ||
      eq.clienteNombre.toLowerCase().includes(t)
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
        <p className="text-sm text-error">No se pudieron cargar los equipos.</p>
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
          <input
            type="search"
            placeholder="Buscar por tipo, serie o cliente…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

        <Link href="/equipos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo equipo
          </Button>
        </Link>
      </div>

      {/* Vacío */}
      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda
              ? `No hay equipos que coincidan con "${busqueda}".`
              : 'Todavía no hay equipos cargados.'}
          </p>
        </div>
      )}

      {/* Grilla de tarjetas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((equipo) => {
          const titulo = [equipo.tipo, equipo.marca, equipo.modelo]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={equipo.id}
              className="group rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-texto">
                    {titulo || 'Equipo sin detalle'}
                  </h3>
                  {/* Cliente dueño */}
                  <p className="truncate text-xs text-primario">
                    {equipo.clienteNombre}
                  </p>
                </div>

                {equipo.ordenEstado && <EstadoBadge estado={equipo.ordenEstado} />}
              </div>

              {/* Serie + descripción */}
              <div className="mt-3 flex flex-col gap-1 text-xs text-texto-2">
                <span className="font-mono">
                  S/N: {equipo.numeroSerie ?? '—'}
                </span>
                {equipo.descripcion && (
                  <span className="line-clamp-2">{equipo.descripcion}</span>
                )}
              </div>

              {/* Acciones */}
              <div className="mt-3 flex justify-end gap-1 border-t border-white/5 pt-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  title="Ver orden relacionada"
                  onClick={() => setEquipoOrden(equipo)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-primario"
                >
                  <ClipboardList className="size-4" />
                </button>
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setEquipoAEditar(equipo)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-aviso"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => setEquipoAEliminar(equipo)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: editar */}
      <Modal
        abierto={equipoAEditar !== null}
        onCerrar={() => setEquipoAEditar(null)}
        titulo={equipoAEditar ? `Editar equipo #${equipoAEditar.id}` : ''}
      >
        {equipoAEditar && (
          <EquipoForm
            clientes={clientes}
            inicial={equipoAEditar}
            onGuardar={guardarEdicion}
            onCancelar={() => setEquipoAEditar(null)}
          />
        )}
      </Modal>

      {/* Modal: eliminar (confirmación) */}
      <Modal
        abierto={equipoAEliminar !== null}
        onCerrar={() => setEquipoAEliminar(null)}
        titulo="Eliminar equipo"
      >
        {equipoAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar el equipo{' '}
              <span className="font-semibold text-texto">
                {[equipoAEliminar.tipo, equipoAEliminar.marca, equipoAEliminar.modelo]
                  .filter(Boolean)
                  .join(' ') || `#${equipoAEliminar.id}`}
              </span>{' '}
              de {equipoAEliminar.clienteNombre}? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variante="ghost" onClick={() => setEquipoAEliminar(null)}>
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

      {/* Modal: ver orden relacionada */}
      <ModalOrden
        equipo={equipoOrden}
        onCerrar={() => setEquipoOrden(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Modal interno: busca la orden de este equipo.
// El endpoint /api/ordenes no filtra por equipoId, así que
// traemos la lista y elegimos la última del equipo (habrá
// endpoint directo cuando exista el detalle en la Parte 5).
// ------------------------------------------------------------
function ModalOrden({
  equipo,
  onCerrar,
}: {
  equipo: Equipo | null;
  onCerrar: () => void;
}) {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [cargando, setCargando] = useState(false);

  // Reset al cambiar de equipo: patrón adjust-during-render
  // (setState en render condicional está permitido; en effect no).
  const [equipoPrevio, setEquipoPrevio] = useState(equipo);
  if (equipoPrevio !== equipo) {
    setEquipoPrevio(equipo);
    setOrden(null);
    setCargando(true);
  }

  useEffect(() => {
    if (!equipo) return;

    // No tocamos estado acá: el bloque de arriba (adjust-during-render)
    // ya puso cargando=true y orden=null cuando equipo cambió.
    api
      .get<Orden[]>('/ordenes')
      .then((lista) => {
        // Órdenes de ESTE equipo, más reciente primero.
        const propias = lista
          .filter((o) => o.equipoId === equipo.id)
          .sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso));
        setOrden(propias[0] ?? null);
      })
      .catch(() => setOrden(null))
      .finally(() => setCargando(false));
  }, [equipo]);

  return (
    <Modal
      abierto={equipo !== null}
      onCerrar={onCerrar}
      titulo="Orden relacionada"
    >
      {cargando ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-texto-2">
          <span className="size-5 animate-spin rounded-full border-2 border-primario border-t-transparent" />
          Buscando la orden de este equipo…
        </div>
      ) : orden === null ? (
        <p className="py-4 text-center text-sm text-texto-2">
          Este equipo todavía no tiene una orden de servicio.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-primario">
              {orden.numeroOrden}
            </span>
            <EstadoBadge estado={orden.estado} />
          </div>

          <div className="rounded-lg bg-panel-2 p-3 text-sm text-texto-2">
            <p>
              <span className="text-texto">Cliente:</span> {orden.clienteNombre}
            </p>
            <p>
              <span className="text-texto">Ingreso:</span>{' '}
              {formatearFecha(orden.fechaIngreso)}
            </p>
            <p>
              <span className="text-texto">Costo:</span>{' '}
              {formatearPesos(orden.costo)}
            </p>
            {orden.problemaReportado && (
              <p className="mt-2">
                <span className="text-texto">Problema:</span>{' '}
                {orden.problemaReportado}
              </p>
            )}
          </div>

          <p className="text-xs text-texto-2">
            El detalle completo de la orden llega en la Parte 5.
          </p>
        </div>
      )}
    </Modal>
  );
}
