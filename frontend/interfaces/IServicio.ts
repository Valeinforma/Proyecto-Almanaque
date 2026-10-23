// ============================================================
// interfaces/IServicio.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (CatalogoDtos).
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

export interface IServicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
  // URL pública de la foto en Supabase Storage (null = sin foto).
  imagenUrl: string | null;
}

export interface IServicioInput {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  activo: boolean;
  imagenUrl?: string | null;
}
