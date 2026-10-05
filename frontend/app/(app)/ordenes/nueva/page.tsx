'use client';

// ============================================================
// app/(app)/ordenes/nueva/page.tsx — ALTA DE ORDEN
// (ROOM_MAP §2: /ordenes/nueva)
// ------------------------------------------------------------
// Flujo: elegir CLIENTE → sus EQUIPOS (en cascada) → describir
// el problema → crear (POST /api/ordenes).
//
// El backend exige `usuarioId` = técnico responsable:
//  • por defecto: el usuario EN SESIÓN (siempre existe).
//  • si sos Admin: podés elegir otro técnico (GET /usuarios
//    es Admin-only — por eso nadie más carga esa lista).
//
// Los DETALLES (servicios/repuestos) no se cargan acá: se
// agregan desde el detalle de la orden, donde se controla
// el stock repuesto por repuesto.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import { api } from '@/lib/api';
import { useSesion } from '@/lib/auth';
import type { Cliente, Equipo, Orden, OrdenInput, Usuario } from '@/types';

export default function NuevaOrdenPage() {
  const router = useRouter();
  const sesion = useSesion();

  // ---------- datos de apoyo ----------
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

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
  const [cargando, setCargando] = useState(true);

  // Cargamos clientes + equipos (y técnicos solo si es Admin).
  // Tercer promise condicional: resuelve null si no es Admin.
  useEffect(() => {
    Promise.all([
      api.get<Cliente[]>('/clientes'),
      api.get<Equipo[]>('/equipos'),
      sesion?.rol === 'Admin'
        ? api.get<Usuario[]>('/usuarios')
        : Promise.resolve<Usuario[] | null>(null),
    ])
      .then(([listaClientes, listaEquipos, listaUsuarios]) => {
        setClientes(listaClientes);
        setEquipos(listaEquipos);
        if (listaUsuarios) setTecnicos(listaUsuarios.filter((u) => u.activo));
        // Responsable por defecto: yo (la sesión).
        if (sesion) setUsuarioId(String(sesion.id));
        setCargando(false);
      })
      .catch((e: unknown) => {
        setErrorCarga(e instanceof Error ? e.message : 'Error desconocido');
        setCargando(false);
      });
  }, [sesion]);

  // Cascada: al cambiar de cliente, el equipo vuelve a vacío.
  // (setState en handler de evento: permitido.)
  const alCambiarCliente = (valor: string) => {
    setClienteId(valor);
    setEquipoId('');
  };

  const equiposDelCliente = equipos.filter(
    (eq) => eq.clienteId === Number(clienteId)
  );

  const alEnviar = useCallback(async () => {
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

    const datos: OrdenInput = {
      equipoId: Number(equipoId),
      usuarioId: Number(usuarioId),
      problemaReportado: problema.trim() || null,
      fechaEstimada: fechaEstimada || null,
      observaciones: observaciones.trim() || null,
    };

    try {
      await api.post<Orden>('/ordenes', datos);
      router.push('/ordenes');
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al crear');
      setEnviando(false);
    }
  }, [enviando, clienteId, equipoId, usuarioId, problema, fechaEstimada, observaciones, router]);

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
            {/* 1) Cliente → 2) equipo en cascada */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Cliente *"
                valor={clienteId}
                onChange={alCambiarCliente}
                placeholder="Elegí un cliente…"
                opciones={clientes.map((c) => ({
                  valor: c.id,
                  texto: `${c.nombre} ${c.apellido}`,
                }))}
                disabled={enviando}
              />
              <Select
                label="Equipo *"
                valor={equipoId}
                onChange={setEquipoId}
                placeholder={
                  clienteId ? 'Elegí un equipo…' : 'Primero elegí el cliente'
                }
                disabled={!clienteId || enviando}
                opciones={equiposDelCliente.map((eq) => ({
                  valor: eq.id,
                  texto: [eq.tipo, eq.marca, eq.modelo].filter(Boolean).join(' ') ||
                    `Equipo #${eq.id}`,
                }))}
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
    </div>
  );
}
