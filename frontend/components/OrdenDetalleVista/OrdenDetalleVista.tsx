'use client';

// ============================================================
// components/OrdenDetalleVista/OrdenDetalleVista.tsx — DETALLE DE ORDEN
// ------------------------------------------------------------
// La pantalla central del sistema (ROOM_MAP §4): consume el
// Context — NO hace fetch ni tiene lógica de negocio propia.
// Concentra las 4 tareas de la orden: VER (stepper + datos),
// CAMBIAR ESTADO, EDITAR cabecera y gestionar DETALLES
// (servicios y repuestos).
//
// Rol Recepcion: GET /repuestos es Admin/Tecnico → los paneles
// de repuestos se ocultan (el backend igual rechazaría 403).
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, X, Calendar, Wrench, Package } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { EstadoBadge } from '@/components/Badge/Badge';
import EstadoStepper from '@/components/EstadoStepper/EstadoStepper';
import ModalEditarOrden from '@/components/ModalEditarOrden/ModalEditarOrden';
import ModalCambioEstado from '@/components/ModalCambioEstado/ModalCambioEstado';
import ModalAgregarLinea from '@/components/ModalAgregarLinea/ModalAgregarLinea';
import Cargando from '@/components/Cargando/Cargando';
import { useOrdenDetalle } from '@/components/OrdenDetalleContext/OrdenDetalleContext';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import { ETIQUETAS_ESTADO } from '@/types/estados';

// Fila simple de texto (etiqueta + valor o "—").
function TextoFila({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-texto-2">{etiqueta}</dt>
      <dd className={`text-right ${valor ? 'text-texto' : 'text-texto-2/60'}`}>
        {valor || '—'}
      </dd>
    </div>
  );
}

