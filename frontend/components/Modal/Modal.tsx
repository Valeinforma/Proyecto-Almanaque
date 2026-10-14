'use client';

// ============================================================
// components/ui/Modal.tsx
// ------------------------------------------------------------
// Diálogo superpuesto (SDD §12: Modal).
//
// - Se cierra con: click afuera, botón X, o tecla Escape
// - `abierto` lo controla la pantalla que lo usa
//
// Uso:
//   <Modal abierto={abierto} onCerrar={cerrar} titulo="Nuevo cliente">
//     ...formulario...
//   </Modal>
// ============================================================

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

export default function Modal({ abierto, onCerrar, titulo, children }: ModalProps) {
  // Escape para cerrar: se agrega mientras el modal está abierto
  // y se limpia al cerrar (así no quedan listeners huérfanos).
  useEffect(() => {
    if (!abierto) return;

    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  // Sin render nada si está cerrado (no hay costo en el DOM).
  if (!abierto) return null;

  return (
    // Overlay: capa fija sobre toda la pantalla.
    // e.currentTarget === e.target → el click fue en el fondo
    // (no en el panel interno) → cerrar.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.currentTarget === e.target) onCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="w-full max-w-lg rounded-xl border border-white/10 bg-panel p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-texto-2 transition-colors hover:bg-white/5 hover:text-texto cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
