// ============================================================
// app/api/[...ruta]/route.ts — PROXY HACIA LA API .NET
// ------------------------------------------------------------
// El frontend llama a rutas RELATIVAS (`/api/...`) y este route
// handler las reenvía al backend usando `API_URL`, que es una
// variable SOLO del servidor (sin NEXT_PUBLIC_):
//
//   navegador -> https://<frontend>/api/... -> https://<backend>/api/...
//
// Ventajas frente a llamar al backend directo desde el navegador:
//   - No hay CORS (el navegador solo habla con su propio origen).
//   - No se expone la URL del backend en el bundle.
//   - Cambiar `API_URL` en el host solo requiere reiniciar, no
//     reconstruir el frontend.
//
// En local, sin `API_URL`, cae a http://localhost:5137.
// ============================================================

import type { NextRequest } from 'next/server';

const BACKEND = (process.env.API_URL ?? 'http://localhost:5137').replace(/\/+$/, '');

type Contexto = { params: Promise<{ ruta?: string[] }> };

async function reenviar(request: NextRequest, { params }: Contexto): Promise<Response> {
  const { ruta = [] } = await params;

  const destino = new URL(
    `${BACKEND}/api/${ruta.map(encodeURIComponent).join('/')}${request.nextUrl.search}`
  );

  // Copiamos los headers del navegador (incluye X-Usuario-Id, que es
  // la autenticación del sistema) salvo los que dependen de la conexión.
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  // undici (fetch de Node) rechaza `Expect: 100-continue` y los headers
  // hop-by-hop. Los navegadores normalmente no los mandan, pero algunos
  // clientes (curl/PowerShell) sí.
  headers.delete('expect');
  headers.delete('transfer-encoding');
  headers.delete('upgrade');

  const tieneCuerpo = request.method !== 'GET' && request.method !== 'HEAD';

  try {
    const respuesta = await fetch(destino, {
      method: request.method,
      headers,
      body: tieneCuerpo ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });

    // Devolvemos solo lo que importa; el backend no manda CORS porque
    // nunca lo llama el navegador.
    const salida = new Headers();
    const tipo = respuesta.headers.get('content-type');
    if (tipo) salida.set('content-type', tipo);
    const disposicion = respuesta.headers.get('content-disposition');
    if (disposicion) salida.set('content-disposition', disposicion);

    return new Response(respuesta.body, {
      status: respuesta.status,
      headers: salida,
    });
  } catch (error) {
    console.error('[proxy-api] error reenviando a', destino.toString(), error);
    return Response.json(
      {
        mensaje:
          'No se pudo contactar la API. Revisá que API_URL esté configurada en el servidor y que el backend esté arriba.',
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, ctx: Contexto) {
  return reenviar(request, ctx);
}

export async function POST(request: NextRequest, ctx: Contexto) {
  return reenviar(request, ctx);
}

export async function PUT(request: NextRequest, ctx: Contexto) {
  return reenviar(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: Contexto) {
  return reenviar(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: Contexto) {
  return reenviar(request, ctx);
}
