"use client"

import { useState, useTransition, useOptimistic } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Layers, 
    Ticket as TicketIcon, 
    Clock, 
    CheckCircle2,
    LayoutGrid,
    Search,
    ChevronRight,
    ArrowUpRight,
    Plus,
    MoveRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateTicketDialog } from "./CreateTicketDialog";
import { CreateModuleDialog } from "./CreateModuleDialog";
import { AssignToModuleButton } from "./AssignToModuleButton";
import { assignTicketToModule } from "@/app/actions/projects";
import { unlinkTicketFromProject } from "@/app/actions/tickets";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eraser } from "lucide-react";

export function ProjectStructure({ project, session }: { project: any, session: any }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);

    // Estado Optimista: Simulamos el cambio en la estructura antes de que la BDD responda
    const [optimisticProject, addOptimisticMove] = useOptimistic(
        project,
        (state, { ticketId, targetModuleId }: { ticketId: string, targetModuleId: string | null | 'unlink' }) => {
            const newState = { ...state };
            let movedTicket: any = null;

            // 1. Quitar de donde esté (backlog o módulos)
            newState.tickets = (state.tickets || []).filter((t: any) => {
                if (t.id === ticketId) { movedTicket = t; return false; }
                return true;
            });
            newState.modules = (state.modules || []).map((m: any) => {
                const isSource = m.tickets.some((t: any) => t.id === ticketId);
                if (isSource) {
                    movedTicket = m.tickets.find((t: any) => t.id === ticketId);
                    return { ...m, tickets: m.tickets.filter((t: any) => t.id !== ticketId) };
                }
                return m;
            });

            if (!movedTicket) return state;
            if (targetModuleId === 'unlink') return newState; // Se elimina del proyecto

            // 2. Insertar en el destino
            if (targetModuleId === null) {
                return { ...newState, tickets: [{ ...movedTicket, moduleId: null }, ...newState.tickets] };
            } else {
                return {
                    ...newState,
                    modules: newState.modules.map((m: any) => 
                        m.id === targetModuleId 
                            ? { ...m, tickets: [...m.tickets, { ...movedTicket, moduleId: targetModuleId }] }
                            : m
                    )
                };
            }
        }
    );

    const handleUnlink = (ticketId: string) => {
        startTransition(async () => {
            addOptimisticMove({ ticketId, targetModuleId: 'unlink' });
            try {
                await unlinkTicketFromProject(ticketId);
                router.refresh();
                toast.success("Ticket liberado del proyecto");
            } catch (error) {
                toast.error("Error al desvincular");
            }
        });
    };

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        setDraggedTicketId(ticketId);
        e.dataTransfer.setData("ticketId", ticketId);
        e.dataTransfer.effectAllowed = "move";
        
        // Crear una imagen fantasma personalizada si se desea, o usar la predeterminada
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "0.4";
        }
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedTicketId(null);
        setDropTargetId(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = "1";
        }
    };

    const handleDragOver = (e: React.DragEvent, id: string | null) => {
        e.preventDefault();
        setDropTargetId(id);
    };

    const handleDrop = (e: React.DragEvent, targetModuleId: string | null) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData("ticketId");
        setDraggedTicketId(null);
        setDropTargetId(null);

        if (!ticketId) return;

        startTransition(async () => {
            addOptimisticMove({ ticketId, targetModuleId });
            try {
                await assignTicketToModule(ticketId, targetModuleId as string);
                router.refresh();
            } catch (error) {
                toast.error("Error al sincronizar estructura");
            }
        });
    };

    const filteredBacklog = (optimisticProject.tickets || []).filter((t: any) => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <TooltipProvider>
            <div className="grid gap-8 lg:grid-cols-[380px_1fr] animate-in fade-in duration-700">
                {/* BACKLOG SIDEBAR */}
                <div 
                    className={cn(
                        "space-y-6 transition-all duration-300",
                        dropTargetId === 'backlog' && "scale-[1.02] translate-x-2"
                    )}
                    onDragOver={(e) => handleDragOver(e, 'backlog')}
                    onDragLeave={() => setDropTargetId(null)}
                    onDrop={(e) => handleDrop(e, null)}
                >
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                             <div className={cn(
                                 "size-2 animate-pulse rounded-full transition-all duration-500",
                                 dropTargetId === 'backlog' ? "bg-primary scale-[2] shadow-[0_0_10px_rgba(0,0,0,0.2)]" : "bg-primary/30"
                             )} />
                             <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Backlog Maestro</h2>
                        </div>
                        <Badge variant="outline" className="rounded-none border-primary/20 text-[9px] font-black text-primary">
                            {optimisticProject.tickets.length}
                        </Badge>
                    </div>

                    <Card className={cn(
                        "rounded-none border-2 transition-all duration-300 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col h-[750px] shadow-2xl relative",
                        dropTargetId === 'backlog' ? "border-primary shadow-primary/20 ring-4 ring-primary/5" : "border-primary/10 shadow-primary/5"
                    )}>
                        {dropTargetId === 'backlog' && (
                            <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-pulse z-0" />
                        )}

                        <div className="p-4 border-b-2 border-foreground/5 space-y-4 bg-muted/20 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <input 
                                    className="w-full bg-background border-2 border-foreground/5 h-10 pl-9 pr-4 text-xs font-bold uppercase tracking-tight focus:border-primary/40 outline-none transition-all"
                                    placeholder="Buscar en el backlog..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <CreateTicketDialog 
                                projectId={project.id} 
                                currentUserId={session.id} 
                                variant="default" 
                                availableProjectTickets={optimisticProject.tickets}
                            />
                        </div>

                        <ScrollArea className="flex-1 z-10">
                            <div className="p-3 space-y-3">
                                {filteredBacklog.map((ticket: any) => (
                                    <div 
                                        key={ticket.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                                        onDragEnd={handleDragEnd}
                                        className={cn(
                                            "group/ticket p-4 bg-background border-2 border-foreground/5 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden animate-in fade-in zoom-in-95 duration-500",
                                            draggedTicketId === ticket.id && "opacity-20 scale-95 grayscale"
                                        )}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <Link href={`/tickets/${ticket.id}`} className="font-extrabold text-[13px] uppercase tracking-tighter leading-tight hover:text-primary transition-colors line-clamp-2 pr-2">
                                                    {ticket.title}
                                                </Link>
                                                <Badge variant="outline" className={cn(
                                                    "rounded-none text-[8px] font-black shrink-0 px-1 border-2",
                                                    ticket.priority === 'URGENT' ? 'border-red-500/50 text-red-500 bg-red-500/5' : 'border-foreground/5 text-muted-foreground/40'
                                                )}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-3 border-t border-foreground/5">
                                                <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] font-black uppercase tracking-widest">
                                                    <Clock className="size-3" />
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/ticket:opacity-100 transition-all">
                                                    <AssignToModuleButton 
                                                        ticketId={ticket.id} 
                                                        modules={optimisticProject.modules.map((m: any) => ({ id: m.id, name: m.name }))} 
                                                    />
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-8 rounded-none hover:bg-red-500/10 hover:text-red-500" 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleUnlink(ticket.id);
                                                                }}
                                                                disabled={isPending}
                                                            >
                                                                <Eraser className="size-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-none font-bold uppercase text-[9px] tracking-widest bg-red-500 text-white">Liberar de Proyecto</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8 rounded-none hover:bg-primary/10 hover:text-primary" asChild>
                                                                <Link href={`/tickets/${ticket.id}`}>
                                                                    <ArrowUpRight className="size-3.5" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-none font-bold uppercase text-[9px] tracking-widest">Abrir Requerimiento</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredBacklog.length === 0 && (
                                    <div className="py-24 flex flex-col items-center justify-center text-center gap-4 opacity-10 border-4 border-dashed border-foreground/5 font-black uppercase text-[10px] tracking-widest">
                                        <CheckCircle2 className="size-12" />
                                        <p>Estructura Despejada</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>

                {/* MODULES GRID */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                             <LayoutGrid className="size-4 text-primary" />
                             <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Matriz de Objetivos</h2>
                        </div>
                        {isPending && (
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary animate-pulse">
                                <Loader2 className="size-3 animate-spin" />
                                Transacción en Curso
                            </div>
                        )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                        {optimisticProject.modules.map((mod: any) => (
                            <div 
                                key={mod.id}
                                onDragOver={(e) => handleDragOver(e, mod.id)}
                                onDragLeave={() => setDropTargetId(null)}
                                onDrop={(e) => handleDrop(e, mod.id)}
                                className="h-full"
                            >
                                <Card className={cn(
                                    "rounded-none border-2 bg-background flex flex-col h-[420px] transition-all duration-300 relative overflow-hidden",
                                    dropTargetId === mod.id ? "border-primary border-4 shadow-2xl scale-[1.04] z-20" : "border-foreground/5 hover:border-primary/20"
                                )}>
                                    {dropTargetId === mod.id && (
                                        <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-pulse" />
                                    )}
                                    
                                    <div className="p-5 border-b-2 border-foreground/5 bg-muted/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="outline" className="rounded-none text-[8px] font-black border-primary/30 text-primary uppercase bg-primary/5">
                                                ID-{mod.id.slice(-3).toUpperCase()}
                                            </Badge>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-primary transition-colors" asChild>
                                                         <Link href={`/kanban?module=${mod.id}`}>
                                                            <MoveRight className="size-4" />
                                                         </Link>
                                                     </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="rounded-none font-bold uppercase text-[9px]">Consola Kanban</TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                                            {mod.name}
                                        </h3>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">
                                            {mod.tickets.length} Requerimientos Vinculados
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-hidden p-2">
                                        <ScrollArea className="h-full pr-2">
                                            <div className="p-1 space-y-2">
                                                {mod.tickets.map((t: any) => (
                                                    <div 
                                                        key={t.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, t.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className="block group/item"
                                                    >
                                                        <Link 
                                                            href={`/tickets/${t.id}`}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 bg-muted/5 hover:bg-primary/5 border-2 border-transparent hover:border-primary/20 transition-all overflow-hidden animate-in slide-in-from-right-4 duration-500 cursor-grab active:cursor-grabbing",
                                                                draggedTicketId === t.id && "opacity-10 scale-90 grayscale"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={cn(
                                                                    "size-2 shrink-0 rounded-none transform rotate-45 border border-foreground/10 transition-all duration-700",
                                                                    t.status === 'DONE' ? 'bg-green-500 scale-110 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                                                                    t.status === 'IN_PROGRESS' ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse' : 'bg-primary/20'
                                                                )} />
                                                                <span className="text-[11px] font-extrabold uppercase tracking-tight truncate opacity-60 group-hover/item:opacity-100 transition-opacity">
                                                                    {t.title}
                                                                </span>
                                                            </div>
                                                            <ChevronRight className="size-3 text-primary opacity-0 group-hover/item:opacity-40 transition-all shrink-0" />
                                                        </Link>
                                                    </div>
                                                ))}
                                                {mod.tickets.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-20 opacity-[0.05] border-4 border-dashed border-foreground/10 font-black uppercase text-[10px] tracking-widest gap-2">
                                                        <Plus className="size-12" />
                                                        <p>Matriz Vacía</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <div className="p-4 bg-muted/10 border-t-2 border-foreground/5 grid grid-cols-2 gap-3">
                                        <CreateTicketDialog 
                                            moduleId={mod.id} 
                                            projectId={project.id}
                                            currentUserId={session.id} 
                                            availableProjectTickets={optimisticProject.tickets}
                                        />
                                        <Button variant="outline" size="sm" className="rounded-none text-[9px] font-black uppercase border-2 border-foreground/10 h-10 hover:bg-foreground hover:text-background transition-colors" asChild>
                                            <Link href={`/kanban?module=${mod.id}`}>Tablero Maestro</Link>
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        ))}

                        {/* ADD MODULE CTA */}
                        <div className="border-4 border-dashed border-foreground/5 rounded-none p-12 text-center flex flex-col items-center justify-center gap-8 group hover:border-primary/30 hover:bg-primary/5 transition-all h-[420px]">
                            <div className="size-24 bg-muted/20 border-2 border-foreground/5 rounded-none flex items-center justify-center group-hover:rotate-90 group-hover:scale-110 group-hover:border-primary/20 transition-all duration-700">
                                <Plus className="size-12 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="space-y-6 w-full flex flex-col items-center">
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60">Anexar Módulo</p>
                                    <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/30">Ampliar la cobertura del proyecto</p>
                                </div>
                                <CreateModuleDialog projectId={project.id} availableTickets={optimisticProject.tickets} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
