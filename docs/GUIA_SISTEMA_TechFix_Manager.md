# GUÍA DEL SISTEMA — TechFix Manager

> **Qué es este documento:** la explicación práctica de cómo funciona el
> sistema completo (backend + frontend), pensada para leerse de punta a
> punta. No reemplaza a los otros docs de la carpeta:
>
> | Documento | Para qué sirve |
> |---|---|
> | `TDD_TechFix_Manager.txt` | Diseño técnico: qué tecnología y por qué |
> | `SDD_TechFix_Manager.txt` | Diseño de software: estructura y UI |
> | `ROOM_MAP_TechFix_Manager.txt` | Mapa de pantallas y navegación |
> | **`GUIA_SISTEMA_TechFix_Manager.md` (este)** | **Cómo funciona en la práctica** |
>
> **Estado:** ✅ **SISTEMA COMPLETO** — actualizado tras la **Parte 8** (configuración; frontend de 8/8 partes, 17 pantallas).
> Las secciones marcadas *(en construcción)* se completan con cada parte.

---

## 1. VISIÓN GENERAL

TechFix Manager es un sistema web para gestionar una empresa de
servicios técnicos: clientes, equipos, órdenes de reparación, catálogo
de servicios y repuestos, y usuarios del sistema.

### Arquitectura

```
   ┌─────────────────────────── NAVEGADOR ───────────────────────────┐
   │                                                                 │
   │   Next.js (React + TypeScript)  — frontend en localhost:3000    │
   │   ┌────────────┐   ┌──────────────┐   ┌────────────────────┐    │
   │   │ Pantallas  │──▶│  lib/api.ts  │──▶│ fetch + header     │    │
   │   │ (app/)     │   │  (cliente    │   │ X-Usuario-Id       │    │
   │   └────────────┘   │   HTTP)      │   └─────────┬──────────┘    │
   │                    └──────────────┘             │               │
   └─────────────────────────────────────────────────┼───────────────┘
                                                     │  HTTP + JSON
                                                     ▼
   ┌─────────────────────────── SERVIDOR ────────────────────────────┐
   │                                                                 │
   │   ASP.NET Core 10 Web API  — backend en localhost:5137          │
   │   ┌──────────────┐  ┌───────────────────┐  ┌────────────────┐   │
   │   │ Controllers  │─▶│ Services          │─▶│ EF Core        │   │
   │   │ (rutas)      │  │ (auth, lógica)    │  │ (ORM)          │   │
   │   └──────────────┘  └───────────────────┘  └───────┬────────┘   │
   └────────────────────────────────────────────────────┼────────────┘
                                                        │ SQL
                                                        ▼
                                            ┌───────────────────────┐
                                            │  PostgreSQL 18        │
                                            │  base: techfix_db    │
                                            └───────────────────────┘
```

**Idea central:** el frontend **no toca la base de datos**. Todo pasa
por la API, que es quien valida permisos, reglas de negocio y escribe
en PostgreSQL. La base de datos no es "del frontend": es "del backend".

---

## 2. CÓMO SE LEVANTA EL SISTEMA

Necesitás 3 procesos (en este orden):

### 1) PostgreSQL (solo una vez por sesión de Windows)
```powershell
# El servicio Windows ya lo deja corriendo:
# postgresql-x64-18 (D:\PostgresSQL\18)
```

### 2) Backend API
```powershell
cd "D:\Po\Proyecto Almanaque\Backend"
dotnet run          # queda en http://localhost:5137
```
- Swagger (probador visual de endpoints): `http://localhost:5137/swagger`
- Verificación rápida: `http://localhost:5137/` debe responder
  `{"servicio":"API TechFix Manager","estado":"OK"}`

### 3) Frontend
```powershell
cd "D:\Po\Proyecto Almanaque\frontend"
pnpm dev            # queda en http://localhost:3000
```

### Comandos útiles del frontend
| Comando | Qué hace |
|---|---|
| `pnpm dev` | servidor de desarrollo (con hot reload) |
| `pnpm build` | compilación de producción (incluye typecheck) |
| `pnpm lint` | ESLint (estilo + reglas de Next.js) |
| `pnpm smoke` | prueba de la capa de datos contra la API real |

> `pnpm smoke` requiere que la API esté levantada. Prueba login,
> header de sesión y errores 401 con el código real del frontend.

---

## 3. EL BACKEND POR DENTRO

### 3.1 Estructura de carpetas (`Backend/`)

```
Backend/
├── Controllers/      8 archivos: un controlador por módulo
│                     (rutas HTTP + quién puede + llamada a la lógica)
├── Models/           9 entidades + enum EstadoOrden + constantes Roles
├── Dtos/             7 archivos: las formas de datos que entran/salen
│                     (request y response separados)
├── Services/         AuthService (login + BCrypt)
│                     HeaderAuthenticationHandler (¿quién es este?)
├── Data/             AppDbContext (tabla por DbSet + relaciones)
├── Migrations/       esquema de la base generado por EF Core
├── Program.cs        arranque: DI, CORS, auth, JSON, Swagger
├── appsettings.json  cadena de conexión a PostgreSQL
└── seed.sql          datos de prueba re-ejecutables
```

