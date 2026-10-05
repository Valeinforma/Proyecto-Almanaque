'use client';

// ============================================================
// components/forms/ServicioForm.tsx — FORMULARIO DE SERVICIOS
// ------------------------------------------------------------
// Mismo patrón que ClienteForm/EquipoForm: controlado, validación
// local, errores del backend, sin fetch propio.
//
// Campos (CatalogoDtos.ServicioCreateDto):
//   nombre * · precio * · descripcion · activo
// `activo` = si está desactivado, el backend lo excluye de las
// órdenes (y de la lista `?activo=true`), pero sigue existiendo
// en las órdenes viejas.
//
// Uso:
//   <ServicioForm onGuardar={crear} onCancelar={volver} />
//   <ServicioForm inicial={servicio} ... />
// ============================================================

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import type { Servicio, ServicioInput } from '@/types';

interface ServicioFormProps {
  inicial?: Servicio;
  onGuardar: (datos: ServicioInput) => Promise<void>;
  onCancelar: () => void;
}

export default function ServicioForm({ inicial, onGuardar, onCancelar }: ServicioFormProps) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [precio, setPrecio] = useState(inicial ? String(inicial.precio) : '');
  const [activo, setActivo] = useState(inicial?.activo ?? true);

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // ---------- validación ----------
    const precioNum = Number(precio);
    if (!nombre.trim()) {
      setErrorLocal('El nombre es obligatorio.');
      return;
    }
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      setErrorLocal('El precio debe ser un número mayor o igual a 0.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    const datos: ServicioInput = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: precioNum,
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
        placeholder="Cambio de pantalla"
        disabled={enviando}
      />

      <TextArea
        label="Descripción"
        valor={descripcion}
        onChange={setDescripcion}
        placeholder="Qué incluye el servicio…"
        disabled={enviando}
      />

      <Input
        type="number"
        label="Precio *"
        valor={precio}
        onChange={setPrecio}
        placeholder="15000"
        min={0}
        step="0.01"
        disabled={enviando}
      />

      {/* Checkbox simple: estado del ítem en el catálogo */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-texto-2">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          disabled={enviando}
          className="size-4 accent-[#38bdf8]"
        />
        Activo (disponible para nuevas órdenes)
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
          {inicial ? 'Guardar cambios' : 'Crear servicio'}
        </Button>
      </div>
    </form>
  );
}
