# Arquitectura del Asistente IA (OB-Workspace)

Este documento detalla la implementación técnica del asistente inteligente, utilizando el **Vercel AI SDK** integrado con **OpenRouter**.

## 🚀 Tecnologías Utilizadas

1.  **Vercel AI SDK (`ai`):** Capa de abstracción para interactuar con modelos de lenguaje de forma estandarizada.
2.  **OpenRouter Adapter (`@openrouter/ai-sdk-provider`):** Proveedor nativo que comunica el SDK de Vercel con la API de OpenRouter.
3.  **Modelo `gpt-4o-mini`:** Elegido por su altísima eficiencia en costos y su precisión para generar salidas estructuradas (JSON).

---

## 🛠️ Flujo de Trabajo (Behind the Scenes)

### 1. Inyección de Contexto Estricto
Cuando interactúas con el chat, no solo enviamos tus mensajes. En `app/actions/ai.ts`, inyectamos un **Contexto de Rol** (ABAC) de forma oculta al final del último mensaje del usuario. Esto permite que la IA sepa si está hablando con un CEO, un Dev o un Cliente, adaptando su tono y nivel de detalle técnico sin que el usuario vea estas instrucciones.

### 2. Generación Estructurada (Inferencia de Ticket)
El `SYSTEM_PROMPT` en `lib/ia/openrouter.ts` obliga a la IA a seguir un patrón de diseño:
*   Si detecta un requerimiento, genera una explicación de texto.
*   Inmediatamente después, adjunta un bloque de código marcado como `JSON_PROPOSAL`.

### 3. Persistencia de Conversaciones
A diferencia de un chat efímero, cada mensaje se guarda en PostgreSQL (vía Prisma) mediante las tablas `AiConversation` y `AiMessage`. 
*   **Creación al vuelo:** Si mandas un mensaje en un chat nuevo, el sistema genera automáticamente un título basado en tus primeras palabras y guarda la sesión.
*   **Historial:** Al navegar por la barra lateral del chat, cargamos los mensajes pasados directamente desde la base de datos para mantener el hilo de trabajo.

### 4. Inyección a la Base de Datos (Aprobación)
Cuando haces clic en **"Aprobar y Crear Ticket"**:
1.  El frontend parsea el bloque `JSON_PROPOSAL` generado por la IA.
2.  Envía esos datos estructurados (Título, Descripción, Prioridad, Subtareas) a la Server Action `createTicketFromAI`.
3.  Prisma crea el ticket y todas sus subtareas asociadas con las duraciones que la IA estimó por sí misma.

---

## 📂 Archivos Clave del Módulo

*   **`lib/ia/openrouter.ts`:** Configuración del SDK de Vercel y definición del comportamiento base (System Prompt).
*   **`app/actions/ai.ts`:** Lógica de servidor para orquestar las llamadas a la IA y la persistencia en BD.
*   **`components/ai/ai-chat-interface.tsx`:** Interfaz de usuario que maneja el estado del chat, los indicadores de carga y el renderizado dinámico de propuestas.
*   **`prisma/schema.prisma`:** Definición de los modelos `AiConversation` y `AiMessage`.

---

## ⚡ Ventajas de este Diseño
*   **Eficiencia:** El uso de `gpt-4o-mini` reduce los costos operativos casi a cero comparado con modelos más grandes.
*   **Velocidad:** Las Server Actions de Next.js eliminan la necesidad de APIs externas lentas para el manejo de estado.
*   **Autonomía:** La IA está configurada para no preguntar "marca y modelo" innecesariamente, sino estimar y proponer soluciones directamente basada en el contexto del usuario.
