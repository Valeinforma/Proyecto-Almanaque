// ============================================================
// interfaces/IPublico.ts
// ------------------------------------------------------------
// Espejo en TypeScript del DTO que devuelve
// GET /api/publico/catalogo (catálogo público de la landing).
//
// Regla: cada campo replica el nombre EXACTO que el backend
// devuelve en JSON (serializador camelCase de ASP.NET).
// ============================================================

// Servicio activo, mínimo para la vitrina pública.
export interface IServicioPublico {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
}

// Repuesto activo con stock, mínimo para la vitrina pública.
export interface IRepuestoPublico {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagenUrl: string | null;
}

// Respuesta completa del endpoint público.
export interface ICatalogoPublico {
  servicios: IServicioPublico[];
  repuestos: IRepuestoPublico[];
}
