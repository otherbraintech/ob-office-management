import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Layers, Plus, Ticket as TicketIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDocuments } from "@/app/actions/documents";
import { PlanningTab } from "./_components/PlanningTab";
import { CreateModuleDialog } from "./_components/CreateModuleDialog";
import { ProjectStructure } from "./_components/ProjectStructure";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const session = await getSession();
    if (!session) redirect('/login');

    const project = await prisma.project.findUnique({
        where: { id: resolvedParams.slug },
        include: {
            modules: {
                include: {
                    tickets: {
                        orderBy: { order: 'asc' },
                        include: { subtasks: true }
                    }
                }
            },
            tickets: {
                where: { moduleId: null },
                orderBy: { createdAt: 'desc' },
                include: { subtasks: true }
            }
        }
    });

    if (!project) {
        return <div className="p-8 text-center text-red-500 font-black uppercase tracking-widest border-4 border-dashed border-red-500/20 m-8">Proyecto no encontrado.</div>
    }

    const documents = await getDocuments(project.id);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-background/50">
            {/* Header Premium Industrial */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-foreground pb-12 pt-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary text-primary-foreground font-black text-xl shadow-[6px_6px_0px_rgba(0,0,0,0.15)] rounded-none">
                            OBJ-{project.id.slice(-4).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-none border-primary/40 text-primary text-[9px] font-black uppercase tracking-widest px-3 h-5">
                                    Misión Activa
                                </Badge>
                                <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-tight">Estatus: {project.status}</span>
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">{project.name}</h1>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-bold max-w-3xl leading-relaxed uppercase tracking-tight opacity-70">
                        {project.description || "Iniciando planificación de arquitectura... Sin parámetros registrados."}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                     <CreateModuleDialog projectId={project.id} availableTickets={project.tickets} />
                     <Button className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">
                        Configurar Misión
                     </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="h-14 bg-muted/40 p-1 rounded-none border-b-4 border-foreground/5 w-fit gap-3 mb-10">
                    <TabsTrigger value="overview" className="rounded-none text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none transition-all px-10 h-full">
                        Estructura
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="rounded-none text-[11px] font-black uppercase tracking-[0.2em] data-[state=active]:bg-foreground data-[state=active]:text-background data-[state=active]:shadow-none transition-all px-10 h-full gap-2">
                        <Layers className="h-4 w-4" /> IA Nexus
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                    <ProjectStructure project={project} session={session} />
                </TabsContent>

                <TabsContent value="planning" className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <PlanningTab 
                        projectId={project.id} 
                        projectName={project.name}
                        initialDocuments={documents} 
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