**Regla de responsabilidades:**
- **Controller** = recibe HTTP, aplica `[Authorize]`, delega, responde
- **Service/Handler** = lógica transversal (login, identidad)
- **DbContext** = única puerta a la base de datos
- **DTO** = contrato de datos (nunca exponer entidades directamente
  si querés controlar qué viaja en JSON)

### 3.2 Ciclo de una petición, paso a paso

Ejemplo real: el frontend pide `GET /api/clientes` con sesión.

```
1. Navegador (lib/api.ts)
      fetch('http://localhost:5137/api/clientes', {
        headers: { 'X-Usuario-Id': '3' }        ◀── lo agrega api.ts
      })

2. CORS (Program.cs → UseCors("Frontend"))
      ¿Viene de localhost:3000 o :5173?  SÍ → lo deja pasar
      (si viniera de otro origen, se rechazaría ANTES de llegar
       al controller)

3. Autenticación (HeaderAuthenticationHandler)
      Lee X-Usuario-Id = 3
        → ¿existe el usuario 3 en la DB?  NO → 401
        → ¿está activo?                    NO → 401
        → SÍ → arma un "ticket" con su ROL REAL de la DB
          (el rol NUNCA se toma del header: solo el id)

4. Autorización ([Authorize(Roles = "Admin,Tecnico,Recepcion")])
      ¿El rol del ticket está en la lista?  NO → 403
      (Recepción sí puede ver clientes; para /api/usuarios
       la lista es solo Admin → Recepción recibe 403)

5. Controller (ClientesController.Listar)
      var query = db.Clientes...   // LINQ
      if (search != null) filtrar...
      return Ok(clientes)

6. EF Core → PostgreSQL
      LINQ se convierte en SQL SELECT (con parámetros,
      es decir: a prueba de SQL injection por diseño)

7. Respuesta
      C# object → JSON camelCase → { "id": 1, "nombre": ... }
      El frontend lo recibe como datos tipados (types/index.ts)
```

### 3.3 Autenticación por header `X-Usuario-Id` (sin token)

**Decisión histórica:** el proyecto empezó con JWT y se cambió a un
header simple, manteniendo los roles activos.

```
POST /api/auth/login   { "email", "password" }
        │
        ▼
AuthService: busca el usuario por email y compara la contraseña
        con BCrypt (hash en la DB, nunca texto plano)
        │
        ├─ mal  → 401 { "mensaje": "Credenciales incorrectas" }
        └─ bien → 200 { id, nombre, email, rol }   ◀── SIN token
                          │
                          ▼
        El frontend guarda eso en localStorage
        y lo manda como header en cada pedido:
        X-Usuario-Id: <id>
```

**Por qué el rol es seguro aunque el header no:** el handler ignora
cualquier cosa salvo el **id**; con el id va a la DB y toma el rol real.
Un usuario que mande un id ajeno se hace pasar por ese usuario (eso es
lo débil de este diseño, aceptado para uso local), pero **no puede
inventarse un rol**: si la DB dice que es Recepción, es Recepción.

### 3.4 Endpoints y roles

| Grupo | Rutas | Quién |
|---|---|---|
| Auth | POST `/api/auth/login`, GET `/api/auth/login` → GET `/api/auth/me` | público / cualquiera autenticado |
| Clientes | GET/POST/PUT/DELETE `/api/clientes` | Admin, Técnico, Recepción |
| Equipos | GET/POST/PUT/DELETE `/api/equipos` | Admin, Técnico, Recepción |
| Órdenes | GET/POST/PUT/DELETE `/api/ordenes`, PUT `/api/ordenes/{id}/estado` | Admin, Técnico, Recepción |
| Servicios | GET (todos), POST/PUT/DELETE | lectura: cualquiera · escritura: Admin, Técnico |
| Repuestos | GET/POST/PUT/DELETE | Admin, Técnico |
| Usuarios | GET/POST/PUT/DELETE | solo Admin |
| Dashboard | GET `/api/dashboard/resumen` | cualquiera autenticado |

**Query params disponibles:**
- `/api/clientes?search=juan`
- `/api/equipos?search=note&clienteId=3`
- `/api/ordenes?estado=Presupuestado&search=ORD-000012`
- `/api/repuestos?search=bater& soloActivos=true`

### 3.5 Reglas de negocio (las importantes)

**① Transiciones de estado de una orden**

```
Recibido ──▶ EnDiagnostico ──▶ Presupuestado ──▶ EnReparacion ──▶ Listo ──▶ Entregado
    │              │                  │                │
    └──Cancelado───└────Cancelado─────└────Cancelado───┘ (rama lateral)

Cancelado y Entregado son estados finales (sin salida).
```

Implementado en `OrdenesController.Transiciones` (línea 15).
`PUT /api/ordenes/{id}/estado` valida el salto y devuelve **400** si no
corresponde (ej: de `Recibido` directo a `Entregado`).

**② El Costo se calcula solo**

`Costo = Σ detalles de servicios + Σ detalles de repuestos`.
Si la orden no tiene detalles, el `PUT` de la orden permite setearlo a
mano. Nunca se pide al usuario que cargue el total.

