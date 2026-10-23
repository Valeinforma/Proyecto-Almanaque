'use client';

// ============================================================
// lib/auth.ts
// ------------------------------------------------------------
// Sesión del usuario (SDD §11):
//
//   1. Login: POST /api/auth/login con { email, password }
//      → el backend responde { id, nombre, email, rol }
//        (NO devuelve token: la auth es por header X-Usuario-Id)
//   2. Guardamos ese objeto en localStorage
//   3. lib/api.ts lo lee para mandar el header en cada pedido
//   4. Si no hay usuario o el id es inválido → a /login
//
// Uso:
//   const u = await iniciarSesion(email, password);
//   const yo = obtenerSesion();      // lectura puntual
//   const viva = useSesion();        // REACTIVA (se actualiza sola)
//   cerrarSesion();
// ============================================================

import { useSyncExternalStore } from 'react';
import { api, guardarSesion, borrarSesion, CLAVE_SESION } from './api';
import type { ISesionUsuario } from '@/interfaces/IUsuario';
import type { Rol } from '@/types/roles';

// POST /api/auth/login
// Lanza ApiError(401, 'Credenciales incorrectas') si falla.
export async function iniciarSesion(email: string, password: string): Promise<ISesionUsuario> {
  const sesion = await api.post<ISesionUsuario>('/auth/login', { email, password });

  // Si el backend respondió sin id, algo anda mal → no guardamos nada.
  if (!sesion || typeof sesion.id !== 'number') {
    throw new Error('Respuesta de login inválida');
  }

  // guardarSesion notifica a los suscriptores (useSesion).
  guardarSesion(sesion);
  return sesion;
}

// Cierra la sesión (borra localStorage + notifica a useSesion).
// El caller suele navegar a /login después.
export function cerrarSesion(): void {
  borrarSesion();
}

// Registro público (pantalla /registro): POST /api/auth/registro.
// El backend crea el usuario con rol Recepcion y responde con el
// MISMO shape que el login → acá solo guardamos la sesión.
// Lanza ApiError(409, 'Ya existe un usuario con ese email') si el
// email está tomado, o ApiError(400, ...) si la validación falla.
export async function registrarse(
  nombre: string,
  email: string,
  password: string
): Promise<ISesionUsuario> {
  const sesion = await api.post<ISesionUsuario>('/auth/registro', {
    nombre,
    email,
    password,
  });

  // Misma sanidad que en iniciarSesion: sin id no hay sesión.
  if (!sesion || typeof sesion.id !== 'number') {
    throw new Error('Respuesta de registro inválida');
  }

  guardarSesion(sesion);
  return sesion;
}

// ---------- lectura con caché ----------
// useSyncExternalStore exige que getSnapshot devuelva SIEMPRE el
// mismo objeto mientras no cambie el valor crudo (sino React cree
// que hay un cambio nuevo en cada render → loop infinito).
// Por eso parseamos solo cuando el string de localStorage cambió.
let crudoCache: string | null | undefined = undefined;
let sesionCache: ISesionUsuario | null = null;

function leerSesion(): ISesionUsuario | null {
  if (typeof window === 'undefined') return null;

  const crudo = window.localStorage.getItem(CLAVE_SESION);

  if (crudo !== crudoCache) {
    crudoCache = crudo;
    sesionCache = null;

    if (crudo) {
      try {
        const datos = JSON.parse(crudo) as ISesionUsuario;
        // Sanidad mínima: id + rol presentes.
        if (typeof datos.id === 'number' && typeof datos.rol === 'string') {
          sesionCache = datos;
        }
      } catch {
        // JSON corrupto → tratamos como "sin sesión".
        sesionCache = null;
      }
    }
  }

  return sesionCache;
}

// Devuelve la sesión guardada, o null si no hay / está rota.
// (Versión imperativa: para usar fuera de React o en momentos
// puntuales —ej: antes de un fetch—.)
export function obtenerSesion(): ISesionUsuario | null {
  return leerSesion();
}

// true si hay sesión (para guardas rápidas).
export function haySesion(): boolean {
  return leerSesion() !== null;
}

// ---------- sesión REACTIVA (hook) ----------
// Suscripción al almacenamiento de la sesión:
//   · evento propio CLAVE_SESION → cambios de ESTA pestaña
//     (login, logout, 401 de api.ts)
//   · evento nativo 'storage' → cambios de OTRAS pestañas
function suscribir(alCambiar: () => void): () => void {
  const handler = () => alCambiar();
  window.addEventListener(CLAVE_SESION, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CLAVE_SESION, handler);
    window.removeEventListener('storage', handler);
  };
}

// Snapshot del servidor (SSR/prerender): no hay localStorage → null.
// Esto hace que el HTML del servidor y la primera renderización del
// navegador coincidan (sin "hydration mismatch").
function sesionEnServidor(): ISesionUsuario | null {
  return null;
}

// Hook principal de sesión:
//   const sesion = useSesion();  // null | { id, nombre, email, rol }
//
// Por qué useSyncExternalStore y no useState+useEffect:
// localStorage es una "fuente externa" a React. Esta API le dice
// a React cómo leerla y suscribirse, resolviendo sola los problemas
// de SSR y de sincronía (regla: nada de setState dentro de effects).
export function useSesion(): ISesionUsuario | null {
  return useSyncExternalStore(suscribir, leerSesion, sesionEnServidor);
}

// ¿El usuario actual tiene ALGUNO de los roles indicados?
// Uso: ocultar botones/menús (la autorización real la hace el backend).
export function tieneRol(...roles: Rol[]): boolean {
  const sesion = leerSesion();
  return sesion !== null && roles.includes(sesion.rol);
}
