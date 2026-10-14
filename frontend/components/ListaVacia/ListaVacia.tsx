'use client';

// ============================================================
// components/ListaVacia/ListaVacia.tsx — LISTA SIN ÍTEMS
// ------------------------------------------------------------
// Estado vacío compartido por los listados. El texto lo calcula
// cada módulo: si hay búsqueda, avisa que nada coincide; si no,
// invita a crear el primer registro.
// ============================================================

interface ListaVaciaProps {
  texto: string;
}

export default function ListaVacia({ texto }: ListaVaciaProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-panel p-10 text-center">
      <p className="text-sm text-texto-2">{texto}</p>
    </div>
  );
}
