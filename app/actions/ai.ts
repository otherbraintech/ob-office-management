"use server"
 
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { AI_ASSISTANT_SYSTEM_PROMPT } from "@/lib/prompts/assistant-prompts";

const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY;

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || 'MISSING_KEY',
  headers: {
    "HTTP-Referer": "https://ob-workspace.com",
    "X-Title": "OB Workspace",
  }
});

const MODEL = "openai/gpt-4o-mini";

export async function aiAnalyzeTicket(prompt: string) {
  try {
    const result = await aiChat([{ role: 'user', content: prompt }]);
    if (typeof result === 'string') {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return { data };
    }
    return { data: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to analyze ticket" };
  }
}

export async function aiChat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[], userRole?: string) {
  try {
    const { text } = await generateText({
      model: openrouter(MODEL),
      system: AI_ASSISTANT_SYSTEM_PROMPT(userRole),
      messages: messages as any,
      maxOutputTokens: 1500, // Aumentado para subtasks largas
    });

    return { data: text };
  } catch (error) {
    console.error("[aiChat Error]:", error);
    return { error: "Error al procesar la petición de IA." };
  }
}

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
    const ticketData: any = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      creatorId: data.leadId,
      subtasks: {
        create: data.subtasks.map(s => ({
          title: s.title,
          estimatedTime: s.estimatedTime
        }))
      }
    };

    if (data.moduleId) {
      ticketData.moduleId = data.moduleId;
    }

    if (data.projectId) {
      ticketData.projectId = data.projectId;
    }

    const ticket = await prisma.ticket.create({
      data: ticketData
    });
    revalidatePath("/tickets");
    return { data: ticket };
  } catch (error) {
    console.error("[createTicketFromAI Error]:", error);
    return { error: error instanceof Error ? error.message : "Failed to create ticket" };
  }
}

export async function getAiConversations(userId: string) {
  try {
    const convs = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
    return { data: convs };
  } catch (error) {
    return { error: "Failed to load conversations" };
  }
}

export async function getAiConversationMessages(conversationId: string) {
  try {
    const messages = await prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
    return { data: messages };
  } catch (error) {
    return { error: "Failed to load messages" };
  }
}

export async function createAiConversation(userId: string, title: string) {
  try {
    const conv = await prisma.aiConversation.create({
      data: { userId, title }
    });
    return { data: conv };
  } catch (error) {
    return { error: "Failed to create conversation" };
  }
}

export async function addAiMessage(conversationId: string, role: string, content: string) {
  try {
    const msg = await prisma.aiMessage.create({
      data: { conversationId, role, content }
    });
    await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    return { data: msg };
  } catch (error) {
    return { error: "Failed to save message" };
  }
}

export async function updateAiConversationTitle(id: string, title: string) {
  try {
    const conv = await prisma.aiConversation.update({
      where: { id },
      data: { title }
    });
    return { data: conv };
  } catch (error) {
    return { error: "No se pudo actualizar el título." };
  }
}
