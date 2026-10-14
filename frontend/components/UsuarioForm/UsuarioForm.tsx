'use client';

// ============================================================
// components/forms/UsuarioForm.tsx — FORMULARIO DE USUARIOS
// ------------------------------------------------------------
// Patrón de los forms anteriores + dos particularidades:
//
// 1. CONTRASEÑA: al CREAR es obligatoria; al EDITAR es
//    OPCIONAL — si queda vacía el backend no la toca
//    (`if (!string.IsNullOrEmpty(request.Password))`).
//    Nunca se muestra ni se pide la contraseña actual: el
//    backend solo acepta reemplazarla por una nueva.
// 2. DUPLICADOS: si el email ya existe el backend responde
//    409 con { mensaje } y eso aparece en el error rojo.
//
// Uso:
//   <UsuarioForm onGuardar={crear} onCancelar={...} />
//   <UsuarioForm inicial={usuario} ... />   ← modo edición
// ============================================================

import { useState } from 'react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Select from '@/components/Select/Select';
import { ROLES, type Rol } from '@/types/roles';
import type { IUsuario, IUsuarioInput } from '@/interfaces/IUsuario';

interface UsuarioFormProps {
  inicial?: IUsuario; // presente → modo edición (password opcional)
  onGuardar: (datos: IUsuarioInput) => Promise<void>;
  onCancelar: () => void;
}

// Opciones del Select de rol (ROLES viene de types/index.ts).
const OPCIONES_ROL = ROLES.map((r) => ({
  valor: r,
  texto: r === 'Admin' ? 'Administrador' : r === 'Tecnico' ? 'Técnico' : 'Recepción',
}));

export default function UsuarioForm({ inicial, onGuardar, onCancelar }: UsuarioFormProps) {
  const esEdicion = inicial !== undefined;

  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [email, setEmail] = useState(inicial?.email ?? '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>(inicial?.rol ?? 'Tecnico');
  const [activo, setActivo] = useState(inicial?.activo ?? true);

  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // ---------- validación ----------
    if (!nombre.trim()) {
      setErrorLocal('El nombre es obligatorio.');
      return;
    }
    // Chequeo básico de formato (el backend solo exige que venga).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorLocal('Ingresá un email válido.');
      return;
    }
    if (!esEdicion && !password) {
      setErrorLocal('La contraseña es obligatoria al crear.');
      return;
    }
    if (esEdicion && password && password.length < 6) {
      setErrorLocal('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setErrorLocal(null);
    setErrorBackend(null);
    setEnviando(true);

    const datos: IUsuarioInput = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
      activo,
      // Solo mandamos password si hay una nueva (el resto de
      // los casos el backend la conserva tal cual).
      ...(password ? { password } : {}),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nombre *"
          valor={nombre}
          onChange={setNombre}
          placeholder="Ana García"
          disabled={enviando}
        />
        <Input
          type="email"
          label="Email *"
          valor={email}
          onChange={setEmail}
          placeholder="ana@techfix.com"
          disabled={enviando}
        />
      </div>

      <Input
        type="password"
        label={esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
        valor={password}
        onChange={setPassword}
        placeholder={esEdicion ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
        autoComplete="new-password"
        disabled={enviando}
      />

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <Select
          label="Rol *"
          valor={rol}
          onChange={(v) => setRol(v as Rol)}
          opciones={OPCIONES_ROL}
          disabled={enviando}
        />

        <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-texto-2">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            disabled={enviando}
            className="size-4 accent-[#38bdf8]"
          />
          Usuario activo (puede iniciar sesión)
        </label>
      </div>

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
          {esEdicion ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}
