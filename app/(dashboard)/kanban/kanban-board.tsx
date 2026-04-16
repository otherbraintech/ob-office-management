'use client';

import { useState, useOptimistic, useTransition } from "react";
import { TicketStatus } from "@prisma/client";
import { KanbanColumn } from "./kanban-column";
import { moveTicket } from "@/app/actions/tickets";
import { toast } from "sonner";

interface KanbanBoardProps {
    initialTickets: any[];
    COLUMNS: any[];
    allUsers: any[];
    currentUserId: string;
}

export function KanbanBoard({ initialTickets, COLUMNS, allUsers, currentUserId }: KanbanBoardProps) {
    const [isPending, startTransition] = useTransition();
    const [draggingId, setDraggingId] = useState<string | null>(null);
    
    // Optimizamos el estado de los tickets
    const [optimisticTickets, addOptimisticTicket] = useOptimistic(
        initialTickets,
        (state: any[], { ticketId, newStatus, newIndex }: { ticketId: string, newStatus: TicketStatus, newIndex?: number }) => {
            const ticketIdx = state.findIndex(t => t.id === ticketId);
            if (ticketIdx === -1) return state;
            
            const newState = [...state];
            const [movedTicket] = newState.splice(ticketIdx, 1);
            const updatedTicket = { ...movedTicket, status: newStatus };

            const ticketsInCol = newState.filter(t => t.status === newStatus);
            
            if (newIndex !== undefined && newIndex < ticketsInCol.length) {
                const targetRefId = ticketsInCol[newIndex].id;
                const absoluteInsertIdx = newState.findIndex(t => t.id === targetRefId);
                newState.splice(absoluteInsertIdx, 0, updatedTicket);
            } else {
                newState.push(updatedTicket);
            }
            
            return newState;
        }
    );

    const handleMoveTicket = async (ticketId: string, newStatus: TicketStatus, newIndex?: number) => {
        startTransition(async () => {
            // Actualización optimista instantánea
            addOptimisticTicket({ ticketId, newStatus, newIndex });
            
            try {
                const result = await moveTicket(ticketId, newStatus, newIndex);
                if (result?.error) {
                    toast.error("Error al mover el ticket");
                }
            } catch (error) {
                toast.error("Error de conexión");
            }
        });
    };

    return (
        <div className="flex min-h-full h-fit gap-2 md:gap-3 p-2 md:p-4 pt-4 pb-20 overflow-x-auto">
            {COLUMNS.map((col) => (
                <KanbanColumn 
                    key={`kanban-col-${col.id}`}
                    id={col.id as TicketStatus}
                    title={col.title}
                    iconName={col.iconName}
                    color={col.color}
                    tickets={optimisticTickets.filter(t => t.status === col.id)}
                    allUsers={allUsers}
                    currentUserId={currentUserId}
                    onMoveTicket={handleMoveTicket}
                    currentDraggingId={draggingId}
                    onDraggingChange={setDraggingId}
                />
            ))}
        </div>
    );
}
