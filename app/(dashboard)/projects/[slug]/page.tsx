import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FolderKanban, ListTodo, Layers, Calendar, Clock, BarChart4, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSession } from '@/app/actions/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { slug } = params;

  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { id: slug },
        { name: { contains: slug, mode: 'insensitive' } }
      ]
    },
    include: {
      modules: {
        include: {
          tickets: {
            include: {
              subtasks: true,
              lead: true,
              collaborators: true
            }
          }
        }
      }
    }
  });

  if (!project) return notFound();

  const allTickets = project.modules.flatMap(m => m.tickets);
  const completedTickets = allTickets.filter(t => t.status === 'DONE').length;
  const progressPercent = allTickets.length > 0 ? (completedTickets / allTickets.length) * 100 : 0;

  const totalSubtasks = allTickets.reduce((acc, t) => acc + t.subtasks.length, 0);
  const completedSubtasks = allTickets.reduce((acc, t) => acc + t.subtasks.filter(s => s.status === 'DONE').length, 0);

  const uniqueMembers = new Set([
      ...allTickets.map(t => t.leadId),
      ...allTickets.flatMap(t => t.collaborators.map(c => c.id))
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">{project.description || 'Detalles técnicos y operativos de la plataforma.'}</p>
        </div>
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="w-fit h-fit px-4 py-1.5 uppercase tracking-widest text-xs font-bold">
          {project.status === 'active' ? 'En ejecución' : project.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium italic text-muted-foreground uppercase tracking-widest">Progreso Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progressPercent)}%</div>
            <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">{completedTickets} de {allTickets.length} tickets terminados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium italic text-muted-foreground uppercase tracking-widest">Tickets</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTickets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{allTickets.filter(t => t.status === 'IN_PROGRESS').length} en desarrollo activo</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium italic text-muted-foreground uppercase tracking-widest">Subtareas</CardTitle>
            <BarChart4 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSubtasks} / {totalSubtasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Hitos técnicos alcanzados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium italic text-muted-foreground uppercase tracking-widest">Equipo</CardTitle>
            <Users className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueMembers.size} Miembros</div>
            <p className="text-xs text-muted-foreground mt-1">Asignados a este proyecto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 mt-0.5" /> Módulos del Sistema
                </CardTitle>
                <CardDescription>Escalabilidad y arquitectura organizada por componentes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {project.modules.map((module) => {
                  const moduleCompleted = module.tickets.filter(t => t.status === 'DONE').length;
                  const moduleProgress = module.tickets.length > 0 ? (moduleCompleted / module.tickets.length) * 100 : 0;
                  return (
                    <div key={module.id} className="p-4 border rounded-xl bg-card hover:bg-muted/30 transition-colors space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate">{module.name}</span>
                        <Badge variant="outline" className="text-[10px]">{module.tickets.length} Tks</Badge>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                           className="h-full bg-green-500"
                           style={{ width: `${moduleProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" /> Roadmap de Tickets
                </CardTitle>
             </CardHeader>
             <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTickets.slice(0, 10).map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium text-xs max-w-[180px] truncate">{ticket.title}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className="text-[10px] capitalize font-normal">
                             {ticket.status.toLowerCase().replace('_', ' ')}
                           </Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant={ticket.priority === 'URGENT' ? 'destructive' : 'secondary'} className="text-[10px] font-normal">
                             {ticket.priority}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate">{ticket.lead.name || 'Sin asignar'}</TableCell>
                      </TableRow>
                    ))}
                    {allTickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">No hay tickets activos.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Información Técnica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Fecha de creación</span>
                <span className="text-sm">{new Date(project.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Última actualización</span>
                <span className="text-sm">{new Date(project.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Identificador Único</span>
                <code className="text-[10px] bg-muted p-1 rounded border overflow-x-auto">{project.id}</code>
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle className="text-sm">Métricas de Rendimiento</CardTitle>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Velocidad de cierre</span>
                      <span className="font-bold">Alta</span>
                   </div>
                   <div className="h-1 bg-secondary rounded-full">
                      <div className="h-full w-4/5 bg-green-500 rounded-full" />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Calidad del código</span>
                      <span className="font-bold">A+</span>
                   </div>
                   <div className="h-1 bg-secondary rounded-full">
                      <div className="h-full w-[95%] bg-blue-500 rounded-full" />
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
