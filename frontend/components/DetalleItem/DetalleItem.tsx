'use client';

// ============================================================
// components/DetalleItem/DetalleItem.tsx
// ------------------------------------------------------------
// Modal de "Ver más información" para las tarjetas públicas
// de repuestos y servicios (landing y tienda).
//
// Recibe el item seleccionado (o null) y reutiliza el Modal
// compartido (SDD §12) para mostrar: foto grande, precio,
// la descripción completa y datos clave (disponibilidad para
// repuestos / tipo y presupuesto para servicios).
//
// El discriminante es 'stock' in item: solo IRepuestoPublico
// lo trae, así el type-narrowing de TS queda explícito.
// ============================================================

import Modal from '@/components/Modal/Modal';
import { Package, Wrench, MapPin, ArrowRight } from 'lucide-react';
import type { IRepuestoPublico, IServicioPublico } from '@/interfaces/IPublico';
import { formatearPesos } from '@/lib/formato';

type ItemDetalle = IRepuestoPublico | IServicioPublico;

interface DetalleItemProps {
  item: ItemDetalle | null;
  onCerrar: () => void;
}

export default function DetalleItem({ item, onCerrar }: DetalleItemProps) {
  if (!item) return null;

  const esRepuesto = 'stock' in item;
  const stockBajo = esRepuesto && item.stock <= 3;

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={esRepuesto ? 'Detalle del repuesto' : 'Detalle del servicio'}
    >
      {/* Foto grande del ítem (o el icono de fallback, igual
          que en la tarjeta). */}
      {item.imagenUrl ? (
        <div className="h-44 w-full overflow-hidden rounded-lg bg-panel-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL pública de Supabase Storage, fuera del optimizador de Next */}
          <img
            src={item.imagenUrl}
            alt={item.nombre}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-primario/10 text-primario">
          {esRepuesto ? <Package className="size-6" /> : <Wrench className="size-6" />}
        </span>
      )}

      {/* Nombre + precio de referencia. */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-texto">{item.nombre}</h3>
        <p className="text-lg font-semibold text-primario">
          {esRepuesto ? (
            formatearPesos(item.precio)
          ) : (
            <>
              <span className="text-xs font-normal text-texto-2">Desde </span>
              {formatearPesos(item.precio)}
            </>
          )}
        </p>
      </div>

      {/* La "pequeña descripción" completa del catálogo. */}
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-widest text-texto-2">
          Descripción
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-texto">
          {item.descripcion ?? 'Consultanos por más detalles.'}
        </p>
      </div>

      {/* Datos clave del ítem (filas reales del catálogo,
          sin inventar especificaciones). */}
      <dl className="mt-4 space-y-2 rounded-lg border border-white/5 bg-panel-2 p-4 text-sm">
        {esRepuesto ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Disponibilidad</dt>
              <dd
                className={`font-medium ${
                  stockBajo ? 'text-aviso' : 'text-texto'
                }`}
              >
                {stockBajo
                  ? `¡Quedan ${item.stock}!`
                  : `En stock · ${item.stock} unidades`}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Entrega</dt>
              <dd className="flex items-center gap-1.5 text-texto">
                <MapPin className="size-3.5 text-primario" />
                Retiro en el taller
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Tipo</dt>
              <dd className="text-texto">Servicio técnico</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-texto-2">Presupuesto</dt>
              <dd className="text-texto">Previo y sin compromiso</dd>
            </div>
          </>
        )}
      </dl>

      {/* CTA: el footer público tiene el ancla #contacto con
          dirección y teléfono (compartido por landing y tienda). */}
      <a
        href="/#contacto"
        onClick={onCerrar}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-fondo transition-opacity hover:opacity-90"
      >
        Consultar por este {esRepuesto ? 'repuesto' : 'servicio'}
        <ArrowRight className="size-4" />
      </a>
    </Modal>
  );
}
