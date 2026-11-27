'use client';

// ============================================================
// components/Paginador/Paginador.tsx — NAVEGACIÓN ENTRE PÁGINAS
// ------------------------------------------------------------
// Componente presentacional: NO decide cuántos items por página
// ni hace fetch; solo muestra el estado recibido y emite la
// página elegida. Se oculta cuando hay una sola página.
//
// Uso:
//   <Paginador pagina={1} totalPaginas={3} total={23}
//     porPagina={8} onCambiar={irAPagina} />
// ============================================================

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/Button/Button';

interface PaginadorProps {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  /** Total de items filtrados (para el texto "Mostrando X–Y de Z"). */
  total?: number;
  porPagina?: number;
}

export default function Paginador({
  pagina,
  totalPaginas,
  onCambiar,
  total,
  porPagina,
}: PaginadorProps) {
  if (totalPaginas <= 1) return null;

  const itemsPorPagina = porPagina ?? 0;
  const desde = total !== undefined && itemsPorPagina > 0
    ? (pagina - 1) * itemsPorPagina + 1
    : null;
  const hasta = total !== undefined && itemsPorPagina > 0
    ? Math.min(pagina * itemsPorPagina, total)
    : null;

  return (
    <nav
      aria-label="Paginación"
      className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row"
    >
      <p className="text-xs text-texto-2">
        {desde !== null && hasta !== null
          ? `Mostrando ${desde}–${hasta} de ${total}`
          : `Página ${pagina} de ${totalPaginas}`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variante="secondary"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>

        <span className="px-2 text-xs text-texto-2">
          Página {pagina} de {totalPaginas}
        </span>

        <Button
          variante="secondary"
          tamano="sm"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiar(pagina + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
