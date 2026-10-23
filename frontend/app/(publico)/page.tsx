'use client';

// ============================================================
// app/(publico)/page.tsx — PANTALLA DE INICIO "/" (pública)
// ------------------------------------------------------------
// Vitrina pública del taller, inspirada en el patrón de home de
// los e-commerce de referencia (hero → servicios → repuestos →
// contacto) pero con el contenido y el tema de TechFix.
//
// Comportamiento de la raíz:
//   · con sesión    → /dashboard (el personal no ve la vitrina)
//   · sin sesión    → esta landing, con botón "Ingresar" a /login
//
// Los datos (servicios y repuestos activos) salen de la API
// pública GET /api/publico/catalogo — no hay nada hardcodeado:
// si el taller cambia un precio o agrega un servicio, se refleja
// acá solo.
//
// Al ser 'use client' el fetch ocurre en el navegador después del
// primer render (mismo patrón que el resto de las pantallas del
// sistema).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderPublico from '@/components/HeaderPublico/HeaderPublico';
import Hero from '@/components/Hero/Hero';
import ServiciosOfrecidos from '@/components/ServiciosOfrecidos/ServiciosOfrecidos';
import RepuestosDisponibles from '@/components/RepuestosDisponibles/RepuestosDisponibles';
import FooterPublico from '@/components/FooterPublico/FooterPublico';
import Cargando from '@/components/Cargando/Cargando';
import ErrorCarga from '@/components/ErrorCarga/ErrorCarga';
import { api, ApiError } from '@/lib/api';
import { haySesion } from '@/lib/auth';
import type { ICatalogoPublico } from '@/interfaces/IPublico';

export default function InicioPage() {
  const router = useRouter();

  // Datos del catálogo público. null = todavía no cargó.
  const [catalogo, setCatalogo] = useState<ICatalogoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // GUARD: quien entra a "/" con sesión va directo al dashboard
  // (misma lógica que el guard del layout (app), aplicada en la
  // raíz para no mostrarle la vitrina al personal logueado).
  useEffect(() => {
    if (haySesion()) router.replace('/dashboard');
  }, [router]);

  // Carga del catálogo público (reutilizable para el botón
  // "Reintentar" de ErrorCarga).
  const cargarCatalogo = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.get<ICatalogoPublico>('/publico/catalogo');
      setCatalogo(datos);
    } catch (err) {
      // ApiError trae el mensaje del backend; otros errores
      // (API caída) → mensaje genérico, igual que el login.
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

  return (
    <div className="min-h-screen bg-fondo">
      <HeaderPublico />

      <main>
        <Hero />

        {/* Resultado de la carga del catálogo (servicios + repuestos). */}
        {cargando && <Cargando />}

        {!cargando && error && (
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <ErrorCarga
              mensaje="No se pudieron cargar los servicios y repuestos."
              error={error}
              onReintentar={() => void cargarCatalogo()}
            />
          </div>
        )}

        {!cargando && !error && catalogo && (
          <>
            <ServiciosOfrecidos servicios={catalogo.servicios} />
            <RepuestosDisponibles repuestos={catalogo.repuestos} />
          </>
        )}
      </main>

      <FooterPublico />
    </div>
  );
}
