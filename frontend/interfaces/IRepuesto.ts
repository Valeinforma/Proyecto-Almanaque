// ============================================================
// interfaces/IRepuesto.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (CatalogoDtos).
// El stock se descuenta al agregarlo a una orden y se restaura
// al quitarlo o borrar la orden.
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

export interface IRepuesto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}

export interface IRepuestoInput {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock: number;
  activo: boolean;
}
