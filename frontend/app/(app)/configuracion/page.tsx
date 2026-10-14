'use client';

// ============================================================
// app/(app)/configuracion/page.tsx — CONFIGURACIÓN (Parte 8)
// (ROOM_MAP §3: menú /configuracion)
// ------------------------------------------------------------
// Tres bloques, con alcances HONESTOS sobre lo que el backend
// sí y no soporta hoy:
//
// 1. DATOS DEL TALLER — el backend NO tiene endpoint para
//    esto; se guardan en localStorage de este navegador
//    (lib/configuracion.ts). Cuando exista el endpoint, solo
//    hay que tocar ese módulo.
//
// 2. MI CONTRASEÑA — la API no tiene
//    "cambiar mi contraseña". Sí permite que un ADMIN cambie
//    la suya con PUT /usuarios/{id} (el mismo módulo de la
//    Parte 7). Los demás roles ven el aviso de que solo un
//    Administrador puede hacerlo desde Usuarios.
//
// 3. SISTEMA — ping al health del backend (GET /, en la raíz,
//    NO bajo /api), datos de la sesión y del stack.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Building, KeyRound, Server, RefreshCw } from 'lucide-react';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import useUsuariosApi from '@/hooks/useUsuariosApi';
import { API_URL } from '@/lib/api';
import { tieneRol, useSesion } from '@/lib/auth';
import { CONFIG_VACIA, guardarConfigTaller, obtenerConfigTaller } from '@/lib/configuracion';
import type { ConfigTaller } from '@/lib/configuracion';

// Estado del health check del backend.
type EstadoApi = 'probando' | 'ok' | 'error';

