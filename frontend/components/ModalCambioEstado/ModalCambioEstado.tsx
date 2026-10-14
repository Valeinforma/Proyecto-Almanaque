'use client';

// ============================================================
// components/ModalCambioEstado/ModalCambioEstado.tsx — CAMBIO DE ESTADO
// ------------------------------------------------------------
// Formulario del modal de cambio de estado, con nota opcional.
// La nota se guarda en el campo que corresponde al destino
// (diagnóstico / solución / observaciones) — lo decide
// OrdenDetalleContext en `aplicarCambio`.
//
// El backend REVALIDA la transición (400 si es inválida): la
// UI solo ofrece los botones válidos, pero nunca "miente".
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import TextArea from '@/components/TextArea/TextArea';
import { ETIQUETAS_ESTADO } from '@/types/estados';
import type { EstadoOrden } from '@/types/estados';

interface ModalCambioEstadoProps {
  destino: EstadoOrden;
  actual: EstadoOrden;
  onGuardar: (nota: string) => Promise<void>;
  onCancelar: () => void;
}

export default function ModalCambioEstado({
  destino,
  actual,
  onGuardar,
  onCancelar,
}: ModalCambioEstadoProps) {
  const etiqueta =
    destino === 'EnDiagnostico'
      ? 'Diagnóstico (opcional)'
      : destino === 'Listo'
        ? 'Solución aplicada (opcional)'
        : 'Observaciones (opcional)';

  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onGuardar(nota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <p className="text-sm text-texto-2">
        <span className="text-texto">{ETIQUETAS_ESTADO[actual]}</span> →{' '}
        <span className="text-primario">{ETIQUETAS_ESTADO[destino]}</span>
        {destino === 'Cancelado' && ' (la orden queda cerrada y no avanza más)'}
      </p>

      <TextArea label={etiqueta} valor={nota} onChange={setNota} disabled={enviando} />

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Volver
        </Button>
        <Button
          type="submit"
          loading={enviando}
          variante={destino === 'Cancelado' ? 'danger' : 'primary'}
        >
          Confirmar cambio
        </Button>
      </div>
    </form>
  );
}
