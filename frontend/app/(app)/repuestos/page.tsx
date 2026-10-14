// ============================================================
// app/(app)/repuestos/page.tsx — RUTA /repuestos
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO compone
// el Provider del módulo + su vista. La lógica vive en
// components/RepuestosContext y components/RepuestosVista.
// ============================================================

import { RepuestosProvider } from '@/components/RepuestosContext/RepuestosContext';
import RepuestosVista from '@/components/RepuestosVista/RepuestosVista';

export default function RepuestosPage() {
  return (
    <RepuestosProvider>
      <RepuestosVista />
    </RepuestosProvider>
  );
}
