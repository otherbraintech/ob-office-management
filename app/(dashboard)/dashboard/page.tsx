import { ActiveTimer } from '@/components/dashboard/active-timer';
import { NewTicketForm } from '@/components/dashboard/new-ticket-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  Users
} from "lucide-react";
import { getSession } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardOverview() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  const role = session.role;
  const isCEO = role === 'CEO';
  const isClient = role === 'EXTERNAL_CLIENT';

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Consultas Generales vs Personales
  const projectCount = await prisma.project.count({ where: isCEO ? { status: 'active' } : undefined });
  const ticketCount = await prisma.ticket.count({ 
    where: { 
      status: { not: 'DONE' },
      ...(isClient ? { creatorId: session.id } : {}),
      ...((!isCEO && !isClient) ? { 
          OR: [{ leadId: session.id }, { collaborators: { some: { id: session.id } } }] 
       } : {})
    } 
  });

  const recentTickets = await prisma.ticket.findMany({
    take: 5,
    where: isClient ? { creatorId: session.id } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { lead: true }
  });

  const activeSessions = await prisma.workSession.findMany({
    where: { endTime: null },
    include: { user: true }
  });

  const weeklyWorkSessions = await prisma.workSession.findMany({
    where: {
      startTime: { gte: sevenDaysAgo },
      ...(!isCEO ? { userId: session.id } : {})
    },
    select: { duration: true }
  });

  let monthlyExpenses = { _sum: { amount: 0 } };
  if (isCEO) {
    monthlyExpenses = await prisma.expense.aggregate({
      where: { billDate: { gte: firstDayOfMonth } },
      _sum: { amount: true }
    });
  }

  const totalWeeklyMinutes = weeklyWorkSessions.reduce((acc, session) => acc + (session.duration || 0), 0);
  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const totalMonthlyExpenses = monthlyExpenses._sum.amount || 0;

  const myProjects = await prisma.project.findMany({
    take: 3,
    include: {
      modules: {
        include: {
          tickets: {
            include: { subtasks: true }
          }
        }
      }
    }
  });

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Panel Principal</h1>
        <p className="text-muted-foreground">Bienvenido de nuevo, {session.name || session.email || 'Usuario'}. {isCEO ? 'Esto es lo que está pasando en Otherbrain.' : 'Este es tu resumen de trabajo.'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {!isClient && <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground mt-1">En ejecución</p>
          </CardContent>
        </Card>}

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isClient ? 'Tus Tickets' : 'Tickets Pendientes'}</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de revisión</p>
          </CardContent>
        </Card>

        {!isClient && <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isCEO ? 'Horas Globales Semana' : 'Mis Horas Semana'}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeeklyHours}h</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">Meta: 40h</p>
          </CardContent>
        </Card>}

        {isCEO && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gastos Mensuales</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlyExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">Operativa</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-8">
          {!isClient && <Card>
            <CardHeader>
              <CardTitle>Proyectos en Curso</CardTitle>
              <CardDescription>Seguimiento de progreso real basado en tareas completadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {myProjects.map((project, i) => {
                const tickets = project.modules.flatMap(m => m.tickets);
                const subtasks = tickets.flatMap(t => t.subtasks);
                const completed = subtasks.filter(s => s.status === 'DONE').length;
                const progress = subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0;

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{project.name}</span>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status === 'active' ? 'Activo' : 'Pausado'}
                      </Badge>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] text-muted-foreground uppercase tracking-widest">
                      {Math.round(progress)}% Completado
                    </div>
                  </div>
                );
              })}
              {myProjects.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-4">No hay proyectos activos.</p>}
            </CardContent>
          </Card>}

          {!isClient && (
            <div className="grid gap-4 md:grid-cols-2">
              <ActiveTimer />
              <NewTicketForm />
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{isClient ? 'Tus solicitudes recientes' : 'Tickets Recientes'}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentTickets.map((ticket, i) => (
                  <div key={i} className="flex gap-4 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {ticket.lead?.name?.[0] || ticket.lead?.email?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <p>
                        <span className="font-bold">{ticket.lead?.name || 'Sistema'}</span> creó{" "}
                        <span className="font-medium text-blue-600 truncate inline-block max-w-[150px] align-bottom">{ticket.title}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {recentTickets.length === 0 && (
                  <p className="text-sm text-muted-foreground italic text-center">Sin actividad reciente.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {!isClient && <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Equipo Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex -space-x-3 overflow-hidden">
                {activeSessions.map((session, i) => (
                   <div key={i} title={session.user.name || session.user.email} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs uppercase border-2 border-white">
                     {session.user.name?.[0] || session.user.email[0]}
                   </div>
                ))}
                {activeSessions.length === 0 && (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-white">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {activeSessions.length} {activeSessions.length === 1 ? 'miembro está' : 'miembros están'} trabajando ahora mismo.
              </p>
            </CardContent>
          </Card>}
        </div>
      </div>
    </div>
  );
}
