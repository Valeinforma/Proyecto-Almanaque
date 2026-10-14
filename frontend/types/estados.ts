// ============================================================
// types/estados.ts
// ------------------------------------------------------------
// Estados de orden (Models/EstadoOrden.cs) y las reglas de
// negocio asociadas, COPIADAS del backend.
//
// Los estados viajan como TEXTO en JSON gracias al
// JsonStringEnumConverter de ASP.NET.
// ============================================================

export type EstadoOrden =
  | 'Recibido'
  | 'EnDiagnostico'
  | 'Presupuestado'
  | 'EnReparacion'
  | 'Listo'
  | 'Entregado'
  | 'Cancelado';

// Flujo principal de la línea de progreso del detalle de orden
// (sin Cancelado, que es una rama lateral).
export const FLUJO_ESTADOS: EstadoOrden[] = [
  'Recibido',
  'EnDiagnostico',
  'Presupuestado',
  'EnReparacion',
  'Listo',
  'Entregado',
];

// Texto amigable para mostrar en la UI.
export const ETIQUETAS_ESTADO: Record<EstadoOrden, string> = {
  Recibido: 'Recibido',
  EnDiagnostico: 'Diagnóstico',
  Presupuestado: 'Presupuesto',
  EnReparacion: 'Reparación',
  Listo: 'Listo',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
};

// Transiciones permitidas: COPIADAS del backend
// (OrdenesController.Transiciones). Si el backend cambia las
// reglas, hay que actualizar este mapa para que el frontend
// solo ofrezca botones válidos igual que la API.
export const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  Recibido: ['EnDiagnostico', 'Cancelado'],
  EnDiagnostico: ['Presupuestado', 'Cancelado'],
  Presupuestado: ['EnReparacion', 'Cancelado'],
  EnReparacion: ['Listo', 'Cancelado'],
  Listo: ['Entregado'],
  Entregado: [],
  Cancelado: [],
};

// Devuelve a qué estados se puede avanzar desde el estado actual.
export function transicionesDesde(estado: EstadoOrden): EstadoOrden[] {
  return TRANSICIONES[estado] ?? [];
}
