'use client';

// ============================================================
// components/ModalAgregarLinea/ModalAgregarLinea.tsx — AGREGAR LÍNEA
// ------------------------------------------------------------
// Formulario del modal "Agregar servicio / Agregar repuesto" a
// una orden. Valida cantidad >= 1 y, para repuestos, stock
// suficiente (el backend vuelve a validar todo igual que acá).
//
// Al confirmar, el Context arma los DOS arrays de detalles y el
// backend descuenta stock y recalcula el costo.
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Select from '@/components/Select/Select';
import type { TipoLinea } from '@/components/OrdenDetalleContext/OrdenDetalleContext';

interface OpcionLinea {
  id: number;
  texto: string;
  stock?: number;
}

interface ModalAgregarLineaProps {
  tipo: TipoLinea;
  opciones: OpcionLinea[];
  onGuardar: (item: { id: number; cantidad: number }) => Promise<void>;
  onCancelar: () => void;
}

export default function ModalAgregarLinea({
  tipo,
  opciones,
  onGuardar,
  onCancelar,
}: ModalAgregarLineaProps) {
  const [seleccion, setSeleccion] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!seleccion) {
      setErrorLocal('Elegí un ítem de la lista.');
      return;
    }

    const cantidadNum = Number(cantidad);
    const stock = opciones.find((op) => op.id === Number(seleccion))?.stock;

    if (!Number.isInteger(cantidadNum) || cantidadNum < 1) {
      setErrorLocal('La cantidad debe ser un número entero mayor a 0.');
      return;
    }
    if (tipo === 'repuesto' && stock !== undefined && cantidadNum > stock) {
      setErrorLocal(`Solo hay ${stock} unidades en stock.`);
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);
    try {
      await onGuardar({ id: Number(seleccion), cantidad: cantidadNum });
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al agregar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {opciones.length === 0 ? (
        <p className="py-3 text-sm text-texto-2">
          No hay {tipo === 'servicio' ? 'servicios' : 'repuestos'} activos para
          agregar.
        </p>
      ) : (
        <>
          <Select
            label={tipo === 'servicio' ? 'Servicio *' : 'Repuesto *'}
            valor={seleccion}
            onChange={setSeleccion}
            placeholder="Elegí…"
            opciones={opciones.map((op) => ({ valor: op.id, texto: op.texto }))}
            disabled={enviando}
          />
          <Input
            type="number"
            label="Cantidad *"
            valor={cantidad}
            onChange={setCantidad}
            min={1}
            disabled={enviando}
          />
        </>
      )}

      <p className="text-xs text-texto-2">
        {tipo === 'repuesto'
          ? 'Al confirmar se descuenta el stock y se recalcula el costo (lo hace el backend).'
          : 'Al confirmar el backend recalcula el costo de la orden.'}
      </p>

      {errorBackend && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {errorBackend}
        </p>
      )}
      {errorLocal && (
        <p className="rounded-lg border border-aviso/30 bg-aviso/10 px-3 py-2 text-sm text-aviso">
          {errorLocal}
        </p>
      )}

      <div className="mt-1 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando} disabled={opciones.length === 0}>
          Agregar
        </Button>
      </div>
    </form>
  );
}
