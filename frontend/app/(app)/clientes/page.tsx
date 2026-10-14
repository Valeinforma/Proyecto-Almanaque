// ============================================================
// app/(app)/clientes/page.tsx — RUTA /clientes
// ------------------------------------------------------------
// Página delgada (patrón AppClientes del repo de referencia):
// SOLO compone el Provider del módulo + su vista. Toda la
// lógica (fetch, búsqueda, modales, CRUD) vive en
// components/ClientesContext (estado) y components/ClientesVista
// (UI).
//
// Es Server Component: los hijos client se encargan del resto.
// ============================================================

import { ClientesProvider } from '@/components/ClientesContext/ClientesContext';
import ClientesVista from '@/components/ClientesVista/ClientesVista';

export default function ClientesPage() {
  return (
    <ClientesProvider>
      <ClientesVista />
    </ClientesProvider>
  );
}
