'use client';

// ============================================================
// app/(app)/clientes/nuevo/page.tsx — CREAR CLIENTE
// (ROOM_MAP §2: /clientes/nuevo)
// ------------------------------------------------------------
// Usa el MISMO ClienteForm que el modal de edición — la única
// diferencia es qué hace con los datos:
//   acá → alta vía useClientesApi().agregarCliente y volvemos
//   al listado (que recargará los datos).
//
// Página en vez de modal (a diferencia de editar) porque crear
// es una "tarea con foco": formulario completo + botón volver.
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import ClienteForm from '@/components/ClienteForm/ClienteForm';
import useClientesApi from '@/hooks/useClientesApi';
import type { IClienteInput } from '@/interfaces/ICliente';

export default function NuevoClientePage() {
  const router = useRouter();

  // No necesitamos el listado, solo la operación de alta.
  const { agregarCliente } = useClientesApi({ autoCargar: false });

  async function crear(datos: IClienteInput) {
    // POST → la API responde 201 con el cliente creado (el
    // form captura cualquier error del backend).
    await agregarCliente(datos);
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
