'use client';

// ============================================================
// components/OrdenDetalleContext/OrdenDetalleContext.tsx — DETALLE
// ------------------------------------------------------------
// Patrón del resto de los módulos aplicado al detalle de una
// orden (ROOM_MAP §4): el Provider es dueño de la orden, sus
// catálogos y los CUATRO modales de la pantalla:
//
//   1. editando        → problema / fecha estimada / observaciones
//   2. cambioA         → cambio de estado con nota opcional
//   3. agregando       → agregar línea (servicio o repuesto)
//   4. aQuitar         → quitar línea (restaura stock)
//   5. eliminando      → eliminar la orden completa
//
// Recibe el id de la ruta como prop (ruta dinámica /ordenes/[id]).
//
// Consumo (dentro del Provider, si no lanza):
//   const { orden, permitidos, abrirEdicion } = useOrdenDetalle();
// ============================================================

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import useOrdenDetalleApi from '@/hooks/useOrdenDetalleApi';
import { useSesion } from '@/lib/auth';
import { transicionesDesde } from '@/types/estados';
import type { EstadoOrden } from '@/types/estados';
import type { IOrden, IOrdenEstadoInput } from '@/interfaces/IOrden';
import type { IRepuesto } from '@/interfaces/IRepuesto';
import type { IServicio } from '@/interfaces/IServicio';

export type TipoLinea = 'servicio' | 'repuesto';

export interface LineaAQuitar {
  tipo: TipoLinea;
  detalleId: number;
  nombre: string;
}

interface OrdenDetalleContextValue {
  // datos (del hook)
  orden: IOrden | null;
  servicios: IServicio[];
  repuestos: IRepuesto[];
  cargando: boolean;
  error: string | null;
  recargar: () => void;
  // derivados
  /** Rol Recepcion: no puede ver repuestos (403 en la API). */
  esRecepcion: boolean;
  /** Transiciones permitidas desde el estado actual (espejo del backend). */
  permitidos: EstadoOrden[];
  // modal editar cabecera
  editando: boolean;
  abrirEdicion: () => void;
  cerrarEdicion: () => void;
  // modal cambio de estado (null = cerrado)
  cambioA: EstadoOrden | null;
  setCambioA: (destino: EstadoOrden | null) => void;
  // modal agregar línea (null = cerrado)
  agregando: TipoLinea | null;
  setAgregando: (tipo: TipoLinea | null) => void;
  // modal quitar línea (null = cerrado)
  aQuitar: LineaAQuitar | null;
  pedirQuitar: (linea: LineaAQuitar) => void;
  cerrarQuitar: () => void;
  // modal eliminar orden
  eliminando: boolean;
  setEliminando: (valor: boolean) => void;
  // operaciones
  guardarEdicion: (datos: {
    problemaReportado: string | null;
    fechaEstimada: string | null;
    observaciones: string | null;
  }) => Promise<void>;
  aplicarCambio: (nota: string) => Promise<void>;
  agregarLinea: (tipo: TipoLinea, item: { id: number; cantidad: number }) => Promise<void>;
  confirmarQuitar: () => Promise<void>;
  confirmarEliminacion: () => Promise<void>;
}

const OrdenDetalleContext = createContext<OrdenDetalleContextValue | null>(null);