**③ El stock se mueve con la orden**

- Agregar un repuesto a una orden → **descuenta** stock
- Quitarlo (o borrar la orden) → **restaura** stock
- Stock insuficiente → la API responde error

**④ NumeroOrden automático**

Formato `ORD-000001`, consecutivo, lo genera el backend al crear.

**⑤ Enums como texto**

Los estados viajan como `"Presupuestado"`, no como `3`
(`JsonStringEnumConverter` en Program.cs).

### 3.6 Errores: formato y códigos

Todo error del backend responde JSON con la misma forma:

```json
{ "mensaje": "Explicación legible para el usuario" }
```

| Código | Cuándo | Qué hace el frontend |
|---|---|---|
| 400 | Validación / transición inválida / stock insuficiente | muestra `mensaje` en el formulario o toast |
| 401 | Sin header o id inválido/inactivo | borra sesión → a `/login` |
| 403 | Rol sin permiso (ej: Recepción pidiendo `/api/usuarios`) | muestra "no tenés permisos" |
| 404 | Id inexistente | mensaje de "no encontrado" |
| 409 | Conflicto (si aplica) | muestra `mensaje` |

El cliente HTTP (`lib/api.ts`) convierte estos en una excepción
`ApiError` con `status` y `message` para que las pantallas hagan
`try/catch` y muestren `error.message`.

---

## 4. LA BASE DE DATOS

### 4.1 Tablas y relaciones

```
usuarios ──┐
           │ (quién atiende)
           ▼
        ordenes_servicio ─────────────┐
           │                          │
           │ (equipo atendido)        │ (quién registró)
           ▼                          ▼
        equipos ──── cliente        usuario
           │
           ▼
        clientes

        ordenes_servicio ──< orden_detalles        >── servicios
        ordenes_servicio ──< orden_repuesto_detalles >── repuestos
```

9 tablas (verificadas en `techfix_db`):

| Tabla | Qué guarda |
|---|---|
| `usuarios` | cuentas del sistema (email, hash BCrypt, rol, activo) |
| `clientes` | fichas de clientes (con `fecha_alta` y total equipos calculado) |
| `equipos` | dispositivos, cada uno dueño de un cliente |
| `ordenes_servicio` | el núcleo: estado, costos, fechas, diagnóstico |
| `servicios` | catálogo de servicios (precio, activo) |
| `repuestos` | catálogo de repuestos (**con stock**) |
| `orden_detalles` | línea detalle orden↔servicio (cantidad, precio, subtotal) |
| `orden_repuesto_detalles` | línea detalle orden↔repuesto |
| `__EFMigrationsHistory` | control de migraciones aplicadas |

Las dos tablas `orden_*` son las que hacen la relación muchostantos
(una orden tiene N servicios y N repuestos). **Ojo:** el detalle guarda
una **foto del precio** al momento de agregarlo; si mañana subís el
precio del catálogo, las órdenes viejas no cambian.

### 4.2 Migraciones: el esquema es código

```powershell
cd Backend
dotnet ef migrations add <Nombre>    # genera el código del cambio
dotnet ef database update            # lo aplica a PostgreSQL
```

**Nunca** se altera el esquema a mano con SQL: EF Core es la única
fuente de verdad. (Si editás la base direct, la migración se desincroniza.)

### 4.3 `seed.sql`: datos de prueba

Ubicación: `Backend/seed.sql`. Es **re-ejecutable**: borra todo
(TRUNCATE + reset de secuencias) y vuelve a insertar:

| Dato | Cantidad |
|---|---|
| Usuarios | 3 (admin / técnico / recepción) |
| Clientes | 5 |
| Equipos | 7 |
| Servicios | 10 |
| Repuestos | 12 |
| Órdenes | 13 (una por estado, para probar todo el flujo) |
| Detalles | 10 de servicios + 8 de repuestos |

```powershell
$env:PGPASSWORD='postgres'
& "D:\PostgresSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d techfix_db -f "D:\Po\Proyecto Almanaque\Backend\seed.sql"
```

**Cuándo re-sembrar:** después de tests que hayan ensuciado datos
(el script de smoke del backend y el `pnpm smoke` del frontend crean
y borran datos). Volver a sembrar = volver al estado conocido.

**Usuarios y contraseñas seed:**

| Email | Password | Rol |
|---|---|---|
| `admin@techfix.com` | `admin123` | Admin |
| `tecnico@techfix.com` | `tecnico123` | Técnico |
| `recepcion@techfix.com` | `recepcion123` | Recepción |

---

## 5. EL FRONTEND POR DENTRO

> 🚧 *En construcción: se completa con cada Parte (ver §5.6)*

### 5.1 Estructura de carpetas (`frontend/`)

