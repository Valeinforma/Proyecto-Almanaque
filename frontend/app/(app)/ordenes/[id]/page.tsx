'use client';

// ============================================================
// app/(app)/ordenes/[id]/page.tsx — DETALLE DE ORDEN
// (ROOM_MAP §4: ver, editar, cambiar estado, gestionar detalles)
// ------------------------------------------------------------
// La pantalla central del sistema. Concentra 4 tareas:
//
//  1. VER: stepper de estados + datos de cliente/equipo/fechas.
//  2. CAMBIAR ESTADO: solo ofrece botones válidos según
//     TRANSICIONES (espejo del backend) → PUT /ordenes/{id}/estado.
//     El backend REVALIDA la transición: si mandamos una
//     inválida devuelve 400, así que la UI nunca "miente".
//  3. EDITAR: problema/fecha/observaciones → PUT /ordenes/{id}.
//  4. DETALLES: servicios y repuestos de la orden.
//     ⚠ PUT reemplaza AMBOS listados → siempre se mandan los
//     dos arrays juntos (si falta uno, el backend lo vacía).
//     El costo lo recalcula el backend; el stock se descuenta
//     al agregar repuestos y se restaura al quitarlos/borrar.
//
// Rol Recepcion: GET /repuestos es Admin/Tecnico → el panel de
// repuestos se oculta (el backend igual rechazaría con 403).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, X, Calendar, Wrench, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import { EstadoBadge } from '@/components/ui/Badge';
import EstadoStepper from '@/components/EstadoStepper';
import { api } from '@/lib/api';
import { useSesion } from '@/lib/auth';
import { formatearFecha, formatearPesos } from '@/lib/formato';
import { ETIQUETAS_ESTADO, transicionesDesde } from '@/types';
import type {
  EstadoOrden,
  Orden,
  OrdenEstadoInput,
  Repuesto,
  Servicio,
} from '@/types';

