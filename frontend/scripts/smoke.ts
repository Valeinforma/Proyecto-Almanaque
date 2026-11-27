// ============================================================
// scripts/smoke.ts
// ------------------------------------------------------------
// Prueba rápida de la capa de datos del frontend contra la API
// REAL que está corriendo en localhost:5137.
//
// Ejecutar (con la API arriba):
//   npx tsx scripts/smoke.ts
//
// Qué valida:
//   1. login correcto con el código real de lib/auth.ts
//   2. login con password malo → ApiError 401
//   3. GET /clientes con header X-Usuario-Id automático
//   4. petición sin sesión → según Auth:Habilitada:
//        · false (default, API abierta) → 200 como admin sintético
//        · true  (API cerrada)          → ApiError 401
// ============================================================

// --- Stub de navegador ANTES de importar lib/ (se importan
// dinámicamente abajo por eso: en Node no existen window ni
// localStorage, y auth.ts/api.ts los usan).
const almacen = new Map<string, string>();

(globalThis as Record<string, unknown>).window = globalThis;
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => almacen.get(k) ?? null,
  setItem: (k: string, v: string) => void almacen.set(k, v),
  removeItem: (k: string) => void almacen.delete(k),
};

let fallos = 0;

// tsx NO carga .env.local (eso lo hace Next). Sin esta variable,
// lib/api.ts usa rutas relativas y fetch falla en Node con
// "Failed to parse URL". Usamos el mismo fallback que el proxy:
// la API local en 5137. Se define ANTES de importar lib/ porque
// API_URL se calcula al evaluar el módulo.
process.env.NEXT_PUBLIC_API_URL ??= 'http://localhost:5137';

function check(nombre: string, ok: boolean, detalle?: string): void {
  console.log(`${ok ? 'OK  ' : 'FAIL'} - ${nombre}${detalle ? ` (${detalle})` : ''}`);
  if (!ok) fallos++;
}

async function main(): Promise<void> {
  const { iniciarSesion, cerrarSesion, obtenerSesion } = await import('../lib/auth');
  const { api, ApiError } = await import('../lib/api');

  // 1. Login correcto
  const sesion = await iniciarSesion('admin@techfix.com', 'admin123');
  check('login admin 200', sesion.id === 1 && sesion.rol === 'Admin', `id=${sesion.id} rol=${sesion.rol}`);
  check('sesion guardada en localStorage', obtenerSesion()?.email === 'admin@techfix.com');

  // 2. Password malo
  try {
    await iniciarSesion('admin@techfix.com', 'cualquiera');
    check('login password malo 401', false, 'no lanzó');
  } catch (e) {
    check('login password malo 401', e instanceof ApiError && e.status === 401, (e as Error).message);
  }

  // 3. GET con header automático
  const clientes = await api.get<Array<{ id: number }>>('/clientes');
  check('GET /clientes con header', Array.isArray(clientes) && clientes.length === 5, `n=${clientes.length}`);

  // 4. Sin sesión → comporta según Auth:Habilitada (ver cabecera)
  cerrarSesion();
  try {
    const sinSesion = await api.get<Array<{ id: number }>>('/clientes');
    // API abierta (Auth:Habilitada=false): 200 con datos de admin sintético
    check('GET sin sesión 200 (API abierta)', Array.isArray(sinSesion),
      `n=${sinSesion.length}`);
  } catch (e) {
    // API cerrada (Auth:Habilitada=true): debe ser 401
    check('GET sin sesión 401 (API cerrada)', e instanceof ApiError && e.status === 401, (e as Error).message);
  }

  console.log(`\nRESULTADO: fallos=${fallos}`);
  process.exitCode = fallos;
}

main().catch((e) => {
  console.error('ERROR inesperado:', e);
  process.exitCode = 1;
});
