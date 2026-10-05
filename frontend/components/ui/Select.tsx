'use client';

// ============================================================
// components/ui/Select.tsx — CAMPO SELECT (SDD §12)
// ------------------------------------------------------------
// Variante de Input para elegir una opción de una lista.
// Mismo estilo visual que el resto de los campos del sistema.
//
// Uso:
//   <Select label="Cliente" valor={id} onChange={setId}
//           opciones={[{ valor: 1, texto: 'Juan Pérez' }]} />
// ============================================================

import { useId } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Opcion {
  valor: string | number;
  texto: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'children'> {
  label: string;
  valor: string | number;
  onChange: (nuevo: string) => string | void;
  opciones: Opcion[];
  placeholder?: string;
  error?: string;
}

export default function Select({
  label,
  valor,
  onChange,
  opciones,
  placeholder,
  error,
  className = '',
  id,
  ...resto
}: SelectProps) {
  const idAuto = useId();
  const campoId = id ?? idAuto;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-xs font-medium text-texto-2">
        {label}
      </label>

      <div className="relative">
        <select
          id={campoId}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className={`
            h-10 w-full appearance-none rounded-lg bg-panel-2 px-3 pr-9
            text-sm text-texto border outline-none transition-colors
            ${error ? 'border-error' : 'border-white/10 focus:border-primario'}
            ${className}
          `.replace(/\s+/g, ' ')}
          {...resto}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {opciones.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.texto}
            </option>
          ))}
        </select>

        {/* Flecha decorativa (el select nativo está escondido). */}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
