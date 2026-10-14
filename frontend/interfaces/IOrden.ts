// ============================================================
// interfaces/IOrden.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (OrdenDtos.cs):
// la orden de servicio y sus líneas de detalle (servicios y
// repuestos).
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

import type { EstadoOrden } from '@/types/estados';

export interface IDetalleServicioInput {
  servicioId: number;
  cantidad: number;
}

export interface IDetalleRepuestoInput {
  repuestoId: number;
  cantidad: number;
}

// Líneas de detalle de servicios (nombre, precio, subtotal…)
export interface IOrdenDetalle {
  id: number;
  servicioId: number;
  servicioNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

// Líneas de detalle de repuestos (el backend descuenta stock al agregar).
export interface IOrdenRepuestoDetalle {
  id: number;
  repuestoId: number;
  repuestoNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface IOrden {
  id: number;
  numeroOrden: string;
  equipoId: number;
  equipoTipo: string | null;
  equipoMarca: string | null;
  equipoModelo: string | null;
  equipoNumeroSerie: string | null;
  clienteId: number;
  clienteNombre: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaIngreso: string;
  fechaEstimada: string | null;
  problemaReportado: string | null;
  diagnostico: string | null;
  solucion: string | null;
  estado: EstadoOrden;
  costo: number;
  observaciones: string | null;
  fechaEntrega: string | null;
  detallesServicios: IOrdenDetalle[];
  detallesRepuestos: IOrdenRepuestoDetalle[];
}

export interface IOrdenInput {
  equipoId: number;
  usuarioId: number;
  problemaReportado?: string | null;
  fechaEstimada?: string | null;
  observaciones?: string | null;
  detallesServicios?: IDetalleServicioInput[];
  detallesRepuestos?: IDetalleRepuestoInput[];
}

// Body de PUT /api/ordenes/{id} (OrdenUpdateDto).
// IMPORTANTE: si se envía detallesServicios O detallesRepuestos
// (aunque sea uno solo), el backend REEMPLAZA los dos listados
// completos (restaura stock y recalcula el costo). Hay que
// mandar SIEMPRE los dos arrays juntos para no perder líneas.
export interface IOrdenUpdateInput {
  problemaReportado?: string | null;
  fechaEstimada?: string | null;
  observaciones?: string | null;
  costo?: number;
  detallesServicios?: IDetalleServicioInput[];
  detallesRepuestos?: IDetalleRepuestoInput[];
}

// Body de PUT /api/ordenes/{id}/estado.
export interface IOrdenEstadoInput {
  estado: EstadoOrden;
  diagnostico?: string | null;
  solucion?: string | null;
  observaciones?: string | null;
}
