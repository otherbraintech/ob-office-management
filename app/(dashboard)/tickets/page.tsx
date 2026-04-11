import { getSession } from "@/app/actions/auth";
import { getTickets } from "@/app/actions/tickets";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { redirect } from "next/navigation";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const moduleId = typeof searchParams.module === 'string' ? searchParams.module : undefined;
  const tickets = await getTickets(moduleId);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Tablero de Requerimientos</h1>
           <p className="text-muted-foreground mt-1">Gestiona el progreso funcional de los tickets.</p>
        </div>
      </div>
      
      <KanbanBoard tickets={tickets} />
    </div>
  )
}
