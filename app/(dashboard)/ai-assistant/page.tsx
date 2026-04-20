import { getSession } from "@/app/actions/auth";
import { chatWithAI } from "@/lib/ia/openrouter";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AIChatInterface } from "@/components/ai/ai-chat-interface";
import { getAiConversations } from "@/app/actions/ai";
import { Suspense } from "react";

export default async function AIAssistantPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  const projectId = resolvedSearchParams.projectId;
  let contextProject = null;

  if (projectId) {
      contextProject = await prisma.project.findUnique({
          where: { id: projectId }
      });
  }

  // Pre-load active modules and projects so AI can assign tickets to them
  const modules = await prisma.module.findMany({
      include: { project: true }
  });

  const projects = await prisma.project.findMany({
      orderBy: { name: 'asc' }
  });

  // Load user conversations
  const convsResult = await getAiConversations(session.id);
  const initialConversations = convsResult.data || [];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] p-2 overflow-hidden">
      <div className="flex flex-col gap-1 mb-4 shrink-0 px-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Crear ticket con IA</h1>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Tu asistente personal para estructurar requerimientos, estimar tiempos y organizar el trabajo de forma automática.</p>
      </div>

      <div className="flex-1 min-h-0 bg-background border-2 border-foreground/5 rounded-none shadow-none overflow-hidden flex flex-col">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Cargando asistente...</div>}>
            <AIChatInterface 
                availableModules={modules} 
                availableProjects={projects}
                currentUserId={session.id} 
                currentUserRole={session.role}
                initialConversations={initialConversations}
                contextProject={contextProject}
            />
          </Suspense>
      </div>
    </div>
  );
}
