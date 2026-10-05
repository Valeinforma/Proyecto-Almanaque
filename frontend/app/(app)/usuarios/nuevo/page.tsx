'use client';

// ============================================================
// app/(app)/usuarios/nuevo/page.tsx — CREAR USUARIO
// (ROOM_MAP §2: /usuarios/nuevo, Admin)
// ------------------------------------------------------------
// Patrón "crear = página". El form valida en cliente; los
// errores del backend (email duplicado 409, rol inválido 400)
// aparecen dentro del propio form.
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UsuarioForm from '@/components/forms/UsuarioForm';
import { api } from '@/lib/api';
import type { Usuario, UsuarioInput } from '@/types';

export default function NuevoUsuarioPage() {
  const router = useRouter();

  async function crear(datos: UsuarioInput) {
    await api.post<Usuario>('/usuarios', datos);
    router.push('/usuarios');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/usuarios')}
        className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-texto-2 transition-colors hover:text-primario"
      >
        <ArrowLeft className="size-4" />
        Volver a usuarios
      </button>

      <div className="rounded-xl border border-white/10 bg-panel p-6">
        <h2 className="text-lg font-semibold text-texto">Nuevo usuario</h2>
        <p className="mb-5 mt-1 text-sm text-texto-2">
          Elegí el rol con cuidado: define qué puede ver y hacer en el sistema
          (el backend lo valida en cada request).
        </p>

        <UsuarioForm onGuardar={crear} onCancelar={() => router.push('/usuarios')} />
      </div>
    </div>
  );
}
