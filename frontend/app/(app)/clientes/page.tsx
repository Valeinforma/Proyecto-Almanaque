'use client';

// ============================================================
// app/(app)/clientes/page.tsx — LISTADO DE CLIENTES (ROOM_MAP §6)
// ------------------------------------------------------------
// Acciones: buscar · crear · editar · eliminar · ver equipos.
//
// Este archivo es el PATRÓN CRUD de referencia del sistema:
// las pantallas de Equipos (Parte 4) y las del catálogo
// (Parte 6) repiten esta estructura.
//
// Estructura del estado:
//   clientes        → qué se muestra (copia de la API)
//   clienteAEditar  → modal de edición abierto (o null)
//   clienteAEliminar→ modal de confirmación abierto (o null)
//   clienteEquipos  → modal "ver equipos" abierto (o null)
//
// El borrado usa confirmación (SDD §15): "¿Eliminar cliente…?"
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MonitorSmartphone,
  Mail,
  Phone,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { EstadoBadge } from '@/components/ui/Badge';
import ClienteForm from '@/components/forms/ClienteForm';
import { api } from '@/lib/api';
import type { Cliente, ClienteInput, Equipo } from '@/types';

export default function ClientesPage() {
  // ---------- estado ----------
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Modales (null = cerrado).
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<Cliente | null>(null);
  const [clienteEquipos, setClienteEquipos] = useState<Cliente | null>(null);

  // ---------- carga ----------
  const cargar = useCallback(() => {
    api
      .get<Cliente[]>('/clientes')
      .then((lista) => {
        setClientes(lista);
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

  // ---------- acciones CRUD ----------

  // EDITAR: el modal manda los datos → PUT → actualizamos la copia
  // local (sin recargar toda la lista: la API ya nos devolvió OK).
  async function guardarEdicion(datos: ClienteInput) {
    const id = clienteAEditar!.id;
    await api.put<Cliente>(`/clientes/${id}`, datos);
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...datos } : c)));
    setClienteAEditar(null);
  }

  // ELIMINAR: DELETE → quitamos de la lista local.
  async function confirmarEliminacion() {
    const id = clienteAEliminar!.id;
    await api.delete(`/clientes/${id}`);
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setClienteAEliminar(null);
  }

  // ---------- filtrado en cliente ----------
  // Traemos TODO el listado una vez y filtramos acá abajo.
  // (Con pocos clientes esto es instantáneo y evita un request
  // por tecla; el backend también acepta ?search= si crece.)
  const visibles = clientes.filter((c) => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return (
      c.nombre.toLowerCase().includes(t) ||
      c.apellido.toLowerCase().includes(t) ||
      (c.email ?? '').toLowerCase().includes(t)
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
        <p className="text-sm text-error">No se pudieron cargar los clientes.</p>
        <p className="mt-1 text-xs text-texto-2">{error}</p>
        <Button variante="secondary" tamano="sm" className="mt-4" onClick={cargar}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---------- Barra: buscador + crear ---------- */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
          <input
            type="search"
            placeholder="Buscar por nombre, apellido o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

        {/* ROOM_MAP §6: "Nuevo" → página /clientes/nuevo */}
        <Link href="/clientes/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>

      {/* ---------- Estado vacío ---------- */}
      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda
              ? `No hay clientes que coincidan con "${busqueda}".`
              : 'Todavía no hay clientes. Creá el primero.'}
          </p>
        </div>
      )}

      {/* ---------- Grilla de tarjetas ---------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((cliente) => (
          <div
            key={cliente.id}
            className="group rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-texto">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <span className="text-xs text-texto-2">
                  {cliente.totalEquipos}{' '}
                  {cliente.totalEquipos === 1 ? 'equipo' : 'equipos'}
                </span>
              </div>

              {/* Acciones: siempre visibles en touch, al hover en desktop */}
              <div className="flex shrink-0 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  title="Ver equipos"
                  onClick={() => setClienteEquipos(cliente)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-primario"
                >
                  <MonitorSmartphone className="size-4" />
                </button>
                <button
                  type="button"
                  title="Editar"
                  onClick={() => setClienteAEditar(cliente)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-aviso"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => setClienteAEliminar(cliente)}
                  className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            {/* Contacto */}
            <div className="mt-3 flex flex-col gap-1 text-xs text-texto-2">
              {cliente.email && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="size-3.5 shrink-0" />
                  {cliente.email}
                </span>
              )}
              {cliente.telefono && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  {cliente.telefono}
                </span>
              )}
              {!cliente.email && !cliente.telefono && (
                <span>Sin datos de contacto</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Modal: editar ---------- */}
      <Modal
        abierto={clienteAEditar !== null}
        onCerrar={() => setClienteAEditar(null)}
        titulo={clienteAEditar ? `Editar: ${clienteAEditar.nombre} ${clienteAEditar.apellido}` : ''}
      >
        {clienteAEditar && (
          <ClienteForm
            inicial={clienteAEditar}
            onGuardar={guardarEdicion}
            onCancelar={() => setClienteAEditar(null)}
          />
        )}
      </Modal>

      {/* ---------- Modal: eliminar (confirmación SDD §15) ---------- */}
      <Modal
        abierto={clienteAEliminar !== null}
        onCerrar={() => setClienteAEliminar(null)}
        titulo="Eliminar cliente"
      >
        {clienteAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar cliente{' '}
              <span className="font-semibold text-texto">
                {clienteAEliminar.nombre} {clienteAEliminar.apellido}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variante="ghost"
                onClick={() => setClienteAEliminar(null)}
              >
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

      {/* ---------- Modal: ver equipos del cliente ---------- */}
      <ModalEquipos
        cliente={clienteEquipos}
        onCerrar={() => setClienteEquipos(null)}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Modal interno: lista los equipos del cliente.
// Se carga AL ABRIR (cliente != null) con ?clienteId= — el
// endpoint de equipos de la API lo soporta.
// ------------------------------------------------------------
function ModalEquipos({
  cliente,
  onCerrar,
}: {
  cliente: Cliente | null;
  onCerrar: () => void;
}) {
  // null = "aún no cargamos los equipos de este cliente".
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);

  // Cuando cambia el cliente (se abre otro modal), reseteamos el
  // resultado anterior. Patrón "adjust state during render"
  // (permitido) — en vez de setState dentro del effect.
  const [clientePrevia, setClientePrevia] = useState(cliente);
  if (clientePrevia !== cliente) {
    setClientePrevia(cliente);
    setEquipos(null);
  }

  // El effect SOLO dispara la petición; el resultado llega en
  // .then() (patrón exigido por el lint de Next 16).
  useEffect(() => {
    if (!cliente) return; // modal cerrado → nada que hacer

    api
      .get<Equipo[]>(`/equipos?clienteId=${cliente.id}`)
      .then((lista) => setEquipos(lista))
      .catch(() => setEquipos([]));
  }, [cliente]);

  return (
    <Modal
      abierto={cliente !== null}
      onCerrar={onCerrar}
      titulo={cliente ? `Equipos de ${cliente.nombre} ${cliente.apellido}` : ''}
    >
      {equipos === null ? (
        <div className="flex justify-center py-6">
          <span className="size-6 animate-spin rounded-full border-2 border-primario border-t-transparent" />
        </div>
      ) : equipos.length === 0 ? (
        <p className="py-4 text-center text-sm text-texto-2">
          Este cliente todavía no tiene equipos cargados.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {equipos.map((equipo) => (
            <li key={equipo.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-texto">
                  {[equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' ') ||
                    'Equipo sin detalle'}
                </p>
                <p className="truncate font-mono text-xs text-texto-2">
                  S/N: {equipo.numeroSerie ?? '—'}
                </p>
              </div>
              {equipo.ordenEstado && <EstadoBadge estado={equipo.ordenEstado} />}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
