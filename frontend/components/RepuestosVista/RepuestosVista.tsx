'use client';

// ============================================================
// components/RepuestosVista/RepuestosVista.tsx — INVENTARIO DE REPUESTOS
// ------------------------------------------------------------
// Vista del módulo Repuestos: consume el Context — NO hace fetch
// ni tiene lógica de negocio propia.
//
// Semáforo de stock en la tarjeta:
//   0 → error · 1-3 → aviso · 4+ → normal
// (el stock real lo descuenta/restaura el backend al agregar o
// quitar repuestos de una orden).
// ============================================================

import Link from 'next/link';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { Badge } from '@/components/Badge/Badge';
import RepuestoForm from '@/components/RepuestoForm/RepuestoForm';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import { useRepuestos } from '@/components/RepuestosContext/RepuestosContext';
import { formatearPesos } from '@/lib/formato';

export default function RepuestosVista() {
  const {
    acceso,
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    repuestosVisibles,
    repuestoAEditar,
    setRepuestoAEditar,
    repuestoAEliminar,
    setRepuestoAEliminar,
    guardarEdicion,
    confirmarEliminacion,
  } = useRepuestos();

  // ---------- sin acceso (Recepcion) ----------
  if (!acceso) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-aviso/30 bg-aviso/10 p-6 text-center">
        <ShieldAlert className="mx-auto size-8 text-aviso" />
        <p className="mt-3 text-sm font-medium text-texto">
          Este módulo es solo para Administradores y Técnicos.
        </p>
        <p className="mt-1 text-xs text-texto-2">
          El inventario de repuestos no está disponible para tu rol.
        </p>
        <Button variante="secondary" tamano="sm" className="mt-4" onClick={() => history.back()}>
          Volver
        </Button>
      </div>
    );
  }

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los repuestos."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar repuesto…" />

        <Link href="/repuestos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo repuesto
          </Button>
        </Link>
      </div>

      {repuestosVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda
              ? `No hay repuestos que coincidan con "${busqueda}".`
              : 'El inventario está vacío.'
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {repuestosVisibles.map((repuesto) => (
          <div
            key={repuesto.id}
            className="group rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 truncate font-semibold text-texto">{repuesto.nombre}</h3>
              <Badge tono={repuesto.activo ? 'exito' : 'neutro'}>
                {repuesto.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {repuesto.descripcion && (
              <p className="mt-1 line-clamp-2 text-xs text-texto-2">{repuesto.descripcion}</p>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-primario">
                  {formatearPesos(repuesto.precio)}
                </span>
                {/* Semáforo de stock */}
                <span
                  className={`text-xs font-medium ${
                    repuesto.stock === 0
                      ? 'text-error'
                      : repuesto.stock <= 3
                        ? 'text-aviso'
                        : 'text-texto-2'
                  }`}
                >
                  Stock: {repuesto.stock}
                </span>
              </div>

              <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setRepuestoAEditar(repuesto)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-aviso"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => setRepuestoAEliminar(repuesto)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: editar */}
      <Modal
        abierto={repuestoAEditar !== null}
        onCerrar={() => setRepuestoAEditar(null)}
        titulo={repuestoAEditar ? `Editar «${repuestoAEditar.nombre}»` : ''}
      >
        {repuestoAEditar && (
          <RepuestoForm
            inicial={repuestoAEditar}
            onGuardar={guardarEdicion}
            onCancelar={() => setRepuestoAEditar(null)}
          />
        )}
      </Modal>

      {/* Modal: eliminar (confirmación) */}
      <Modal
        abierto={repuestoAEliminar !== null}
        onCerrar={() => setRepuestoAEliminar(null)}
        titulo="Eliminar repuesto"
      >
        {repuestoAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar{' '}
              <span className="font-semibold text-texto">{repuestoAEliminar.nombre}</span>{' '}
              (stock {repuestoAEliminar.stock})? Las órdenes que ya lo usan
              conservan su línea.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variante="ghost" onClick={() => setRepuestoAEliminar(null)}>
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
