'use client';

// ============================================================
// components/ClientesVista/ClientesVista.tsx — LISTADO DE CLIENTES
// ------------------------------------------------------------
// Vista del módulo Clientes (ROOM_MAP §6): consume el estado del
// Context — NO hace fetch ni tiene lógica de negocio propia.
//
// Acciones: buscar · crear · editar · eliminar · ver equipos.
// El borrado usa confirmación (SDD §15): "¿Eliminar cliente…?"
// ============================================================

import Link from 'next/link';
import { Plus, Pencil, Trash2, MonitorSmartphone, Mail, Phone } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import ClienteForm from '@/components/ClienteForm/ClienteForm';
import ModalEquipos from '@/components/ModalEquipos/ModalEquipos';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import { useClientes } from '@/components/ClientesContext/ClientesContext';

export default function ClientesVista() {
  const {
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    clientesVisibles,
    clienteAEditar,
    setClienteAEditar,
    clienteAEliminar,
    setClienteAEliminar,
    clienteEquipos,
    setClienteEquipos,
    guardarEdicion,
    confirmarEliminacion,
  } = useClientes();

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los clientes."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---------- Barra: buscador + crear ---------- */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por nombre, apellido o email…"
        />

        {/* ROOM_MAP §6: "Nuevo" → página /clientes/nuevo */}
        <Link href="/clientes/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        </Link>
      </div>

      {/* ---------- Estado vacío ---------- */}
      {clientesVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda
              ? `No hay clientes que coincidan con "${busqueda}".`
              : 'Todavía no hay clientes. Creá el primero.'
          }
        />
      )}

      {/* ---------- Grilla de tarjetas ---------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {clientesVisibles.map((cliente) => (
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
