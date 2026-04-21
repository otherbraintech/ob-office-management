"use server"

import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, generateObject, experimental_generateSpeech as generateSpeech } from 'ai';
import { z } from 'zod';
import { AI_ASSISTANT_SYSTEM_PROMPT } from "@/lib/prompts/assistant-prompts";

// 🔴 4. Validación estricta de API Key
const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("CRITICAL: OPENROUTER_KEY is not defined in .env");
}

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || 'MISSING_KEY',
  headers: {
    "HTTP-Referer": "https://ob-workspace.com",
    "X-Title": "OB Workspace Vanessa",
  }
});

const MODEL = "openai/gpt-4o-mini";

// 🟡 7. Tipado estricto de roles
export type AiRole = 'user' | 'assistant' | 'system';

export interface AiMessage {
  role: AiRole;
  content: string;
}

/**
 * Respuesta estandarizada para Server Actions
 */
type ActionResponse<T> = { data: T; error?: never } | { data?: never; error: string };

/**
 * 🟡 3 & 🧠 Mejora PRO: Uso de generateObject para análisis técnico
 * Elimina Regex y JSON.parse peligroso.
 */
export async function aiAnalyzeTicket(prompt: string, userRole?: string): Promise<ActionResponse<any>> {
  if (!OPENROUTER_API_KEY) return { error: "Configuración de IA incompleta." };

  try {
    const { object } = await generateObject({
      model: openrouter(MODEL),
      system: AI_ASSISTANT_SYSTEM_PROMPT(userRole) + "\nResponde ÚNICAMENTE con el objeto JSON solicitado.",
      schema: z.object({
        title: z.string().min(5).max(100),
        description: z.string().min(10),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        subtasks: z.array(
          z.object({
            title: z.string(),
            estimatedTime: z.number().min(5).max(480)
          })
        )
      }),
      prompt: prompt,
    });

    return { data: object };
  } catch (error) {
    console.error("[aiAnalyzeTicket Error]:", error);
    return { error: "No se pudo estructurar el requerimiento. Intenta ser más descriptivo." };
  }
}

/**
 * 🟢 Chat Conversacional con Vanessa
 */
export async function aiChat(messages: AiMessage[], userRole?: string): Promise<ActionResponse<string>> {
  if (!OPENROUTER_API_KEY) return { error: "IA no configurada." };

  try {
    const { text } = await generateText({
      model: openrouter(MODEL),
      system: AI_ASSISTANT_SYSTEM_PROMPT(userRole),
      messages, // 🟡 3. Tipado correcto heredado
      maxOutputTokens: 1500,
    });

    return { data: text.trim() };
  } catch (error) {
    console.error("[aiChat Error]:", error);
    return { error: "Vanessa tuvo un pequeño desliz técnico. Reintenta pues." };
  }
}

/**
 * 🟡 6. Persistencia Sanitizada de Tickets creados por IA
 */
export async function createTicketFromAI(data: {
  title: string;
  description: string;
  priority: TicketPriority;
  subtasks: { title: string; estimatedTime: number }[];
  moduleId?: string;
  projectId?: string;
  leadId: string;
}) {
  try {
    // Sanitización básica
    const title = data.title.trim().substring(0, 150);
    const description = data.description.trim();

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: data.priority,
        creatorId: data.leadId,
        moduleId: data.moduleId || null,
        projectId: data.projectId || null,
        subtasks: {
          create: data.subtasks.map(s => ({
            title: s.title.trim(),
            estimatedTime: Math.max(5, s.estimatedTime)
          }))
        }
      }
    });

    revalidatePath("/tickets");
    return { data: ticket };
  } catch (error) {
    console.error("[createTicketFromAI Error]:", error);
    return { error: "Error al inyectar el ticket en la DB." };
  }
}

/**
 * 🟠 5. TTS con API nativa de OpenRouter (Fetch Manual para máxima compatibilidad)
 */
export async function aiGenerateSpeech(text: string): Promise<ActionResponse<string>> {
  if (!OPENROUTER_API_KEY) return { error: "Key faltante." };

  try {
    // 🧠 Limpieza previa para el motor de voz
    const cleanText = text.replace(/```JSON_PROPOSAL[\s\S]*?```/g, '').trim();
    if (!cleanText) return { error: "Sin texto que procesar." };

    const response = await fetch("https://openrouter.ai/api/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-audio-mini",
        input: cleanText,
        voice: "shimmer",
        response_format: "mp3"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("OpenRouter TTS Fail:", errorText);
      return { error: "Servicio de voz no disponible." };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    return { data: base64Audio };
  } catch (error) {
    console.error("[aiGenerateSpeech Error]:", error);
    return { error: "Error técnico en TTS." };
  }
}

// --- GESTIÓN DE PERSISTENCIA ---

export async function getAiConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  }).then(data => ({ data })).catch(() => ({ error: "Error al cargar chats." }));
}

export async function getAiConversationMessages(conversationId: string) {
  return prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  }).then(data => ({ data })).catch(() => ({ error: "Error al cargar mensajes." }));
}

export async function createAiConversation(userId: string, title: string) {
  const sanitizedTitle = title.trim().substring(0, 50) || "Nueva conversación";
  return prisma.aiConversation.create({
    data: { userId, title: sanitizedTitle }
  }).then(data => ({ data })).catch(() => ({ error: "Error al crear chat." }));
}

export async function addAiMessage(conversationId: string, role: AiRole, content: string) {
  try {
    const msg = await prisma.aiMessage.create({
      data: { conversationId, role, content: content.trim() }
    });
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    return { data: msg };
  } catch (error) {
    return { error: "No se pudo guardar el mensaje." };
  }
}

export async function updateAiConversationTitle(id: string, title: string) {
  return prisma.aiConversation.update({
    where: { id },
    data: { title: title.trim().substring(0, 50) }
  }).then(data => ({ data })).catch(() => ({ error: "Error al renombrar." }));
}
