// ============================================================
// app/(app)/ordenes/page.tsx — RUTA /ordenes
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO compone
// el Provider del módulo + su vista. La lógica vive en
// components/OrdenesContext y components/OrdenesVista.
// ============================================================

import { OrdenesProvider } from '@/components/OrdenesContext/OrdenesContext';
import OrdenesVista from '@/components/OrdenesVista/OrdenesVista';

export default function OrdenesPage() {
  return (
    <OrdenesProvider>
      <OrdenesVista />
    </OrdenesProvider>
  );
}