export default function ConfiguracionPage() {
  const sesion = useSesion();
  const esAdmin = tieneRol('Admin');

  // El PUT de contraseña va por el hook (sin cargar el listado):
  // la página no necesita GET /usuarios.
  const { editarUsuario } = useUsuariosApi({ autoCargar: false });

  // ========================================================
  // 1) Datos del taller (localStorage)
  // ========================================================
  const [taller, setTaller] = useState<ConfigTaller>(CONFIG_VACIA);
  const [tallerGuardado, setTallerGuardado] = useState(false);

  // Carga inicial: como el linter prohíbe setState DIRECTO en el
  // cuerpo del effect (Parte 5), lo metemos en un .then().
  useEffect(() => {
    Promise.resolve(obtenerConfigTaller()).then((config) => {
      setTaller(config);
    });
  }, []);

  const cambiarTaller =
    (campo: keyof ConfigTaller) => (valor: string) => {
      setTaller((c) => ({ ...c, [campo]: valor }));
      setTallerGuardado(false); // cualquier cambio invalida el ✓
    };

  function guardarTaller(e: React.FormEvent) {
    e.preventDefault();
    guardarConfigTaller(taller);
    setTallerGuardado(true); // setState en handler: permitido
  }

  // ========================================================
  // 2) Mi contraseña
  // ========================================================
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passOk, setPassOk] = useState(false);
  const [passEnviando, setPassEnviando] = useState(false);

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    if (passEnviando || !sesion) return;

    // ---------- validación ----------
    if (nueva.length < 6) {
      setPassError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nueva !== repetir) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }

    setPassError(null);
    setPassOk(false);
    setPassEnviando(true);

    try {
      // PUT /usuarios/{id} es de REEMPLAZO total: manda todos
      // los campos (tomamos nombre/email/rol de la sesión;
      // activo=true porque para iniciar sesión hay que estarlo).
      // El backend solo hashea `password` si viene no vacía.
      await editarUsuario(sesion.id, {
        nombre: sesion.nombre,
        email: sesion.email,
        rol: sesion.rol,
        activo: true,
        password: nueva,
      });
      setPassOk(true);
      setNueva('');
      setRepetir('');
    } catch (err) {
      setPassError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setPassEnviando(false);
    }
  }

  // ========================================================
  // 3) Sistema: ping al health + sesión + stack
  // ========================================================
  const [estadoApi, setEstadoApi] = useState<EstadoApi>('probando');
  const [servicioApi, setServicioApi] = useState<string | null>(null);

  // El health vive en la RAÍZ del backend (Program.cs:
  // MapGet("/")), por eso usamos fetch directo con API_URL y
  // no api.get (que siempre pone /api por delante).
  // OJO: NO tocamos estado en el cuerpo de esta función —
  // el effect la llama y el linter (react-hooks/set-state-in-effect)
  // rastrearía el setState. Los .then() sí están permitidos.
  const verificarApi = useCallback(() => {
    fetch(`${API_URL}/`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ servicio: string; estado: string }>;
      })
      .then((datos) => {
        setServicioApi(datos.servicio);
        setEstadoApi(datos.estado === 'OK' ? 'ok' : 'error');
      })
      .catch(() => {
        setServicioApi(null);
        setEstadoApi('error');
      });
  }, []);

  useEffect(() => {
    verificarApi();
  }, [verificarApi]);

  // Re-verificar desde el botón (handler de evento: setState
  // directo permitido) — vuelve a la animación de "probando".
  function reverificar() {
    setEstadoApi('probando');
    verificarApi();
  }

  // ========================================================
  // Render
  // ========================================================
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-lg font-semibold text-texto">Configuración</h1>
      <p className="mb-5 text-sm text-texto-2">
        Preferencias del sistema y datos de la instancia.
      </p>

      {/* ---------- 1) Datos del taller ---------- */}
      <section className="rounded-xl border border-white/10 bg-panel p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-texto">
          <Building className="size-4 text-primario" />
          Datos del taller
        </h2>
        <p className="mb-4 text-xs text-texto-2">
          Se guardan en <strong className="text-texto">este navegador</strong>{' '}
          (el backend todavía no expone endpoint de configuración).
        </p>

        <form onSubmit={guardarTaller} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre del taller"
              valor={taller.nombre}
              onChange={cambiarTaller('nombre')}
              placeholder="TechFix Manager"
            />
            <Input
              label="Teléfono"
              valor={taller.telefono}
              onChange={cambiarTaller('telefono')}
              placeholder="+54 11 5555-5555"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="email"
              label="Email de contacto"
              valor={taller.email}
              onChange={cambiarTaller('email')}
              placeholder="contacto@techfix.com"
            />
            <Input
              label="Dirección"
              valor={taller.direccion}
              onChange={cambiarTaller('direccion')}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            {tallerGuardado && (
              <span className="text-xs text-exito">Guardado ✓</span>
            )}
            <Button type="submit">Guardar datos</Button>
          </div>
        </form>
      </section>

      {/* ---------- 2) Mi contraseña ---------- */}
      <section className="mt-4 rounded-xl border border-white/10 bg-panel p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-texto">
          <KeyRound className="size-4 text-primario" />
          Cambiar mi contraseña
        </h2>

        {esAdmin ? (
          <>
            <p className="mb-4 text-xs text-texto-2">
              Como Administrador podés reemplazar la contraseña de tu propio
              usuario (la API lo permite con{' '}
              <span className="font-mono">PUT /usuarios/&#123;id&#125;</span>).
            </p>

            <form onSubmit={cambiarPassword} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="password"
                  label="Nueva contraseña *"
                  valor={nueva}
                  onChange={setNueva}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  disabled={passEnviando}
                />
                <Input
                  type="password"
                  label="Repetir contraseña *"
                  valor={repetir}
                  onChange={setRepetir}
                  autoComplete="new-password"
                  disabled={passEnviando}
                />
              </div>

              {passError && (
                <p className="rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                  {passError}
                </p>
              )}
              {passOk && (
                <p className="rounded-lg border border-exito/30 bg-exito/10 px-3 py-2 text-sm text-exito">
                  Contraseña actualizada. No hace falta volver a iniciar sesión.
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" loading={passEnviando}>
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          </>
        ) : (
          <p className="rounded-lg border border-aviso/30 bg-aviso/10 px-3 py-2 text-sm text-aviso">
            Tu rol ({sesion?.rol}) no puede cambiar contraseñas desde la API:
            el endpoint <span className="font-mono">PUT /usuarios/&#123;id&#125;</span>{' '}
            es solo de Administrador. Pedile a un Admin que lo haga desde
            Usuarios.
          </p>
        )}
      </section>

      {/* ---------- 3) Sistema ---------- */}
      <section className="mt-4 rounded-xl border border-white/10 bg-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-texto">
          <Server className="size-4 text-primario" />
          Sistema
        </h2>

        <div className="flex flex-col gap-3 text-sm">
          {/* Health del backend */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-texto-2">
              <span
                className={`size-2.5 rounded-full ${
                  estadoApi === 'ok'
                    ? 'bg-exito'
                    : estadoApi === 'error'
                      ? 'bg-error'
                      : 'animate-pulse bg-aviso'
                }`}
              />
              API {estadoApi === 'ok' ? 'conectada' : estadoApi === 'error' ? 'no responde' : 'verificando…'}
            </span>
            <span className="truncate text-xs text-texto-2">
              {servicioApi ?? API_URL}
            </span>
            <Button
              type="button"
              variante="ghost"
              tamano="sm"
              onClick={reverificar}
              disabled={estadoApi === 'probando'}
            >
              <RefreshCw className="size-4" />
              Verificar
            </Button>
          </div>

          {/* Sesión actual */}
          <div className="flex justify-between gap-3 border-t border-white/5 pt-3">
            <span className="text-texto-2">Sesión actual</span>
            <span className="truncate text-right text-texto">
              {sesion?.nombre} · {sesion?.rol}{' '}
              <span className="text-texto-2">({sesion?.email})</span>
            </span>
          </div>

          {/* Stack */}
          <div className="flex justify-between gap-3 border-t border-white/5 pt-3">
            <span className="text-texto-2">Stack</span>
            <span className="text-right text-texto">
              Next.js 16 · React 19 · .NET 10 · PostgreSQL 18
            </span>
          </div>

          <div className="flex justify-between gap-3 border-t border-white/5 pt-3">
            <span className="text-texto-2">Rutas del frontend</span>
            <span className="text-right text-texto">17 pantallas (Parte 1-8)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
