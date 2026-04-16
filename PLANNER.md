# Planificación del Sistema SaaS Interno: OB-Workspace

Este documento sirve como la guía principal para el desaorrollo completo de la plataforma OB-Workspace. A continuación se detalla la planificación lógica, arquitectónica y conceptual del sistema, libre de código, orientada a mantener escalabilidad y buenas prácticas.

---

## 1. Arquitectura del Sistema (Alto Nivel)

El sistema será desarrollado bajo el stack ya definido en el proyecto: **Next.js (App Router), TypeScript, Tailwind CSS, Prisma y shadcn/ui.**
Se utilizará una arquitectura basada en **Server Components (RSC)** y **Server Actions** para delegar la carga de operaciones al servidor, asegurar la seguridad de la información y obtener un rendimiento óptimo.

*   **Frontend / UI Layer:** Next.js (Client Components solo cuando haya interactividad). Todo basado en shadcn/ui.
*   **Backend / API Layer:** Next.js Server Actions y Route Handlers (donde aplique para webhooks externos o integraciones).
*   **Database Layer:** PostgreSQL gestionado vía Prisma ORM.
*   **AI Layer:** Integración con OpenRouter vía API REST.
*   **Auth Layer:** Sistema robusto autentificación y RBAC (Role-Based Access Control) con control dinámico.

---

## 2. División en Módulos Técnicos

El proyecto se dividirá en los siguientes módulos principales para facilitar su mantenimiento:

### Módulo de Identidad y Acceso (Auth & RBAC)
*   Gestión de sesiones, login, registro y recuperación de contraseña.
*   Resolución dinámica de roles y permisos por contexto.

### Módulo Core (Proyectos, Módulos, Tickets, Subtareas)
*   Operaciones CRUD jerárquicas.
*   Cálculo de métricas derivadas (tiempo y progreso en forma de cascada: Subtarea -> Ticket -> Módulo -> Proyecto).

### Módulo Colaborativo
*   Asignaciones múltiples, comentarios en tickets, modificaciones guiadas.
*   Gestión dinámica de "miembros del equipo".

### Módulo de Time Tracking
*   Máquina de estado para controlar los turnos por usuario (Start, Pause, Stop).
*   Registro de `WorkSessions` ligadas a las subtareas.

### Módulo Financiero (Gastos y Suscripciones)
*   Registro de gastos recurrentes vs puntuales.
*   Panel financiero de CEO.

### Módulo de Portal Externo
*   Interfaces seguras limitadas a creación y visualización mínima para el rol `External Client`.

### Módulo IA Asistente
*   Chat inteligente capaz de parsear intenciones del usuario en mutaciones de la base de datos (Ej: Crear subtareas automáticamente).

### Módulo de Notificaciones
*   Notificaciones in-app y workers para envío de correos.

---

## 3. Estructura de Carpetas

La estructura respetará el estándar de Next.js App Router (colocation):

```
ob-workspace/
├── app/
│   ├── (auth)/                # Pantallas de login, registro, recuperación
│   ├── (dashboard)/           # Layout principal autenticado
│   │   ├── projects/          # Lista y detalles de Proyectos y Módulos
│   │   ├── tickets/           # Kanban, detalle visual de tickets
│   │   ├── tracking/          # Dashboard de turnos y métricas de desarrollador
│   │   ├── expenses/          # Módulo de gastos (acceso condicional)
│   │   ├── chat-ai/           # Interfaz de IA con OpenRouter
│   │   └── admin/             # Gestión de roles (solo CEO)
│   ├── (portal)/              # Portal externo para clientes
│   └── api/                   # Webhooks y endpoints específicos (ej. Notificaciones, webhooks OpenRouter)
├── components/
│   ├── ui/                    # Componentes base de shadcn modificados
│   ├── core/                  # Componentes de negocio (TicketCard, KanbanBoard, Timer, etc)
│   └── layout/                # Navbars, sidebars, headers
├── lib/
│   ├── prisma.ts              # Cliente DB
│   ├── auth.ts                # Utilidades de sesión y tokens
│   ├── permissions.ts         # Resolución de permisos granulares por contexto
│   └── openrouter.ts          # Integración IA
├── prisma/
│   └── schema.prisma          # End source of truth para la BD
└── actions/                   # Server Actions separadas por dominio
    ├── tickets.ts
    ├── tracking.ts
    ├── expenses.ts
    └── users.ts
```

---

## 4. Diseño del Modelo de Datos (Conceptual)

El modelo se basa en garantizar la trazabilidad de tiempos y relaciones de negocio. (Gran parte ya existe en `schema.prisma`, debe ajustarse a esta narrativa).

*   **User:** Email, Role (Enum), metadatos.
*   **Project:** Entidad superior.
*   **Module:** Entidad intermedia (pertenece a un Project).
*   **Ticket:** Mantiene estado, prioridad. Tiene relaciones complejas hacia `User`: un responsable principal y múltiples colaboradores. Pertenece a un Module.
*   **Subtask:** La unidad funcional. Tiene *estado* y *tiempo estimado*. Pertenece a un Ticket. Tiene un responsable asociado.
*   **WorkSession:** Elemento base del Time Tracking. Contiene un `startTime`, `endTime`, `duration` y se asocia a una Subtarea y a un Usuario.
*   **Expense / Subscription:** Monto, tipo (interno, empresa, recurrente), asociación opcional a Project.
*   **Comment:** (Sugerido para funcionalidad 2). Asociado a Tickets.
*   **Notification:** Registro de los avisos del sistema a los usuarios.

