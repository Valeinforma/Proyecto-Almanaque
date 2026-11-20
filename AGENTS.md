# AGENTS.md

## Repository Structure

TechFix Manager — workspace con la API del backend, el frontend Next.js y la configuración de Supabase.

- `Backend/` — ASP.NET Core 10 Web API + EF Core (Npgsql/PostgreSQL), controllers, auth por headers
- `frontend/` — Next.js 16 (App Router, TypeScript, Tailwind 4), cliente del sistema y vitrina pública
- `supabase/` — configuración del CLI y migraciones de infraestructura (bucket de Storage para imágenes)
- `docs/` — documentación del proyecto: `ROOM_MAP_TechFix_Manager.txt`, `SDD_TechFix_Manager.txt`, `TDD_TechFix_Manager.txt`, `GUIA_SISTEMA_TechFix_Manager.md`, `ARQUITECTURA_FRONTEND.html`
- `.vscode/mcp.json` — MCP servers (el server `postgres` apunta a `techfix_db`)

## Backend (Backend/)

### Commands

```bash
cd Backend
dotnet run          # starts on http://localhost:5137
dotnet build        # compile only
dotnet ef migrations add <Nombre>   # crear migración
dotnet ef database update           # aplicar migraciones
dotnet ef migrations list           # ver migraciones aplicadas/pendientes
```

Seed de datos (PostgreSQL, re-ejecutable):

```powershell
& "D:\PostgresSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d techfix_db -f seed.sql
```

Swagger UI disponible en `/swagger` (Development).

### Architecture

- **Controllers** (10): `AuthController`, `ClientesController`, `EquiposController`, `OrdenesController`, `ServiciosController`, `RepuestosController`, `UsuariosController`, `DashboardController`, `CatalogoPublicoController`, `ArchivoController`
- `Models/` — 10 archivos: `Usuario`, `Cliente`, `Equipo`, `OrdenServicio`, `Servicio`, `Repuesto`, `OrdenDetalle`, `OrdenRepuestoDetalle`, `EstadoOrden` (enum), `Roles` (constantes)
- `Dtos/` — 7 archivos: Auth, Cliente, Equipo, Orden, Catalogo, Usuario, Dashboard
- `Services/` — `AuthService` (login + BCrypt), `HeaderAuthenticationHandler` (autenticación por header), `SupabaseStorageService` (subida de imágenes)
- `Data/AppDbContext.cs` — 8 DbSets, precisiones decimales y relaciones
- `Migrations/` — esquema generado por EF Core
- `Program.cs` — DI, CORS, esquema de autenticación HeaderAuth, Swagger, HttpClient de Supabase

### Database

- PostgreSQL 18 en `D:\PostgresSQL\18` (servicio Windows `postgresql-x64-18`)
- Base de datos: `techfix_db`, usuario `postgres`, password `postgres`, puerto 5432
- Cliente psql: `D:\PostgresSQL\18\bin\psql.exe`
- **NO tocar la base `electronicstore`**: pertenece a otro proyecto (`D:\Po\Proyecto-ale\ElectronicStore`)
- Esquema: solo vía EF Core (`dotnet ef database update`), NO hay migraciones manuales
- Datos: `Backend/seed.sql`, re-ejecutable (TRUNCATE + INSERT + setval de secuencias)

### Auth (sin JWT)

- `POST /api/auth/login` con `{ "email": "...", "password": "..." }` → devuelve `{ id, nombre, email, rol }` (NO emite token)
- `POST /api/auth/registro` con `{ "nombre": "...", "email": "...", "password": "..." }` (público) → crea usuario con rol **Recepcion** (el rol nunca se acepta del cliente) y devuelve el mismo shape que el login. Email repetido → 409 `{ mensaje }`
- Peticiones protegidas: header `X-Usuario-Id: <id>`
- El backend valida el usuario en la DB (existe y activo) y aplica **su rol desde la DB**; el rol nunca se toma del header
- Roles: `Admin`, `Tecnico`, `Recepcion`
- Usuarios seed: `admin@techfix.com`/`admin123` (Admin), `tecnico@techfix.com`/`tecnico123` (Tecnico), `recepcion@techfix.com`/`recepcion123` (Recepcion)
- Contraseñas: hash BCrypt (nunca texto plano en la DB)

### API groups (`/api/*`)

