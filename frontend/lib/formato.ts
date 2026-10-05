// ============================================================
// lib/formato.ts
// ------------------------------------------------------------
// Helpers de formato compartidos por TODAS las pantallas.
//
// Centralizamos acá para que un cambio visual (ej: mostrar
// "1.234,56 USD" en vez de "$1.234") sea en un solo lugar.
// ============================================================

// Formatea un número como pesos argentinos.
//   formatearPesos(172700) → "$172.700"
//   formatearPesos(9300.5) → "$9.300,50"
export function formatearPesos(valor: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: valor % 1 === 0 ? 0 : 2,
  }).format(valor);
}

// Formatea un ISO 8601 como fecha local corta.
//   formatearFecha('2026-09-24T15:30:00') → "24/9/2026"
export function formatearFecha(iso: string | null): string {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(fecha);
}
