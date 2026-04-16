'use server';

import { aiChat } from "@/app/actions/ai";
import { generateText } from "ai";
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY || '',
});

export async function suggestSubtasksAI(title: string, description: string, existingTasks: string[] = []) {
    try {
        const prompt = `Actúa como un experto en gestión de proyectos. Basado en el siguiente ticket y las tareas ya existentes, sugiere UNA (1) nueva sub-tarea técnica que sea necesaria y no esté repetida.
        
        Título del Ticket: ${title}
        Descripción: ${description}
        Tareas ya creadas: ${existingTasks.length > 0 ? existingTasks.join(", ") : "Ninguna"}
        
        Responde EXCLUSIVAMENTE en ESPAÑOL con un objeto JSON (sin markdown): { "title": "Nombre de la tarea", "estimatedTime": 30 }`;

        const { text } = await generateText({
            model: openrouter("openai/gpt-4o-mini"),
            prompt: prompt,
        });

        // Parse clean JSON
        const match = text.match(/\{[\s\S]*?\}/);
        if (!match) throw new Error("Could not parse AI response");
        return { data: [JSON.parse(match[0])] };
    } catch (e) {
        return { error: "Error de IA al sugerir tareas" };
    }
}

export async function improveSubtaskTextAI(text: string) {
    try {
        const prompt = `Improve the following subtask description to be professional and clear, keep it short (max 10 words).
        Current text: ${text}
        
        Respond ONLY with the improved text.`;

        const { text: improved } = await generateText({
            model: openrouter("openai/gpt-4o-mini"),
            prompt: prompt,
        });

        return { data: improved.trim() };
    } catch (e) {
        return { error: "Error de IA al mejorar texto" };
    }
}

export async function regenerateFullSubtasksAI(title: string, description: string) {
    try {
        const prompt = `Actúa como un arquitecto de soluciones experto. 
        Analiza el siguiente ticket y genera una secuencia lógica y cronológica de sub-tareas técnicas (de 4 a 8 tareas) para completarlo de principio a fin.
        
        Título del Ticket: ${title}
        Descripción: ${description}
        
        Las tareas deben estar en orden de ejecución.
        Responde EXCLUSIVAMENTE en ESPAÑOL con un array JSON de objetos (sin markdown): [{ "title": "Nombre de la tarea", "estimatedTime": 30 }]`;

        const { text } = await generateText({
            model: openrouter("openai/gpt-4o-mini"),
            prompt: prompt,
        });

        const match = text.match(/\[[\s\S]*?\]/);
        if (!match) throw new Error("Could not parse AI response");
        return { data: JSON.parse(match[0]) };
    } catch (e) {
        return { error: "Error de IA al regenerar estructura de trabajo" };
    }
}
