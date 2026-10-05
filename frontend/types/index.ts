// ============================================================
// types/index.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (.NET 10).
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

// ---------- Roles (Models/Roles.cs) ----------
// El backend valida roles con [Authorize(Roles = "...")].
// El frontend solo los usa para mostrar/ocultar botones:
// la seguridad real siempre la da el backend.
export type Rol = 'Admin' | 'Tecnico' | 'Recepcion';

export const ROLES: Rol[] = ['Admin', 'Tecnico', 'Recepcion'];

// ---------- Estados de orden (Models/EstadoOrden.cs) ----------
// Los estados viajan como TEXTO en JSON (JsonStringEnumConverter).
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

// ---------- Sesión (AuthDtos.cs) ----------
// Lo que devuelve POST /api/auth/login.
export interface SesionUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// ---------- Usuarios (UsuarioDtos.cs) ----------
// Lo que devuelve GET /api/usuarios (incluye activo).
export interface Usuario extends SesionUsuario {
  activo: boolean;
}

export interface UsuarioInput {
  nombre: string;
  email: string;
  password?: string; // requerido al crear, opcional al editar
  rol: Rol;
  activo: boolean;
}

// ---------- Clientes (ClienteDtos.cs) ----------
export interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fechaAlta: string; // ISO 8601 desde DateTime
  totalEquipos: number;
}

export interface ClienteInput {
  nombre: string;
  apellido: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}

// ---------- Equipos (EquipoDtos.cs) ----------
export interface Equipo {
  id: number;
  clienteId: number;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  descripcion: string | null;
  clienteNombre: string;
  ordenEstado: EstadoOrden | null; // estado de su orden actual (si tiene)
}

export interface EquipoInput {
  clienteId: number;
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  descripcion?: string | null;
}

// ---------- Órdenes (OrdenDtos.cs) ----------
export interface DetalleServicioInput {
  servicioId: number;
  cantidad: number;
}

export interface DetalleRepuestoInput {
  repuestoId: number;
  cantidad: number;
}

// Líneas de detalle de servicios (nombre, precio, subtotal…)
export interface OrdenDetalle {
  id: number;
  servicioId: number;
  servicioNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

// Líneas de detalle de repuestos (el backend descuenta stock al agregar).
export interface OrdenRepuestoDetalle {
  id: number;
  repuestoId: number;
  repuestoNombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Orden {
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
  detallesServicios: OrdenDetalle[];
  detallesRepuestos: OrdenRepuestoDetalle[];
}

export interface OrdenInput {
  equipoId: number;
  usuarioId: number;
  problemaReportado?: string | null;
  fechaEstimada?: string | null;
  observaciones?: string | null;
  detallesServicios?: DetalleServicioInput[];
  detallesRepuestos?: DetalleRepuestoInput[];
}

// Body de PUT /api/ordenes/{id} (OrdenUpdateDto).
// IMPORTANTE: si se envía detallesServicios O detallesRepuestos
// (aunque sea uno solo), el backend REEMPLAZA los dos listados
// completos (restaura stock y recalcula el costo). Hay que
// mandar SIEMPRE los dos arrays juntos para no perder líneas.
export interface OrdenUpdateInput {
  problemaReportado?: string | null;
  fechaEstimada?: string | null;
  observaciones?: string | null;
  costo?: number;
  detallesServicios?: DetalleServicioInput[];
  detallesRepuestos?: DetalleRepuestoInput[];
}

// Body de PUT /api/ordenes/{id}/estado.
export interface OrdenEstadoInput {
  estado: EstadoOrden;
  diagnostico?: string | null;
  solucion?: string | null;
  observaciones?: string | null;
}

// ---------- Catálogo: Servicios y Repuestos ----------
export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
}

export interface ServicioInput {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
}

export interface Repuesto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface RepuestoInput {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}

// ---------- Dashboard (DashboardDtos.cs) ----------
export interface OrdenResumen {
  id: number;
  numeroOrden: string;
  clienteNombre: string;
  equipo: string | null;
  estado: EstadoOrden;
  fechaIngreso: string;
  costo: number;
}

export interface Dashboard {
  ordenesAbiertas: number;
  enDiagnostico: number;
  enReparacion: number;
  listasParaEntregar: number;
  ingresosEstimados: number;
  totalClientes: number;
  totalEquipos: number;
  totalServiciosActivos: number;
  totalRepuestosActivos: number;
  ordenesRecientes: OrdenResumen[];
  equiposListos: OrdenResumen[];
}
