'use client';

// ============================================================
// components/forms/RepuestoForm.tsx — FORMULARIO DE REPUESTOS
// ------------------------------------------------------------
// Igual que ServicioForm + el campo `stock` (entero >= 0).
//
// OJO con el stock inicial al EDITAR: el backend acepta el
// número que mandemos y lo pone tal cual (no lo "suma"). Es el
// valor de verdad del inventario — cuidado al cambiarlo.
//
// Uso:
//   <RepuestoForm onGuardar={crear} onCancelar={volver} />
//   <RepuestoForm inicial={repuesto} ... />
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import TextArea from '@/components/TextArea/TextArea';
import type { IRepuesto, IRepuestoInput } from '@/interfaces/IRepuesto';

interface RepuestoFormProps {
  inicial?: IRepuesto;
  onGuardar: (datos: IRepuestoInput) => Promise<void>;
  onCancelar: () => void;
}

export default function RepuestoForm({ inicial, onGuardar, onCancelar }: RepuestoFormProps) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [precio, setPrecio] = useState(inicial ? String(inicial.precio) : '');
  const [stock, setStock] = useState(inicial ? String(inicial.stock) : '0');
  const [activo, setActivo] = useState(inicial?.activo ?? true);

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // ---------- validación ----------
    const precioNum = Number(precio);
    const stockNum = Number(stock);

    if (!nombre.trim()) {
      setErrorLocal('El nombre es obligatorio.');
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      setErrorLocal('El precio debe ser un número mayor o igual a 0.');
      return;
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setErrorLocal('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    const datos: IRepuestoInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioNum,
      stock: stockNum,
      activo,
    };

    try {
      await onGuardar(datos);
    } catch (err) {
      setErrorBackend(err instanceof Error ? err.message : 'Error al guardar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      <Input
        label="Nombre *"
        valor={nombre}
        onChange={setNombre}
        placeholder="Batería Lenovo"
        disabled={enviando}
      />

      <TextArea
        label="Descripción"
        valor={descripcion}
        onChange={setDescripcion}
        placeholder="Modelo compatible, características…"
        disabled={enviando}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          label="Precio *"
          valor={precio}
          onChange={setPrecio}
          placeholder="25000"
          min={0}
          step="0.01"
          disabled={enviando}
        />
        <Input
          type="number"
          label="Stock *"
          valor={stock}
          onChange={setStock}
          placeholder="10"
          min={0}
          disabled={enviando}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-texto-2">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          disabled={enviando}
          className="size-4 accent-[#38bdf8]"
        />
        Activo (se puede agregar a órdenes)
      </label>

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

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variante="ghost" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" loading={enviando}>
          {inicial ? 'Guardar cambios' : 'Crear repuesto'}
        </Button>
      </div>
    </form>
  );
}
