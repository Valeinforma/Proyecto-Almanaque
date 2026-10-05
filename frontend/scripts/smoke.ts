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
//   4. petición sin sesión → ApiError 401
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

  // 4. Sin sesión → 401
  cerrarSesion();
  try {
    await api.get('/clientes');
    check('GET sin sesión 401', false, 'no lanzó');
  } catch (e) {
    check('GET sin sesión 401', e instanceof ApiError && e.status === 401, (e as Error).message);
  }

  console.log(`\nRESULTADO: fallos=${fallos}`);
  process.exitCode = fallos;
}

main().catch((e) => {
  console.error('ERROR inesperado:', e);
  process.exitCode = 1;
});
