'use client';

// ============================================================
// components/forms/ClienteForm.tsx — FORMULARIO DE CLIENTES
// ------------------------------------------------------------
// Formulario REUTILIZABLE que usan DOS pantallas:
//   · /clientes/nuevo      → sin `inicial` (crear)
//   · modal de /clientes    → con `inicial`  (editar)
//
// Responsabilidades:
//   · mantener el estado de los campos (controlado)
//   · validación en cliente (antes de pegarle a la API)
//   · mostrar errores que devuelve el backend (400)
//   · NO sabe nada de fetch: solo llama a `onGuardar(datos)`
//     y quien lo monta decide qué hacer (patrón "presentational")
//
// Uso:
//   <ClienteForm onGuardar={crear} onCancelar={volver} />
//   <ClienteForm inicial={cliente} onGuardar={guardar} ... />
// ============================================================

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Cliente, ClienteInput } from '@/types';

interface ClienteFormProps {
  inicial?: Cliente; // presente → modo edición
  onGuardar: (datos: ClienteInput) => Promise<void>;
  onCancelar: () => void;
}

// Estado inicial de los campos (vacío o los del cliente a editar).
function estadoInicial(inicial?: Cliente) {
  return {
    nombre: inicial?.nombre ?? '',
    apellido: inicial?.apellido ?? '',
    telefono: inicial?.telefono ?? '',
    email: inicial?.email ?? '',
    direccion: inicial?.direccion ?? '',
  };
}

export default function ClienteForm({ inicial, onGuardar, onCancelar }: ClienteFormProps) {
  const [campos, setCampos] = useState(() => estadoInicial(inicial));
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Actualiza un campo: el name identifica cuál es.
  const cambiar = (campo: keyof typeof campos) => (valor: string) =>
    setCampos((c) => ({ ...c, [campo]: valor }));

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // ---------- validación en cliente ----------
    if (!campos.nombre.trim() || !campos.apellido.trim()) {
      setErrorLocal('Nombre y apellido son obligatorios.');
      return;
    }
    if (campos.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email)) {
      setErrorLocal('El email no tiene un formato válido.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    // Armamos el DTO que espera el backend (campos vacíos → null).
    const datos: ClienteInput = {
      nombre: campos.nombre.trim(),
      apellido: campos.apellido.trim(),
      telefono: campos.telefono.trim() || null,
      email: campos.email.trim() || null,
      direccion: campos.direccion.trim() || null,
    };

    try {
      // El padre decide: POST (crear) o PUT (editar).
      await onGuardar(datos);
      // Si llegamos acá, el padre ya navegó/actualizó: no
      // hacemos nada más (el componente se desmonta).
    } catch (err) {
      // Errores del backend (400 con { mensaje }) → bajo el form.
      setErrorBackend(err instanceof Error ? err.message : 'Error al guardar');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      {/* Nombre y apellido en dos columnas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre *"
          valor={campos.nombre}
          onChange={cambiar('nombre')}
          placeholder="Juan"
          disabled={enviando}
        />
        <Input
          label="Apellido *"
          valor={campos.apellido}
          onChange={cambiar('apellido')}
          placeholder="Pérez"
          disabled={enviando}
        />
      </div>

      <Input
        label="Teléfono"
        valor={campos.telefono}
        onChange={cambiar('telefono')}
        placeholder="11 4444-5555"
        disabled={enviando}
      />

      <Input
        label="Email"
        type="email"
        valor={campos.email}
        onChange={cambiar('email')}
        placeholder="juan@email.com"
        disabled={enviando}
      />

      <Input
        label="Dirección"
        valor={campos.direccion}
        onChange={cambiar('direccion')}
        placeholder="Av. Siempreviva 742"
        disabled={enviando}
      />

      {/* Errores: primero los del backend (más confiables), después
          los de validación local. */}
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

      {/* Acciones */}
      <div className="mt-2 flex justify-end gap-3">
        <Button
          type="button"
          variante="ghost"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={enviando}>
          {inicial ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
