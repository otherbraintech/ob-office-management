import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { AIChatInterface } from "@/components/ai/chat-interface";
import { redirect } from "next/navigation";

export default async function AIAssistantPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // For the demonstration, we'll pick the first project/module available
  // In a real scenario, we might want to let the user select it or pass it via context
  const module = await prisma.module.findFirst({
    include: { project: true }
  });

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] space-y-4">
        <h1 className="text-2xl font-bold">No se encontraron módulos</h1>
        <p className="text-muted-foreground">Crea un proyecto y un módulo primero para usar el asistente.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Asistente IA</h1>
        <p className="text-muted-foreground">Conversa con nuestra IA para crear tickets detallados en <span className="font-semibold text-foreground">{module.project.name} / {module.name}</span></p>
      </div>

      <AIChatInterface moduleId={module.id} userId={session.id} />
    </div>
  );
}
