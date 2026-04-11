import { getProjects } from "@/app/actions/projects";
import { getSession } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Activity, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const projects = await getProjects();

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proyectos</h1>
                    <p className="text-muted-foreground">Gestiona y analiza el progreso funcional de los proyectos de la compañía.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
                        <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardTitle className="mt-2 text-xl">{project.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{project.description || "Sin descripción disponible."}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        <span>{project._count.modules} Módulos</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>Tracker Activo</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
                {projects.length === 0 && (
                     <div className="col-span-full border border-dashed rounded-lg p-12 text-center flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">Aún no hay proyectos</h3>
                        <p className="text-muted-foreground max-w-sm">No se encontraron proyectos activos. El rol de CEO/Manager debe generar la estructura inicial.</p>
                     </div>
                )}
            </div>
        </div>
    )
}
