// ============================================================
// lib/api.ts
// ------------------------------------------------------------
// Cliente HTTP centralizado (SDD §10).
//
// TODO pedido a la API pasa por acá para que en UN solo lugar:
//   1. se agregue la base URL (variable de entorno)
//   2. se agregue el header X-Usuario-Id (la sesión)
//   3. se parseen errores del backend { mensaje }
//   4. se redirija a /login si la sesión ya no sirve
//
// Uso desde cualquier página/componente:
//   await api.get<ICliente[]>('/clientes')
//   await api.post('/clientes', datos)
// ============================================================

// Base URL de la API .NET. En desarrollo la definimos en
// .env.local (NEXT_PUBLIC_API_URL). El prefijo NEXT_PUBLIC_
// es lo que hace que Next.js la empaquete para el navegador.
// Exportado para la pantalla de Configuración, que consulta el
// health en la RAÍZ del backend (`GET /`), fuera del prefijo /api.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5137';

// Clave donde guardamos el usuario en localStorage.
// (Se define acá porque api.ts necesita leerla para el header,
// y auth.ts la importa desde acá para escribirla → sin bucles.)
export const CLAVE_SESION = 'techfix_sesion';

// Error tipado de la API: siempre sabemos el status HTTP y el
// mensaje "amigable" que devuelve el backend ({ mensaje }).
export class ApiError extends Error {
  status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Lee el id de la sesión actual.
// - En el navegador: lee localStorage.
// - En el servidor (SSR/prerender): devuelve null, porque
//   localStorage no existe allá y no hay sesión que leer.
export function obtenerIdSesion(): number | null {
  if (typeof window === 'undefined') return null;

  const crudo = window.localStorage.getItem(CLAVE_SESION);
  if (!crudo) return null;

  try {
    const sesion = JSON.parse(crudo) as { id?: number };
    return typeof sesion.id === 'number' ? sesion.id : null;
  } catch {
    // JSON corrupto → tratamos como "sin sesión".
    return null;
  }
}

// Guarda la sesión completa (la usa lib/auth.ts tras el login).
// y avisa a los componentes suscriptores (useSesion en lib/auth.ts).
export function guardarSesion(sesion: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  notificarSesion();
}

// Borra la sesión (logout o 401) y avisa a los suscriptores.
export function borrarSesion(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CLAVE_SESION);
  notificarSesion();
}

// Emite un evento DOM propio para que useSyncExternalStore sepa
// que localStorage cambió. (El evento nativo 'storage' solo salta
// en OTRAS pestañas; los cambios de esta pestaña no lo disparan.)
// typeof defensivo: en Node (smoke test) no existe dispatchEvent.
function notificarSesion(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(CLAVE_SESION));
  }
}

// Función interna que hace el fetch real.
// `cuerpo` undefined → GET/DELETE sin body.
async function apiFetch<T>(
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
  ruta: string,
  cuerpo?: unknown
): Promise<T> {
  const usuarioId = obtenerIdSesion();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Header de autenticación de TODO el sistema.
  // En el login todavía no hay sesión → se manda sin header
  // (ese endpoint es [AllowAnonymous]).
  if (usuarioId !== null) {
    headers['X-Usuario-Id'] = String(usuarioId);
  }

  const respuesta = await fetch(`${API_URL}/api${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });

  // 204 No Content (ej: DELETE exitoso) → no hay JSON que leer.
  if (respuesta.status === 204) {
    return undefined as T;
  }

  // Intentamos leer el body: el backend siempre responde JSON
  // ({ mensaje } en errores, datos en éxito).
  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    // El backend manda { mensaje: "..." } en errores de negocio
    // (validaciones, 400 de transición, 404, 403 de rol…).
    const mensajeBackend =
      datos && typeof datos === 'object' && 'mensaje' in datos
        ? String((datos as { mensaje: unknown }).mensaje)
        : `Error HTTP ${respuesta.status}`;

    // 401 = la sesión ya no sirve (id inexistente/inactivo).
    // Acá solo BORRAMOS la sesión y lanzamos el error; la
    // redirección a /login la hace el guard del layout (Parte 1)
    // con router.replace(), que es la forma correcta en Next.js.
    // (El login manda 401 con credenciales malas: ese caso lo
    // maneja la pantalla de login con su propio mensaje.)
    if (respuesta.status === 401 && ruta !== '/auth/login') {
      borrarSesion();
    }

    throw new ApiError(respuesta.status, mensajeBackend);
  }

  return datos as T;
}

// API pública con la forma que pide el SDD §10:
//   api.get('/clientes') · api.post('/clientes', data) · ...
export const api = {
  get: <T>(ruta: string) => apiFetch<T>('GET', ruta),
  post: <T>(ruta: string, cuerpo: unknown) => apiFetch<T>('POST', ruta, cuerpo),
  put: <T>(ruta: string, cuerpo: unknown) => apiFetch<T>('PUT', ruta, cuerpo),
  delete: <T>(ruta: string) => apiFetch<T>('DELETE', ruta),
};

// ---------- subida de imágenes (Supabase Storage vía backend) ----------
// POST /api/archivo/imagen?carpeta=repuestos|servicios (multipart).
// El backend sube al bucket con la service key y devuelve { url };
// acá solo devolvemos la URL pública. Mismas reglas que apiFetch:
// header X-Usuario-Id, errores { mensaje } → ApiError, 401 → borrar sesión.
export type CarpetaImagen = 'repuestos' | 'servicios';

export async function subirImagen(carpeta: CarpetaImagen, archivo: File): Promise<string> {
  const usuarioId = obtenerIdSesion();

  const formData = new FormData();
  formData.append('archivo', archivo);

  // Sin Content-Type manual: el browser pone el boundary del multipart.
  const headers: Record<string, string> = {};
  if (usuarioId !== null) {
    headers['X-Usuario-Id'] = String(usuarioId);
  }

  const respuesta = await fetch(
    `${API_URL}/api/archivo/imagen?carpeta=${encodeURIComponent(carpeta)}`,
    { method: 'POST', headers, body: formData }
  );

  let datos: unknown = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    const mensajeBackend =
      datos && typeof datos === 'object' && 'mensaje' in datos
        ? String((datos as { mensaje: unknown }).mensaje)
        : `Error HTTP ${respuesta.status}`;

    if (respuesta.status === 401) borrarSesion();
    throw new ApiError(respuesta.status, mensajeBackend);
  }

  const url = (datos as { url?: unknown } | null)?.url;
  if (typeof url !== 'string') {
    throw new ApiError(500, 'La API no devolvió la URL de la imagen.');
  }
  return url;
}
