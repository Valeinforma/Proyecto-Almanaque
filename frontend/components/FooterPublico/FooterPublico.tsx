'use client';

// ============================================================
// components/FooterPublico/FooterPublico.tsx — FOOTER LANDING
// ------------------------------------------------------------
// Cierre de la pantalla de inicio pública: CTA final para traer
// el equipo + datos de contacto + columns de links (el patrón
// de footer de los e-commerce de referencia, en versión tallar).
//
// Los datos de contacto son de ejemplo (mismo criterio que el
// seed de la DB): si el taller tiene datos reales, se cambian
// acá en un solo lugar.
// ============================================================

import Link from 'next/link';
import { Wrench, MapPin, Clock, Phone, ArrowRight } from 'lucide-react';

const CONTACTO = [
  { icono: MapPin, texto: 'Av. Siempreviva 742, San Justo' },
  { icono: Clock, texto: 'Lunes a viernes de 9 a 18 h' },
  { icono: Phone, texto: '(011) 5555-5555' },
];

export default function FooterPublico() {
  return (
    <footer id="contacto" className="scroll-mt-20 border-t border-white/5 bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        {/* ---------- CTA final ---------- */}
        <div className="rounded-2xl border border-primario/20 bg-panel p-8 text-center md:p-12">
          <h2 className="text-2xl font-semibold text-texto md:text-3xl">
            ¿No sabés si se puede reparar?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-texto-2">
            Traé tu equipo al taller y lo evaluamos sin cargo. Te
            decimos qué tiene y cuánto sale antes de empezar.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primario px-5 py-2.5 text-sm font-semibold text-fondo transition-colors hover:bg-sky-300"
          >
            Contactanos
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* ---------- Datos ---------- */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {/* Marca + descripción. */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primario text-fondo">
                <Wrench className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-wide">TECHFIX</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-texto-2">
              Taller de reparación de equipos electrónicos.
              Diagnóstico, service y repuestos con garantía.
            </p>
          </div>

          {/* Contacto. */}
          <div>
            <h3 className="text-sm font-semibold text-texto">Contacto</h3>
            <ul className="mt-4 space-y-3">
              {CONTACTO.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-center gap-2.5 text-sm text-texto-2">
                  <Icono className="size-4 shrink-0 text-primario" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          {/* Accesos rápidos. */}
          <div>
            <h3 className="text-sm font-semibold text-texto">Accesos</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="#servicios" className="text-texto-2 transition-colors hover:text-texto">
                  Servicios
                </a>
              </li>
              <li>
                <a href="#repuestos" className="text-texto-2 transition-colors hover:text-texto">
                  Repuestos en stock
                </a>
              </li>
              <li>
                <Link href="/login" className="text-texto-2 transition-colors hover:text-texto">
                  Ingresar al sistema
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ---------- Copyright ---------- */}
        <p className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-texto-2">
          © {new Date().getFullYear()} TechFix Manager. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
