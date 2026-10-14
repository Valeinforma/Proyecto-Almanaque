'use client';

// ============================================================
// components/UsuariosVista/UsuariosVista.tsx — GESTIÓN DE USUARIOS
// ------------------------------------------------------------
// Vista del módulo Usuarios (solo Admin): consume el Context —
// NO hace fetch ni tiene lógica de negocio propia.
//
// Reglas del backend que la UI respeta:
//  · No podés eliminar TU PROPIO usuario (400) → el botón ni
//    se muestra para la sesión actual.
//  · Si el usuario tiene órdenes a su nombre, no se puede
//    borrar (409) → el mensaje del backend aparece tal cual
//    dentro del modal (errorEliminar del Context).
//  · Email duplicado → 409 con { mensaje } (lo muestra el form).
// ============================================================

import Link from 'next/link';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import Button from '@/components/Button/Button';
import Modal from '@/components/Modal/Modal';
import { Badge } from '@/components/Badge/Badge';
import UsuarioForm from '@/components/UsuarioForm/UsuarioForm';
import Buscador from '@/components/Buscador/Buscador';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import ListaVacia from '@/components/ListaVacia/ListaVacia';
import { useUsuarios } from '@/components/UsuariosContext/UsuariosContext';
import { useSesion } from '@/lib/auth';
import type { Rol } from '@/types/roles';

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

export default function UsuariosVista() {
  const sesion = useSesion();

  const {
    esAdmin,
    cargando,
    error,
    recargar,
    busqueda,
    setBusqueda,
    usuariosVisibles,
    usuarioAEditar,
    setUsuarioAEditar,
    usuarioAEliminar,
    errorEliminar,
    abrirEliminacion,
    cerrarEliminacion,
    guardarEdicion,
    confirmarEliminacion,
  } = useUsuarios();

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

  if (cargando) return <Cargando />;

  if (error) {
    return (
      <ErrorCarga
        mensaje="No se pudieron cargar los usuarios."
        error={error}
        onReintentar={recargar}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Buscador
          valor={busqueda}
          onCambio={setBusqueda}
          placeholder="Buscar por nombre, email o rol…"
        />

        <Link href="/usuarios/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </Link>
      </div>

      {usuariosVisibles.length === 0 && (
        <ListaVacia
          texto={
            busqueda
              ? `No hay usuarios que coincidan con "${busqueda}".`
              : 'No hay usuarios.'
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {usuariosVisibles.map((usuario) => {
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
                      onClick={() => abrirEliminacion(usuario)}
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
      <Modal abierto={usuarioAEliminar !== null} onCerrar={cerrarEliminacion} titulo="Eliminar usuario">
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
              <Button variante="ghost" onClick={cerrarEliminacion}>
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
