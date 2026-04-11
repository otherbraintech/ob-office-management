"use server"

import { chatWithAI } from "@/lib/ia/openrouter";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function aiAnalyzeTicket(prompt: string) {
  try {
    const result = await chatWithAI([{ role: 'user', content: prompt }]);
    // Intentar extraer el JSON del resultado si es que viene con texto
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to analyze ticket" };
  }
}

export async function aiChat(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const result = await chatWithAI(messages);
    return { data: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to chat with AI" };
  }
}

export async function createTicketFromAI(data: {
  title: string;
  description: string;
  priority: TicketPriority;
  subtasks: { title: string; estimatedTime: number }[];
  moduleId: string;
  leadId: string;
}) {
  try {
    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        moduleId: data.moduleId,
        leadId: data.leadId,
        subtasks: {
          create: data.subtasks.map(s => ({
            title: s.title,
            estimatedTime: s.estimatedTime
          }))
        }
      }
    });
    revalidatePath("/dashboard/tickets");
    return { data: ticket };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to create ticket" };
  }
}
