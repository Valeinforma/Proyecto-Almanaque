// ============================================================
// app/(app)/usuarios/page.tsx — RUTA /usuarios
// ------------------------------------------------------------
// Página delgada (patrón del repo de referencia): SOLO compone
// el Provider del módulo + su vista. La lógica vive en
// components/UsuariosContext y components/UsuariosVista.
// ============================================================

import { UsuariosProvider } from '@/components/UsuariosContext/UsuariosContext';
import UsuariosVista from '@/components/UsuariosVista/UsuariosVista';

export default function UsuariosPage() {
  return (
    <UsuariosProvider>
      <UsuariosVista />
    </UsuariosProvider>
  );
}
