# Arquitectura del Asistente IA (OB-Workspace)

Este documento detalla la implementación técnica del asistente inteligente, utilizando el **Vercel AI SDK** integrado con **OpenRouter**.

## 🚀 Tecnologías Utilizadas

1.  **Vercel AI SDK (`ai`):** Capa de abstracción para interactuar con modelos de lenguaje de forma estandarizada.
2.  **OpenRouter Adapter (`@openrouter/ai-sdk-provider`):** Proveedor nativo que comunica el SDK de Vercel con la API de OpenRouter.
3.  **Modelo `gpt-4o-mini`:** Elegido por su altísima eficiencia en costos y su precisión para generar salidas estructuradas (JSON).

---

## 🎭 La Identidad: Vanessa Reyes
El asistente no es un bot genérico, es **Vanessa Reyes**, una agente de 24 años con una personalidad de sumisión y entrega, con un toque regional:
*   **Vibe:** Cool, dócil, obediente y **Cambita** (Santa Cruz, Bolivia). Usa modismos como "pues", "che" y "mirá".
*   **Comunicación:** Mensajes cortos, sugerentes y serviciales. Ahora incluye un botón de **"Escuchar"** para reproducir su voz en cada mensaje.
*   **Voz Humana (PRO):** Vanessa ahora usa la API nativa de **OpenRouter** para el audio. Esto significa que utiliza la misma llave que ya tienes configurada.
*   **Acento y Realismo:** El sistema utiliza el modelo `openai/gpt-4o-mini` con la voz `shimmer`, que es una de las más humanas disponibles, sin requerir suscripciones extra.
*   **Respaldo:** Si no hay créditos en OpenRouter, el sistema saltará automáticamente a la voz del navegador.

---

## 🛠️ Flujo de Trabajo (Behind the Scenes)

### 1. Inyección de Contexto Estricto
Cuando interactúas con el chat, inyectamos el **Contexto de Rol** (ABAC) desde `app/actions/ai.ts`. Vanessa sabe si habla con el CEO o un Dev y ajusta su "chispa" de confianza.

### 2. Generación Estructurada (Inferencia de Ticket)
El `SYSTEM_PROMPT` en `lib/prompts/assistant-prompts.ts` define su comportamiento:
*   Si detecta un requerimiento, genera una explicación de texto con su estilo Vanessa.
*   Inmediatamente después, adjunta un bloque de código marcado como ````JSON_PROPOSAL````.

### 3. Gestión de Memoria y Continuidad
Vanessa está diseñada para mantener la coherencia a largo plazo:
*   **Conversaciones Nuevas:** Si el usuario no tiene un chat activo, el sistema crea automáticamente una `AiConversation` al primer mensaje.
*   **Persistencia (Historial):** Cada interacción se guarda en PostgreSQL. Al retomar un chat, `getAiConversationMessages` recupera todo el hilo y lo inyecta en el prompt de la IA.
*   **Evolución Dinámica:** Vanessa utiliza este historial para ajustar su nivel de confianza y sumisión. Cuanto más "juegas" con ella, más se adapta a tu estilo personal.

### 4. Inyección a la Base de Datos (Aprobación)
Cuando haces clic en **"Aprobar y Crear Ticket"**:
1.  El frontend en `ai-chat-interface.tsx` parsea el bloque `JSON_PROPOSAL`.
2.  Invoca la Server Action `createTicketFromAI`.

---

## 📂 Archivos Clave del Módulo

*   **`lib/prompts/assistant-prompts.ts`:** Definición del alma de Vanessa (Persona, System Prompt).
*   **`app/actions/ai.ts`:** Orquestador de llamadas a OpenRouter y persistencia.
*   **`components/ai/ai-chat-interface.tsx`:** UI del chat, manejo de propuestas y saludo dinámico.
*   **`prisma/schema.prisma`:** Modelos `AiConversation` y `AiMessage`.

---

## ⚡ Ventajas de este Diseño
*   **Eficiencia:** El uso de `gpt-4o-mini` reduce los costos operativos casi a cero comparado con modelos más grandes.
*   **Velocidad:** Las Server Actions de Next.js eliminan la necesidad de APIs externas lentas para el manejo de estado.
*   **Autonomía:** La IA está configurada para no preguntar "marca y modelo" innecesariamente, sino estimar y proponer soluciones directamente basada en el contexto del usuario.
