// ============================================================
// app/api/salud/route.ts — PING AL HEALTH DEL BACKEND
// ------------------------------------------------------------
// El backend expone su health en la RAÍZ (`GET /`, fuera de /api),
// así que no puede pasar por el proxy de `app/api/[...ruta]`.
// La pantalla de Configuración consulta este endpoint para mostrar
// si la API responde.
// ============================================================

import { NextResponse } from 'next/server';

const BACKEND = (process.env.API_URL ?? 'http://localhost:5137').replace(/\/+$/, '');

export async function GET() {
  try {
    const respuesta = await fetch(`${BACKEND}/`, { cache: 'no-store' });
    const datos = await respuesta.json();
    return NextResponse.json(datos, { status: respuesta.status });
  } catch {
    return NextResponse.json(
      {
        mensaje:
          'No se pudo contactar la API. Revisá que API_URL esté configurada en el servidor y que el backend esté arriba.',
      },
      { status: 502 }
    );
  }
}
