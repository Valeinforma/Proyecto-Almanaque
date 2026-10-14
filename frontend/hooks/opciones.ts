// ============================================================
// hooks/opciones.ts
// ------------------------------------------------------------
// Opciones comunes de los hooks de datos por recurso.
// (Patrón useClientesApi del repositorio de referencia, donde
// la carga es automática al montar.)
//
// autoCargar:
//   · true (default) → el hook carga su lista solo al montarse
//     (como el repo de referencia)
//   · false → las pantallas de creación (/nuevo) lo desactivan
//     porque solo necesitan la operación de alta, no el listado
// ============================================================

export interface OpcionesHook {
  autoCargar?: boolean;
}
