'use client';

// ============================================================
// app/(publico)/registro/page.tsx — PANTALLA DE REGISTRO
// ------------------------------------------------------------
// Alta de cuenta propia (botón "Registrarse" del login), sin
// sesión previa.
//
// Flujo:
//   1. valida en cliente (campos obligatorios, claves iguales,
//      mínimo 6 caracteres — mismo criterio que el backend)
//   2. POST /api/auth/registro → el backend crea el usuario con
//      rol Recepcion (el rol NUNCA se envía desde acá) y responde
//      { id, nombre, email, rol }
//   3. registrarse() (lib/auth.ts) guarda la sesión → replace a
//      /dashboard: el usuario queda ingresado directamente
//   4. email repetido → ApiError 409 con el mensaje del backend
//
// Si alguien llega acá ya con sesión → al dashboard (igual que
// /login).
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wrench, UserPlus, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { registrarse, haySesion } from '@/lib/auth';

export default function RegistroPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [repetirClave, setRepetirClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ya con sesión → no tiene sentido registrar otra cuenta acá.
  useEffect(() => {
    if (haySesion()) router.replace('/dashboard');
  }, [router]);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // Validación en cliente (el backend también valida).
    if (!nombre.trim() || !email.trim() || !clave || !repetirClave) {
      setError('Completá todos los campos.');
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
      // El backend fija el rol (Recepcion) y devuelve la sesión.
      await registrarse(nombre.trim(), email.trim(), clave);
      // Registro OK → sesión guardada por lib/auth.ts.
      router.replace('/dashboard');
    } catch (err) {
      const mensaje =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudo conectar con el servidor.';
      setError(mensaje);
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ---------- Lado izquierdo: marca ---------- */}
      <div className="hidden lg:flex relative w-1/2 flex-col justify-between overflow-hidden bg-panel p-10">
        {/* Rejilla técnica de fondo (misma firma que el login). */}
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
            Creá tu cuenta y empezá a operar hoy mismo.
          </p>
          <p className="mt-4 max-w-md text-sm text-texto-2">
            El registro da de alta una cuenta de recepción: podés
            recibir equipos, registrar clientes y dar seguimiento a
            las órdenes del taller.
          </p>
        </div>

        <p className="relative text-xs text-texto-2">
          TechFix Manager · sistema interno
        </p>
      </div>

      {/* ---------- Lado derecho: formulario ---------- */}
      <div className="flex w-full items-center justify-center bg-fondo p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Marca chica para móvil/tablet. */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primario text-fondo">
              <Wrench className="size-5" />
            </span>
            <span className="text-lg font-bold">TECHFIX</span>
          </div>

          <h1 className="text-2xl font-semibold text-texto">Crear cuenta</h1>
          <p className="mt-1 text-sm text-texto-2">
            Completá tus datos para registrarte en el sistema.
          </p>

          <form onSubmit={alEnviar} className="mt-8 flex flex-col gap-4">
            <Input
              label="Nombre y apellido"
              type="text"
              autoComplete="name"
              placeholder="Juana Pérez"
              valor={nombre}
              onChange={setNombre}
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="juanaperez@techfix.com"
              valor={email}
              onChange={setEmail}
            />

            <Input
              label="Contraseña"
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

            {/* Mensaje de error (email tomado, validación, conexión). */}
            {error && (
              <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" loading={enviando} className="mt-2 w-full">
              {!enviando && <UserPlus className="size-4" />}
              Crear cuenta
            </Button>
          </form>

          {/* Volver al login. */}
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-primario transition-colors hover:text-sky-300"
          >
            <ArrowLeft className="size-4" />
            ¿Ya tenés cuenta? Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
