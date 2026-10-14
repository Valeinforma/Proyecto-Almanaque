// ============================================================
// app/(app)/equipos/page.tsx — RUTA /equipos
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO compone
// el Provider del módulo + su vista. La lógica vive en
// components/EquiposContext y components/EquiposVista.
// ============================================================

import { EquiposProvider } from '@/components/EquiposContext/EquiposContext';
import EquiposVista from '@/components/EquiposVista/EquiposVista';

export default function EquiposPage() {
  return (
    <EquiposProvider>
      <EquiposVista />
    </EquiposProvider>
  );
}
