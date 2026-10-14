'use client';

// ============================================================
// components/UsuariosContext/UsuariosContext.tsx — ESTADO DE USUARIOS
// ------------------------------------------------------------
// Patrón ClientesContext aplicado a la gestión de usuarios
// (ROOM_MAP §5: Admin) + la guarda de rol propia del módulo:
//
//   · esAdmin false → no se pide la lista (autoCargar: esAdmin)
//     y la vista muestra "sin acceso" sin generar un 403
//   · errorEliminar → error de DELETE mostrado DENTRO del modal
//     de confirmación (ej: usuario con órdenes → 409 del
//     backend, que es la mejor explicación)
//
// Consumo (dentro del Provider, si no lanza):
//   const { usuariosVisibles, setUsuarioAEditar } = useUsuarios();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useUsuariosApi from '@/hooks/useUsuariosApi';
import { tieneRol } from '@/lib/auth';
import type { IUsuario, IUsuarioInput } from '@/interfaces/IUsuario';

interface UsuariosContextValue {
  /** false → rol sin acceso: no hay request ni lista. */
  esAdmin: boolean;
  // datos (del hook)
  usuarios: IUsuario[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda
  busqueda: string;
  setBusqueda: (texto: string) => void;
  usuariosVisibles: IUsuario[];
  // modal editar (null = cerrado)
  usuarioAEditar: IUsuario | null;
  setUsuarioAEditar: (usuario: IUsuario | null) => void;
  // modal eliminar — abrir/cierran con su error pegado
  usuarioAEliminar: IUsuario | null;
  errorEliminar: string | null;
  abrirEliminacion: (usuario: IUsuario) => void;
  cerrarEliminacion: () => void;
  // operaciones
  guardarEdicion: (datos: IUsuarioInput) => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const UsuariosContext = createContext<UsuariosContextValue | null>(null);

export function UsuariosProvider({ children }: { children: ReactNode }) {
  // Módulo EXCLUSIVO de Administrador (la API devolvería 403
  // igual a otros roles — esto es solo UX, igual que /repuestos).
  const esAdmin = tieneRol('Admin');

  const {
    usuarios,
    cargando,
    error,
    obtenerUsuarios,
    editarUsuario,
    eliminarUsuario,
  } = useUsuariosApi({ autoCargar: esAdmin });

  const [busqueda, setBusqueda] = useState('');
  const [usuarioAEditar, setUsuarioAEditar] = useState<IUsuario | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<IUsuario | null>(null);
  // Error de DELETE mostrado DENTRO del modal de confirmación
  // (ej: "tiene órdenes de servicio" → 409).
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  // Filtrado en cliente (nombre, email o rol).
  const t = busqueda.trim().toLowerCase();
  const usuariosVisibles = t
    ? usuarios.filter(
        (u) =>
          u.nombre.toLowerCase().includes(t) ||
          u.email.toLowerCase().includes(t) ||
          u.rol.toLowerCase().includes(t)
      )
    : usuarios;

  async function guardarEdicion(datos: IUsuarioInput) {
    await editarUsuario(usuarioAEditar!.id, datos);
    setUsuarioAEditar(null);
  }

  function abrirEliminacion(usuario: IUsuario) {
    setErrorEliminar(null);
    setUsuarioAEliminar(usuario);
  }

  function cerrarEliminacion() {
    setUsuarioAEliminar(null);
    setErrorEliminar(null);
  }

  // ELIMINAR: si el backend rechaza (409 con órdenes u otro),
  // el mensaje queda pegado en el modal; no se cierra.
  async function confirmarEliminacion() {
    const id = usuarioAEliminar!.id;
    setErrorEliminar(null);
    try {
      await eliminarUsuario(id);
      setUsuarioAEliminar(null);
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const value: UsuariosContextValue = {
    esAdmin,
    usuarios,
    cargando,
    error,
    recargar: () => {
      obtenerUsuarios();
    },
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
  };

  return (
    <UsuariosContext.Provider value={value}>{children}</UsuariosContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useUsuarios(): UsuariosContextValue {
  const ctx = useContext(UsuariosContext);
  if (!ctx) {
    throw new Error('useUsuarios() debe usarse dentro de <UsuariosProvider>');
  }
  return ctx;
}
