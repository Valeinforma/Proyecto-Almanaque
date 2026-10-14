'use client';

// ============================================================
// components/EquiposVista/EquiposVista.tsx — LISTADO DE EQUIPOS
// ------------------------------------------------------------
// Vista del módulo Equipos (ROOM_MAP §7): consume el Context —
// NO hace fetch ni tiene lógica de negocio propia.
//
// Tarjeta con lo que pide SDD §8: tipo, marca, modelo, número
// de serie, cliente, descripción y estado de su orden (badge).
// Acciones: buscar · crear · editar · eliminar · ver orden
// relacionada.
// ============================================================

import Link from 'next/link';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { EstadoBadge } from '@/components/Badge/Badge';
import EquipoForm from '@/components/EquipoForm/EquipoForm';
import ModalOrden from '@/components/ModalOrden/ModalOrden';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import { useEquipos } from '@/components/EquiposContext/EquiposContext';

export default function EquiposVista() {
  const {
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    equiposVisibles,
    clientes,
    equipoAEditar,
    setEquipoAEditar,
    equipoAEliminar,
    setEquipoAEliminar,
    equipoOrden,
    setEquipoOrden,
    guardarEdicion,
    confirmarEliminacion,
  } = useEquipos();

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los equipos."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Buscador + crear */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por tipo, serie o cliente…"
        />

        <Link href="/equipos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo equipo
          </Button>
        </Link>
      </div>

      {/* Vacío */}
      {equiposVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda
              ? `No hay equipos que coincidan con "${busqueda}".`
              : 'Todavía no hay equipos cargados.'
          }
        />
      )}

      {/* Grilla de tarjetas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {equiposVisibles.map((equipo) => {
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
                  <p className="truncate text-xs text-primario">{equipo.clienteNombre}</p>
                </div>

                {equipo.ordenEstado && <EstadoBadge estado={equipo.ordenEstado} />}
              </div>

              {/* Serie + descripción */}
              <div className="mt-3 flex flex-col gap-1 text-xs text-texto-2">
                <span className="font-mono">S/N: {equipo.numeroSerie ?? '—'}</span>
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
      <ModalOrden equipo={equipoOrden} onCerrar={() => setEquipoOrden(null)} />
    </div>
  );
}
