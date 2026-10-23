# AGENTS.md

## Repository Structure

TechFix Manager — workspace con la API del backend y su documentación. No hay frontend en el workspace todavía.

- `Backend/` — ASP.NET Core 10 Web API + EF Core (Npgsql/PostgreSQL), controllers, auth por headers
- `docs/` — documentación del proyecto: `ROOM_MAP_TechFix_Manager.txt`, `SDD_TechFix_Manager.txt`, `TDD_TechFix_Manager.txt`
- `.vscode/mcp.json` — MCP servers (el server `postgres` apunta a `techfix_db`)

## Backend (Backend/)

### Commands

```bash
cd Backend
dotnet run          # starts on http://localhost:5137
dotnet build        # compile only
dotnet ef migrations add <Nombre>   # crear migración
dotnet ef database update           # aplicar migraciones
```

Seed de datos (PostgreSQL, re-ejecutable):

```powershell
& "D:\PostgresSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d techfix_db -f seed.sql
```

Swagger UI disponible en `/swagger` (Development).

### Architecture

- **Controllers** (9): `AuthController`, `ClientesController`, `EquiposController`, `OrdenesController`, `ServiciosController`, `RepuestosController`, `UsuariosController`, `DashboardController`, `CatalogoPublicoController`
- `Models/` — 10 archivos: `Usuario`, `Cliente`, `Equipo`, `OrdenServicio`, `Servicio`, `Repuesto`, `OrdenDetalle`, `OrdenRepuestoDetalle`, `EstadoOrden` (enum), `Roles` (constantes)
- `Dtos/` — 7 archivos: Auth, Cliente, Equipo, Orden, Catalogo, Usuario, Dashboard
- `Services/` — `AuthService` (login + BCrypt), `HeaderAuthenticationHandler` (autenticación por header)
- `Data/AppDbContext.cs` — 8 DbSets, precisiones decimales y relaciones
- `Migrations/` — esquema generado por EF Core
- `Program.cs` — DI, CORS, esquema de autenticación HeaderAuth, Swagger

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

### Gotchas

- El frontend no existe en el workspace (la carpeta `FrontendElectronica/` fue eliminada); la API no tiene clientes HTTP que la consuman todavía
- CORS permite `http://localhost:5173` (Vite) y `http://localhost:3000` (Next.js)
- No hay infraestructura de tests ni CI/CD
- Sin migraciones de datos desde MySQL: los datos viejos se reemplazaron con `seed.sql`

### Code style

- TypeScript/JS/JSON/HTML/CSS: 2-space indentation, single quotes, semicolons, ES5 trailing commas.
- C#: 4-space indentation.
- All files: LF line endings, trim trailing whitespace, insert final newline.

## Dev Environment

- Backend: `http://localhost:5137` (HTTP)
- Swagger: `http://localhost:5137/swagger`
- PostgreSQL: `localhost:5432`, usuario `postgres`, password `postgres`, base `techfix_db`

## No test infrastructure

There are no test frameworks, test scripts, or test files. No CI/CD pipelines.
