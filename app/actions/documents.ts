"use server"

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

const OPENROUTER_API_KEY = process.env.OPENROUTER_KEY || process.env.OPENROUTER_API_KEY;
const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY || 'MISSING_KEY',
});

export async function createDocument(projectId: string, name: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const doc = await prisma.projectDocument.create({
    data: {
      name,
      content: `# ${name}\n\nComienza la planificación aquí...`,
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return doc;
}

export async function updateDocument(id: string, content: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const doc = await prisma.projectDocument.update({
    where: { id },
    data: { content },
  });

  revalidatePath(`/projects/${doc.projectId}`);
  return doc;
}

export async function deleteDocument(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const doc = await prisma.projectDocument.delete({
    where: { id },
  });

  revalidatePath(`/projects/${doc.projectId}`);
  return doc;
}

export async function getDocuments(projectId: string) {
  return await prisma.projectDocument.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' }
  });
}

export async function generateTicketsFromDocument(documentId: string, projectId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const doc = await prisma.projectDocument.findUnique({
    where: { id: documentId },
  });

  if (!doc) throw new Error("Document not found");

  // Usamos IA para extraer tickets
  const { text } = await generateText({
    model: openrouter("openai/gpt-4o-mini"),
    system: `
      Eres un experto en gestión de proyectos. Analiza el siguiente documento Markdown de planificación y propón una lista de tickets técnicos.
      Cada ticket debe tener:
      - Título claro.
      - Descripción detallada.
      - Prioridad (LOW, MEDIUM, HIGH, URGENT).
      - Subtareas con duración estimada en minutos.

      Responde únicamente en formato JSON con la siguiente estructura:
      {
        "tickets": [
          {
            "title": "string",
            "description": "string",
            "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
            "subtasks": [
              { "title": "string", "estimatedTime": number }
            ]
          }
        ]
      }
    `,
    prompt: doc.content,
  });

  try {
    const data = JSON.parse(text.replace(/```json|```/g, ""));
    const tickets = data.tickets;

    // Buscamos o creamos un módulo por defecto para "Planificación"
    let module = await prisma.module.findFirst({
        where: { projectId, name: "Planificación" }
    });

    if (!module) {
        module = await prisma.module.create({
            data: { name: "Planificación", projectId }
        });
    }

    // Creamos los tickets
    for (const t of tickets) {
      await prisma.ticket.create({
        data: {
          title: t.title,
          description: t.description,
          priority: t.priority as any,
          moduleId: module.id,
          creatorId: session.id,
          subtasks: {
            create: t.subtasks.map((s: any) => ({
              title: s.title,
              estimatedTime: s.estimatedTime,
            })),
          },
        },
      });
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, count: tickets.length };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("No se pudo procesar la respuesta de la IA.");
  }
}

export async function assistDocumentGeneration(projectId: string, documentId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) throw new Error("Proyecto no encontrado");

  // Usamos IA para generar un esqueleto Markdown
  const { text } = await generateText({
    model: openrouter("openai/gpt-4o-mini"),
    system: `
      Eres un Analista Técnico Funcional experto. Actúas apoyando a los desarrolladores a planificar. 
      Escribe un documento Markdown bien estructurado para planificar este proyecto. Incluye:
      - Titulo (H1)
      - Resumen ejecutivo
      - Objetivos (Viñetas)
      - Arquitectura/Módulos sugeridos
      - Requisitos funcionales clave
      - Tecnologías propuestas
      No cierres el texto en etiquetas de código markdown de bloque, escribe puramente en formato Markdown directo (texto con formato #, *, etc).
    `,
    prompt: `Proyecto: ${project.name}\nDescripción: ${project.description || 'Sin descripción detallada.'}`,
  });

  const updatedDoc = await prisma.projectDocument.update({
    where: { id: documentId },
    data: { content: text },
  });

  revalidatePath(`/projects/${projectId}`);
  return updatedDoc;
}

