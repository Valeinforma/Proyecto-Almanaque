'use client';

// ============================================================
// components/ui/TextArea.tsx — CAMPO DE TEXTO MULTILÍNEA (SDD §12)
// ------------------------------------------------------------
// Variante de Input para descripciones largas (problema
// reportado, diagnóstico, solucion…). Mismo estilo y API:
//
//   <TextArea label="Problema" valor={texto}
//             onChange={setTexto} placeholder="…" />
// ============================================================

import { useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  label: string;
  valor: string;
  onChange: (nuevo: string) => void;
  error?: string;
}

export default function TextArea({
  label,
  valor,
  onChange,
  error,
  className = '',
  id,
  rows = 3,
  ...resto
}: TextAreaProps) {
  const idAuto = useId();
  const campoId = id ?? idAuto;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={campoId} className="text-xs font-medium text-texto-2">
        {label}
      </label>

      <textarea
        id={campoId}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`
          w-full resize-y rounded-lg bg-panel-2 px-3 py-2
          text-sm text-texto border outline-none transition-colors
          placeholder:text-texto-2/50
          ${error ? 'border-error' : 'border-white/10 focus:border-primario'}
          ${className}
        `.replace(/\s+/g, ' ')}
        {...resto}
      />

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
