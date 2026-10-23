'use client';

// ============================================================
// components/CampoImagen/CampoImagen.tsx — SUBIDA DE FOTO
// ------------------------------------------------------------
// Selector de imagen con preview para los formularios de
// catálogo (RepuestoForm / ServicioForm). NO sube nada por su
// cuenta: valida tipo/tamaño, muestra el preview local y avisa
// al formulario con onCambio(file). La subida real la hace el
// formulario con subirImagen() de lib/api.ts al enviar.
//
// Preview: data local vía URL.createObjectURL mientras no se
// envía; si ya hay imagen guardada (urlActual) la muestra.
// ============================================================

import { useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';

const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const TAMANIO_MAXIMO = 5 * 1024 * 1024; // 5 MB (lo mismo que el backend)

interface CampoImagenProps {
  label?: string;
  // Archivo elegido (null = no hay archivo nuevo).
  archivo: File | null;
  // URL ya guardada (para mostrar preview al editar / quitar).
  urlActual: string | null;
  // Se dispara con el archivo nuevo, o null si se quitó.
  onCambio: (archivo: File | null) => void;
  // Al quitar: avisa que la imagen guardada también debe borrarse.
  onQuitarGuardada?: () => void;
  disabled?: boolean;
}

export default function CampoImagen({
  label = 'Foto del producto',
  archivo,
  urlActual,
  onCambio,
  onQuitarGuardada,
  disabled = false,
}: CampoImagenProps) {
  const [error, setError] = useState<string | null>(null);
  // ObjectURL del archivo recién elegido (preview local).
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);

  const preview = previewLocal ?? urlActual ?? null;

  function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = ''; // permite volver a elegir el mismo archivo

    if (!file) return;

    if (!TIPOS_ADMITIDOS.includes(file.type)) {
      setError('Formato no soportado: usá una imagen JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > TAMANIO_MAXIMO) {
      setError('La imagen no puede superar los 5 MB.');
      return;
    }

    setError(null);
    if (previewLocal) URL.revokeObjectURL(previewLocal);
    setPreviewLocal(URL.createObjectURL(file));
    onCambio(file);
  }

  function alQuitar() {
    if (previewLocal) URL.revokeObjectURL(previewLocal);
    setPreviewLocal(null);
    setError(null);
    onCambio(null);
    // Si había una imagen ya guardada, el formulario debe limpiarla.
    if (urlActual) onQuitarGuardada?.();
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-texto-2">{label}</span>

      {preview ? (
        <div className="relative h-32 overflow-hidden rounded-lg border border-white/10 bg-panel-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview local / URL de Supabase: fuera del optimizador de Next */}
          <img
            src={preview}
            alt="Vista previa de la imagen"
            className="h-full w-full object-cover"
          />
          {!disabled && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              <label
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-fondo/85 px-2.5 py-1.5 text-xs font-medium text-texto transition-colors hover:bg-fondo"
                title="Cambiar imagen"
              >
                <RefreshCw className="size-3.5" />
                Cambiar
                <input
                  type="file"
                  accept={TIPOS_ADMITIDOS.join(',')}
                  onChange={alElegir}
                  disabled={disabled}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={alQuitar}
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-lg bg-error/85 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-error disabled:opacity-50"
                title="Quitar imagen"
              >
                <Trash2 className="size-3.5" />
                Quitar
              </button>
            </div>
          )}
        </div>
      ) : (
        <label
          className={`flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 bg-panel-2 text-texto-2 transition-colors hover:border-primario/50 hover:text-texto ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <ImagePlus className="size-6" />
          <span className="text-xs">Elegir imagen (JPG, PNG, WEBP o GIF · máx. 5 MB)</span>
          <input
            type="file"
            accept={TIPOS_ADMITIDOS.join(',')}
            onChange={alElegir}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      )}

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