type TipoLinea = 'servicio' | 'repuesto';

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sesion = useSesion();
  const id = Number(params.id);

  // ---------- estado ----------
  const [orden, setOrden] = useState<Orden | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales: uno por tarea.
  const [editando, setEditando] = useState(false);
  const [cambioA, setCambioA] = useState<EstadoOrden | null>(null);
  const [agregando, setAgregando] = useState<TipoLinea | null>(null);
  const [aQuitar, setAQuitar] = useState<{
    tipo: TipoLinea;
    detalleId: number;
    nombre: string;
  } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // ---------- carga ----------
  // Tres requests en paralelo. /repuestos puede dar 403 (rol
  // Recepcion) → .catch devuelve lista vacía y la página no se
  // rompe: el panel simplemente no se muestra.
  const cargar = useCallback(() => {
    Promise.all([
      api.get<Orden>(`/ordenes/${id}`),
      api.get<Servicio[]>('/servicios'),
      api.get<Repuesto[]>('/repuestos').catch(() => [] as Repuesto[]),
    ])
      .then(([o, s, r]) => {
        setOrden(o);
        setServicios(s);
        setRepuestos(r);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error desconocido');
        setCargando(false);
      });
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ---------- acciones ----------
  async function guardarEdicion(datos: {
    problemaReportado: string | null;
    fechaEstimada: string | null;
    observaciones: string | null;
  }) {
    // Sin listados en el body → el backend NO toca los detalles.
    await api.put(`/ordenes/${id}`, datos);
    setEditando(false);
    await cargar();
  }

  async function aplicarCambio(nota: string) {
    const cuerpo: OrdenEstadoInput = { estado: cambioA! };
    const texto = nota.trim();
    if (texto) {
      // Cada destino guarda la nota en su campo del backend.
      if (cambioA === 'EnDiagnostico') cuerpo.diagnostico = texto;
      else if (cambioA === 'Listo') cuerpo.solucion = texto;
      else cuerpo.observaciones = texto;
    }
    await api.put(`/ordenes/${id}/estado`, cuerpo);
    setCambioA(null);
    await cargar();
  }

  // Clave del truco de esta pantalla: reemplazar detalles.
  async function reemplazarDetalles(
    sigServicios: Array<{ servicioId: number; cantidad: number }>,
    sigRepuestos: Array<{ repuestoId: number; cantidad: number }>
  ) {
    await api.put(`/ordenes/${id}`, {
      detallesServicios: sigServicios,
      detallesRepuestos: sigRepuestos,
    });
    await cargar();
  }

  async function agregarLinea(tipo: TipoLinea, item: { id: number; cantidad: number }) {
    const o = orden!;
    const serv = o.detallesServicios.map((d) => ({
      servicioId: d.servicioId,
      cantidad: d.cantidad,
    }));
    const rep = o.detallesRepuestos.map((d) => ({
      repuestoId: d.repuestoId,
      cantidad: d.cantidad,
    }));

    if (tipo === 'servicio') serv.push({ servicioId: item.id, cantidad: item.cantidad });
    else rep.push({ repuestoId: item.id, cantidad: item.cantidad });

    await reemplazarDetalles(serv, rep);
    setAgregando(null);
  }

  async function quitarLinea() {
    const { tipo, detalleId } = aQuitar!;
    const o = orden!;

    const serv = o.detallesServicios
      .filter((d) => !(tipo === 'servicio' && d.id === detalleId))
      .map((d) => ({ servicioId: d.servicioId, cantidad: d.cantidad }));
    const rep = o.detallesRepuestos
      .filter((d) => !(tipo === 'repuesto' && d.id === detalleId))
      .map((d) => ({ repuestoId: d.repuestoId, cantidad: d.cantidad }));

    await reemplazarDetalles(serv, rep);
    setAQuitar(null);
  }

  async function eliminarOrden() {
    await api.delete(`/ordenes/${id}`);
    router.push('/ordenes');
  }

  // ---------- render ----------
  if (cargando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">No se pudo cargar la orden.</p>
        <p className="mt-1 text-xs text-texto-2">{error ?? 'Orden no encontrada'}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variante="ghost" onClick={() => router.push('/ordenes')}>
            Volver
          </Button>
          <Button variante="secondary" tamano="sm" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const equipoTitulo = [orden.equipoTipo, orden.equipoMarca, orden.equipoModelo]
    .filter(Boolean)
    .join(' ');
  const permitidos = transicionesDesde(orden.estado);
  const esRecepcion = sesion?.rol === 'Recepcion';

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
            <Button variante="secondary" tamano="sm" onClick={() => setEditando(true)}>
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
                      setAQuitar({ tipo: 'servicio', detalleId: d.id, nombre: d.servicioNombre })
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
                          setAQuitar({ tipo: 'repuesto', detalleId: d.id, nombre: d.repuestoNombre })
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
      <Modal abierto={editando} onCerrar={() => setEditando(false)} titulo="Editar orden">
        <FormEditarModal
          inicial={orden}
          onGuardar={guardarEdicion}
          onCancelar={() => setEditando(false)}
        />
      </Modal>

      {/* Cambiar estado */}
      <Modal
        abierto={cambioA !== null}
        onCerrar={() => setCambioA(null)}
        titulo={cambioA ? `Cambiar a «${ETIQUETAS_ESTADO[cambioA]}»` : ''}
      >
        {cambioA && (
          <CambioEstadoModal
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
          <AgregarLineaModal
            tipo="servicio"
            opciones={servicios
              .filter((s) => s.activo)
              .map((s) => ({ id: s.id, texto: `${s.nombre} — ${formatearPesos(s.precio)}` }))}
            onGuardar={(item) => agregarLinea('servicio', item)}
            onCancelar={() => setAgregando(null)}
          />
        )}
        {agregando === 'repuesto' && (
          <AgregarLineaModal
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
        onCerrar={() => setAQuitar(null)}
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
              <Button variante="ghost" onClick={() => setAQuitar(null)}>
                Volver
              </Button>
              <Button variante="danger" onClick={quitarLinea}>
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
            <Button variante="danger" onClick={eliminarOrden}>
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------
// Fila simple de texto (etiqueta + valor o "—").
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// Modal: editar problema / fecha estimada / observaciones.
// Inicializa desde la orden al montar (el modal vive montado
// solo mientras `editando` es true).
// ------------------------------------------------------------
function FormEditarModal({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial: Orden;
  onGuardar: (datos: {
    problemaReportado: string | null;
    fechaEstimada: string | null;
    observaciones: string | null;
  }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [problema, setProblema] = useState(inicial.problemaReportado ?? '');
  const [fechaEstimada, setFechaEstimada] = useState(inicial.fechaEstimada?.slice(0, 10) ?? '');
  const [observaciones, setObservaciones] = useState(inicial.observaciones ?? '');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        problemaReportado: problema.trim() || null,
        fechaEstimada: fechaEstimada || null,
        observaciones: observaciones.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <TextArea
        label="Problema reportado"
        valor={problema}
        onChange={setProblema}
        disabled={enviando}
      />
      <Input
        type="date"
        label="Fecha estimada de entrega"
        valor={fechaEstimada}
        onChange={setFechaEstimada}
        disabled={enviando}
      />
      <TextArea
        label="Observaciones internas"
        valor={observaciones}
        onChange={setObservaciones}
        disabled={enviando}
      />

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Modal: cambio de estado con nota opcional.
// La nota se guarda en el campo que corresponde al destino
// (diagnóstico / solución / observaciones) — lo decide la
// pantalla madre en `aplicarCambio`.
// ------------------------------------------------------------
function CambioEstadoModal({
  destino,
  actual,
  onGuardar,
  onCancelar,
}: {
  destino: EstadoOrden;
  actual: EstadoOrden;
  onGuardar: (nota: string) => Promise<void>;
  onCancelar: () => void;
}) {
  const etiqueta =
    destino === 'EnDiagnostico'
      ? 'Diagnóstico (opcional)'
      : destino === 'Listo'
        ? 'Solución aplicada (opcional)'
        : 'Observaciones (opcional)';

  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onGuardar(nota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="text-sm text-texto-2">
        <span className="text-texto">{ETIQUETAS_ESTADO[actual]}</span> →{' '}
        <span className="text-primario">{ETIQUETAS_ESTADO[destino]}</span>
        {destino === 'Cancelado' && ' (la orden queda cerrada y no avanza más)'}
      </p>

      <TextArea label={etiqueta} valor={nota} onChange={setNota} disabled={enviando} />

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Volver
        </Button>
        <Button
          type="submit"
          loading={enviando}
          variante={destino === 'Cancelado' ? 'danger' : 'primary'}
        >
          Confirmar cambio
        </Button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// Modal: agregar una línea (servicio o repuesto).
// Valida cantidad >= 1 y, para repuestos, stock suficiente.
// El backend vuelve a validar todo igual que acá.
// ------------------------------------------------------------
function AgregarLineaModal({
  tipo,
  opciones,
  onGuardar,
  onCancelar,
}: {
  tipo: TipoLinea;
  opciones: Array<{ id: number; texto: string; stock?: number }>;
  onGuardar: (item: { id: number; cantidad: number }) => Promise<void>;
  onCancelar: () => void;
}) {
  const [seleccion, setSeleccion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!seleccion) {
      setErrorLocal('Elegí un ítem de la lista.');
      return;
    }

    const cantidadNum = Number(cantidad);
    const stock = opciones.find((op) => op.id === Number(seleccion))?.stock;

    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      setErrorLocal('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (tipo === 'repuesto' && stock !== undefined && cantidadNum > stock) {
      setErrorLocal(`Solo hay ${stock} unidades en stock.`);
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);
    try {
      await onGuardar({ id: Number(seleccion), cantidad: cantidadNum });
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al agregar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {opciones.length === 0 ? (
        <p className="py-3 text-sm text-texto-2">
          No hay {tipo === 'servicio' ? 'servicios' : 'repuestos'} activos para
          agregar.
        </p>
      ) : (
        <>
          <Select
            label={tipo === 'servicio' ? 'Servicio *' : 'Repuesto *'}
            valor={seleccion}
            onChange={setSeleccion}
            placeholder="Elegí…"
            opciones={opciones.map((op) => ({ valor: op.id, texto: op.texto }))}
            disabled={enviando}
          />
          <Input
            type="number"
            label="Cantidad *"
            valor={cantidad}
            onChange={setCantidad}
            min={1}
            disabled={enviando}
          />
        </>
      )}

      <p className="text-xs text-texto-2">
        {tipo === 'repuesto'
          ? 'Al confirmar se descuenta el stock y se recalcula el costo (lo hace el backend).'
          : 'Al confirmar el backend recalcula el costo de la orden.'}
      </p>

      {errorBackend && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {errorBackend}
        </p>
      )}
      {errorLocal && (
        <p className="rounded-lg border border-aviso/30 bg-aviso/10 px-3 py-2 text-sm text-aviso">
          {errorLocal}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando} disabled={opciones.length === 0}>
          Agregar
        </Button>
      </div>
    </form>
  );
}
