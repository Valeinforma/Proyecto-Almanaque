'use client';

// ============================================================
// components/ErrorCarga/ErrorCarga.tsx — ERROR DE CARGA
// ------------------------------------------------------------
// Estado de error de TODOS los listados: mensaje del módulo +
// el detalle que devolvió la API + botón "Reintentar" que
// vuelve a llamar a obtener del hook correspondiente.
// ============================================================

import Button from '@/components/Button/Button';

interface ErrorCargaProps {
  /** Texto propio del módulo: "No se pudieron cargar los clientes." */
  mensaje: string;
  /** Detalle del error (mensaje de ApiError del backend). */
  error: string | null;
  onReintentar: () => void;
}

export default function ErrorCarga({ mensaje, error, onReintentar }: ErrorCargaProps) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
      <p className="text-sm text-error">{mensaje}</p>
      <p className="mt-1 text-xs text-texto-2">{error}</p>
      <Button variante="secondary" tamano="sm" className="mt-4" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}
