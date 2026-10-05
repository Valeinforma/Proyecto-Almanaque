'use client';

// ============================================================
// components/ui/Input.tsx
// ------------------------------------------------------------
// Campo de texto con label y mensaje de error integrados
// (SDD §12: Input).
//
// Uso:
//   <Input label="Email" type="email" valor={} onChange={} />
//   <Input label="Teléfono" error="Formato inválido" />
//
// Nota: usamos `valor` + `onChange` (controlado desde la pantalla)
// en vez de `defaultValue`, para que el formulario siempre tenga
// el estado React como fuente de verdad.
// ============================================================

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  valor?: string;
  onChange?: (nuevo: string) => void;
  error?: string;
}

export default function Input({
  label,
  valor,
  onChange,
  error,
  className = '',
  id,
  ...resto
}: InputProps) {
  // useId genera un id estable y único → el <label for> linkea
  // con su input (accesibilidad: clickear el label focusea el campo).
  const idAuto = useId();
  const campoId = id ?? idAuto;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={campoId}
        className="text-xs font-medium text-texto-2"
      >
        {label}
      </label>

      <input
        id={campoId}
        value={valor}
        onChange={(e) => onChange?.(e.target.value)}
        className={`
          h-10 w-full rounded-lg bg-panel-2 px-3 text-sm text-texto
          border outline-none transition-colors
          placeholder:text-texto-2/50
          ${error
            ? 'border-error focus:border-error'
            : 'border-white/10 focus:border-primario'}
          ${className}
        `.replace(/\s+/g, ' ')}
        {...resto}
      />

      {/* Mensaje de validación debajo del campo. */}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
