'use client';

// ============================================================
// app/login/page.tsx — PANTALLA DE LOGIN (ROOM_MAP §4, SDD §5)
// ------------------------------------------------------------
// Dividida en dos mitades:
//   · izquierda → marca TechFix + frase (solo decorativa)
//   · derecha   → formulario email/clave
//
// Flujo:
//   1. usuario carga credenciales → iniciarSesion() (lib/auth.ts)
//   2. POST /api/auth/login  →  { id, nombre, email, rol }
//   3. se guarda en localStorage  →  router.replace('/dashboard')
//   4. si falla (ApiError 401) → mensaje de error en la pantalla
//
// Es 'use client' porque usa estado (useRouter, useState) y
// localStorage — nada de esto existe en el servidor.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Wrench, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { iniciarSesion, haySesion } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  // Estado del formulario (controlado: React es la fuente de verdad).
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si alguien llega a /login ya con sesión → no tiene sentido
  // pedirle credencias: lo mandamos al dashboard.
  useEffect(() => {
    if (haySesion()) router.replace('/dashboard');
  }, [router]);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    // Validación rápida en cliente (el backend también valida).
    if (!email.trim() || !clave) {
      setError('Completá el email y la contraseña.');
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      await iniciarSesion(email.trim(), clave);
      // Login OK → la sesión ya quedó guardada en localStorage
      // por lib/auth.ts. replace() en vez de push(): el botón
      // "atrás" del navegador no debería volver al login.
      router.replace('/dashboard');
    } catch (err) {
      // ApiError 401 → "Credenciales incorrectas" (mensaje del backend).
      // Cualquier otro error (API caída) → mensaje genérico.
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
        {/* Rejilla técnica de fondo (decorativa). */}
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
            Organizá cada reparación desde un solo lugar.
          </p>
          <p className="mt-4 max-w-md text-sm text-texto-2">
            Clientes, equipos, órdenes de servicio y repuestos — todo el
            taller, en una sola pantalla.
          </p>
        </div>

        <p className="relative text-xs text-texto-2">
          TechFix Manager · sistema interno
        </p>
      </div>

      {/* ---------- Lado derecho: formulario ---------- */}
      <div className="flex w-full items-center justify-center bg-fondo p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Marca chica para móvil/tablet (en chico no hay panel izq.) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primario text-fondo">
              <Wrench className="size-5" />
            </span>
            <span className="text-lg font-bold">TECHFIX</span>
          </div>

          <h1 className="text-2xl font-semibold text-texto">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-texto-2">
            Ingresá con tu cuenta del taller.
          </p>

          <form onSubmit={alEnviar} className="mt-8 flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@techfix.com"
              valor={email}
              onChange={setEmail}
            />

            {/* Clave con ojo para mostrar/ocultar (ROOM_MAP §4). */}
            <div className="relative">
              <Input
                label="Contraseña"
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                valor={clave}
                onChange={setClave}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setVerClave((v) => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-2 top-[30px] cursor-pointer rounded p-1.5 text-texto-2 transition-colors hover:text-texto"
              >
                {verClave ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Mensaje de error (credenciales o conexión). */}
            {error && (
              <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" loading={enviando} className="mt-2 w-full">
              {!enviando && <LogIn className="size-4" />}
              Ingresar
            </Button>
          </form>

          <p className="mt-6 text-xs text-texto-2">
            ¿Problemas para entrar? Consulte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
