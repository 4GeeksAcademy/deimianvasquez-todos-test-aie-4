# Lista de tareas con roles

App de registro e inicio de sesión. Cada usuario ve y administra solo sus tareas. El admin, además, ve la lista de usuarios registrados.

El permiso extra del admin es ver usuarios. No ve ni edita las tareas de los demás.

## Stack

- Monorepo con dos carpetas: `backend/` y `frontend/`.
- Back: FastAPI, TinyDB, JWT en cookie `httpOnly`, bcrypt. Mismo patrón que el ejemplo de autenticación del curso.
- Front: Next.js.
- La cookie se llama `access_token`. Atributos: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` según configuración.
- El front llama al back con `credentials: "include"`.
- CORS del back permite el origen del front y `allow_credentials=True`.

## Fuera de alcance

Comentarios, adjuntos, etiquetas, fechas de vencimiento, paginación, recuperación de contraseña y que el admin edite o borre tareas ajenas.

## Roles

Solo dos: `user` y `admin`.

| Acción | Sin sesión | user | admin |
|---|---|---|---|
| Registrarse e iniciar sesión | sí | sí | sí |
| Ver y editar sus tareas | no | sí | sí |
| Ver la lista de usuarios | no | no | sí |
| Ver, editar o borrar su usuario | no | solo el suyo | solo el suyo |
| Ver o editar tareas de otro | no | no | no |

El registro no acepta `role` en el body. Si el email es `dvasquez@4geeksacademy.com`, el rol guardado es `admin`. Cualquier otro email queda como `user`.

## Datos

Usuario:

- `id`
- `name`
- `email` único
- `password_hash` (nunca se devuelve)
- `role`: `user` o `admin`
- `created_at`
- `updated_at`

Tarea:

- `id`
- `title` texto no vacío
- `done` boolean, por defecto `false`
- `owner_id`
- `created_at`

Respuesta pública de usuario: `id`, `name`, `email`, `role`, `created_at`, `updated_at`.

## API

### Auth y usuarios

`POST /users`  
Registro. Body: `name`, `email`, `password`.  
201 con el usuario público. 409 si el email ya existe. 422 si el body es inválido.  
El rol lo asigna el servidor: `admin` solo para `dvasquez@4geeksacademy.com`, `user` para el resto.

`POST /auth/login`  
Body: `email`, `password`.  
200 y setea la cookie. 401 si el email no existe o la contraseña no coincide. El mensaje es el mismo en ambos casos.

`POST /auth/logout`  
200 y borra la cookie.

`GET /users/me`  
200 con el usuario de la cookie. 401 sin cookie o con token inválido.

`GET /users`  
200 con la lista de usuarios públicos, solo si `role` es `admin`.  
401 sin sesión. 403 si el rol es `user`.

`GET /users/{id}`  
200 si la sesión es de ese usuario. El admin también solo puede ver el suyo por id.  
401 sin sesión. 403 si es otro usuario. 404 si no existe.

`PATCH /users/{id}`  
Body opcional: `name`, `email`, `password`.  
200 con el usuario actualizado. Actualiza `updated_at`. El `role` no cambia.  
401 sin sesión. 403 si es otro usuario. 404 si no existe. 409 si el email ya está registrado.

`DELETE /users/{id}`  
204 si lo borra el propio usuario.  
401 sin sesión. 403 si es otro usuario. 404 si no existe.

### Tareas

Todas exigen sesión. Sin sesión: 401.

`GET /tasks`  
200 con las tareas cuyo `owner_id` es el usuario de la cookie. Si no tiene, la lista va vacía.

`GET /tasks/{id}`  
200 si la tarea es del usuario de la cookie.  
401 sin sesión. 404 si no existe o si es de otro usuario. El admin también recibe 404 sobre una tarea ajena.

`POST /tasks`  
Body: `title`.  
201 con la tarea. `owner_id` sale de la cookie, no del body. `done` empieza en `false`.  
422 si `title` viene vacío.

`PATCH /tasks/{id}`  
Body opcional: `title`, `done`.  
200 con la tarea actualizada.  
404 si no existe o si `owner_id` no es el usuario actual. El admin también recibe 404 sobre una tarea ajena.

`DELETE /tasks/{id}`  
204 si la borra el dueño.  
404 si no existe o si no es el dueño.

## Front

Públicas:

- `/register`: nombre, email, contraseña. Al terminar, redirige a `/login`.
- `/login`: email y contraseña. Al terminar, redirige a `/tasks`.

Protegidas. Sin sesión redirigen a `/login`:

- `/tasks`: lista de las tareas propias, formulario para crear, marcar hecha y borrar.
- `/admin/users`: tabla con nombre, email y rol. Solo entra el admin. Un `user` que abre la URL ve un mensaje de acceso denegado, sin la lista.

Nav, según `GET /users/me`:

- Sin sesión: enlaces a registro e ingreso.
- Con sesión: enlace a tareas y botón de cerrar sesión.
- Con `role = admin`: también el enlace a usuarios.

## Reglas que no se pueden saltar

1. La contraseña se guarda hasheada.
2. Ningún endpoint devuelve `password_hash`.
3. El rol no se acepta desde el cliente.
4. `owner_id` no se acepta desde el cliente.
5. Una tarea ajena responde 404, tanto para `user` como para `admin`.
6. 401 significa sin sesión válida. 403 significa sesión válida sin permiso.
7. El enlace de usuarios no se renderiza si el rol no es `admin`.

## Tests

Se testean las dos partes. Cada capa cubre una cosa distinta.

### Back (pytest + TestClient)

Base de datos temporal por test, para no tocar `data/db.json`.

- Registrar con `dvasquez@4geeksacademy.com` crea `role = admin`. Cualquier otro email crea `role = user`, aunque el body mande `admin`.
- Email repetido devuelve 409.
- Login correcto setea la cookie. Login incorrecto devuelve 401 y no setea cookie.
- `GET /users/me` sin cookie devuelve 401.
- `GET /tasks` sin cookie devuelve 401.
- Un usuario solo recibe sus tareas.
- `GET`, `PATCH` y `DELETE` de una tarea ajena devuelven 404.
- `GET /users` con rol `user` devuelve 403.
- `GET /users` con rol `admin` devuelve 200 y la lista no incluye `password_hash`.
- Logout borra la cookie y el siguiente `GET /users/me` devuelve 401.

### Front (Vitest + Testing Library)

Se mockea la API.

- Sin sesión, la página de tareas redirige a `/login`.
- Con sesión `user`, se ve el formulario y la lista, y no se ve el enlace de usuarios.
- Con sesión `admin`, se ve el enlace de usuarios.
- Un `user` en `/admin/users` ve acceso denegado y no ve la tabla.
- Enviar el formulario de crear tarea llama al endpoint con el título escrito.
- Marcar hecha y borrar llaman a `PATCH` y `DELETE` de esa tarea.

No hace falta un navegador real para estos casos. Playwright queda para después, si se quiere recorrer registro, login y lista en un solo flujo.
