'use client';

import { TicketStatus } from "@prisma/client";
import { updateTicketStatus } from "@/app/actions/tickets";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LucideIcon, Clock, MoveRight, ClipboardList, AlertCircle, PlayCircle, TestTube2, CheckCircle2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { TicketCard } from "@/components/tickets/ticket-card";
import { UserAvatarProfile } from "@/components/tickets/user-avatar-profile";

const ICON_MAP: Record<string, LucideIcon> = {
    backlog: ClipboardList,
    todo: AlertCircle,
    progress: PlayCircle,
    testing: TestTube2,
    done: CheckCircle2,
    cancelled: Ban,
};

interface KanbanColumnProps {
    id: TicketStatus;
    title: string;
    iconName: string;
    color: string;
    tickets: any[];
    allUsers: any[];
    currentUserId: string;
    onMoveTicket: (ticketId: string, newStatus: TicketStatus, newIndex?: number) => void;
    currentDraggingId: string | null;
    onDraggingChange: (ticketId: string | null) => void;
}

export function KanbanColumn({ id, title, iconName, color, tickets, allUsers, currentUserId, onMoveTicket, currentDraggingId, onDraggingChange }: KanbanColumnProps) {
    const [isOver, setIsOver] = useState(false);
    const [dragOverTicketId, setDragOverTicketId] = useState<string | null>(null);
    const Icon = ICON_MAP[iconName] || AlertCircle;

    const handleDragStart = (e: React.DragEvent, ticketId: string) => {
        e.dataTransfer.setData("ticketId", ticketId);
        e.dataTransfer.effectAllowed = "move";
        onDraggingChange(ticketId);
        
        // Ajuste opcional para intentar que la imagen de arrastre sea más nítida
        if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 10, 10);
        }
    };

    const handleDragEnd = () => {
        onDraggingChange(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
        // Si el evento ocurre directamente en la columna (no en una card), limpiamos el indicador de card
        if (e.target === e.currentTarget) {
            setDragOverTicketId(null);
        }
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        
        const ticketId = e.dataTransfer.getData("ticketId");
        
        // Calculamos el nuevo índice si estamos sobre un ticket
        const newIndex = dragOverTicketId 
            ? tickets.findIndex(t => t.id === dragOverTicketId)
            : undefined;

        setDragOverTicketId(null);
        onDraggingChange(null); // Aseguramos que se limpie el estado de arrastre global
        
        if (ticketId) {
            onMoveTicket(ticketId, id, newIndex);
        }
    };

    return (
        <div 
            className={cn(
                "flex flex-col w-60 shrink-0 h-full transition-colors border-r-2 border-foreground/5 last:border-0 px-2",
                isOver && "bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-transparent py-2 z-10">
                <div className="flex items-center gap-2">
                    <Icon className={cn("size-4", color)} />
                    <h2 className="text-xs font-bold uppercase tracking-widest">{title}</h2>
                    <Badge variant="secondary" className="text-[10px] rounded-none px-1 h-4 min-w-4 flex items-center justify-center bg-foreground/5 text-muted-foreground border-none">
                        {tickets.length}
                    </Badge>
                </div>
            </div>

            <div className="flex flex-col gap-2 pb-8 overflow-y-auto no-scrollbar">
                {tickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                        onDragEnd={handleDragEnd}
                        onDragEnter={(e) => {
                            e.preventDefault();
                            if (currentDraggingId && currentDraggingId !== ticket.id) {
                                setDragOverTicketId(ticket.id);
                            }
                        }}
                        onDrop={(e) => {
                            // Dejar que el drop llegue a la columna pero limpiar el estado local
                            setDragOverTicketId(null);
                        }}
                        className={cn(
                            "group relative cursor-grab active:cursor-grabbing transition-all duration-150",
                            currentDraggingId === ticket.id && "opacity-20 scale-95 grayscale"
                        )}
                    >
                        {/* Indicador de caída suave (Drop Zone) - Ignora eventos para evitar parpadeos */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out pointer-events-none",
                            dragOverTicketId === ticket.id ? "h-36 opacity-100 mb-2" : "h-0 opacity-0 mb-0"
                        )}>
                            <div className="h-32 w-full border-2 border-dashed border-primary/10 bg-primary/5" />
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Card className={cn(
                                    "rounded-none border-2 border-foreground/5 last:border-0 hover:border-primary/30 transition-all bg-background shadow-none overflow-hidden cursor-pointer",
                                    currentDraggingId === ticket.id && "border-primary border-dashed shadow-xl"
                                )}>
                                    <CardContent className="p-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <Badge variant="outline" className={cn(
                                                    "text-[9px] border-primary/20 text-primary uppercase h-4 px-1 rounded-none",
                                                    ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? "text-red-500 border-red-500/20" : ""
                                                )}>
                                                    {ticket.priority}
                                                </Badge>
                                                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-muted-foreground/60">
                                                    <Clock className="size-3" />
                                                    {ticket.subtasks.length} tareas
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {ticket.title}
                                            </h3>
                                            
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-foreground/5">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase truncate max-w-[120px]">
                                                    {ticket.project?.name || ticket.module?.project?.name || "Sin Proyecto"}
                                                </span>
                                                <div className="flex -space-x-1.5 overflow-hidden">
                                                    {ticket.lead && (
                                                        <UserAvatarProfile 
                                                            userId={ticket.lead.id} 
                                                            allUsers={allUsers} 
                                                            isLead={true}
                                                            ticketLead={ticket.lead}
                                                        />
                                                    )}
                                                    {ticket.collaborators?.map((col: any) => (
                                                        <UserAvatarProfile 
                                                            key={col.id}
                                                            userId={col.id} 
                                                            allUsers={allUsers} 
                                                            isLead={false}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 overflow-y-auto max-h-[90vh] border-2 border-primary/20 rounded-none bg-background custom-scrollbar">
                                <DialogTitle className="sr-only">Detalles de Misión Operativa</DialogTitle>
                                <TicketCard 
                                    ticket={ticket} 
                                    allUsers={allUsers} 
                                    currentUserId={currentUserId} 
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                ))}

                {/* Zona de caída al final de la columna */}
                <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    (isOver && !dragOverTicketId) ? "h-36 opacity-100 mb-2" : "h-0 opacity-0 mb-0"
                )}>
                    <div className="h-32 w-full border-2 border-dashed border-primary/10 bg-primary/5" />
                </div>

                {tickets.length === 0 && !isOver && (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-foreground/5 opacity-20">
                        <MoveRight className="size-8 rotate-90" />
                        <span className="text-[10px] font-bold uppercase mt-2">Vacío</span>
                    </div>
                )}
            </div>
        </div>
    );
}
