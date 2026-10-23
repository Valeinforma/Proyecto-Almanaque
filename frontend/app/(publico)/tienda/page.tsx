'use client';

// ============================================================
// app/(publico)/tienda/page.tsx — TIENDA PÚBLICA "/tienda"
// ------------------------------------------------------------
// Catálogo completo para comprar/consultar SIN iniciar sesión
// (el botón "Ver la tienda" del login viene acá).
//
// Diferencias con la landing ("/"):
//   · la landing es la vitrina de marketing (hero + secciones)
//   · la tienda es el catálogo: filtros de búsqueda simples,
//     repuestos (productos) como protagonistas y los servicios
//     disponibles, todo sin sesión
//
// Usa el MISMO endpoint público (GET /api/publico/catalogo):
// los datos siempre son los de la DB, nunca hardcodeados.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Store, Search } from 'lucide-react';
import HeaderPublico from '@/components/HeaderPublico/HeaderPublico';
import FooterPublico from '@/components/FooterPublico/FooterPublico';
import RepuestosDisponibles from '@/components/RepuestosDisponibles/RepuestosDisponibles';
import ServiciosOfrecidos from '@/components/ServiciosOfrecidos/ServiciosOfrecidos';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import { api, ApiError } from '@/lib/api';
import type { ICatalogoPublico } from '@/interfaces/IPublico';

export default function TiendaPage() {
  const [catalogo, setCatalogo] = useState<ICatalogoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const cargarCatalogo = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.get<ICatalogoPublico>('/publico/catalogo');
      setCatalogo(datos);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarCatalogo();
  }, [cargarCatalogo]);

  // Filtro de texto sobre repuestos (nombre + descripción).
  // useMemo evita re-filtrar en cada render que no cambie la lista.
  const repuestosFiltrados = useMemo(() => {
    if (!catalogo) return [];
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return catalogo.repuestos;
    return catalogo.repuestos.filter((r) =>
      `${r.nombre} ${r.descripcion ?? ''}`.toLowerCase().includes(termino)
    );
  }, [catalogo, busqueda]);

  // Servicios también filtrables con el mismo término.
  const serviciosFiltrados = useMemo(() => {
    if (!catalogo) return [];
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return catalogo.servicios;
    return catalogo.servicios.filter((s) =>
      `${s.nombre} ${s.descripcion ?? ''}`.toLowerCase().includes(termino)
    );
  }, [catalogo, busqueda]);

  return (
    <div className="min-h-screen bg-fondo">
      <HeaderPublico />

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {/* Encabezado de la tienda. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primario text-fondo">
              <Store className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-texto">Tienda TechFix</h1>
              <p className="text-sm text-texto-2">
                Repuestos y servicios — comprá o consultá sin cuenta.
              </p>
            </div>
          </div>

          {/* Buscador (filtra productos y servicios a la vez). */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-texto-2" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto o servicio…"
              aria-label="Buscar en la tienda"
              className="w-full rounded-lg border border-white/10 bg-panel py-2 pl-9 pr-3 text-sm text-texto placeholder:text-texto-2 focus:border-primario/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Resultado de la carga. */}
        <div className="mt-6">
          {cargando && <Cargando />}

          {!cargando && error && (
            <ErrorCarga
              mensaje="No se pudo cargar la tienda."
              error={error}
              onReintentar={() => void cargarCatalogo()}
            />
          )}

          {!cargando && !error && catalogo && (
            <>
              {/* Productos primero: es una tienda.
                  · sin búsqueda → siempre se muestra (la nota de
                    "sin stock" interna aplica)
                  · con búsqueda → solo si hay coincidencias (si no,
                    mandaría "sin stock" cuando en realidad no matchea) */}
              {(repuestosFiltrados.length > 0 || !busqueda.trim()) && (
                <RepuestosDisponibles repuestos={repuestosFiltrados} />
              )}

              {serviciosFiltrados.length > 0 && (
                <div className="mt-12">
                  <ServiciosOfrecidos servicios={serviciosFiltrados} />
                </div>
              )}

              {/* Sin coincidencias para el término buscado. */}
              {busqueda.trim() &&
                repuestosFiltrados.length === 0 &&
                serviciosFiltrados.length === 0 && (
                <p className="mt-8 rounded-xl border border-white/5 bg-panel p-8 text-center text-sm text-texto-2">
                  No encontramos nada para “{busqueda.trim()}”. Probá con
                  otro término.
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <FooterPublico />
    </div>
  );
}
