import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket } from "lucide-react";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function MyTicketsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isClient = session.role === "EXTERNAL_CLIENT";

  let tickets;
  
  if (isClient) {
     tickets = await prisma.ticket.findMany({
         where: { creatorId: session.id },
         include: { subtasks: true, module: { include: { project: true } } },
         orderBy: { createdAt: 'desc' }
     });
  } else {
     tickets = await prisma.ticket.findMany({
         where: { 
             OR: [
                 { leadId: session.id },
                 { collaborators: { some: { id: session.id } } }
             ]
         },
         include: { subtasks: true, module: { include: { project: true } } },
         orderBy: { createdAt: 'desc' }
     });
  }

  const activeTickets = tickets.filter(t => t.status !== 'DONE').length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{isClient ? 'Plataforma de Clientes' : 'Tus Tickets Asignados'}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets Activos</CardTitle>
            <CardDescription>{isClient ? 'Tus requerimientos en progreso' : 'Pendientes de resolver.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight">Lista de Requerimientos</h3>
          <p className="text-sm text-muted-foreground mt-2">{isClient ? 'Tus solicitudes recientes.' : 'Tu cola de trabajo por prioridad.'}</p>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
                <div className="flex flex-col">
                  <span className="font-semibold">{ticket.title}</span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-xl">{ticket.description}</span>
                  <div className="flex items-center gap-2 mt-2">
                     <Badge variant="outline" className="text-[10px]">{ticket.module.project.name}</Badge>
                     <Badge variant="secondary" className="text-[10px]">{ticket.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'destructive' : 'default'}>
                    {ticket.priority}
                  </Badge>
                  {!isClient && (
                     <div className="text-xs text-muted-foreground border p-2 rounded-md">
                         {ticket.subtasks.length} sub-tareas
                     </div>
                  )}
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                    No tienes tickets ({isClient ? 'creados' : 'asignados'}).
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
