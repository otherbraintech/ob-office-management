# OB-OfficeManagement: Guía de Referencia Técnica y Funcional

Este documento sirve como fuente de verdad para el sistema OfficeManagement de Otherbrain.

---

## 🏗️ ARQUITECTURA GENERAL
- **Framework:** Next.js 16.2.3 (Turbopack).
- **Base de Datos:** PostgreSQL con Prisma ORM y adaptador Edge.
- **Tipografía:** Inter (Configurada globalmente).
- **Estructura de Rutas:** Agrupación bajo `(dashboard)` para acceso protegido.

---

## 🧩 MÓDULOS DE NEGOCIO

### 1. Gestión de Trabajo (Tickets & Kanban)
- **Modelo:** Project -> Module -> Ticket -> Subtask.
- **Kanban:** Ubicado en la página principal del Dashboard (`DashboardOverview`).
- **Lógica:** Solo las subtareas tienen tiempo estimado. El tiempo del ticket es la suma de sus subtareas.
- **Vistas:**
  - `Panel de Control`: Kanban general.
  - `Mis Tickets`: Listado personal de tareas.

### 2. Time Tracking (Sistema de Turnos)
- **Componente:** `ActiveTimer` (Lado del cliente).
- **Backend:** `WorkSession` en Prisma.
- **Flujo:** Iniciar turno vincula una subtarea activa. Al finalizar, se calcula la duración y se suma al `realTime` de la `Subtask`.
- **Rutas:** `/dashboard/timer` y `/dashboard/timer/logs`.

### 3. IA (OpenRouter)
- **Key:** Almacenada en `OPENROUTER_KEY` (.env).
- **Funcionalidad:** Chat conversacional para crear tickets automáticamente, desglosar subtareas y estimar tiempos.
- **Servicio:** `lib/ia/openrouter.ts`.

### 4. Finanzas e Ingenieria de Gastos
- **Gastos:** `INTERNAL`, `COMPANY`, `RECURRING`.
- **Suscripciones:** Seguimiento de pagos periódicos con alertas de fecha de factura.
- **Métricas:** Rentabilidad por proyecto calculada en tiempo real.

---

## 🔐 SEGURIDAD Y PERMISOS
- **Roles:** CEO, DEVELOPER, INTERN, EXTERNAL_CLIENT.
- **Navegación:** Barra lateral dinámica que usa etiquetas directas (no acordeones) para mayor fluidez.
- **Auth:** Server Actions en `app/actions/auth.ts`.

---

## 🎨 ESTÁNDARES DE UI
- **Componentes:** Shadcn UI (Badge, Table, Tabs, Cards, Button, etc.).
- **Identidad:** Uso de `obom-presentation.svg` en pantallas de autenticación.
- **Localización:** 100% Español.

---

## 📂 REGLAS DE DESARROLLO
1. Todas las páginas nuevas deben ir dentro de `app/(dashboard)/`.
2. Usar Server Components para data fetching siempre que sea posible.
3. Las mutaciones deben realizarse a través de Server Actions.
4. Mantener el diseño responsivo y mobile-first.
