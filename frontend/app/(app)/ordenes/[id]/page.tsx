'use client';

// ============================================================
// app/(app)/ordenes/[id]/page.tsx — RUTA /ordenes/{id}
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO toma el
// id de la ruta y compone el Provider del detalle + su vista.
// La lógica vive en components/OrdenDetalleContext,
// components/OrdenDetalleVista y hooks/useOrdenDetalleApi.
// ============================================================

import { useParams } from 'next/navigation';
import { OrdenDetalleProvider } from '@/components/OrdenDetalleContext/OrdenDetalleContext';
import OrdenDetalleVista from '@/components/OrdenDetalleVista/OrdenDetalleVista';

export default function OrdenDetallePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  return (
    <OrdenDetalleProvider id={id}>
      <OrdenDetalleVista />
    </OrdenDetalleProvider>
  );
}
