'use client';

// ============================================================
// app/(app)/clientes/nuevo/page.tsx — CREAR CLIENTE
// (ROOM_MAP §2: /clientes/nuevo)
// ------------------------------------------------------------
// Usa el MISMO ClienteForm que el modal de edición — la única
// diferencia es qué hace con los datos:
//   acá → POST y volvemos al listado.
//
// Página en vez de modal (a diferencia de editar) porque crear
// es una "tarea con foco": formulario completo + botón volver.
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ClienteForm from '@/components/forms/ClienteForm';
import { api } from '@/lib/api';
import type { Cliente, ClienteInput } from '@/types';

export default function NuevoClientePage() {
  const router = useRouter();

  async function crear(datos: ClienteInput) {
    // POST → la API responde 201 con el cliente creado.
    await api.post<Cliente>('/clientes', datos);
    // Listo: volvemos al listado (que ya recargará los datos).
    router.push('/clientes');
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Volver al listado */}
      <button
        type="button"
        onClick={() => router.push('/clientes')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a clientes
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nuevo cliente</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          Completá los datos del cliente. Los campos con * son obligatorios.
        </p>

        <ClienteForm onGuardar={crear} onCancelar={() => router.push('/clientes')} />
      </div>
    </div>
  );
}