```
frontend/
├── app/                páginas (App Router de Next.js)
│   ├── layout.tsx      <html> + fuentes + metadata
│   ├── page.tsx        raíz "/" → redirección según sesión
│   ├── login/page.tsx  pantalla de login dividida
│   └── (app)/          rutas protegidas con layout común
│       ├── layout.tsx      guard de sesión + shell
│       └── dashboard/      (primeras pantallas internas)
├── components/
│   ├── ui/             Button, Input, Modal, Badge
│   ├── Sidebar.tsx     menú lateral (por rol y por parte)
│   └── Header.tsx      barra superior (título + usuario)
├── lib/                la "capa de datos"
│   ├── api.ts          cliente HTTP centralizado
│   └── auth.ts         sesión (login/logout/useSesion)
├── types/index.ts      espejo TypeScript de los DTOs del backend
├── scripts/smoke.ts    prueba de la capa de datos (pnpm smoke)
├── .env.local          NEXT_PUBLIC_API_URL
└── pnpm-lock.yaml      dependencias fijadas por pnpm
```

### 5.2 Las 3 capas

```
① PANTALLA (app/**/page.tsx)
     "mostrar clientes, botón Eliminar, formulario..."
        │  llama a...
        ▼
② CAPA DE DATOS (lib/api.ts + lib/auth.ts)
     agrega X-Usuario-Id, maneja errores, parsea JSON
        │  fetch a...
        ▼
③ API (.NET) → PostgreSQL
```

**Por qué así:** si mañana la API cambia de URL o aparece un token,
se toca **un solo archivo** (`lib/api.ts`), no 20 pantallas.

### 5.3 Sesión: del login al header

```
/login  →  iniciarSesion(email, password)
              │ POST /api/auth/login
              ▼
         { id, nombre, email, rol }  →  localStorage('techfix_sesion')
                                              │
              cualquier llamada  ◀─────────────┘
              api.get('/ordenes')  lo lee y agrega
                                   X-Usuario-Id: <id>
```

- **Sin sesión** → `lib/api.ts` no manda header → la API responde 401
- **401 en cualquier request** → `api.ts` borra la sesión y lanza
  `ApiError`; la pantalla/layout decide redirigir a `/login`
  (regla SDD §11)
- El **rol** vive en la misma sesión y sirve para mostrar/ocultar
  botones; el que manda es el backend (§3.3)

### 5.4 `types/index.ts`: el espejo

Cada interface replica campo por campo un DTO del backend
(`Cliente`, `Equipo`, `Orden`, `Servicio`, `Repuesto`, `Usuario`,
`Dashboard`…). Si el backend cambia un DTO, **se cambia primero acá**
y TypeScript te marca en todas las pantallas afectadas.

Además contiene el conocimiento del dominio que comparte la UI:
`TRANSICIONES` (copiada del backend), `FLUJO_ESTADOS`,
`ETIQUETAS_ESTADO`.

### 5.5 `pnpm smoke`

`scripts/smoke.ts` prueba la capa de datos con el código real:
login correcto, login con password malo (401), GET con header
automático, y GET sin sesión (401). Corre contra la API real,
así que valida el camino completo menos el navegador.

### 5.6 Login, layout y sesión en la UI *(Parte 1)*

**Pantallas nuevas:**

```
app/
├── page.tsx                 "/" → redirige según sesión
├── login/page.tsx           pantalla de login dividida
└── (app)/                   ← route group: agrupa rutas
    ├── layout.tsx           guard + shell (sidebar/header)
    └── dashboard/page.tsx   placeholder (la real es Parte 2)

components/
├── ui/Button.tsx            variantes primary/secondary/danger/ghost
├── ui/Input.tsx             campo con label + error
├── ui/Modal.tsx             diálogo (cierra con X, afuera o Escape)
├── ui/Badge.tsx             Badge genérico + EstadoBadge (por estado)
├── Sidebar.tsx              menú por rol, crece con cada parte
└── Header.tsx               título de sección + usuario + hamburguesa
```

**El guard de sesión (cómo protege las rutas):**

```
entrás a /dashboard
      │
      ▼
app/(app)/layout.tsx  →  useSesion()
      │
      ├─ null (sin sesión)  →  spinner + router.replace('/login')
      │
      └─ { id, rol, ... }   →  renderiza Sidebar + Header + página
```

**`useSesion()` — la sesión reactiva (lib/auth.ts):**

Se implementó con `useSyncExternalStore` de React, no con
`useState + useEffect`:

- lee `localStorage` como "fuente externa" con caché (si el string
  no cambió, devuelve el MISMO objeto → React no re-renderiza en vano)
- se suscribe a un evento propio (`techfix_sesion`) que emite
  `lib/api.ts` cada vez que guarda/borra la sesión (login, logout,
  o un 401 en cualquier request) y también al evento nativo
  `storage` (cambios hechos desde OTRA pestaña)
- el snapshot del servidor es `null` → el HTML prerenderizado y la
  primera render del navegador coinciden (sin "hydration mismatch")
- esto cumple la regla de lint de Next 16: **nada de `setState`
  dentro de `useEffect`** (el guard solo llama a `router.replace`)

**Menú por partes y por rol (Sidebar):**

```ts
const PARTE_ACTUAL = 1;   // se sube al terminar cada parte

MENU = [
  { General:  Dashboard (parte 1) },
  { Gestión:  Órdenes (5), Clientes (3), Equipos (4) },
  { Catálogo: Servicios (6), Repuestos (6) },
  { Sistema:  Usuarios (7, solo Admin), Configuración (8) },
]
```

