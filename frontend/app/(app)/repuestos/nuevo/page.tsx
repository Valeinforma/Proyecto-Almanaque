'use client';

// ============================================================
// app/(app)/repuestos/nuevo/page.tsx — CREAR REPUESTO
// (ROOM_MAP §2: /repuestos/nuevo)
// ------------------------------------------------------------
// Mismo patrón que /servicios/nuevo. El stock inicial se
// define acá; después lo maneja el backend (descuenta al
// agregar a órdenes, restaura al quitar).
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RepuestoForm from '@/components/forms/RepuestoForm';
import { api } from '@/lib/api';
import type { Repuesto, RepuestoInput } from '@/types';

export default function NuevoRepuestoPage() {
  const router = useRouter();

  async function crear(datos: RepuestoInput) {
    await api.post<Repuesto>('/repuestos', datos);
    router.push('/repuestos');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/repuestos')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a repuestos
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nuevo repuesto</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          El stock inicial se descuenta solo cuando el repuesto entra en una
          orden.
        </p>

        <RepuestoForm onGuardar={crear} onCancelar={() => router.push('/repuestos')} />
      </div>
    </div>
  );
}
