import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActiveTimer } from "@/components/dashboard/active-timer";
import { Timer, History, Calendar, Layout, PlayCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function TimerPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const workSessions = await prisma.workSession.findMany({
    where: { userId: session.id },
    include: {
      subtask: {
        include: {
          ticket: {
            include: {
              module: {
                include: { project: true }
              }
            }
          }
        }
      }
    },
    orderBy: { startTime: 'desc' },
    take: 10,
  });

  const activeSession = workSessions.find(s => !s.endTime);

  const totalMinutesToday = workSessions
    .filter(s => new Date(s.startTime).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.duration, 0);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Registro de Tiempo</h1>
        <p className="text-muted-foreground text-sm">Gestiona tus horas de trabajo y sesiones activas.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <ActiveTimer />
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Resumen de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatDuration(totalMinutesToday)}</div>
              <p className="text-xs text-muted-foreground mt-1">Tiempo total registrado hoy</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Sesiones</CardTitle>
                <CardDescription>Tus registros de tiempo más recientes.</CardDescription>
              </div>
              <History className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto/Tarea</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs truncate">
                            {session.subtask.ticket.module.project.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {session.subtask.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[9px] opacity-70">
                           {new Date(session.startTime).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {session.endTime ? formatDuration(session.duration) : 'En curso...'}
                      </TableCell>
                      <TableCell>
                         {session.endTime ? (
                           <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Finalizado</Badge>
                         ) : (
                           <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-green-500 hover:bg-green-600 animate-pulse">Activo</Badge>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {workSessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                        <div className="flex flex-col items-center gap-2">
                           <Layout className="h-8 w-8 opacity-20" />
                           <span>No tienes sesiones registradas aún.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