Un item se muestra si `item.parte <= PARTE_ACTUAL` **y** su rol lo
permite. La visibilidad es comodidad: quien dice "403" es el backend.

**Responsividad:** en desktop el sidebar queda fijo; en móvil se
superpone (hamburguesa en el Header + fondo para cerrar). Al navegar,
el menú se cierra solo.

---

### 5.7 Dashboard *(Parte 2)*

**Pantalla:** `app/(app)/dashboard/page.tsx` + `StatCard` + `OrdenCard`.

```
GET /api/dashboard/resumen  →  la API arma TODO en una consulta:
{ ordenesAbiertas, enDiagnostico, enReparacion, listasParaEntregar,
  ingresosEstimados, ordenesRecientes[5], equiposListos[...] }
        │
        ▼
estado de React (useState) → render
  · saludo según hora
  · 5 StatCards (ícono + número + etiqueta)
  · 2 columnas: Órdenes recientes / Equipos listos (OrdenCard)
```

**Patrón de carga de datos (obligado por el lint de Next 16):**

```ts
// cargar() SOLO lanza la petición — sin setState en su cuerpo.
const cargar = useCallback(() => {
  api.get('/dashboard/resumen')
    .then((r) => { setDatos(r); ... })   // ← setState acá adentro: OK
    .catch((e) => { setError(e.message) });
}, []);

useEffect(() => { cargar(); }, [cargar]); // effect: llama y listo

const reintentar = () => { setCargando(true); cargar(); }; // botón
```

La regla `react-hooks/set-state-in-effect` (React 19 / Next 16)
prohíbe cualquier `setState` "directo o transitivo" dentro de un
`useEffect`: solo se permite dentro de callbacks de suscripción
(`.then`, eventos, listeners). Los efectos sirven para sincronizar
con sistemas EXTERNOS (fetch, localStorage, timers), no para
guardar estado de forma directa.

**Estados de la pantalla:** cargando (spinner) · error (panel con
"Reintentar") · datos (pantalla completa) · listas vacías (mensaje).

### 5.8 Clientes — el patrón CRUD *(Parte 3)*

**Pantallas:** `app/(app)/clientes/page.tsx` (listado),
`app/(app)/clientes/nuevo/page.tsx` (crear),
`components/forms/ClienteForm.tsx` (formulario compartido).

Esta parte define el **patrón que repiten** Equipos (Parte 4),
Servicios/Repuestos (Parte 6) y Usuarios (Parte 7):

```
/listados  ─ carga (useEffect + .then) ─▶ tarjetas con acciones
    │
    ├─ [+ Nuevo]        → página /clientes/nuevo
    │                      (ClienteForm → POST → vuelve al listado)
    ├─ ✏️ Editar         → Modal con ClienteForm
    │                      (PUT → actualiza la copia local)
    ├─ 🗑 Eliminar       → Modal de confirmación "¿Eliminar…?"
    │                      (DELETE → quita de la copia local)
    └─ 👁 Ver equipos    → Modal con GET /equipos?clienteId=N
                           (muestra equipo + estado de su orden)
```

**Decisiones del patrón:**

1. **Crear = página, Editar = modal.** Crear es una tarea con foco
   (formulario completo); editar es un ajuste rápido que no debe
   perder de vista el listado.
2. **Lista local en memoria:** después de POST/PUT/DELETE no se
   recarga todo: se actualiza el `useState` con lo que ya sabemos
   (la API respondió OK). Menos requests, UI instantánea.
3. **Filtrado en cliente:** el buscador filtra la lista ya cargada
   (sin un request por tecla). El backend igual acepta
   `?search=` si el volumen crece.
4. **`ClienteForm` no hace fetch:** solo valida y llama a
   `onGuardar(datos)`; quién lo monta decide POST o PUT.
   Formularios "presentacionales" → fáciles de reusar y testear.
5. **Confirmación en acciones destructivas** (SDD §15): nunca
   DELETE directo desde un click.

**Nota de roles:** con clientes los 3 roles pueden todo; la
restricción visual por rol se nota recién en Repuestos (Parte 6)
y Usuarios (Parte 7).

### 5.9 Equipos — segundo cliente del patrón *(Parte 4)*

**Pantallas:** `app/(app)/equipos/page.tsx` (listado),
`app/(app)/equipos/nuevo/page.tsx` (crear),
`components/forms/EquipoForm.tsx` (formulario),
`components/ui/Select.tsx` (nuevo componente, SDD §12).

Es el **segundo uso del patrón CRUD** de la Parte 3. Lo nuevo:

1. **`Select` reutilizable** — un equipo *tiene dueño*: el form
   trae un `<select>` de clientes. Se monta con `clientes` que
   carga el padre (el form sigue sin decidir a quién llamar).
2. **Dos listas en paralelo** — el listado pide
   `Promise.all([api.get('/equipos'), api.get('/clientes')])`:
   equipos para las tarjetas, clientes para el select del modal.
3. **Tarjeta con estado de orden** (SDD §8): tipo, marca,
   modelo, serie (mono), cliente, descripción y un
   `<EstadoBadge>` con `ordenEstado` que viene resuelto en el
   DTO del backend (sin join en el cliente).
