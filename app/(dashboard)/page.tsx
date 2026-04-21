import { ActiveTimer } from '@/components/dashboard/active-timer';
import { KanbanBoard } from '@/components/dashboard/kanban-board';
import { NewTicketForm } from '@/components/dashboard/new-ticket-form';
import { TicketPriority, TicketStatus, SubtaskStatus } from '@prisma/client';
import { getSession } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';

// Mock data for the dashboard demo
const MOCK_TICKETS = [
  { id: '1', title: 'Fix Header Alignment', description: 'Spacing in mobile view is wrong.', status: TicketStatus.BACKLOG, priority: TicketPriority.MEDIUM },
  { id: '2', title: 'Implement Login Form', description: 'Use Next.js Server Actions.', status: TicketStatus.IN_PROGRESS, priority: TicketPriority.HIGH },
  { id: '3', title: 'Setup Prisma Schema', description: 'Define initial models.', status: TicketStatus.DONE, priority: TicketPriority.LOW },
];

export default async function DashboardPage() {
  const session = await getSession();
  const role = session?.role || 'EXTERNAL_CLIENT';

  if (role === 'EXTERNAL_CLIENT') {
    // Fetch projects related to this external client
    const projects = await prisma.project.findMany({
      where: {
        modules: {
          some: {
            tickets: {
              some: {
                leadId: session.id
              }
            }
          }
        }
      },
      include: {
        modules: {
          include: {
            tickets: {
              include: {
                subtasks: true
              }
            }
          }
        }
      }
    });

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal del Cliente</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos y crea nuevas solicitudes.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => {
            let totalSubtasks = 0;
            let completedSubtasks = 0;

            project.modules.forEach((m: any) => {
              m.tickets.forEach((t: any) => {
                t.subtasks.forEach((s: any) => {
                  totalSubtasks++;
                  if (s.status === SubtaskStatus.DONE) completedSubtasks++;
                });
              });
            });

            const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

            return (
              <div key={project.id} className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso del Proyecto</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">Estado</span>
                    <span className="capitalize font-medium text-green-600">{project.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
              <p className="text-muted-foreground italic">No se encontraron proyectos vinculados a tu cuenta.</p>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <NewTicketForm moduleId={projects[0]?.modules[0]?.id || ""} userId={session?.id || ""} />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Solicitudes Recientes</h2>
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Título</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.flatMap((p: any) => p.modules.flatMap((m: any) => m.tickets))
                    .sort((a: any, b: any) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
                    .slice(0, 5)
                    .map((ticket: any) => (
                      <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{ticket.title}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            ticket.status === 'DONE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {ticket.status.toLowerCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">{ticket.priority.toLowerCase()}</td>
                      </tr>
                    ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground italic">No hay tickets.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Internal User Dashboard
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="md:col-span-2 lg:col-span-2 space-y-4">
           <ActiveTimer />
           <NewTicketForm moduleId="" userId={session?.id || ""} />
        </div>
        <div className="md:col-span-1 lg:col-span-5 border rounded-xl overflow-hidden bg-card">
           <div className="p-4 border-b bg-muted/50 font-semibold flex items-center gap-2">
             Tubería de Tickets
             <span className="text-xs font-normal text-muted-foreground">(Vista Previa)</span>
           </div>
           <KanbanBoard tickets={MOCK_TICKETS} />
        </div>
      </div>
    </div>
  );
}
