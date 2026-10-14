'use client';

// ============================================================
// app/(app)/servicios/nuevo/page.tsx — CREAR SERVICIO
// (ROOM_MAP §2: /servicios/nuevo)
// ------------------------------------------------------------
// El patrón "crear = página". Como el form solo necesita el
// callback de alta, usamos useServiciosApi sin cargar el
// listado (autoCargar: false).
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ServicioForm from '@/components/ServicioForm/ServicioForm';
import useServiciosApi from '@/hooks/useServiciosApi';
import type { IServicioInput } from '@/interfaces/IServicio';

export default function NuevoServicioPage() {
  const router = useRouter();

  const { agregarServicio } = useServiciosApi({ autoCargar: false });

  async function crear(datos: IServicioInput) {
    await agregarServicio(datos);
    router.push('/servicios');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/servicios')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a servicios
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nuevo servicio</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          Se agrega al catálogo activo y queda disponible para las órdenes.
        </p>

        <ServicioForm onGuardar={crear} onCancelar={() => router.push('/servicios')} />
      </div>
    </div>
  );
}
