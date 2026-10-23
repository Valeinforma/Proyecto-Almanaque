'use client';

// ============================================================
// components/Hero/Hero.tsx — BANNER PRINCIPAL DE LA LANDING
// ------------------------------------------------------------
// Zona de entrada de la pantalla de inicio pública, inspirada en
// el patrón de hero de los e-commerce de referencia pero con la
// identidad TechFix: fondo oscuro, rejilla técnica (la misma
// firma visual que usa el login) y acento celeste.
//
// Estructura:
//   · titular + bajada + CTA ("Ver servicios" ancla a #servicios)
//   · franja de beneficios (los "sellos de confianza" del taller)
// ============================================================

import { ArrowDown, Stethoscope, ShieldCheck, Handshake } from 'lucide-react';

// Sellos de confianza de la franja inferior.
const BENEFICIOS = [
  {
    icono: Stethoscope,
    titulo: 'Diagnóstico sin cargo',
    detalle: 'Te decimos qué tiene antes de tocar nada.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Garantía de 30 días',
    detalle: 'Sobre cada reparación que realizamos.',
  },
  {
    icono: Handshake,
    titulo: 'Atención personalizada',
    detalle: 'Seguí tu orden desde que entra al taller.',
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-panel">
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

      {/* Resplandor celeste detrás del titular. */}
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-primario/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center md:px-6 md:py-28">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-primario/30 bg-primario/10 px-3 py-1 text-xs font-medium text-primario">
          Taller técnico · Reparación y repuestos
        </p>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-tight text-texto md:text-5xl">
          Tecnología que{' '}
          <span className="text-primario">vuelve a funcionar</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-texto-2 md:text-base">
          Reparamos notebooks, celulares y tabletas con diagnóstico
          honesto y repuestos de calidad. Mirá lo que ofrecemos antes de
          traer tu equipo.
        </p>

        {/* CTA principal: baja a la sección de servicios. */}
        <a
          href="#servicios"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primario px-5 py-2.5 text-sm font-semibold text-fondo transition-colors hover:bg-sky-300"
        >
          Ver servicios
          <ArrowDown className="size-4" />
        </a>

        {/* Franja de beneficios. */}
        <dl className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-3">
          {BENEFICIOS.map(({ icono: Icono, titulo, detalle }) => (
            <div
              key={titulo}
              className="rounded-xl border border-white/5 bg-fondo/60 p-4 text-center"
            >
              <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-primario/10 text-primario">
                <Icono className="size-5" />
              </span>
              <dt className="mt-3 text-sm font-semibold text-texto">{titulo}</dt>
              <dd className="mt-1 text-xs text-texto-2">{detalle}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
