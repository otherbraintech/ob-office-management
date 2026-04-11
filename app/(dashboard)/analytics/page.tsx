import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layout
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AnalyticsPage() {
  const [tickets, projects, users, subtasks] = await Promise.all([
    prisma.ticket.findMany({ include: { subtasks: true } }),
    prisma.project.findMany({ include: { modules: { include: { tickets: true } } } }),
    prisma.user.findMany({
      include: {
        assignedSubtasks: {
          where: { status: 'DONE' }
        }
      }
    }),
    prisma.subtask.findMany()
  ]);

  // Status breakdown
  const statsByStatus = {
    BACKLOG: tickets.filter(t => t.status === 'BACKLOG').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    REVIEW: tickets.filter(t => t.status === 'REVIEW').length,
    DONE: tickets.filter(t => t.status === 'DONE').length,
  };

  // Priority breakdown
  const statsByPriority = {
    LOW: tickets.filter(t => t.priority === 'LOW').length,
    MEDIUM: tickets.filter(t => t.priority === 'MEDIUM').length,
    HIGH: tickets.filter(t => t.priority === 'HIGH').length,
    URGENT: tickets.filter(t => t.priority === 'URGENT').length,
  };

  const totalTickets = tickets.length;
  const completedTickets = statsByStatus.DONE;
  const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter(s => s.status === 'DONE').length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Developer productivity: completed subtasks per user
  const developerProductivity = users.map(user => ({
    name: user.name || user.email,
    completed: user.assignedSubtasks.length
  })).sort((a, b) => b.completed - a.completed);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analíticas y Métricas</h1>
        <p className="text-muted-foreground text-sm">Resumen exhaustivo del rendimiento y productividad del equipo.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Finalizados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTickets} / {totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">{completionRate.toFixed(1)}% de tasa de éxito</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subtareas Hechas</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSubtasks}/{totalSubtasks}</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets en Revisión</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsByStatus.REVIEW}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de aprobación</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgencias</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsByPriority.URGENT}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención inmediata</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Productividad por Desarrollador
            </CardTitle>
            <CardDescription>Subtareas completadas por cada miembro del equipo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mt-4">
              {developerProductivity.map((dev, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dev.name}</span>
                    <span className="text-muted-foreground">{dev.completed} subtareas</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${developerProductivity[0].completed > 0 ? (dev.completed / developerProductivity[0].completed) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
              {developerProductivity.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-10 italic">No hay datos de productividad disponibles.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Estado de Tickets</CardTitle>
            <CardDescription>Distribución actual por fase.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {status.replace('_', ' ').toLowerCase()}
                  </Badge>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
              <div className="pt-4 border-t">
                <CardTitle className="text-sm mb-3">Prioridad</CardTitle>
                {Object.entries(statsByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-muted-foreground">{priority}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" /> Avance por Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const projectTickets = project.modules.flatMap(m => m.tickets);
              const projCompleted = projectTickets.filter(t => t.status === 'DONE').length;
              const projProgress = projectTickets.length > 0 ? (projCompleted / projectTickets.length) * 100 : 0;

              return (
                <div key={project.id} className="p-4 border rounded-xl bg-card/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    <Badge variant={projProgress === 100 ? "default" : "secondary"}>
                      {projProgress.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                       className="h-full bg-green-500"
                       style={{ width: `${projProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{projectTickets.length} Tickets</span>
                    <span>{projCompleted} Finalizados</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
