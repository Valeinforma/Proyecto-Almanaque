// ============================================================
// app/(app)/servicios/page.tsx — RUTA /servicios
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO compone
// el Provider del módulo + su vista. La lógica vive en
// components/ServiciosContext y components/ServiciosVista.
// ============================================================

import { ServiciosProvider } from '@/components/ServiciosContext/ServiciosContext';
import ServiciosVista from '@/components/ServiciosVista/ServiciosVista';

export default function ServiciosPage() {
  return (
    <ServiciosProvider>
      <ServiciosVista />
    </ServiciosProvider>
  );
}
