'use client';

// ============================================================
// app/(publico)/restablecer/page.tsx — NUEVA CONTRASEÑA
// ------------------------------------------------------------
// El usuario llega desde el link del email:
//   /restablecer?token=<token>
//
// Flujo:
//   1. se lee el token del query string
//   2. valida en cliente (mínimo 6, claves iguales)
//   3. POST /api/auth/restablecer { token, password }
//   4. si el token venció o ya se usó → ApiError(400) con mensaje
//
// useSearchParams() obliga a envolver el formulario en <Suspense>
// (requisito de Next 16 para páginas prerenderizadas).
// ============================================================

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Wrench, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { restablecerPassword } from '@/lib/auth';

function FormularioRestablecer() {
  const parametros = useSearchParams();
  const token = parametros.get('token') ?? '';

  const [clave, setClave] = useState('');
  const [repetirClave, setRepetirClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Link incompleto o manipulado: ni siquiera mostramos el formulario.
  if (!token) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          El enlace no es válido: falta el token. Pedí uno nuevo desde
          &quot;¿Olvidaste tu contraseña?&quot;.
        </p>
        <Link href="/recuperar" className="w-full">
          <Button variante="secondary" className="w-full">
            <KeyRound className="size-4" />
            Pedir un enlace nuevo
          </Button>
        </Link>
      </div>
    );
  }

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!clave || !repetirClave) {
      setError('Completá ambos campos.');
      return;
    }
    if (clave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (clave !== repetirClave) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      const respuesta = await restablecerPassword(token, clave);
      setMensaje(respuesta);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo conectar con el servidor.'
      );
      setEnviando(false);
    }
  }

  if (mensaje) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg border border-primario/30 bg-primario/10 px-4 py-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primario" />
          <p className="text-sm text-texto">{mensaje}</p>
        </div>

        <Link href="/login" className="w-full">
          <Button className="w-full">
            <ArrowLeft className="size-4" />
            Ir al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={alEnviar} className="mt-8 flex flex-col gap-4">
      <Input
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 6 caracteres"
        valor={clave}
        onChange={setClave}
      />

      <Input
        label="Repetir contraseña"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        valor={repetirClave}
        onChange={setRepetirClave}
      />

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}

      <Button type="submit" loading={enviando} className="mt-2 w-full">
        {!enviando && <KeyRound className="size-4" />}
        Guardar contraseña
      </Button>

      <Link
        href="/login"
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-primario transition-colors hover:text-sky-300"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio de sesión
      </Link>
    </form>
  );
}

export default function RestablecerPage() {
  return (
    <div className="flex min-h-screen">
      {/* ---------- Lado izquierdo: marca ---------- */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden bg-panel p-10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(56,189,248,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.15) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primario text-fondo">
            <Wrench className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-wide">TECHFIX</span>
        </div>

        <div className="relative">
          <p className="max-w-md text-3xl font-semibold leading-tight text-texto">
            Elegí una contraseña nueva.
          </p>
          <p className="mt-4 max-w-md text-sm text-texto-2">
            El enlace sirve una sola vez. Si ya lo usaste o venció,
            podés pedir otro desde la pantalla de recuperación.
          </p>
        </div>

        <p className="relative text-xs text-texto-2">
          TechFix Manager · sistema interno
        </p>
      </div>

      {/* ---------- Lado derecho: formulario ---------- */}
      <div className="flex w-full items-center justify-center bg-fondo p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primario text-fondo">
              <Wrench className="size-5" />
            </span>
            <span className="text-lg font-bold">TECHFIX</span>
          </div>

          <h1 className="text-2xl font-semibold text-texto">
            Restablecer contraseña
          </h1>
          <p className="mt-1 text-sm text-texto-2">
            Creá una contraseña nueva para tu cuenta.
          </p>

          <Suspense
            fallback={<p className="mt-8 text-sm text-texto-2">Cargando…</p>}
          >
            <FormularioRestablecer />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
