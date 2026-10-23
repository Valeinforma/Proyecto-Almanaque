'use client';

// ============================================================
// components/ServiciosOfrecidos/ServiciosOfrecidos.tsx
// ------------------------------------------------------------
// Sección "Lo que hacemos" de la landing: grilla de servicios
// que devuelve GET /api/publico/catalogo (solo activos).
//
// Cada servicio muestra un icono elegido por palabras clave del
// nombre (la API no trae icono): si ninguno coincide se usa uno
// por defecto, así agregar un servicio nuevo nunca rompe nada.
// ============================================================

import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Search,
  Smartphone,
  BatteryCharging,
  PlugZap,
  MonitorDown,
  HardDrive,
  Fan,
  Cpu,
  Keyboard,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import type { IServicioPublico } from '@/interfaces/IPublico';
import { formatearPesos } from '@/lib/formato';
import DetalleItem from '@/components/DetalleItem/DetalleItem';

// Palabras clave → icono. Se recorren en orden; la primera que
// matchee (sobre nombre + descripción) gana.
const ICONOS: Array<{ palabras: string[]; icono: LucideIcon }> = [
  { palabras: ['diagnóstico', 'diagnostico', 'revisión', 'revision'], icono: Search },
  { palabras: ['pantalla'], icono: Smartphone },
  { palabras: ['batería', 'bateria'], icono: BatteryCharging },
  { palabras: ['carga', 'flex', 'conector'], icono: PlugZap },
  { palabras: ['software', 'formateo', 'sistema operativo', 'firmware'], icono: MonitorDown },
  { palabras: ['datos', 'respaldo'], icono: HardDrive },
  { palabras: ['limpieza', 'polvo', 'pasta térmica', 'termica'], icono: Fan },
  { palabras: ['placa', 'madre', 'componentes'], icono: Cpu },
  { palabras: ['teclado'], icono: Keyboard },
];

function iconoDe(servicio: IServicioPublico): LucideIcon {
  const texto = `${servicio.nombre} ${servicio.descripcion ?? ''}`.toLowerCase();
  return ICONOS.find((entrada) =>
    entrada.palabras.some((palabra) => texto.includes(palabra))
  )?.icono ?? Wrench;
}

interface ServiciosOfrecidosProps {
  servicios: IServicioPublico[];
}

export default function ServiciosOfrecidos({ servicios }: ServiciosOfrecidosProps) {
  // Servicio seleccionado para ver en el modal de detalle
  // ("Ver más información"); null = modal cerrado.
  const [seleccionado, setSeleccionado] = useState<IServicioPublico | null>(null);

  return (
    <section id="servicios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6">
      {/* Encabezado de sección (patrón de los e-commerce). */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primario">
            Lo que hacemos
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-texto md:text-3xl">
            Servicios que ofrecemos
          </h2>
        </div>
        <p className="max-w-sm text-sm text-texto-2">
          Presupuesto previo y sin compromiso. Traé tu equipo y lo
          evaluamos.
        </p>
      </div>

      {/* Grilla de servicios. */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servicios.map((servicio) => {
          const Icono = iconoDe(servicio);
          return (
            <article
              key={servicio.id}
              className="group rounded-xl border border-white/5 bg-panel p-5 transition-colors hover:border-primario/40"
            >
              {/* Foto del servicio (si se subió al storage) o el
                  icono por palabras clave (fallback original). */}
              {servicio.imagenUrl ? (
                <div className="h-24 w-full overflow-hidden rounded-lg bg-panel-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL pública de Supabase Storage, fuera del optimizador de Next */}
                  <img
                    src={servicio.imagenUrl}
                    alt={servicio.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <span className="flex size-10 items-center justify-center rounded-lg bg-primario/10 text-primario transition-colors group-hover:bg-primario group-hover:text-fondo">
                  <Icono className="size-5" />
                </span>
              )}

              <h3 className="mt-4 font-semibold text-texto">{servicio.nombre}</h3>

              {servicio.descripcion && (
                <p className="mt-1 text-sm text-texto-2">{servicio.descripcion}</p>
              )}

              <p className="mt-4 text-sm">
                <span className="text-xs text-texto-2">Desde </span>
                <span className="font-semibold text-primario">
                  {formatearPesos(servicio.precio)}
                </span>
              </p>

              {/* Botón "Ver más información" → modal con la
                  descripción completa y los datos del ítem. */}
              <button
                type="button"
                onClick={() => setSeleccionado(servicio)}
                className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-primario transition-colors hover:border-primario/50 hover:bg-primario/10 cursor-pointer"
              >
                Ver más información
                <ArrowRight className="size-3.5" />
              </button>
            </article>
          );
        })}
      </div>

      {/* Modal de detalle del servicio elegido. */}
      <DetalleItem item={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </section>
  );
}
