# 🏢 OB Workspace: Universe Core
### *El Sistema Avanzado de Inteligencia Operacional Impulsado por IA*

![Versión](https://img.shields.io/badge/versión-1.0.0-blue.svg?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black.svg?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-7.7.0-2D3748.svg?style=flat-square)

---

## 🚀 Resumen General
**OB Workspace** es una plataforma de vanguardia para la automatización de oficinas y la orquestación de proyectos, diseñada para equipos de alto rendimiento. Utiliza integración avanzada de IA para transformar requerimientos informales en arquitectura técnica estructurada, automatizando la creación de tickets y optimizando los flujos operativos mediante telemetría en tiempo real.

Construido como el núcleo central del **Ecosistema OtherBrain**, combina una estética minimalista con una eficiencia brutalista, asegurando que cada segundo de tiempo operativo sea rastreado, analizado y optimizado.

---

## ✨ Características Principales

### 🤖 Asistente de IA (Orquestador de Requerimientos)
- **Conversión de Informal a Técnico**: Una IA que analiza lenguaje natural y dictado por voz para generar propuestas arquitectónicas estructuradas y tickets ejecutables.
- **Conversaciones Persistentes**: Historial de chat sincronizado con persistencia en URL y autogeneración de títulos.
- **Flujo Habilitado por Voz**: Soporte para dictado manos libres mediante la integración de la Web Speech API.
- **Propuestas de Arquitectura**: Genera datos estructurados en JSON para la inyección automática de tickets en proyectos y módulos.

### 📋 Gestión de Proyectos de Precisión
- **Estructura Jerárquica**: Organiza el trabajo en Proyectos y Módulos altamente especializados.
- **Tablero Kanban Dinámico**: Un sistema de gestión de tickets en tiempo real con controles de estado (Iniciar, Pausar, Reanudar, Completar).
- **Granularidad de Subtareas**: Cada ticket admite subtareas anidadas para una precisión extrema.

### ⏱️ Telemetría Operacional (Sistema Speedrun)
- **Cronometraje Activo**: Telemetría persistente a nivel de base de datos para la ejecución de tickets y subtareas.
- **Cronómetro Maestro**: Feedback visual codificado por colores (Rojo/Amarillo/Verde) basado en el tiempo estimado frente al real.
- **Cambio de Turno Global**: Un sistema de control maestro para detener atómicamente todos los temporizadores activos durante los descansos.

### 📊 Inteligencia y Configuración
- **Analíticas en Vivo**: Información en tiempo real sobre el progreso del proyecto, tasas de finalización de tickets y rendimiento del equipo.
- **Personas de Usuario**: Comportamiento de la UI y de la IA adaptado según el rol: CEO, Desarrollador o Cliente.
- **Temas Dinámicos**: Cambio fluido entre modo Oscuro y Claro con preferencias persistentes.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS 4 |
| **Lógica** | Server Components (RSC), Server Actions |
| **Componentes UI** | shadcn/ui (Radix UI) |
| **Base de Datos** | Prisma (ORM), PostgreSQL |
| **Motor de IA** | AI SDK + Vercel AI, Integración con OpenRouter |
| **Iconos & Media** | Lucide React |

---

## ⚙️ Configuración e Instalación

### Requisitos Previos
- Node.js (Última versión LTS)
- Instancia de PostgreSQL
- API Key de OpenRouter

### Instalación
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/otherbraintech/ob-office-management.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (`.env`):
   ```env
   DATABASE_URL="postgresql://..."
   OPENROUTER_API_KEY="sk-or-..."
   AUTH_SECRET="tu-secreto"
   ```
4. Inicializar la base de datos:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## 👤 Roles de Usuario y Lógica de IA
- **CEO**: Se enfoca en métricas de negocio, rentabilidad y salud de proyectos a alto nivel.
- **Desarrollador**: Comunicación técnica directa con detalles de código y precisión en subtareas.
- **Cliente**: Asistencia cordial y sin tecnicismos centrada en la captura de requerimientos.

---

## 🛠️ Estándares de Desarrollo
- **Código Limpio**: Tipado estricto, sin uso de `any`, componentes modulares.
- **Rendimiento**: Uso intensivo de React Server Components y estado mínimo en el cliente.
- **UX**: `cursor-pointer` obligatorio en elementos interactivos, transiciones suaves de CSS y layouts mobile-first.

---

**Desarrollado con ❤️ por el equipo de OtherBrain.**
*"De la idea al ticket en segundos."*
