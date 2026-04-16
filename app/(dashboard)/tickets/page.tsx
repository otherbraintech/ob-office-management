import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket as TicketIcon, UserPlus, Inbox, Clock } from "lucide-react";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/tickets/ticket-card";

export default async function TicketsGeneralPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const isAdmin = ["CEO", "DEVELOPER", "INTERN"].includes(session.role);
  
  // Obtenemos todos los tickets que no son DONE, incluyendo los no asignados
  const tickets = await prisma.ticket.findMany({
      include: { 
          subtasks: {
              orderBy: { createdAt: 'asc' }
          }, 
          module: { include: { project: true } },
          project: true,
          creator: true,
          lead: true,
          collaborators: true
      },
      orderBy: { createdAt: 'desc' }
  });

  const allUsers = await prisma.user.findMany({
    select: { id: true, username: true, email: true }
  });

  const unassignedTickets = tickets.filter(t => !t.leadId);
  const assignedActiveTickets = tickets.filter(t => t.leadId && t.status !== 'DONE');

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      {/* ... (Header y Cards de estadísticas igual) ... */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-primary" />
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Tablero General de Requerimientos</h1>
                <p className="text-sm text-muted-foreground">Gestiona la bandeja de entrada y el progreso global de la empresa.</p>
            </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-none border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Inbox className="size-3" /> Bandeja de Entrada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unassignedTickets.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Esperando responsable</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border-2 border-foreground/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">En Ejecución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignedActiveTickets.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase mt-1">Tareas con dueño activo</p>
          </CardContent>
        </Card>
      </div>

      {/* Sección 1: Sin Asignar */}
      {unassignedTickets.length > 0 && (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                <UserPlus className="size-5" /> Bandeja de Entrada (Sin Dueño)
            </h2>
            <div className="grid gap-6">
                {unassignedTickets.map(ticket => (
                    <TicketCard key={ticket.id} ticket={ticket} currentUserId={session.id} allUsers={allUsers} />
                ))}
            </div>
        </div>
      )}

      {/* Sección 2: En Curso */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="size-5 text-muted-foreground" /> Requerimientos en curso
        </h2>
        <div className="grid gap-6">
            {assignedActiveTickets.map(ticket => (
                <TicketCard key={ticket.id} ticket={ticket} currentUserId={session.id} allUsers={allUsers} />
            ))}
            {tickets.length === 0 && (
                <div className="p-12 border-2 border-dashed border-foreground/5 text-center text-muted-foreground rounded-none">
                    No hay actividad en este momento. Usa el Asistente IA para empezar.
                </div>
            )}
        </div>
      </div>

      {isAdmin && (
          <div className="mt-12 pt-8 border-t">
              <h2 className="text-sm font-bold mb-4 opacity-30 uppercase tracking-tighter">Auditoría: Registro Histórico</h2>
              <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm text-left">
                      <thead className="text-[10px] text-muted-foreground uppercase tracking-widest border-b">
                          <tr>
                              <th className="py-3 px-2">Ticket</th>
                              <th className="py-3 px-2">Estado</th>
                              <th className="py-3 px-2">Responsable</th>
                              <th className="py-3 px-2 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody>
                          {tickets.map(t => (
                              <tr key={t.id} className="border-b border-foreground/5 hover:bg-muted/30">
                                  <td className="py-3 px-2">
                                      <p className="font-bold">{t.title}</p>
                                      <p className="text-[10px] text-muted-foreground">{t.module?.name || t.project?.name || 'N/A'}</p>
                                  </td>
                                  <td className="py-3 px-2 italic text-xs">{t.status}</td>
                                  <td className="py-3 px-2">
                                      <span className="text-xs">
                                          {t.lead?.username || t.lead?.email || <span className="text-primary font-bold">POR ASIGNAR</span>}
                                      </span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                      <Button variant="ghost" size="sm" className="h-8 rounded-none text-[10px] uppercase font-bold">Ver Detalles</Button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
}
