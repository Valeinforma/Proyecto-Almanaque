'use client';

// ============================================================
// components/ClientesContext/ClientesContext.tsx — ESTADO DE CLIENTES
// ------------------------------------------------------------
// Patrón TodoContext del repo de referencia aplicado a un módulo
// de TechFix: el Provider es el DUEÑO del estado del módulo —
// lista, búsqueda, modales y operaciones — y la vista lo consume.
//
//   · capa de datos → hooks/useClientesApi (sobre lib/api.ts)
//   · estado UI     → busqueda + los tres modales (editar,
//     eliminar, ver equipos); null = cerrado (mismo criterio
//     que las páginas originales)
//   · derivados     → clientesVisibles (filtrado en cliente)
//
// Consumo (dentro del Provider, si no lanza):
//   const { clientesVisibles, setClienteAEditar } = useClientes();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import useClientesApi from '@/hooks/useClientesApi';
import type { ICliente, IClienteInput } from '@/interfaces/ICliente';

interface ClientesContextValue {
  // datos (del hook)
  clientes: ICliente[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // búsqueda
  busqueda: string;
  setBusqueda: (texto: string) => void;
  clientesVisibles: ICliente[];
  // modales (null = cerrado)
  clienteAEditar: ICliente | null;
  setClienteAEditar: (cliente: ICliente | null) => void;
  clienteAEliminar: ICliente | null;
  setClienteAEliminar: (cliente: ICliente | null) => void;
  clienteEquipos: ICliente | null;
  setClienteEquipos: (cliente: ICliente | null) => void;
  // operaciones
  guardarEdicion: (datos: IClienteInput) => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const ClientesContext = createContext<ClientesContextValue | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const {
    clientes,
    cargando,
    error,
    obtenerClientes,
    editarCliente,
    eliminarCliente,
  } = useClientesApi();

  const [busqueda, setBusqueda] = useState('');
  const [clienteAEditar, setClienteAEditar] = useState<ICliente | null>(null);
  const [clienteAEliminar, setClienteAEliminar] = useState<ICliente | null>(null);
  const [clienteEquipos, setClienteEquipos] = useState<ICliente | null>(null);

  // Traemos TODO el listado una vez y filtramos acá (evita un
  // request por tecla; el backend acepta ?search= si crece).
  const t = busqueda.trim().toLowerCase();
  const clientesVisibles = t
    ? clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(t) ||
          c.apellido.toLowerCase().includes(t) ||
          (c.email ?? '').toLowerCase().includes(t)
      )
    : clientes;

  // EDITAR: el form manda los datos → PUT → el hook actualiza la
  // copia local y cerramos el modal (si el PUT falla, el error
  // lo captura el form y el modal queda abierto).
  async function guardarEdicion(datos: IClienteInput) {
    await editarCliente(clienteAEditar!.id, datos);
    setClienteAEditar(null);
  }

  // ELIMINAR: DELETE → el hook quita de la lista local.
  async function confirmarEliminacion() {
    await eliminarCliente(clienteAEliminar!.id);
    setClienteAEliminar(null);
  }

  const value: ClientesContextValue = {
    clientes,
    cargando,
    error,
    recargar: () => {
      obtenerClientes();
    },
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
  };

  return <ClientesContext.Provider value={value}>{children}</ClientesContext.Provider>;
}

// Consumidor con guardia (en el repo usan aserción no-nula;
// acá lanzamos un error explicativo para fallar temprano y claro).
export function useClientes(): ClientesContextValue {
  const ctx = useContext(ClientesContext);
  if (!ctx) {
    throw new Error('useClientes() debe usarse dentro de <ClientesProvider>');
  }
  return ctx;
}
