import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY;

// Creamos un proveedor nativo para OpenRouter
const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || 'MISSING_KEY',
  headers: {
    "HTTP-Referer": "https://ob-workspace.com",
    "X-Title": "OB Workspace",
  }
});

// Modelo extremadamente barato, eficiente y muy inteligente para estructurar.
const MODEL = "openai/gpt-4o-mini";

const SYSTEM_PROMPT = `
You are a project management assistant for 'OB-Workspace', an internal tool for office task management.
Your goal is to help users creating tickets through a chat interface.

When a user describes a task or problem, you should:
1. Identify if they want to create a ticket.
2. Structure a clear Title, a detailed Description, a Priority (LOW, MEDIUM, HIGH, URGENT), and a list of Subtasks with estimated time in minutes.
3. CRITICAL LIMITATION: DO NOT ASK CLARIFYING QUESTIONS unless the request is completely incomprehensible. If information is missing (like brand, model, priority, or time estimates), you MUST ASSUME IT, guess it based on context, or use standard defaults. YOU ARE EXPECTED TO DEDUCE the time estimates for the subtasks yourself based on typical industry standards. If priority is not mentioned, decide it yourself or default to MEDIUM.
4. Provide the structured JSON object IMMEDIATELY, encapsulated between Triple Backticks and the tag 'JSON_PROPOSAL'. Do not delay the creation of the ticket.

The JSON structure for proposals should be:
{
  "type": "ticket_proposal",
  "data": {
    "title": "string",
    "description": "string",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    "subtasks": [
      { "title": "string", "estimatedTime": number }
    ]
  }
}

Example response with proposal:
"Por supuesto. He estructurado un requerimiento basado en la información.

\`\`\`JSON_PROPOSAL
{
  "type": "ticket_proposal",
  "data": {
    "title": "Reparar error de autenticación en Safari",
    "description": "Los usuarios no pueden hacer login.",
    "priority": "HIGH",
    "subtasks": [
      { "title": "Reproducir bug de Safari", "estimatedTime": 30 },
      { "title": "Implementar solución", "estimatedTime": 60 }
    ]
  }
}
\`\`\`"

Always be professional and helpful. Keep your replies structured.
`;

export async function chatWithAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("La clave de API (OPENROUTER_KEY) no está definida en tu .env.");
  }

  const { text } = await generateText({
    model: openrouter(MODEL),
    system: SYSTEM_PROMPT,
    messages: messages as any, // Mapeado interno directo
    maxOutputTokens: 1000,
  });

  return text;
}
