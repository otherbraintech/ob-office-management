import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
    const session = await getSession();
    if (!session) redirect('/login');

    const project = await prisma.project.findUnique({
        where: { id: params.slug },
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

    if (!project) {
        return <div className="p-8 text-center text-red-500">Proyecto no encontrado.</div>
    }

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground mt-1 max-w-2xl">{project.description || "Proyecto raíz."}</p>
                </div>
                <Badge className="text-sm px-4 py-1" variant={project.status === 'active' ? 'default' : 'secondary'}>
                    ESTADO: {project.status.toUpperCase()}
                </Badge>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Layers className="h-5 w-5" /> Módulos Estructurales
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {project.modules.map((mod) => (
                        <Card key={mod.id}>
                            <CardHeader className="bg-muted/50 rounded-t-lg">
                                <CardTitle className="text-lg">{mod.name}</CardTitle>
                                <CardDescription>{mod.tickets.length} Tickets alojados</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                     {mod.tickets.slice(0, 5).map(ticket => (
                                         <div key={ticket.id} className="flex justify-between items-center text-sm p-2 bg-secondary/30 rounded-md border border-secondary">
                                            <div className="flex items-center gap-2">
                                                 <TicketIcon className="h-4 w-4 text-primary" />
                                                 <Link href={`/dashboard/tickets/${ticket.id}`} className="font-medium hover:underline text-blue-600 dark:text-blue-400">
                                                    {ticket.title}
                                                 </Link>
                                            </div>
                                            <Badge variant={ticket.status === 'DONE' ? 'default' : 'outline'} className="text-[10px]">
                                                {ticket.status}
                                            </Badge>
                                         </div>
                                     ))}
                                     {mod.tickets.length > 5 && (
                                         <p className="text-xs text-muted-foreground pt-2">+ {mod.tickets.length - 5} tickets adicionales.</p>
                                     )}
                                     {mod.tickets.length === 0 && (
                                         <p className="text-sm text-muted-foreground italic">Módulo vacío. No hay requerimientos.</p>
                                     )}
                                </div>
                                <div className="mt-4 pt-4 border-t w-full">
                                    <Button variant="outline" className="w-full text-xs" asChild>
                                        <Link href={`/dashboard/tickets?module=${mod.id}`}>Ver Tablero Kanban del Módulo</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {project.modules.length === 0 && (
                        <div className="col-span-full border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            No se han definido módulos para este proyecto.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
