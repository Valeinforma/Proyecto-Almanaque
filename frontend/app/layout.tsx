import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Fuentes de Google cargadas por Next (quedan como variables CSS).
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata global: lo que muestra la pestaña del navegador.
export const metadata: Metadata = {
  title: 'TechFix Manager',
  description:
    'Gestión de clientes, equipos y órdenes de reparación — sistema interno de TechFix.',
};

// Layout RAÍZ: envuelve TODAS las rutas (es el único que puede
// renderizar <html> y <body>). Acá solo ponemos fuentes y clases globales;
// el layout con sidebar y guard de sesión vive en app/(app)/layout.tsx.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
