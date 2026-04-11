import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, Search, Download, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function LogsPage() {
  const workSessions = await prisma.workSession.findMany({
    include: {
      user: true,
      subtask: {
        include: {
          ticket: true
        }
      }
    },
    orderBy: {
      startTime: 'desc'
    }
  });

  const totalMinutes = workSessions.reduce((acc, session) => acc + (session.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Historial de Tiempos</h1>
          </div>
          <p className="text-muted-foreground text-sm">Registro detallado de sesiones de trabajo del equipo.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">Acumulado en todas las sesiones</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Realizadas</CardTitle>
            <History className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workSessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros totales en el sistema</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones este Mes</CardTitle>
            <History className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {workSessions.filter(s => new Date(s.startTime).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Productividad del período actual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Historial de Actividad</CardTitle>
              <CardDescription>Visualiza el tiempo dedicado por cada colaborador.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors">
                 <Search className="h-3.5 w-3.5" /> Buscar
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-muted transition-colors">
                 <Download className="h-3.5 w-3.5" /> Exportar CSV
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Colaborador</TableHead>
                 <TableHead>Subtarea</TableHead>
                 <TableHead>Ticket</TableHead>
                 <TableHead>Inicio</TableHead>
                 <TableHead>Fin</TableHead>
                 <TableHead className="text-right">Duración</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
                {workSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-muted/30">
                     <TableCell className="font-medium">
                        {session.user.name || session.user.email}
                     </TableCell>
                     <TableCell className="text-xs truncate max-w-[200px]">
                        {session.subtask.title}
                     </TableCell>
                     <TableCell>
                        <Badge variant="outline" className="text-[10px] truncate max-w-[150px]">
                           {session.subtask.ticket.title}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(session.startTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                     </TableCell>
                     <TableCell className="text-xs font-mono text-muted-foreground">
                        {session.endTime ? new Date(session.endTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'En curso'}
                     </TableCell>
                     <TableCell className="text-right font-bold text-sm">
                        {formatDuration(session.duration || 0)}
                     </TableCell>
                  </TableRow>
                ))}
                {workSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                      No hay registros de tiempo disponibles.
                    </TableCell>
                  </TableRow>
                )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
