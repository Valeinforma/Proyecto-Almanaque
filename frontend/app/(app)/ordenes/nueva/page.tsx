'use client';

// ============================================================
// app/(app)/ordenes/nueva/page.tsx — ALTA DE ORDEN
// (ROOM_MAP §2: /ordenes/nueva)
// ------------------------------------------------------------
// Flujo: elegir CLIENTE → sus EQUIPOS (en cascada) → describir
// el problema → crear (useOrdenesApi().agregarOrden).
//
// El backend exige `usuarioId` = técnico responsable:
//  • por defecto: el usuario EN SESIÓN (siempre existe).
//  • si sos Admin: podés elegir otro técnico (GET /usuarios
//    es Admin-only — por eso solo Admin carga esa lista con
//    obtenerUsuarios()).
//
// Los DETALLES (servicios/repuestos) no se cargan acá: se
// agregan desde el detalle de la orden, donde se controla
// el stock repuesto por repuesto.
//
// ALTA RÁPIDA: los selects de Cliente y Equipo llevan al final
// una opción "+ Nuevo…" que abre un modal con el MISMO form de
// /clientes/nuevo y /equipos/nuevo (ClienteForm / EquipoForm).
// Al guardar, el registro creado queda seleccionado en la orden
// sin salir de la pantalla: los hooks ya agregan el ítem a su
// propia lista (agregarCliente / agregarEquipo lo devuelven).
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/Button/Button';
import ClienteForm from '@/components/ClienteForm/ClienteForm';
import EquipoForm from '@/components/EquipoForm/EquipoForm';
import Input from '@/components/Input/Input';
import Modal from '@/components/Modal/Modal';
import Select from '@/components/Select/Select';
import TextArea from '@/components/TextArea/TextArea';
import useClientesApi from '@/hooks/useClientesApi';
import useEquiposApi from '@/hooks/useEquiposApi';
import useUsuariosApi from '@/hooks/useUsuariosApi';
import useOrdenesApi from '@/hooks/useOrdenesApi';
import { useSesion } from '@/lib/auth';
import type { IClienteInput } from '@/interfaces/ICliente';
import type { IEquipoInput } from '@/interfaces/IEquipo';
import type { IOrdenInput } from '@/interfaces/IOrden';

// Valores centinela de las opciones de acción de los selects.
// (No pueden colisionar con un id: los ids son numéricos.)
const NUEVO_CLIENTE = '__nuevo_cliente__';
const NUEVO_EQUIPO = '__nuevo_equipo__';

