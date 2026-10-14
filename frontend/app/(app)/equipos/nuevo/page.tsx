'use client';

// ============================================================
// app/(app)/equipos/nuevo/page.tsx — CREAR EQUIPO
// (ROOM_MAP §2: /equipos/nuevo)
// ------------------------------------------------------------
// Igual que /clientes/nuevo: el form necesita la lista de
// clientes para el select (useClientesApi la trae sola) y el
// alta sale por useEquiposApi().agregarEquipo; después
// volvemos al listado.
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import EquipoForm from '@/components/EquipoForm/EquipoForm';
import useClientesApi from '@/hooks/useClientesApi';
import useEquiposApi from '@/hooks/useEquiposApi';
import type { IEquipoInput } from '@/interfaces/IEquipo';

export default function NuevoEquipoPage() {
  const router = useRouter();

  // Select de clientes: lista auto-cargada.
  const { clientes, error } = useClientesApi();
  // Alta de equipo: sin listado propio.
  const { agregarEquipo } = useEquiposApi({ autoCargar: false });

  async function crear(datos: IEquipoInput) {
    await agregarEquipo(datos);
    router.push('/equipos');
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-error/30 bg-error/10 p-6 text-center">
        <p className="text-sm text-error">
          No se pudieron cargar los clientes para el formulario.
        </p>
        <p className="mt-1 text-xs text-texto-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/equipos')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a equipos
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nuevo equipo</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          Registrá el equipo y su cliente dueño. El campo Cliente * es
          obligatorio.
        </p>

        {/* Mientras carga los clientes, el form se monta con la
            lista vacía (el select quedará sin opciones). */}
        <EquipoForm
          clientes={clientes}
          onGuardar={crear}
          onCancelar={() => router.push('/equipos')}
        />
      </div>
    </div>
  );
}
