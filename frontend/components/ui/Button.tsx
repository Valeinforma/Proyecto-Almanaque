'use client';

// ============================================================
// components/ui/Button.tsx
// ------------------------------------------------------------
// Botón base reutilizable (SDD §12).
//
// - variant: define el color/rol del botón
//   · primary   → acción principal (celeste, una por pantalla)
//   · secondary → acciones secundarias (panel oscuro con borde)
//   · danger    → eliminar / cancelar orden (rosa)
//   · ghost     → acciones discretas (solo texto)
// - loading: muestra spinner y deshabilita el click
//   (evita dobles submits mientras espera la API)
//
// Uso: <Button variant="primary" onClick={...}>Guardar</Button>
// ============================================================

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variante = 'primary' | 'secondary' | 'danger' | 'ghost';
type Tamano = 'sm' | 'md';

// Mapa variante → clases de Tailwind.
// (Centralizado acá para que un cambio visual sea en UN lugar.)
const VARIANTES: Record<Variante, string> = {
  primary:
    'bg-primario text-fondo font-semibold hover:bg-sky-300 disabled:bg-primario/40',
  secondary:
    'bg-panel-2 text-texto border border-white/10 hover:border-primario/40 hover:text-primario',
  danger:
    'bg-error/15 text-error border border-error/30 hover:bg-error/25',
  ghost: 'bg-transparent text-texto-2 hover:text-texto hover:bg-white/5',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  loading?: boolean;
  children?: ReactNode;
}

export default function Button({
  variante = 'primary',
  tamano = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      // Mientras carga: deshabilitado + cursor de espera.
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg transition-colors
        cursor-pointer select-none
        disabled:opacity-60 disabled:cursor-not-allowed
        ${VARIANTES[variante]}
        ${TAMANOS[tamano]}
        ${className}
      `.replace(/\s+/g, ' ')}
      {...resto}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