export default function NuevaOrdenPage() {
  const router = useRouter();
  const sesion = useSesion();

  // ---------- datos de apoyo (auto-cargados) ----------
  const {
    clientes,
    cargando: cargandoClientes,
    error: errorClientes,
    agregarCliente,
  } = useClientesApi();
  const {
    equipos,
    cargando: cargandoEquipos,
    error: errorEquipos,
    agregarEquipo,
  } = useEquiposApi();
  // Técnicos: solo Admin puede pedir /usuarios → lo cargamos a
  // demanda (autoCargar: false) en el effect de abajo.
  const { usuarios: usuariosTodos, obtenerUsuarios } = useUsuariosApi({
    autoCargar: false,
  });
  // Alta de orden: sin listado propio.
  const { agregarOrden } = useOrdenesApi({ autoCargar: false });

  const tecnicos = usuariosTodos.filter((u) => u.activo);

  // ---------- campos del formulario ----------
  const [clienteId, setClienteId] = useState('');
  const [equipoId, setEquipoId] = useState('');
  const [usuarioId, setUsuarioId] = useState(''); // responsable
  const [problema, setProblema] = useState('');
  const [fechaEstimada, setFechaEstimada] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Alta rápida: modales de cliente / equipo (opción "+ Nuevo…").
  const [modalCliente, setModalCliente] = useState(false);
  const [modalEquipo, setModalEquipo] = useState(false);

  // Técnicos solo si es Admin (el GET es Admin-only).
  useEffect(() => {
    if (sesion?.rol === 'Admin') obtenerUsuarios();
  }, [sesion, obtenerUsuarios]);

  // Responsable por defecto: yo (la sesión). Patrón "adjust state
  // during render" (permitido) en vez de setState dentro del effect
  // — react-hooks/set-state-in-effect lo rechazaría.
  const [sesionPrevia, setSesionPrevia] = useState(sesion);
  if (sesionPrevia !== sesion) {
    setSesionPrevia(sesion);
    if (sesion) setUsuarioId(String(sesion.id));
  }

  // Combinados de las dos listas auto-cargadas (mismo UX que el
  // Promise.all original).
  const cargando = cargandoClientes || cargandoEquipos;
  const errorCarga = errorClientes ?? errorEquipos;

  // Cascada: al cambiar de cliente, el equipo vuelve a vacío.
  // (setState en handler de evento: permitido.)
  const alCambiarCliente = (valor: string) => {
    setClienteId(valor);
    setEquipoId('');
  };

  const equiposDelCliente = equipos.filter(
    (eq) => eq.clienteId === Number(clienteId)
  );

  // Los selects llevan al final una ACCIÓN ("+ Nuevo…"), no un
  // valor: si la eligen, abrimos el modal y NO tocamos el estado
  // del id. Ese re-render devuelve el select a la opción previa
  // (es un controlado: `value` sigue siendo el id anterior).
  const alCambiarClienteSelect = (valor: string) => {
    if (valor === NUEVO_CLIENTE) {
      setModalCliente(true);
      return;
    }
    alCambiarCliente(valor);
  };

  const alCambiarEquipoSelect = (valor: string) => {
    if (valor === NUEVO_EQUIPO) {
      setModalEquipo(true);
      return;
    }
    setEquipoId(valor);
  };

  // Altas rápidas: si el backend falla, el error sube al form
  // (ApiError) y el modal queda abierto para corregir.
  async function crearCliente(datos: IClienteInput) {
    const nuevo = await agregarCliente(datos);
    setClienteId(String(nuevo.id)); // queda elegido en la orden
    setEquipoId(''); // cliente nuevo → otros equipos
    setModalCliente(false);
  }

  async function crearEquipo(datos: IEquipoInput) {
    const nuevo = await agregarEquipo(datos);
    setEquipoId(String(nuevo.id));
    setModalEquipo(false);
  }

  async function alEnviar() {
    if (enviando) return;

    if (!clienteId || !equipoId) {
      setErrorLocal('Elegí el cliente y luego uno de sus equipos.');
      return;
    }
    if (!usuarioId) {
      setErrorLocal('Falta el técnico responsable.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    const datos: IOrdenInput = {
      equipoId: Number(equipoId),
      usuarioId: Number(usuarioId),
      problemaReportado: problema.trim() || null,
      fechaEstimada: fechaEstimada || null,
      observaciones: observaciones.trim() || null,
    };

    try {
      await agregarOrden(datos);
      router.push('/ordenes');
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al crear');
      setEnviando(false);
    }
  }

  if (errorCarga) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">No se pudieron cargar los datos.</p>
        <p className="mt-1 text-xs text-texto-2">{errorCarga}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/ordenes')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a órdenes
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nueva orden de servicio</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          La orden entra en estado <strong className="text-texto">Recibido</strong>{' '}
          y su N° se genera solo (ORD-000000).
        </p>

        {cargando ? (
          <div className="flex justify-center py-8">
            <span className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent" />
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void alEnviar();
            }}
            className="flex flex-col gap-4"
          >
            {/* 1) Cliente → 2) equipo en cascada.
                La última opción de cada uno es una ACCIÓN de alta. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Cliente *"
                valor={clienteId}
                onChange={alCambiarClienteSelect}
                placeholder="Elegí un cliente…"
                opciones={[
                  ...clientes.map((c) => ({
                    valor: c.id,
                    texto: `${c.nombre} ${c.apellido}`,
                  })),
                  { valor: NUEVO_CLIENTE, texto: '+ Nuevo cliente…' },
                ]}
                disabled={enviando}
              />
              <Select
                label="Equipo *"
                valor={equipoId}
                onChange={alCambiarEquipoSelect}
                placeholder={
                  !clienteId
                    ? 'Primero elegí el cliente'
                    : equiposDelCliente.length === 0
                      ? 'Sin equipos — creá uno'
                      : 'Elegí un equipo…'
                }
                disabled={!clienteId || enviando}
                opciones={[
                  ...equiposDelCliente.map((eq) => ({
                    valor: eq.id,
                    texto:
                      [eq.tipo, eq.marca, eq.modelo].filter(Boolean).join(' ') ||
                      `Equipo #${eq.id}`,
                  })),
                  { valor: NUEVO_EQUIPO, texto: '+ Nuevo equipo…' },
                ]}
              />
            </div>

            {/* Responsable: Admin elige; el resto usa su sesión */}
            {sesion?.rol === 'Admin' && tecnicos.length > 0 ? (
              <Select
                label="Técnico responsable *"
                valor={usuarioId}
                onChange={setUsuarioId}
                opciones={tecnicos.map((u) => ({
                  valor: u.id,
                  texto: `${u.nombre} (${u.rol})`,
                }))}
                disabled={enviando}
              />
            ) : (
              <div className="rounded-lg border border-white/10 bg-panel-2 px-3 py-2 text-sm text-texto-2">
                <span className="text-texto">Responsable:</span> {sesion?.nombre ?? '—'}
                <span className="ml-2 text-xs">(tu usuario de sesión)</span>
              </div>
            )}

            <TextArea
              label="Problema reportado"
              valor={problema}
              onChange={setProblema}
              placeholder="Qué falla, cuándo empezó, cómo se reproduce…"
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
              placeholder="Notas para el taller (opcional)…"
              disabled={enviando}
            />

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

            <div className="mt-2 flex justify-end gap-3">
              <Button
                type="button"
                variante="ghost"
                onClick={() => router.push('/ordenes')}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={enviando}>
                Crear orden
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Alta rápida: el MISMO form de /clientes/nuevo y /equipos/nuevo.
          Modal no renderiza nada al estar cerrado → los forms se
          remontan en cada apertura y toman el cliente vigente. */}
      <Modal
        abierto={modalCliente}
        onCerrar={() => setModalCliente(false)}
        titulo="Nuevo cliente"
      >
        <ClienteForm
          onGuardar={crearCliente}
          onCancelar={() => setModalCliente(false)}
        />
      </Modal>

      <Modal
        abierto={modalEquipo}
        onCerrar={() => setModalEquipo(false)}
        titulo="Nuevo equipo"
      >
        <EquipoForm
          clientes={clientes}
          clienteIdInicial={clienteId ? Number(clienteId) : undefined}
          onGuardar={crearEquipo}
          onCancelar={() => setModalEquipo(false)}
        />
      </Modal>
    </div>
  );
}
