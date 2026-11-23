'use client';

// ============================================================
// app/(publico)/recuperar/page.tsx — "OLVIDÉ MI CONTRASEÑA"
// ------------------------------------------------------------
// Flujo:
//   1. el usuario carga el email de su cuenta
//   2. POST /api/auth/recuperar → el backend genera un token de
//      un solo uso (1 h) y manda el link por email (Resend)
//   3. la respuesta es SIEMPRE genérica: no se revela si el email
//      existe o no
//
// Si el backend no tiene Email:ApiKey (desarrollo), el link queda
// en el log del backend en vez de enviarse.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { Wrench, MailCheck, Send, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { solicitarRecuperacion } from '@/lib/auth';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!email.trim()) {
      setError('Ingresá el email de tu cuenta.');
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      const respuesta = await solicitarRecuperacion(email.trim());
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
            Recuperá el acceso a tu cuenta.
          </p>
          <p className="mt-4 max-w-md text-sm text-texto-2">
            Te enviamos un enlace seguro por email. Vence en una hora y
            solo se puede usar una vez.
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
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-1 text-sm text-texto-2">
            Ingresá tu email y te mandamos un enlace para crear una nueva.
          </p>

          {mensaje ? (
            // Respuesta genérica del backend (exista o no la cuenta).
            <div className="mt-8 flex flex-col gap-4">
              <div className="flex items-start gap-3 rounded-lg border border-primario/30 bg-primario/10 px-4 py-3">
                <MailCheck className="mt-0.5 size-5 shrink-0 text-primario" />
                <p className="text-sm text-texto">{mensaje}</p>
              </div>

              <p className="text-xs text-texto-2">
                Revisá también la carpeta de spam. Si no llega en unos
                minutos, volvé a intentarlo.
              </p>

              <Link href="/login" className="w-full">
                <Button variante="secondary" className="w-full">
                  <ArrowLeft className="size-4" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={alEnviar} className="mt-8 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="admin@techfix.com"
                valor={email}
                onChange={setEmail}
              />

              {error && (
                <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                loading={enviando}
                className="mt-2 w-full"
              >
                {!enviando && <Send className="size-4" />}
                Enviar enlace
              </Button>

              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primario transition-colors hover:text-sky-300"
              >
                <ArrowLeft className="size-4" />
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
