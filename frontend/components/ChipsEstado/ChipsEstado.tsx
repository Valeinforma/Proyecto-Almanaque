'use client';

// ============================================================
// components/ChipsEstado/ChipsEstado.tsx — FILTROS CON CHIPS
// ------------------------------------------------------------
// Fila de chips filtrables con conteo (chips de estado de las
// órdenes del ROOM_MAP §4). Genérico sobre strings para que el
// módulo arme sus propias opciones (etiquetas y conteos).
//
// El estado del filtro vive en el Context de cada módulo; acá
// solo se renderiza y se emite la selección.
// ============================================================

export interface Chip {
  valor: string;
  etiqueta: string;
  conteo: number;
}

interface ChipsEstadoProps {
  chips: Chip[];
  /** Valor actualmente activo. */
  activo: string;
  onSeleccionar: (valor: string) => void;
}

export default function ChipsEstado({ chips, activo, onSeleccionar }: ChipsEstadoProps) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {chips.map((chip) => {
        const estaActivo = activo === chip.valor;

        return (
          <button
            key={chip.valor}
            type="button"
            onClick={() => onSeleccionar(chip.valor)}
            className={`
              cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors
              ${
                estaActivo
                  ? 'border-primario bg-primario/15 text-primario'
                  : 'border-white/10 bg-panel text-texto-2 hover:border-white/25'
              }
            `.replace(/\s+/g, ' ')}
          >
            {chip.etiqueta}{' '}
            <span className={estaActivo ? 'text-primario' : 'text-texto-2/70'}>({chip.conteo})</span>
          </button>
        );
      })}
    </div>
  );
}