4. **Acción nueva: "Ver orden relacionada"** (ROOM_MAP §7) —
   abre `ModalOrden` interno. Como `/api/ordenes` todavía no
   filtra por `equipoId`, trae las órdenes y elige la última
   del equipo; cuando exista el detalle (Parte 5) se cambia por
   endpoint directo.
5. **Búsqueda** sobre tipo, marca, modelo, serie y
   `clienteNombre` — cinco campos, la misma técnica de filtrado
   en cliente.

**Gotcha de esta parte:** el modal `ModalOrden` resetea
`orden` y `cargando` con el patrón **adjust-during-render**
(cuando cambia la prop `equipo`), porque llamar a `setState`
*directamente* en el cuerpo de un `useEffect` está prohibido
por el linter de React 19 / Next 16
(`react-hooks/set-state-in-effect`). El `setState` dentro de
`.then()` / `.catch()` / `.finally()` sí está permitido.

**Verificación (Parte 4):** `pnpm lint` 0/0 · `pnpm build` 0
(rutas `/equipos`, `/equipos/nuevo`) · `pnpm smoke` 5/5 ·
CRUD real POST→PUT→DELETE 201/200/404 ✓ · `?clienteId=2`
filtra ✓ · HTTP 200 en ambas rutas.

### 5.10 Órdenes de servicio — la pantalla central *(Parte 5)*

**Pantallas:** `app/(app)/ordenes/page.tsx` (listado),
`app/(app)/ordenes/nueva/page.tsx` (alta),
`app/(app)/ordenes/[id]/page.tsx` (detalle ⭐),
`components/EstadoStepper.tsx` (línea de progreso),
`components/ui/TextArea.tsx` (nuevo, SDD §12).

**Listado** — buscador + **chips de estado con conteo**
(Todos / cada etapa / Cancelado) que filtran en cliente (el
backend igual acepta `?estado=` si hace falta). Toda la tarjeta
abre el detalle; el click en Eliminar corta la propagación.

**Alta** — cascada **Cliente → sus equipos**; el `usuarioId`
(técnico responsable) que exige el backend queda:

- por defecto **el usuario en sesión** (siempre existe), y
- si el rol es **Admin**, un `Select` con `GET /usuarios`
  (ese endpoint es Admin-only, por eso nadie más lo pide).

Los detalles NO se cargan en el alta: se agregan después desde
el detalle (donde se controla el stock).

**Detalle** — 4 tareas en una pantalla:

1. **Ver** — `EstadoStepper` (SDD §8): los 6 estados del flujo
   con checks; **Cancelado** (rama lateral) muestra un aviso
   propio, porque no pertenece a `FLUJO_ESTADOS`.
2. **Cambiar estado** — botones generados con
   `transicionesDesde(estado)` (espejo de
   `OrdenesController.Transiciones`): la UI solo *ofrece* lo
   válido, pero **el backend revalida** (probarlo: mandar
   `Listo` desde `EnDiagnostico` → 400). La nota opcional se
   guarda en el campo del destino: diagnóstico →
   `EnDiagnostico`, solución → `Listo`, observaciones → el resto.
3. **Editar** — problema / fecha estimada / observaciones por
   `PUT /ordenes/{id}` **sin listados** en el body → el backend
   no toca los detalles.
4. **Detalles** — tablas de servicios y repuestos con
   `× precio`, subtotal y quitar (X); total = `costo`.

**⚠ El gotcha de la parte:** `PUT /ordenes/{id}` **reemplaza
los dos listados completos** si viene con *alguno* de ellos
(`detallesEnviados` es un OR). Para agregar o quitar UNA línea
hay que mandar **siempre los dos arrays**: el que no cambia se
reenvía completo y el que cambia, modificado. Si se manda solo
uno, el otro se vacía. El backend restaura stock y recalcula el
costo en el mismo request; la pantalla re-`GET` la orden para
quedarse con ids/subtotales frescos.

**Roles:** Recepcion no puede ver repuestos
(`GET /repuestos` es Admin/Tecnico → 403), así que su panel se
oculta y `cargar()` trae ese request con `.catch → []` para que
la página no se rompa. Es UX, no seguridad: la API es quien
rechaza.

**Componentes nuevos:**
`TextArea` (texto multilínea con label/error, igual que
`Input`) y `EstadoStepper` (puntos + líneas que se colorean a
medida que se avanza).

**Verificación (Parte 5):** `pnpm lint` 0/0 · `pnpm build` 0
(rutas `/ordenes`, `/ordenes/nueva`, `/ordenes/[id]`) ·
`pnpm smoke` 5/5 · HTTP 200 en las 3 rutas · flujo real de API:
POST 201 (ORD-000014) → transición válida 200 → **transición
inválida 400** ✓ → detalles con costo recalculado (3000) →
cadena de transiciones 200 → DELETE + 404 ✓.

### 5.11 Catálogos: Servicios y Repuestos *(Parte 6)*

