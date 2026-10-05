'use client';

// ============================================================
// app/(app)/repuestos/page.tsx — CATÁLOGO DE REPUESTOS
// ------------------------------------------------------------
// CRUD del patrón (Parte 3) + INVENTARIO.
//
// Backend: TODOS los endpoints de /api/repuestos son
// Admin/Tecnico (incluso el GET). Repuesto NO es un módulo de
// Recepcion: si alguien entra por URL directa con ese rol, la
// pantalla lo sabe y muestra "sin acceso" sin pedir a la API
// (que devolvería 403 igual — esto es solo UX).
//
// Semáforo de stock en la tarjeta:
//   0 → error · 1-3 → aviso · 4+ → normal
// (el stock real lo descuenta/restaura el backend al agregar o
// quitar repuestos de una orden).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import RepuestoForm from '@/components/forms/RepuestoForm';
import { api } from '@/lib/api';
import { tieneRol } from '@/lib/auth';
import { formatearPesos } from '@/lib/formato';
import type { Repuesto, RepuestoInput } from '@/types';

export default function RepuestosPage() {
  // Guarda de rol ANTES de tocar la API (el backend también
  // rechazaría con 403 — esto ahorra el request y da mejor UX).
  const acceso = tieneRol('Admin', 'Tecnico');

  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [repuestoAEditar, setRepuestoAEditar] = useState<Repuesto | null>(null);
  const [repuestoAEliminar, setRepuestoAEliminar] = useState<Repuesto | null>(null);

  const cargar = useCallback(() => {
    api
      .get<Repuesto[]>('/repuestos')
      .then((lista) => {
        setRepuestos(lista);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error desconocido');
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    if (acceso) cargar();
  }, [acceso, cargar]);

  async function guardarEdicion(datos: RepuestoInput) {
    const id = repuestoAEditar!.id;
    await api.put<Repuesto>(`/repuestos/${id}`, datos);
    setRepuestos((prev) => prev.map((r) => (r.id === id ? { ...r, ...datos } : r)));
    setRepuestoAEditar(null);
  }

  async function confirmarEliminacion() {
    const id = repuestoAEliminar!.id;
    await api.delete(`/repuestos/${id}`);
    setRepuestos((prev) => prev.filter((r) => r.id !== id));
    setRepuestoAEliminar(null);
  }

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

  // ---------- filtrado en cliente ----------
  const visibles = repuestos.filter((r) => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return r.nombre.toLowerCase().includes(t) || (r.descripcion ?? '').toLowerCase().includes(t);
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
        <p className="text-sm text-error">No se pudieron cargar los repuestos.</p>
        <p className="mt-1 text-xs text-texto-2">{error}</p>
        <Button variante="secondary" tamano="sm" className="mt-4" onClick={cargar}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
          <input
            type="search"
            placeholder="Buscar repuesto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

        <Link href="/repuestos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo repuesto
          </Button>
        </Link>
      </div>

      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda ? `No hay repuestos que coincidan con "${busqueda}".` : 'El inventario está vacío.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((repuesto) => (
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