*Regla crítica DB:* El tiempo no se guarda "hardcodeado" como final en los tickets. Los queries calcularán el tiempo sumando las sesiones de las subtareas internamente para evitar des-sincronizaciones (o se utilizarán middlewares de Prisma para actualizar campos derivados concurrentes).

---

## 5. Flujos Clave del Sistema

### Flujo A: Creación de Tickets
1.  Rol de negocio (CEO u External Client) diligencia datos básicos en la interfaz.
2.  (Opcional): Se le invoca a la IA para expandir la descripción y separar automáticamente el Ticket en N Subtareas con tiempos estimados predictivos.
3.  El Server Action se invoca transaccionalmente -> Se crea el ticket -> Se guardan las subtareas -> Se genera evento de notificación.

### Flujo B: Time Tracking Automático (Sistema de turnos)
1.  Usuario selecciona una subtarea desde su panel y presiona "Start".
2.  Se crea una fila en `WorkSession` con `startTime = now()`. Se marca la subtarea en status `DOING`.
3.  Al pausar o finalizar, se hace fetch a un Server Action enviando el id de la `WorkSession`. Se calcula la diferencia, se guarda el `endTime`, se totaliza la duración, y se suma ese valor al acumulado de la subtarea (`realTime`).

### Flujo C: Notificaciones
1.  Las Server Actions de mutación evalúan condiciones relevantes.
2.  Llaman a un handler central (`notifyUser({ event, toUserId })`) de forma asincrónica.
3.  El registro se guarda como in-app en base de datos.
4.  Si amerita email, se despacha un llamado al servicio de correos en background.

---

## 6. Diseño Global de Roles y Permisos

Los permisos no solo son globales, dependen del contexto del objeto visitado (ABAC/RBAC).
Se implementará una función core `can(user, action, resource)` en el servidor.

*   `CEO`: True global en casi todo. Menú completo visible.
*   `External Client`: Rol limitado a la ruta de `(portal)`. Sus consultas de DB forzan condicionales a ver solo tickets que él haya creado.
*   `Developer` e `Intern`:
    *   Pueden ver Kanban general.
    *   Autorización de editar o mover un ticket depende de que el ID del Developer esté presente en `ticket.leadId` o `ticket.collaborators`.
    *   El intern solo podrá ver UI y actuar en cosas sobre las que ha sido nombrado responsable explícito.

---

## 7. Módulo de Gastos

Se definirá un dashboard visible solo para el rol `CEO`.
Soportará:
*   Registro manual de recibos/gastos (Montos, fechas, proyectos atados).
*   Registro de Suscripciones (recurrencias mensuales).
Para manejar la "recurrencia" de la suscripción sin cronjobs complejos iniciales, se guardarán las suscripciones con una fecha de creación y un intervalo. Un query dinámico en el panel de CEO indicará cuánto se debe este mes filtrando por pagos registrados contra el mes en curso (o se montará una tarea asíncrona de Vercel Cron).

---

## 8. Estrategia con Inteligencia Artificial (OpenRouter)

La IA actuará como un "Sidekick" a demanda.
**Casos de uso definidos:**
1.  **Ticket Architect:** Botón mágico habilitado al crear tickets. Toma texto crudo "La vista Home crashea a veces" -> OpenRouter -> Devuelve un objeto JSON estructurado con Título pro, Descripción técnica y lista propuesta de Subtareas con minutos estimados.
2.  **Conversacional:** En la ruta de chat o portal, el usuario escribe en formato libre. El modelo LLM mediante Tool Calling determina si ejecutar la herramienta `create_ticket(args)`.
Se usará Server Actions que instancian el cliente de openrouter, envían prompts controlados vía JSON Mode o function/tool calling.

---

## 9. Estrategia de Escalabilidad

*   **Rendimiento en Base de datos:** Agregación pre y post: Al sumar métricas de tiempo para los Proyectos y el Dashboard Global, las consultas podrían lastrar la BD en gran volumen. Se implementarán Server Components con _Next.js caching (use cache / revalidate)_ limitados según contexto para la analítica global del CEO.
*   **Paginación Natural:** Implementada por defecto en el kanban/tickets table.
*   **Arquitectura de UI:** Se utilizarán Server Actions estrictamente tipados. Composición de shadcn sobre Server components para que el bundle del lado de cliente sea lo más pequeño posible.

---

## 10. Posibles Riesgos y Mitigaciones

1.  **Incongruencias con el Time Tracking**
    *   **Riesgo:** El programador deja su sesión activa el fin de semana y acumula cientos de horas fantasma.
    *   **Mitigación:** Capar o enviar alertas si una sesión sobrepasa un turno de 8 a 10 horas y auto-finalizarla.
2.  **Abuso de API por OpenRouter**
    *   **Riesgo:** Un usuario genera llamadas iterativas de manera abusiva.
    *   **Mitigación:** Rate limit basado en IP/usuario. Uso de modelos económicos (Claude Haiku o similares disponibles por OpenRouter) para tareas ligeras, reservando modelos más pesados para complejas con reintentos controlados.
3.  **Filtración de Datos al Portal Externo**
    *   **Riesgo:** Un cliente con enlace web puede explorar la jerarquía técnica o ver gastos del proyecto.
    *   **Mitigación:** Middleware fuerte en `(portal)` que prevenga rutas y forzar `where: { clientId: currentUser.id }` en cada Prisma query usado desde esas rutas.

***
*Plan generado para el agente Antigravity -> Continúa la ejecución basándote en estos lineamientos.*