**Pantallas:** `app/(app)/servicios/{page,nuevo/page}.tsx`,
`app/(app)/repuestos/{page,nuevo/page}.tsx`,
`components/forms/{ServicioForm,RepuestoForm}.tsx`.

CRUDs del patrón de la Parte 3 con **dos variables nuevas**:
`activo` (el ítem sale del catálogo para nuevas órdenes pero
las viejas lo conservan) y `stock` (inventario).

**Aquí se nota la restricción de roles en la UI:**

| | Servicios | Repuestos |
|---|---|---|
| GET | cualquier autenticado | **solo Admin/Tecnico** |
| POST/PUT/DELETE | Admin/Tecnico | Admin/Tecnico |
| En la UI | Recepcion: **solo lectura** (se ocultan crear/editar/eliminar + aviso "modo solo lectura") | Recepcion: **no ve el ítem en el menú** y si entra por URL muestra "sin acceso" *sin pedir a la API* |

La regla de oro sigue siendo: **la UI oculta lo que el usuario
no puede hacer, pero quien manda es el backend** (probado:
Recepcion → 403 en POST /servicios y en GET /repuestos).

**Detalles:**
- `RepuestoForm` valida precio ≥ 0 y stock entero ≥ 0; al
  editar, el stock se manda tal cual (es el valor de verdad,
  no se "suma").
- Semáforo de stock en la tarjeta: 0 → rojo, 1-3 → ámbar,
  4+ → normal.
- El stock real lo mueven las órdenes (agregar/quitar en el
  detalle, Parte 5), no estas pantallas.
- Sidebar: `PARTE_ACTUAL = 6` + `roles: ['Admin','Tecnico']`
  en el ítem Repuestos (menú filtrado por rol, ya con el
  ítem de Usuarios en Parte 7).

**Verificación (Parte 6):** `pnpm lint` 0/0 · `pnpm build` 0
(15 rutas) · `pnpm smoke` 5/5 · HTTP 200 ×4 · API real: crear/
editar/borrar servicio y repuesto 201/200/200 ✓ · Recepcion
POST servicio **403** ✓ y GET repuestos **403** ✓ · conteos
finales de catálogo restaurados ✓.

### 5.12 Usuarios — módulo solo-Admin *(Parte 7)*

**Pantallas:** `app/(app)/usuarios/page.tsx`,
`app/(app)/usuarios/nuevo/page.tsx`,
`components/forms/UsuarioForm.tsx`.

El módulo más "peligroso" del sistema (define quién puede qué),
protegido en **tres capas**:

1. **Sidebar**: ítem con `roles: ['Admin']` → ni se muestra.
2. **Pantalla**: `tieneRol('Admin')` antes de pedir a la API;
   sin acceso muestra el aviso (mismo patrón que /repuestos).
3. **Backend**: `[Authorize(Roles = "Admin")]` en el controller
   → 403 para el resto (probado con Tecnico → 403 ✓).

**Reglas de negocio que la UI respeta:**

| Regla backend | Comportamiento en la UI |
|---|---|
| Password: solo se cambia si viene no vacía | al editar el campo es **opcional** ("dejar vacío para no cambiar"); al crear, obligatorio |
| Email duplicado → 409 `{ mensaje }` | el mensaje aparece en el form (error rojo) |
| No eliminar tu propio usuario → 400 | el botón 🗑 **ni se muestra** en tu ficha (chip "(vos)") |
| Usuario con órdenes → 409 | el `409` se muestra **dentro del modal** de confirmación y no cierra |
| Rol inválido → 400 | el Select solo ofrece `ROLES` de `types/index.ts` |

**Detalle**: el tono del badge de rol usa los colores del tema
(Admin celeste, Técnico verde, Recepción ámbar) y `activo`
muestra Activo/Inactivo con exito/error.

**Verificación (Parte 7):** `pnpm lint` 0/0 · `pnpm build` 0
(17 rutas) · `pnpm smoke` 5/5 · HTTP 200 ×2 · API real: crear
201 → duplicado **409** → editar sin password 200 (conserva
la contraseña) → **Tecnico GET 403** → borrar + 404 ✓ ·
usuarios seed restaurados (3).

### 5.13 Configuración — cierre del frontend *(Parte 8)*

**Pantalla:** `app/(app)/configuracion/page.tsx`,
`lib/configuracion.ts` (nuevo), `lib/api.ts` (exporta
`API_URL` para el health de la raíz).

Tres bloques con alcances **honestos** sobre lo que la API
soporta hoy:

1. **Datos del taller** (nombre, teléfono, email, dirección):
   **no hay endpoint** en el backend → se guardan en
   `localStorage` de cada navegador (`lib/configuracion.ts`,
   único archivo a tocar cuando exista el endpoint). Carga
   inicial con el truco `Promise.resolve(...).then(setState)`
   porque el linter prohíbe `setState` directo en effects.
2. **Cambiar mi contraseña:** la API **no tiene** endpoint
   "cambiar mi contraseña" (Auth solo: login + me). Un
   **Admin** sí puede reemplazar la suya con
   `PUT /usuarios/{id}` (el mismo de la Parte 7, mandando
   nombre/email/rol de la sesión y `password` nuevo). Los
   demás roles ven el aviso de que solo un Admin puede.
