// ============================================================
// interfaces/ICliente.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (ClienteDtos.cs).
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

export interface ICliente {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  fechaAlta: string; // ISO 8601 desde DateTime
  totalEquipos: number;
}

export interface IClienteInput {
  nombre: string;
  apellido: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
}