export default function OrdenDetalleVista() {
  const router = useRouter();

  const {
    orden,
    servicios,
    repuestos,
    cargando,
    error,
    recargar,
    esRecepcion,
    permitidos,
    editando,
    abrirEdicion,
    cerrarEdicion,
    cambioA,
    setCambioA,
    agregando,
    setAgregando,
    aQuitar,
    pedirQuitar,
    cerrarQuitar,
    eliminando,
    setEliminando,
    guardarEdicion,
    aplicarCambio,
    agregarLinea,
    confirmarQuitar,
    confirmarEliminacion,
  } = useOrdenDetalle();

  if (cargando) return <Cargando />;

  // Error de carga o id inexistente: con botón de volver.
  if (error || !orden) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">No se pudo cargar la orden.</p>
        <p className="mt-1 text-xs text-texto-2">{error ?? 'Orden no encontrada'}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variante="ghost" onClick={() => router.push('/ordenes')}>
            Volver
          </Button>
          <Button variante="secondary" tamano="sm" onClick={recargar}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const equipoTitulo = [orden.equipoTipo, orden.equipoMarca, orden.equipoModelo]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="mx-auto max-w-4xl">
      {/* Volver */}
      <button
        type="button"
        onClick={() => router.push('/ordenes')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a órdenes
      </button>

      {/* ---------- encabezado ---------- */}
      <div className="rounded-xl border border-white/10 bg-panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-xl font-bold text-primario">
                {orden.numeroOrden}
              </h1>
              <EstadoBadge estado={orden.estado} />
            </div>
            <p className="mt-1 text-sm text-texto-2">
              {orden.clienteNombre} ·{' '}
              <span className="text-texto">{equipoTitulo || 'Equipo sin detalle'}</span>
              {orden.equipoNumeroSerie && (
                <span className="font-mono"> · S/N {orden.equipoNumeroSerie}</span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variante="secondary" tamano="sm" onClick={abrirEdicion}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button variante="danger" tamano="sm" onClick={() => setEliminando(true)}>
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Stepper de estados */}
        <div className="mt-5">
          <EstadoStepper estado={orden.estado} />
        </div>
      </div>

      {/* ---------- cambiar estado ---------- */}
      <div className="mt-4 rounded-xl border border-white/10 bg-panel p-5">
        <h2 className="text-sm font-semibold text-texto">Cambiar estado</h2>

        {permitidos.length === 0 ? (
          <p className="mt-2 text-sm text-texto-2">
            Orden cerrada ({ETIQUETAS_ESTADO[orden.estado]}) — no admite más
            cambios de estado.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-texto-2">
              Desde{' '}
              <span className="text-texto">{ETIQUETAS_ESTADO[orden.estado]}</span>{' '}
              solo se permite avanzar a:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {permitidos.map((destino) => (
                <Button
                  key={destino}
                  tamano="sm"
                  variante={destino === 'Cancelado' ? 'danger' : 'secondary'}
                  onClick={() => setCambioA(destino)}
                >
                  {destino === 'Cancelado' ? 'Cancelar orden' : ETIQUETAS_ESTADO[destino]}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ---------- datos ---------- */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Fechas y responsables */}
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-texto">
            <Calendar className="size-4 text-primario" />
            Fechas y seguimiento
          </h3>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">Ingreso</dt>
              <dd className="text-texto">{formatearFecha(orden.fechaIngreso)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">Estimada</dt>
              <dd className="text-texto">{formatearFecha(orden.fechaEstimada)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">Entrega</dt>
              <dd className="text-texto">{formatearFecha(orden.fechaEntrega)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-texto-2">Responsable</dt>
              <dd className="text-texto">{orden.usuarioNombre}</dd>
            </div>
          </dl>
        </div>

        {/* Textos de la orden */}
        <div className="rounded-xl border border-white/10 bg-panel p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-texto">
            <Wrench className="size-4 text-primario" />
            Problema y resolución
          </h3>
          <div className="flex flex-col gap-2 text-sm">
            <TextoFila etiqueta="Problema" valor={orden.problemaReportado} />
            <TextoFila etiqueta="Diagnóstico" valor={orden.diagnostico} />
            <TextoFila etiqueta="Solución" valor={orden.solucion} />
            <TextoFila etiqueta="Observaciones" valor={orden.observaciones} />
          </div>
        </div>
      </div>

      {/* ---------- detalles (servicios y repuestos) ---------- */}
      <div className="mt-4 rounded-xl border border-white/10 bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-texto">
            <Package className="size-4 text-primario" />
            Detalles de la orden
          </h3>
          <div className="flex gap-2">
            <Button
              tamano="sm"
              variante="secondary"
              onClick={() => setAgregando('servicio')}
              disabled={servicios.length === 0}
              title={servicios.length === 0 ? 'No hay servicios activos' : undefined}
            >
              <Plus className="size-4" />
              Servicio
            </Button>

            {/* Recepcion no puede ver repuestos (403 en la API). */}
            {!esRecepcion && (
              <Button
                tamano="sm"
                variante="secondary"
                onClick={() => setAgregando('repuesto')}
                disabled={repuestos.length === 0}
                title={repuestos.length === 0 ? 'No hay repuestos activos' : undefined}
              >
                <Plus className="size-4" />
                Repuesto
              </Button>
            )}
          </div>
        </div>

        {/* Tabla de servicios */}
        <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-texto-2">
          Servicios
        </h4>
        {orden.detallesServicios.length === 0 ? (
          <p className="mt-1 text-sm text-texto-2">Sin servicios cargados.</p>
        ) : (
          <ul className="mt-1 divide-y divide-white/5">
            {orden.detallesServicios.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-texto">{d.servicioNombre}</span>
                <span className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-xs text-texto-2">
                    {d.cantidad} × {formatearPesos(d.precio)}
                  </span>
                  <span className="w-24 text-right text-texto">
                    {formatearPesos(d.subtotal)}
                  </span>
                  <button
                    type="button"
                    title="Quitar servicio"
                    onClick={() =>
                      pedirQuitar({ tipo: 'servicio', detalleId: d.id, nombre: d.servicioNombre })
                    }
                    className="cursor-pointer rounded p-1 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Tabla de repuestos (oculta para Recepcion) */}
        {!esRecepcion && (
          <>
            <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-texto-2">
              Repuestos
            </h4>
            {orden.detallesRepuestos.length === 0 ? (
              <p className="mt-1 text-sm text-texto-2">Sin repuestos cargados.</p>
            ) : (
              <ul className="mt-1 divide-y divide-white/5">
                {orden.detallesRepuestos.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-texto">{d.repuestoNombre}</span>
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <span className="text-xs text-texto-2">
                        {d.cantidad} × {formatearPesos(d.precio)}
                      </span>
                      <span className="w-24 text-right text-texto">
                        {formatearPesos(d.subtotal)}
                      </span>
                      <button
                        type="button"
                        title="Quitar repuesto (restaura stock)"
                        onClick={() =>
                          pedirQuitar({
                            tipo: 'repuesto',
                            detalleId: d.id,
                            nombre: d.repuestoNombre,
                          })
                        }
                        className="cursor-pointer rounded p-1 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Total: lo calcula el backend al agregar/quitar líneas */}
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-sm text-texto-2">Costo total</span>
          <span className="text-lg font-semibold text-texto">
            {formatearPesos(orden.costo)}
          </span>
        </div>
      </div>

      {/* ======================================================
          MODALES
      */}

      {/* Editar textos/fecha */}
      <Modal abierto={editando} onCerrar={cerrarEdicion} titulo="Editar orden">
        <ModalEditarOrden
          inicial={orden}
          onGuardar={guardarEdicion}
          onCancelar={cerrarEdicion}
        />
      </Modal>

      {/* Cambiar estado */}
      <Modal
        abierto={cambioA !== null}
        onCerrar={() => setCambioA(null)}
        titulo={cambioA ? `Cambiar a «${ETIQUETAS_ESTADO[cambioA]}»` : ''}
      >
        {cambioA && (
          <ModalCambioEstado
            destino={cambioA}
            actual={orden.estado}
            onGuardar={aplicarCambio}
            onCancelar={() => setCambioA(null)}
          />
        )}
      </Modal>

      {/* Agregar línea */}
      <Modal
        abierto={agregando !== null}
        onCerrar={() => setAgregando(null)}
        titulo={agregando === 'servicio' ? 'Agregar servicio' : 'Agregar repuesto'}
      >
        {agregando === 'servicio' && (
          <ModalAgregarLinea
            tipo="servicio"
            opciones={servicios
              .filter((s) => s.activo)
              .map((s) => ({ id: s.id, texto: `${s.nombre} — ${formatearPesos(s.precio)}` }))}
            onGuardar={(item) => agregarLinea('servicio', item)}
            onCancelar={() => setAgregando(null)}
          />
        )}
        {agregando === 'repuesto' && (
          <ModalAgregarLinea
            tipo="repuesto"
            opciones={repuestos
              .filter((r) => r.activo)
              .map((r) => ({
                id: r.id,
                texto: `${r.nombre} — ${formatearPesos(r.precio)} (stock ${r.stock})`,
                stock: r.stock,
              }))}
            onGuardar={(item) => agregarLinea('repuesto', item)}
            onCancelar={() => setAgregando(null)}
          />
        )}
      </Modal>

      {/* Quitar línea */}
      <Modal
        abierto={aQuitar !== null}
        onCerrar={cerrarQuitar}
        titulo={aQuitar?.tipo === 'servicio' ? 'Quitar servicio' : 'Quitar repuesto'}
      >
        {aQuitar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Quitar <span className="font-medium text-texto">{aQuitar.nombre}</span> de
              la orden?{' '}
              {aQuitar.tipo === 'repuesto' &&
                'El repuesto volverá al stock y el costo se recalcula.'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variante="ghost" onClick={cerrarQuitar}>
                Volver
              </Button>
              <Button variante="danger" onClick={confirmarQuitar}>
                Quitar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Eliminar orden */}
      <Modal abierto={eliminando} onCerrar={() => setEliminando(false)} titulo="Eliminar orden">
        <div>
          <p className="text-sm text-texto-2">
            ¿Eliminar la orden{' '}
            <span className="font-mono font-semibold text-texto">{orden.numeroOrden}</span>?
            Los repuestos cargados vuelven al stock. Esta acción no se puede
            deshacer.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <Button variante="ghost" onClick={() => setEliminando(false)}>
              Cancelar
            </Button>
            <Button variante="danger" onClick={confirmarEliminacion}>
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