3. **Sistema:** ping al **health en la RAÍZ** del backend
   (`GET /` → `{ servicio, estado }`, distinto de `/api`, por
   eso fetch directo con `API_URL`), sesión actual y stack.
   El botón "Verificar" pone el estado en `probando` desde el
   **handler** (el setState dentro de la función que llama el
   effect estaría prohibido — misma regla de siempre).

**Verificación (Parte 8):** `pnpm lint` 0/0 · `pnpm build` 0
(18 rutas) · `pnpm smoke` 5/5 · HTTP 200 en
`/configuracion` · API real: PUT password → **login con la
nueva** → restaurar → login original ✓ · health raíz
`API TechFix Manager / OK` ✓.

## 6. FLUJO DE PUNTA A PUNTA

### Ejemplo: "crear una orden de reparación" (ya completo, 8/8)

```
1. Admin/Técnico: menú Órdenes → "+ Nueva orden"
   (/ordenes/nueva)
2. Elegir CLIENTE → el select de equipos se filtra en cliente
   → describir problema → responsable = sesión (o técnico si
   es Admin) → POST /api/ordenes
3. CORS → HeaderAuthenticationHandler (¿tiene X-Usuario-Id
   válido y activo?)
4. OrdenesController.Crear:
   a. valida equipo (400) y usuario responsable (400)
   b. arma la orden: estado = 'Recibido', NumeroOrden =
      'ORD-0000xx' autogenerado
   c. responde 201 con la orden completa
5. El frontend navega al listado (/ordenes) y la tarjeta
   nueva aparece (estado Recibido, costo $0)
6. En /ordenes/[id]: "+ Servicio" → el modal arma los DOS
   arrays (servicios + repuestos) → PUT /ordenes/{id} →
   backend recalcula el costo y descuenta stock → la pantalla
   re-GET y muestra el total nuevo
7. Avanzar estados: botón "Diagnóstico" → PUT
   /ordenes/{id}/estado (la UI solo ofrece transiciones
   válidas; el backend revalida con 400 si se salta)
8. "Listo" → "Entregado": el backend pone FechaEntrega solo;
   en /ordenes el chip ya dice Entregado y el stepper queda
   completo (6/6 checks)
```

**El stock en el camino:** agregar repuesto descuenta ·
quitarlo lo restaura · borrar la orden lo restaura todo ·
el costo siempre lo calcula el backend (nunca el frontend).

---

## 7. ERRORES Y CÓMO DEPURAR

**¿La pantalla no muestra nada?**
1. Mirá la consola del navegador (F12): ¿qué request falló?
2. Mirá la terminal de `pnpm dev`: ¿errores de React/TS?

**¿La API responde raro?**
1. Swagger en `http://localhost:5137/swagger`: probá el endpoint a
   mano (con y sin header `X-Usuario-Id`)
2. Terminal de `dotnet run`: stack trace

**Errores típicos:**

| Síntoma | Causa probable |
|---|---|
| 401 en todos lados | API caída, o sesión borrada, o id inexistente |
| 403 | rol insuficiente (mirar tabla §3.4) |
| 400 con `mensaje` | validación o transición de estado inválida |
| CORS error en consola | frontend en un puerto que no es :3000 ni :5173 |
| `fetch failed` | la API no está corriendo |

**Buenas herramientas:**
- `pnpm smoke` → ¿rompí la capa de datos?
- Swagger → ¿el endpoint anda en aislamiento?
- `psql` + queries → ¿los datos están como espero?

---

## 8. HISTORIAL DE DECISIONES

| Cambio | Antes | Después | Por qué |
|---|---|---|---|
| Base de datos | MySQL (`electronicstore`) | PostgreSQL 18 (`techfix_db`) | requisito de la documentación; la BD vieja pertenece a otro proyecto |
| Framework | .NET 8 Minimal APIs | .NET 10 Controllers | requisito documental + estructura más ordenada |
| Autenticación | JWT (token firmado) | header `X-Usuario-Id` | decisión de simplificar manteniendo roles; sin estado en servidor |
| Gestor de paquetes (frontend) | npm | pnpm | instalaciones más rápidas y estrictas |
| Nombre de carpeta | `BackendElectronica` | `Backend` | renombrado al migrar a TechFix |
| Frontend | no existía | Next.js 16 + React 19 + Tailwind v4 (`frontend/`) | 8 partes guiadas, 17 pantallas, patrón CRUD repetido |
| Regla de lint React 19 | setState libre en effects | `react-hooks/set-state-in-effect` | obliga al patrón *adjust-during-render* y a poner `setState` en `.then()` o handlers |
| Configuración del taller | quería endpoint | `localStorage` (documentado) | la API no expone endpoint; se aísla en `lib/configuracion.ts` |
| Cambiar contraseña propia | endpoint nuevo | solo Admin vía `PUT /usuarios/{id}` | sin tocar el backend; el resto de roles lo ve como aviso |

---

*Documento vivo. Se actualiza al final de cada parte del desarrollo.*
*Última actualización: Parte 8 — FRONTEND COMPLETO (configuración, health del sistema y cierre de las 8 partes).*
