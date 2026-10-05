'use client';

// ============================================================
// app/(app)/servicios/page.tsx — CATÁLOGO DE SERVICIOS
// ------------------------------------------------------------
// CRUD del patrón (Parte 3) + una variable nueva: el ROL.
//
// Backend:
//   GET /api/servicios → cualquier usuario autenticado
//   POST/PUT/DELETE    → solo Admin y Tecnico
//
// Acá solo es COMODIDAD visual (la API devuelve 403 igual si
// alguien se salta la UI). Se muestra con `tieneRol()` de
// lib/auth: si no escribe, se ocultan + Nuevo / ✏️ / 🗑.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import ServicioForm from '@/components/forms/ServicioForm';
import { api } from '@/lib/api';
import { tieneRol } from '@/lib/auth';
import { formatearPesos } from '@/lib/formato';
import type { Servicio, ServicioInput } from '@/types';

export default function ServiciosPage() {
  // ¿Puedo escribir? (Admin o Tecnico — Recepcion solo mira)
  const puedeEscribir = tieneRol('Admin', 'Tecnico');

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [servicioAEditar, setServicioAEditar] = useState<Servicio | null>(null);
  const [servicioAEliminar, setServicioAEliminar] = useState<Servicio | null>(null);

  const cargar = useCallback(() => {
    api
      .get<Servicio[]>('/servicios')
      .then((lista) => {
        setServicios(lista);
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

  async function guardarEdicion(datos: ServicioInput) {
    const id = servicioAEditar!.id;
    await api.put<Servicio>(`/servicios/${id}`, datos);
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, ...datos } : s)));
    setServicioAEditar(null);
  }

  async function confirmarEliminacion() {
    const id = servicioAEliminar!.id;
    await api.delete(`/servicios/${id}`);
    setServicios((prev) => prev.filter((s) => s.id !== id));
    setServicioAEliminar(null);
  }

  // ---------- filtrado en cliente ----------
  const visibles = servicios.filter((s) => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return s.nombre.toLowerCase().includes(t) || (s.descripcion ?? '').toLowerCase().includes(t);
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
        <p className="text-sm text-error">No se pudieron cargar los servicios.</p>
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
            placeholder="Buscar servicio…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

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

      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda ? `No hay servicios que coincidan con "${busqueda}".` : 'El catálogo está vacío.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((servicio) => (
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
