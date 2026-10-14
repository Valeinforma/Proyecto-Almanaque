'use client';

// ============================================================
// components/Buscador/Buscador.tsx — CAMPO DE BÚSQUEDA
// ------------------------------------------------------------
// Buscador compartido de todas las pantallas de listado
// (clientes, equipos, órdenes, repuestos, servicios, usuarios).
// Equivale al TodoSearch del repo de referencia: el estado del
// texto vive en el Context de cada módulo; acá solo se muestra
// y se emite el cambio.
// ============================================================

import { Search } from 'lucide-react';

interface BuscadorProps {
  valor: string;
  onCambio: (texto: string) => void;
  placeholder: string;
}

export default function Buscador({ valor, onCambio, placeholder }: BuscadorProps) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
      <input
        type="search"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        className="h-10 w-full rounded-lg border border-white/10 bg-panel-2 pl-9 pr-3 text-sm text-texto outline-none transition-colors placeholder:text-texto-2/50 focus:border-primario"
      />
    </div>
  );
}
