'use client';

// ============================================================
// app/(app)/usuarios/page.tsx — GESTIÓN DE USUARIOS
// (ROOM_MAP §5: Admin)
// ------------------------------------------------------------
// Módulo EXCLUSIVO de Administrador:
//  · Sidebar: el ítem ya tiene `roles: ['Admin']` (Parte 7).
//  · Esta pantalla además verifica el rol ANTES de pedir a la
//    API (que devolvería 403 igual) — mismo patrón que
//    /repuestos en la Parte 6.
//
// Reglas del backend que la UI respeta:
//  · No podés eliminar TU PROPIO usuario (400) → el botón ni
//    se muestra para la sesión actual.
//  · Si el usuario tiene órdenes a su nombre, no se puede
//    borrar (409) → el mensaje del backend aparece tal cual.
//  · Email duplicado → 409 con { mensaje }.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import UsuarioForm from '@/components/forms/UsuarioForm';
import { api } from '@/lib/api';
import { tieneRol, useSesion } from '@/lib/auth';
import type { Rol, Usuario, UsuarioInput } from '@/types';

// Tono del badge según el rol (colores del tema SDD §4).
const TONO_ROL: Record<Rol, 'primario' | 'exito' | 'aviso'> = {
  Admin: 'primario',
  Tecnico: 'exito',
  Recepcion: 'aviso',
};

const ETIQUETA_ROL: Record<Rol, string> = {
  Admin: 'Administrador',
  Tecnico: 'Técnico',
  Recepcion: 'Recepción',
};

export default function UsuariosPage() {
  const sesion = useSesion();
  const esAdmin = tieneRol('Admin');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  // Error de DELETE mostrado DENTRO del modal de confirmación
  // (ej: "tiene órdenes de servicio" → 409).
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api
      .get<Usuario[]>('/usuarios')
      .then((lista) => {
        setUsuarios(lista);
        setCargando(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Error desconocido');
        setCargando(false);
      });
  }, []);

  useEffect(() => {
    if (esAdmin) cargar();
  }, [esAdmin, cargar]);

  async function guardarEdicion(datos: UsuarioInput) {
    const id = usuarioAEditar!.id;
    await api.put<Usuario>(`/usuarios/${id}`, datos);
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, nombre: datos.nombre, email: datos.email, rol: datos.rol, activo: datos.activo }
          : u
      )
    );
    setUsuarioAEditar(null);
  }

  async function confirmarEliminacion() {
    const id = usuarioAEliminar!.id;
    setErrorEliminar(null);
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setUsuarioAEliminar(null);
    } catch (err) {
      // 409 (tiene órdenes) u otro: el mensaje del backend es
      // la mejor explicación — lo mostramos en el modal.
      setErrorEliminar(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  // ---------- sin acceso (no Admin) ----------
  if (!esAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-aviso/30 bg-aviso/10 p-6 text-center">
        <ShieldAlert className="mx-auto size-8 text-aviso" />
        <p className="mt-3 text-sm font-medium text-texto">
          Este módulo es solo para Administradores.
        </p>
        <p className="mt-1 text-xs text-texto-2">
          La gestión de usuarios no está disponible para tu rol.
        </p>
      </div>
    );
  }

  // ---------- filtrado en cliente ----------
  const visibles = usuarios.filter((u) => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return true;
    return (
      u.nombre.toLowerCase().includes(t) ||
      u.email.toLowerCase().includes(t) ||
      u.rol.toLowerCase().includes(t)
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
        <p className="text-sm text-error">No se pudieron cargar los usuarios.</p>
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
            placeholder="Buscar por nombre, email o rol…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
          />
        </div>

        <Link href="/usuarios/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>

      {visibles.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
          <p className="text-sm text-texto-2">
            {busqueda ? `No hay usuarios que coincidan con "${busqueda}".` : 'No hay usuarios.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((usuario) => {
          // Tu propia ficha: no se puede eliminar a uno mismo.
          const esPropio = sesion?.id === usuario.id;

          return (
            <div
              key={usuario.id}
              className="group rounded-xl border border-white/10 bg-panel p-4 transition-colors hover:border-primario/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-texto">
                    {usuario.nombre}
                    {esPropio && (
                      <span className="ml-2 text-xs font-normal text-primario">(vos)</span>
                    )}
                  </h3>
                  <p className="truncate text-xs text-texto-2">{usuario.email}</p>
                </div>
                <Badge tono={TONO_ROL[usuario.rol]}>{ETIQUETA_ROL[usuario.rol]}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                <Badge tono={usuario.activo ? 'exito' : 'error'}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </Badge>

                <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => setUsuarioAEditar(usuario)}
                    className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-aviso"
                  >
                    <Pencil className="size-4" />
                  </button>

                  {/* Sin botón de borrar para tu propio usuario:
                      el backend lo rechaza con 400. */}
                  {!esPropio && (
                    <button
                      type="button"
                      title="Eliminar"
                      onClick={() => {
                        setErrorEliminar(null);
                        setUsuarioAEliminar(usuario);
                      }}
                      className="cursor-pointer rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: editar */}
      <Modal
        abierto={usuarioAEditar !== null}
        onCerrar={() => setUsuarioAEditar(null)}
        titulo={usuarioAEditar ? `Editar «${usuarioAEditar.nombre}»` : ''}
      >
        {usuarioAEditar && (
          <UsuarioForm
            inicial={usuarioAEditar}
            onGuardar={guardarEdicion}
            onCancelar={() => setUsuarioAEditar(null)}
          />
        )}
      </Modal>

      {/* Modal: eliminar (con error del backend pegado adentro) */}
      <Modal
        abierto={usuarioAEliminar !== null}
        onCerrar={() => {
          setUsuarioAEliminar(null);
          setErrorEliminar(null);
        }}
        titulo="Eliminar usuario"
      >
        {usuarioAEliminar && (
          <div>
            <p className="text-sm text-texto-2">
              ¿Eliminar el usuario{' '}
              <span className="font-semibold text-texto">{usuarioAEliminar.nombre}</span>{' '}
              ({usuarioAEliminar.email})?
            </p>

            {errorEliminar && (
              <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {errorEliminar}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <Button
                variante="ghost"
                onClick={() => {
                  setUsuarioAEliminar(null);
                  setErrorEliminar(null);
                }}
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
    </div>
  );
}
