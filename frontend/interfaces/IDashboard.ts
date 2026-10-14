// ============================================================
// interfaces/IDashboard.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (DashboardDtos.cs):
// el resumen del panel principal, armado entero por la API.
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

import type { EstadoOrden } from '@/types/estados';

export interface IOrdenResumen {
  id: number;
  numeroOrden: string;
  clienteNombre: string;
  equipo: string | null;
  estado: EstadoOrden;
  fechaIngreso: string;
  costo: number;
}

export interface IDashboard {
  ordenesAbiertas: number;
  enDiagnostico: number;
  enReparacion: number;
  listasParaEntregar: number;
  ingresosEstimados: number;
  totalClientes: number;
  totalEquipos: number;
  totalServiciosActivos: number;
  totalRepuestosActivos: number;
  ordenesRecientes: IOrdenResumen[];
  equiposListos: IOrdenResumen[];
}
