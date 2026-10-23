'use client';

// ============================================================
// components/RepuestosDisponibles/RepuestosDisponibles.tsx
// ------------------------------------------------------------
// Sección "Repuestos" de la landing: tarjetas estilo producto
// (el patrón "card de e-commerce" adaptado a nuestro tema).
//
// Muestra los repuestos con stock que devuelve
// GET /api/publico/catalogo. El badge de urgencia ("¡Quedan N!")
// replica el recurso visual de las tiendas de referencia, y el
// stock bajo (≤3) se marca en aviso para dar sensación real.
// ============================================================

import { useState } from 'react';
import { Package, MapPin, ArrowRight } from 'lucide-react';
import type { IRepuestoPublico } from '@/interfaces/IPublico';
import { formatearPesos } from '@/lib/formato';
import DetalleItem from '@/components/DetalleItem/DetalleItem';

interface RepuestosDisponiblesProps {
  repuestos: IRepuestoPublico[];
}

export default function RepuestosDisponibles({ repuestos }: RepuestosDisponiblesProps) {
  // Repuesto seleccionado para ver en el modal de detalle
  // ("Ver más información"); null = modal cerrado.
  const [seleccionado, setSeleccionado] = useState<IRepuestoPublico | null>(null);

  return (
    <section id="repuestos" className="scroll-mt-20 bg-panel/50 py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Encabezado de sección. */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primario">
              Disponibilidad real
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-texto md:text-3xl">
              Repuestos en stock
            </h2>
          </div>
          <p className="max-w-sm text-sm text-texto-2">
            Piezas originales y equivalentes certificadas. Consultá por
            tu modelo.
          </p>
        </div>

        {/* Grilla de productos. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {repuestos.map((repuesto) => {
            // Stock bajo → badge en aviso; si no, badge primario.
            const stockBajo = repuesto.stock <= 3;
            return (
              <article
                key={repuesto.id}
                className="group flex flex-col rounded-xl border border-white/5 bg-panel transition-colors hover:border-primario/40"
              >
                {/* Miniatura: si el repuesto tiene foto subida al
                    storage, la mostramos; si no, el panel decorativo
                    con el icono del recurso (fallback original). */}
                <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-t-xl bg-panel-2">
                  {repuesto.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL pública de Supabase Storage, fuera del optimizador de Next
                    <img
                      src={repuesto.imagenUrl}
                      alt={repuesto.nombre}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex size-12 items-center justify-center rounded-full bg-primario/10 text-primario transition-colors group-hover:bg-primario group-hover:text-fondo">
                      <Package className="size-6" />
                    </span>
                  )}

                  {/* Badge de stock (estilo "¡Quedan N!"). */}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      stockBajo
                        ? 'bg-aviso/15 text-aviso'
                        : 'bg-primario/15 text-primario'
                    }`}
                  >
                    ¡Quedan {repuesto.stock}!
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold leading-snug text-texto">
                    {repuesto.nombre}
                  </h3>

                  {repuesto.descripcion && (
                    <p className="mt-1 text-xs text-texto-2">
                      {repuesto.descripcion}
                    </p>
                  )}

                  <p className="mt-3 text-lg font-semibold text-texto">
                    {formatearPesos(repuesto.precio)}
                  </p>

                  {/* Botón "Ver más información" → modal con la
                      descripción completa y los datos del ítem. */}
                  <button
                    type="button"
                    onClick={() => setSeleccionado(repuesto)}
                    className="mt-3 flex items-center gap-1.5 self-start rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-primario transition-colors hover:border-primario/50 hover:bg-primario/10 cursor-pointer"
                  >
                    Ver más información
                    <ArrowRight className="size-3.5" />
                  </button>

                  {/* Pie de tarjeta: retiro. */}
                  <p className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-texto-2">
                    <MapPin className="size-3.5" />
                    Retiro en el taller
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Nota al pie de la sección. */}
        {repuestos.length === 0 && (
          <p className="mt-10 rounded-xl border border-white/5 bg-panel p-8 text-center text-sm text-texto-2">
            Por el momento no hay repuestos en stock. Consultanos por tu
            modelo y lo conseguimos.
          </p>
        )}
      </div>

      {/* Modal de detalle del repuesto elegido. */}
      <DetalleItem item={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </section>
  );
}
