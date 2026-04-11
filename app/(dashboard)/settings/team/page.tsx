import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, Shield, UserCircle, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function TeamManagementPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
          </div>
          <p className="text-muted-foreground text-sm">Administra los permisos, roles y miembros del equipo directivo y técnico.</p>
        </div>
        <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm transition-colors">
          <UserPlus className="h-4 w-4" /> Invitar Miembro
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipo</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Colaboradores activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liderazgo</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'CEO').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Directivos con control total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desarrolladores</CardTitle>
            <UserCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'DEVELOPER').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Equipo técnico operativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incorporaciones</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length}</div>
            <p className="text-xs text-muted-foreground mt-1">Nuevos este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
           <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <CardTitle>Nómina de Miembros</CardTitle>
          </div>
          <CardDescription>Control detallado de accesos y roles asignados.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Nombre / Email</TableHead>
                 <TableHead>Rol</TableHead>
                 <TableHead>Fecha de Ingreso</TableHead>
                 <TableHead className="text-right">Acciones</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
                {users.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{member.name || 'Sin nombre'}</span>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-medium uppercase px-2 py-0.5 border shadow-sm">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(member.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button className="text-[10px] px-2 py-1 border rounded-md hover:bg-muted font-medium uppercase tracking-tight text-blue-600 transition-colors">Modificar Rol</button>
                        <button className="text-[10px] px-2 py-1 border rounded-md hover:bg-muted font-medium uppercase tracking-tight text-red-600 transition-colors">Eliminar</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
