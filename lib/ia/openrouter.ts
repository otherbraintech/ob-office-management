import { TicketPriority } from '@prisma/client';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-exp:free"; // Defaulting to a free model for robustness, can be changed.

export interface AITicket {
  title: string;
  description: string;
  priority: TicketPriority;
  subtasks?: AISubtask[];
}

export interface AISubtask {
  title: string;
  estimatedTime: number; // in minutes
}

const SYSTEM_PROMPT = `
You are a project management assistant for 'OB-OfficeManagement', an internal tool for office task management.
Your goal is to help users creating tickets through a chat interface.

When a user describes a task or problem, you should:
1. Identify if they want to create a ticket.
2. Extract or propose a clear Title, a detailed Description, a Priority (LOW, MEDIUM, HIGH, URGENT), and a list of Subtasks with estimated time in minutes.
3. If information is missing, ask clarifying questions.
4. Once you have enough information, you MUST provide a structured JSON object at the end of your response or as your response, encapsulated between Triple Backticks and the tag 'JSON_PROPOSAL'.

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
"Certainly! I've drafted a ticket based on our conversation.

\`\`\`JSON_PROPOSAL
{
  "type": "ticket_proposal",
  "data": {
    "title": "Fix login bug",
    "description": "Users are unable to login when using Safari browser.",
    "priority": "HIGH",
    "subtasks": [
      { "title": "Reproduce bug in Safari", "estimatedTime": 30 },
      { "title": "Identify root cause", "estimatedTime": 60 },
      { "title": "Deploy fix", "estimatedTime": 15 }
    ]
  }
}
\`\`\`"

Always be professional and helpful. Use the 'Inter' font aesthetic in your descriptions (be concise but clear).
`;

async function openRouterRequest(messages: { role: string; content: string }[]) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ob-officemanagement.com",
      "X-Title": "OB Office Management",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function chatWithAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  const fullMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages
  ];
  return await openRouterRequest(fullMessages);
}
