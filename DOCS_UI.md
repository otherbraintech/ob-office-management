# Sistema de Diseño UI/UX (Brutalist Pro)

Este documento detalla la filosofía y la implementación técnica de la interfaz de usuario en OB-Office Management.

## 🎨 Filosofía Visual: Brutalismo Pro
El sistema utiliza una estética **"Industrial/Technical"** que prioriza la claridad operativa, la velocidad y la densidad de información, sin sacrificar el refinamiento visual.

### Principios Clave:
1.  **Bordes Duros:** Uso de `rounded-none` para evocar precisión técnica y robustez.
2.  **Tracking Negativo:** Uso extensivo de `tracking-tighter` en encabezados para un look moderno y agresivo.
3.  **Tipografía Mono:** Uso de fuentes monoespaciadas para datos de telemetría y métricas (tiempo, IDs, deltas).
4.  **Jerarquía de Datos:** Los metadatos se presentan en tamaños de fuente pequeños (8px-10px) con `font-black` y `uppercase` para una legibilidad estilo terminal.

---

## 👤 Módulo de Perfil (Social-Op Center)

El perfil ha sido rediseñado como un **Centro de Operaciones Personal**, fusionando la identidad social con el rendimiento técnico.

### Componentes de la Vista:
*   **Encabezado de Cobertura (Cover):** Un header dinámico con patrones de cuadrícula y gradientes radiales que establecen el tono visual del entorno.
*   **Tarjeta de Identidad (`ProfileForm`):** 
    *   Avatar circular destacado con efecto de escala y brillo en hover.
    *   Badge de rol dinámico y estado operativo con animación pulse.
    *   Formulario de configuración responsivo integrado directamente en el perfil.
*   **Consola de Rendimiento (`ProfileHistory`):**
    *   **Métricas en Tiempo Real:** Visualización pro de horas totales, productividad (Man-Hours) y misiones completadas.
    *   **Historial de Despliegue:** Lista interactiva de tickets con análisis de delta (Profit vs Retraso) calculado automáticamente.
    *   **Desglose Técnico:** Subtareas con indicadores de eficiencia individual.

---

## 📱 Responsividad y Adaptabilidad (Pro Responsive)

El sistema utiliza un enfoque **Mobile-First Enhanced**:
1.  **Layout Dinámico:** En escritorio (LG+), el perfil se divide en una columna de identidad fija y una consola de actividad expansiva. En dispositivos móviles, los elementos se apilan estratégicamente manteniendo la jerarquía de prioridad.
2.  **Contenedores Backdrop:** Uso de `backdrop-blur-sm` y `bg-background/50` para separar capas de información sin perder la profundidad del entorno.
3.  **Interacciones Smooth:** Integración de animaciones nativas de Tailwind y transiciones `animate-in` para estados de edición y visualización.

---

## 🛠️ Stack de UI
*   **Core:** shadcn/ui (Tailwind CSS + Radix UI).
*   **Iconografía:** Lucide React (Consistente para acciones técnicas).
*   **Feedback:** Sonner (Notificaciones toast para acciones de perfil).
*   **Almacenamiento de Medios:** Integración con `uploadToObFile` para gestión de avatares.
