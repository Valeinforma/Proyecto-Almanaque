// ============================================================
// interfaces/IEquipo.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (EquipoDtos.cs).
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

import type { EstadoOrden } from '@/types/estados';

export interface IEquipo {
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

export interface IEquipoInput {
  clienteId: number;
  tipo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  descripcion?: string | null;
}
