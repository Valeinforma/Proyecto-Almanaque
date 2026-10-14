'use client';

// ============================================================
// components/Cargando/Cargando.tsx — ESTADO DE CARGA
// ------------------------------------------------------------
// Spinner centrado que muestran todas las pantallas mientras el
// hook de datos trae su lista (antes era un bloque copiado en
// cada página).
// ============================================================

export default function Cargando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-2 border-primario border-t-transparent" />
    </div>
  );
}
