'use client';

// ============================================================
// lib/firebase.ts
// ------------------------------------------------------------
// Configuración del cliente de Firebase para el login con Google.
//
// Las claves NEXT_PUBLIC_FIREBASE_* son PÚBLICAS: Firebase las
// necesita en el navegador y no dan acceso a nada por sí solas
// (la seguridad la da la verificación del ID token en el backend).
//
// El SDK se importa de forma DINÁMICA (dentro de obtenerAuth) para
// que el resto de la app no cargue ~100 KB de Firebase si el usuario
// nunca usa el botón de Google.
// ============================================================

// Valores por defecto del proyecto techfix-manager-4730. Firebase
// diseña estas claves para que sean PÚBLICAS (viajan al navegador):
// la seguridad la da la verificación del ID token en el backend.
// Las variables NEXT_PUBLIC_* las sobrescriben si están definidas.
const configuracion = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    'AIzaSyCkLIWpqacMH186VMSIFd9hBuxv0cugbCM',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'techfix-manager-4730.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'techfix-manager-4730',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    '1:1083998558010:web:540f3ffbad5f603dce6203',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    '1083998558010',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'techfix-manager-4730.firebasestorage.app',
};

// true solo si están todas las variables mínimas. Si falta alguna,
// el botón de Google se muestra deshabilitado con un aviso claro
// (en vez de romper el build o el render de la pantalla).
export const firebaseConfigurado = Boolean(
  configuracion.apiKey &&
    configuracion.authDomain &&
    configuracion.projectId &&
    configuracion.appId
);

// Devuelve la instancia de Auth (inicializando Firebase la primera
// vez) o null si no hay configuración. El import dinámico evita que
// el SDK viaje en el bundle inicial.
export async function obtenerAuth() {
  if (!firebaseConfigurado) return null;

  const [{ getApp, getApps, initializeApp }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  const app = getApps().length > 0 ? getApp() : initializeApp(configuracion);

  return getAuth(app);
}
