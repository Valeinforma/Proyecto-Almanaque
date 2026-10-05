// ============================================================
// lib/configuracion.ts — CONFIGURACIÓN LOCAL DEL NAVEGADOR
// ------------------------------------------------------------
// Datos del taller (nombre, teléfono, email, dirección) que el
// backend todavía NO persiste: no existe endpoint para esto.
// Se guardan en `localStorage` de ESTE navegador.
//
// Ojo con el alcance:
//   · Sirve para mostrar/llenar datos en la UI (y más adelante
//     para un reporte o comprobante).
//   · NO es información compartida: cada navegador tiene la suya.
// Cuando el backend tenga un endpoint de configuración, este
// módulo es el único archivo que hay que tocar.
// ============================================================

export interface ConfigTaller {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
}

const CLAVE = 'techfix_config_taller';

export const CONFIG_VACIA: ConfigTaller = {
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
};

// Lectura tolerante: si algo falla (JSON roto, modo privado…)
// devolvemos la config vacía en vez de romper la pantalla.
export function obtenerConfigTaller(): ConfigTaller {
  if (typeof localStorage === 'undefined') return CONFIG_VACIA;
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return CONFIG_VACIA;
    return { ...CONFIG_VACIA, ...(JSON.parse(crudo) as Partial<ConfigTaller>) };
  } catch {
    return CONFIG_VACIA;
  }
}

export function guardarConfigTaller(config: ConfigTaller): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(config));
  } catch {
    // localStorage lleno o bloqueado: la UI igual muestra el
    // valor en memoria, solo que no sobrevive al refresco.
  }
}
