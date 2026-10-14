// ============================================================
// interfaces/IUsuario.ts
// ------------------------------------------------------------
// Espejo en TypeScript de los DTOs del backend (AuthDtos.cs y
// UsuarioDtos.cs): la sesión que devuelve el login y el
// usuario completo del módulo de administración.
//
// Regla: cada interface/campo replica el nombre EXACTO que el
// backend devuelve en JSON (serializador camelCase de ASP.NET).
// Si el backend cambia, este archivo se cambia primero.
// ============================================================

import type { Rol } from '@/types/roles';

// Lo que devuelve POST /api/auth/login.
export interface ISesionUsuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

// Lo que devuelve GET /api/usuarios (incluye activo).
export interface IUsuario extends ISesionUsuario {
  activo: boolean;
}

export interface IUsuarioInput {
  nombre: string;
  email: string;
  password?: string; // requerido al crear, opcional al editar
  rol: Rol;
  activo: boolean;
}
