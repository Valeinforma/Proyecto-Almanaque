'use client';

// ============================================================
// components/ServiciosVista/ServiciosVista.tsx — CATÁLOGO DE SERVICIOS
// ------------------------------------------------------------
// Vista del módulo Servicios: consume el Context — NO hace fetch
// ni tiene lógica de negocio propia.
//
// Variable del módulo: el ROL. Backend: GET abierto a todo
// usuario autenticado; escritura solo Admin/Tecnico. Acá es solo
// COMODIDAD visual con tieneRol() — la API devuelve 403 igual si
// alguien se salta la UI.
// ============================================================

import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { Badge } from '@/components/Badge/Badge';
import ServicioForm from '@/components/ServicioForm/ServicioForm';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import { useServicios } from '@/components/ServiciosContext/ServiciosContext';
import { tieneRol } from '@/lib/auth';
import { formatearPesos } from '@/lib/formato';

export default function ServiciosVista() {
  // ¿Puedo escribir? (Admin o Tecnico — Recepcion solo mira)
  const puedeEscribir = tieneRol('Admin', 'Tecnico');

  const {
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    serviciosVisibles,
    servicioAEditar,
    setServicioAEditar,
    servicioAEliminar,
    setServicioAEliminar,
    guardarEdicion,
    confirmarEliminacion,
  } = useServicios();

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los servicios."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar servicio…" />

        {/* Botón de crear: solo Admin/Tecnico (visual). */}
        {puedeEscribir && (
          <Link href="/servicios/nuevo">
            <Button>
              <Plus className="size-4" />
              Nuevo servicio
            </Button>
          </Link>
        )}
      </div>

      {/* Aviso de solo lectura para Recepcion */}
      {!puedeEscribir && (
        <p className="mb-4 rounded-lg border border-white/10 bg-panel-2 px-3 py-2 text-xs text-texto-2">
          Modo solo lectura: tu rol (Recepcion) no puede modificar el catálogo.
        </p>
      )}

      {serviciosVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda
              ? `No hay servicios que coincidan con "${busqueda}".`
              : 'El catálogo está vacío.'
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {serviciosVisibles.map((servicio) => (
          <div
            key={servicio.id}
            className="group rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 truncate font-semibold text-texto">{servicio.nombre}</h3>
              <Badge tono={servicio.activo ? 'exito' : 'neutro'}>
                {servicio.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>

            {servicio.descripcion && (
              <p className="mt-1 line-clamp-2 text-xs text-texto-2">{servicio.descripcion}</p>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
              <span className="text-sm font-semibold text-primario">
                {formatearPesos(servicio.precio)}
              </span>

              {puedeEscribir && (
                <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => setServicioAEditar(servicio)}
                    className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-aviso"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => setServicioAEliminar(servicio)}
                    className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: editar */}
      <Modal
        abierto={servicioAEditar !== null}
        onCerrar={() => setServicioAEditar(null)}
        titulo={servicioAEditar ? `Editar «${servicioAEditar.nombre}»` : ''}
      >
        {servicioAEditar && (
          <ServicioForm
            inicial={servicioAEditar}
            onGuardar={guardarEdicion}
            onCancelar={() => setServicioAEditar(null)}
          />
        )}
      </Modal>

      {/* Modal: eliminar (confirmación) */}
      <Modal
        abierto={servicioAEliminar !== null}
        onCerrar={() => setServicioAEliminar(null)}
        titulo="Eliminar servicio"
      >
        {servicioAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar el servicio{' '}
              <span className="font-semibold text-texto">{servicioAEliminar.nombre}</span>?
              Las órdenes que ya lo usan conservan su línea.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variante="ghost" onClick={() => setServicioAEliminar(null)}>
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
