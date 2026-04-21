import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AIChatInterface } from "@/components/ai/ai-chat-interface";
import { getAiConversations } from "@/app/actions/ai";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  // Fetch full user for image and other personalized details
  const dbUser = await prisma.user.findUnique({
    where: { id: session.id }
  });

  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col bg-background">
      {/* Header reducido para ganar espacio */}
      <div className="py-2 px-4 shrink-0 bg-background border-b border-foreground/5 z-20">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-full border-2 border-primary/20 shadow-sm shrink-0">
            <AvatarImage src="/vanessa.png" className="object-cover" />
            <AvatarFallback>VN</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Vanessa</h1>
              <Badge variant="outline" className="rounded-none text-[8px] font-black tracking-widest bg-primary/5 text-primary border-primary/20">AGENTE IA</Badge>
            </div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">Gestión avanzada de tickets y orquestación</p>
          </div>
        </div>
      </div>
 
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-background relative">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Cargando asistente...</div>}>
            <AIChatInterface 
                availableModules={modules} 
                availableProjects={projects}
                user={dbUser} 
                initialConversations={initialConversations}
                contextProject={contextProject}
            />
          </Suspense>
      </div>
    </div>
  );
}