export function OrdenDetalleProvider({
  id,
  children,
}: {
  id: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const sesion = useSesion();
  const {
    orden,
    servicios,
    repuestos,
    cargando,
    error,
    obtener,
    actualizarCabecera,
    cambiarEstado,
    reemplazarDetalles,
    eliminarOrden,
  } = useOrdenDetalleApi(id);

  // Modales: uno por tarea (null/false = cerrado).
  const [editando, setEditando] = useState(false);
  const [cambioA, setCambioA] = useState<EstadoOrden | null>(null);
  const [agregando, setAgregando] = useState<TipoLinea | null>(null);
  const [aQuitar, setAQuitar] = useState<LineaAQuitar | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // ---------- derivados ----------
  const esRecepcion = sesion?.rol === 'Recepcion';
  const permitidos = orden ? transicionesDesde(orden.estado) : [];

  // ---------- operaciones ----------

  // EDITAR cabecera: si el PUT falla, el form muestra el error y
  // el modal queda abierto.
  async function guardarEdicion(datos: {
    problemaReportado: string | null;
    fechaEstimada: string | null;
    observaciones: string | null;
  }) {
    await actualizarCabecera(datos);
    setEditando(false);
  }

  // CAMBIAR ESTADO: la nota se guarda en el campo que
  // corresponde al destino (diagnóstico / solución /
  // observaciones) — regla del backend.
  async function aplicarCambio(nota: string) {
    const cuerpo: IOrdenEstadoInput = { estado: cambioA! };
    const texto = nota.trim();
    if (texto) {
      if (cambioA === 'EnDiagnostico') cuerpo.diagnostico = texto;
      else if (cambioA === 'Listo') cuerpo.solucion = texto;
      else cuerpo.observaciones = texto;
    }
    await cambiarEstado(cuerpo);
    setCambioA(null);
  }

  // AGREGAR LÍNEA: se suman las líneas actuales (en formato
  // input) + la nueva y se REEMPLAZAN los dos listados juntos.
  async function agregarLinea(tipo: TipoLinea, item: { id: number; cantidad: number }) {
    const o = orden!;
    const serv = o.detallesServicios.map((d) => ({
      servicioId: d.servicioId,
      cantidad: d.cantidad,
    }));
    const rep = o.detallesRepuestos.map((d) => ({
      repuestoId: d.repuestoId,
      cantidad: d.cantidad,
    }));

    if (tipo === 'servicio') serv.push({ servicioId: item.id, cantidad: item.cantidad });
    else rep.push({ repuestoId: item.id, cantidad: item.cantidad });

    await reemplazarDetalles(serv, rep);
    setAgregando(null);
  }

  // QUITAR LÍNEA: mismas listas menos la elegida; los repuestos
  // quitados vuelven al stock (lo hace el backend).
  async function confirmarQuitar() {
    const { tipo, detalleId } = aQuitar!;
    const o = orden!;

    const serv = o.detallesServicios
      .filter((d) => !(tipo === 'servicio' && d.id === detalleId))
      .map((d) => ({ servicioId: d.servicioId, cantidad: d.cantidad }));
    const rep = o.detallesRepuestos
      .filter((d) => !(tipo === 'repuesto' && d.id === detalleId))
      .map((d) => ({ repuestoId: d.repuestoId, cantidad: d.cantidad }));

    await reemplazarDetalles(serv, rep);
    setAQuitar(null);
  }

  // ELIMINAR: baja total (repuestos restaurados) y vuelta al
  // listado.
  async function confirmarEliminacion() {
    await eliminarOrden();
    router.push('/ordenes');
  }

  function pedirQuitar(linea: LineaAQuitar) {
    setAQuitar(linea);
  }

  function cerrarQuitar() {
    setAQuitar(null);
  }

  const value: OrdenDetalleContextValue = {
    orden,
    servicios,
    repuestos,
    cargando,
    error,
    recargar: () => {
      obtener();
    },
    esRecepcion,
    permitidos,
    editando,
    abrirEdicion: () => setEditando(true),
    cerrarEdicion: () => setEditando(false),
    cambioA,
    setCambioA,
    agregando,
    setAgregando,
    aQuitar,
    pedirQuitar,
    cerrarQuitar,
    eliminando,
    setEliminando,
    guardarEdicion,
    aplicarCambio,
    agregarLinea,
    confirmarQuitar,
    confirmarEliminacion,
  };

  return (
    <OrdenDetalleContext.Provider value={value}>
      {children}
    </OrdenDetalleContext.Provider>
  );
}

// Consumidor con guardia (ver ClientesContext).
export function useOrdenDetalle(): OrdenDetalleContextValue {
  const ctx = useContext(OrdenDetalleContext);
  if (!ctx) {
    throw new Error('useOrdenDetalle() debe usarse dentro de <OrdenDetalleProvider>');
  }
  return ctx;
}
