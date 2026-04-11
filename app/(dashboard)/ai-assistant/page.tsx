import { getSession } from "@/app/actions/auth";
import { chatWithAI } from "@/lib/ia/openrouter";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AIChatInterface } from "@/components/ai/ai-chat-interface";

export default async function AIAssistantPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  // Pre-load active modules so AI can assign tickets to them
  const modules = await prisma.module.findMany({
      include: { project: true }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="flex flex-col gap-2 mb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Asistente IA (OpenRouter)</h1>
        <p className="text-muted-foreground">Tu Project Manager automatizado. Pídele que despiece nuevas features, estime subtareas en minutos, o analice prioridades.</p>
      </div>

      <div className="flex-1 min-h-0 bg-background border rounded-lg shadow-sm overflow-hidden flex flex-col">
          <AIChatInterface availableModules={modules} currentUserId={session.id} />
      </div>
    </div>
  );
}
