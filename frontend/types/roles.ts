// ============================================================
// types/roles.ts
// ------------------------------------------------------------
// Roles que reconoce el backend (Models/Roles.cs).
//
// El backend valida roles con [Authorize(Roles = "...")].
// El frontend solo los usa para mostrar/ocultar botones:
// la seguridad real siempre la da el backend.
// ============================================================

export type Rol = 'Admin' | 'Tecnico' | 'Recepcion';

export const ROLES: Rol[] = ['Admin', 'Tecnico', 'Recepcion'];