| Grupo | Rutas | Roles con acceso |
|-------|-------|------------------|
| Auth | POST `/api/auth/login` (público), POST `/api/auth/registro` (público), GET `/api/auth/me` | cualquiera autenticado |
| Clientes | GET/POST/PUT/DELETE `/api/clientes` | Admin, Tecnico, Recepcion |
| Equipos | GET/POST/PUT/DELETE `/api/equipos` | Admin, Tecnico, Recepcion |
| Órdenes | GET/POST/PUT/DELETE `/api/ordenes`, PUT `/api/ordenes/{id}/estado` | Admin, Tecnico, Recepcion |
| Servicios | GET `/api/servicios` (todos), POST/PUT/DELETE | escritura: Admin, Tecnico |
| Repuestos | GET/POST/PUT/DELETE `/api/repuestos` | Admin, Tecnico |
| Usuarios | GET/POST/PUT/DELETE `/api/usuarios` | Admin |
| Dashboard | GET `/api/dashboard/resumen` | cualquiera autenticado |
| Catálogo público | GET `/api/publico/catalogo` | **público** (sin sesión): servicios activos + repuestos activos con stock, mínimos campos (vitrina de la landing `/`), incluye `imagenUrl` |
| Archivos (imágenes) | POST `/api/archivo/imagen?carpeta=repuestos\|servicios` (multipart, campo `archivo`, JPG/PNG/WEBP/GIF ≤5MB) → `{ url }` | carpeta `repuestos`: Admin, Tecnico · carpeta `servicios`: solo Admin. Sube a Supabase Storage (bucket `StorageFix` público, carpeta `imagenes/`) desde el backend con la service key; el front solo recibe la URL pública. `repuestos`/`servicios` guardan la URL en `imagen_url` |

### Estados de orden

`Recibido → EnDiagnostico → Presupuestado → EnReparacion → Listo → Entregado`

`Cancelado` se puede marcar desde Recibido, EnDiagnostico, Presupuestado o EnReparacion. `PUT /api/ordenes/{id}/estado` valida las transiciones permitidas y devuelve 400 si no corresponde.

### Reglas de negocio

- El **Costo** de la orden se calcula automáticamente como suma de detalles (servicios + repuestos); si no hay detalles, puede setearse manualmente en el PUT de la orden
- El **stock** de repuestos se descuenta al agregarlos a una orden y se restaura al quitarlos o borrar la orden
- `NumeroOrden` se autogenera consecutivo con formato `ORD-000001`
- Los enums se envían/reciben como texto JSON (ej. `"Presupuestado"`), gracias a `JsonStringEnumConverter`

## Frontend (frontend/)

Next.js 16.3.6 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4. Gestor de paquetes: **pnpm**.

### Commands

```bash
cd frontend
pnpm install        # dependencias
pnpm dev            # http://localhost:3000
pnpm build          # build de producción (incluye type-check)
pnpm lint           # ESLint (debe quedar sin errores)
pnpm smoke          # smoke test de la capa de datos contra la API real
```

`pnpm smoke` necesita el backend corriendo en `http://localhost:5137` (si no se define
`NEXT_PUBLIC_API_URL`, el script usa ese fallback).

### Architecture

- `app/(app)/` — pantallas protegidas: dashboard, órdenes, clientes, equipos, servicios, repuestos, usuarios, configuración
- `app/(publico)/` — landing `/` y tienda `/tienda` (catálogo sin sesión)
- `app/login`, `app/registro` — autenticación pública
- `app/api/[...ruta]/route.ts` — **proxy** que reenvía `/api/*` al backend usando `API_URL` (variable solo del servidor; por defecto `http://localhost:5137`)
- `app/api/salud/route.ts` — ping al health del backend para la pantalla de Configuración
- `components/` — UI por feature (formularios, tablas, modales, `CampoImagen`, etc.)
- `lib/api.ts` — cliente HTTP central: agrega `X-Usuario-Id`, parsea `{ mensaje }` y borra la sesión ante 401
- `lib/auth.ts` — login/logout y sesión en `localStorage` (`techfix_sesion`)
- `interfaces/`, `types/`, `hooks/` — contratos y hooks compartidos

### Environment

- Local: `.env.local` sin `NEXT_PUBLIC_API_URL` → el navegador llama rutas relativas `/api/...` y el proxy de Next las reenvía a `API_URL` (por defecto `http://localhost:5137`). No hay CORS.
- Opcional (modo directo): definir `NEXT_PUBLIC_API_URL` hace que el navegador llame al backend sin proxy; requiere CORS en el backend.
- Producción (Render): definir `API_URL` en el servidor del frontend apuntando a la URL pública del backend, sin `/api` ni barra final.

### Gotchas

- CORS del backend permite `http://localhost:5173` (Vite), `http://localhost:3000`, `http://localhost:3001` (puerto estable local) y `https://proyecto-almanaque.onrender.com`
- Sin migraciones de datos desde MySQL: los datos viejos se reemplazaron con `seed.sql`
- El backend corre en HTTP en desarrollo; no hay HTTPS local configurado para el front
- No hay CI/CD ni framework de tests formal; la validación es `pnpm build` + `pnpm lint` + `pnpm smoke`

### Code style

- TypeScript/JS/JSON/HTML/CSS: 2-space indentation, single quotes, semicolons, ES5 trailing commas.
- C#: 4-space indentation.
- All files: LF line endings, trim trailing whitespace, insert final newline.

## Dev Environment

- Backend: `http://localhost:5137` (HTTP)
- Swagger: `http://localhost:5137/swagger`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`, usuario `postgres`, password `postgres`, base `techfix_db`
- Supabase Storage: bucket público `StorageFix` (imágenes del catálogo)

## Build / tooling notes

- `Backend/Backend.csproj` define `AllowMissingPrunePackageData=true` para evitar `NETSDK1226` con el SDK 10.0.401 local.
- El backend se publica con `Backend/Dockerfile` (imagen `sdk:10.0` → `aspnet:10.0`, escucha en el puerto 10000).
