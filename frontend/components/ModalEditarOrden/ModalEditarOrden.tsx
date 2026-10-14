'use client';

// ============================================================
// components/ModalEditarOrden/ModalEditarOrden.tsx — EDITAR CABECERA
// ------------------------------------------------------------
// Formulario del modal "Editar orden": problema / fecha estimada
// / observaciones. Inicializa desde la orden al montar (el
// modal vive montado solo mientras `editando` es true).
//
// Sin listados en el body del PUT → el backend NO toca los
// detalles de la orden (regla del OrdenUpdateDto).
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import TextArea from '@/components/TextArea/TextArea';
import type { IOrden } from '@/interfaces/IOrden';

interface ModalEditarOrdenProps {
  inicial: IOrden;
  onGuardar: (datos: {
    problemaReportado: string | null;
    fechaEstimada: string | null;
    observaciones: string | null;
  }) => Promise<void>;
  onCancelar: () => void;
}

export default function ModalEditarOrden({
  inicial,
  onGuardar,
  onCancelar,
}: ModalEditarOrdenProps) {
  const [problema, setProblema] = useState(inicial.problemaReportado ?? '');
  const [fechaEstimada, setFechaEstimada] = useState(
    inicial.fechaEstimada?.slice(0, 10) ?? ''
  );
  const [observaciones, setObservaciones] = useState(inicial.observaciones ?? '');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await onGuardar({
        problemaReportado: problema.trim() || null,
        fechaEstimada: fechaEstimada || null,
        observaciones: observaciones.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <TextArea
        label="Problema reportado"
        valor={problema}
        onChange={setProblema}
        disabled={enviando}
      />
      <Input
        type="date"
        label="Fecha estimada de entrega"
        valor={fechaEstimada}
        onChange={setFechaEstimada}
        disabled={enviando}
      />
      <TextArea
        label="Observaciones internas"
        valor={observaciones}
        onChange={setObservaciones}
        disabled={enviando}
      />

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
