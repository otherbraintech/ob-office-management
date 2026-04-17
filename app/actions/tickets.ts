'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function updateTicketAssignees(ticketId: string, leadId: string | null, collaboratorIds: string[]) {
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                leadId: leadId,
                collaborators: {
                    set: collaboratorIds.map(id => ({ id }))
                }
            }
        });
        revalidatePath("/tickets");
        revalidatePath("/tickets/me");
        revalidatePath("/kanban");
        return { success: true };
    } catch (e) {
        console.error("Assignees Update Error:", e);
        return { error: "No se pudieron actualizar los responsables" };
    }
}

export async function assignTicket(ticketId: string, userId: string) {
    return updateTicketAssignees(ticketId, userId, []);
}

export async function updateSubtaskTime(subtaskId: string, minutes: number) {
    try {
        await prisma.subtask.update({
            where: { id: subtaskId },
            data: { estimatedTime: minutes }
        });
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo actualizar el tiempo" };
    }
}

export async function addSubtaskToTicket(ticketId: string, title: string, estimatedTime: number) {
    try {
        await prisma.subtask.create({
            data: {
                title,
                estimatedTime,
                ticketId
            }
        });
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo añadir la sub-tarea" };
    }
}

export async function deleteSubtask(subtaskId: string) {
    try {
        await prisma.subtask.delete({
            where: { id: subtaskId }
        });
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo eliminar la sub-tarea" };
    }
}

export async function unassignTicket(ticketId: string) {
    try {
        console.log(`[Unassigning Ticket via Raw SQL]: ${ticketId}`);
        await prisma.$executeRaw`UPDATE "Ticket" SET "leadId" = NULL WHERE id = ${ticketId}`;
        
        revalidatePath("/tickets");
        revalidatePath("/tickets/me");
        revalidatePath("/");
        return { success: true };
    } catch (e) {
        console.error(`[Unassigning Raw Error]:`, e);
        return { error: "No se pudo desasignar el ticket" };
    }
}

export async function rebuildTicketSubtasks(ticketId: string, subtasks: { title: string, estimatedTime: number }[]) {
    try {
        await prisma.$transaction([
            prisma.subtask.deleteMany({ where: { ticketId } }),
            prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    subtasks: {
                        create: subtasks.map((s, index) => ({
                            title: s.title,
                            estimatedTime: s.estimatedTime,
                            order: index
                        }))
                    }
                }
            })
        ]);
        revalidatePath("/tickets");
        return { success: true };
    } catch (e: any) {
        console.error(`[Rebuild Error]:`, e);
        return { error: e.message || "No se pudo reconstruir la estructura del ticket" };
    }
}

export async function reorderSubtask(subtaskId: string, direction: 'UP' | 'DOWN') {
    try {
        const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
        if (!subtask) return { error: "No se encontró la sub-tarea" };

        const other = await prisma.subtask.findFirst({
            where: {
                ticketId: subtask.ticketId,
                order: direction === 'UP' ? { lt: subtask.order } : { gt: subtask.order }
            },
            orderBy: { order: direction === 'UP' ? 'desc' : 'asc' }
        });

        if (other) {
            await prisma.$transaction([
                prisma.subtask.update({ where: { id: subtaskId }, data: { order: other.order } }),
                prisma.subtask.update({ where: { id: other.id }, data: { order: subtask.order } })
            ]);
        }
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo reordenar" };
    }
}
export async function updateTicketStatus(ticketId: string, status: any) {
    try {
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) return { error: "Ticket no encontrado" };

        // Rigorous Validation: No lead = No operation
        if ((status === 'TODO' || status === 'IN_PROGRESS') && !ticket.leadId) {
            return { error: "BLOQUEO DE SEGURIDAD: Se requiere asignar un responsable antes de mover el ticket a estados operativos." };
        }

        // Si el ticket vuelve a la cola, cerramos todas sus sesiones operativas activas
        if (status === 'TODO' || status === 'BACKLOG') {
            const activeSessions = await prisma.workSession.findMany({
                where: { ticketId: ticketId, endTime: null }
            });
            for (const session of activeSessions) {
                const endTime = new Date();
                const durationMinutes = Math.round((endTime.getTime() - session.startTime.getTime()) / 60000);
                await prisma.$transaction([
                    prisma.workSession.update({
                        where: { id: session.id },
                        data: { endTime, duration: durationMinutes }
                    }),
                    prisma.ticket.update({
                        where: { id: ticketId },
                        data: { realTime: { increment: durationMinutes } }
                    })
                ]);
            }
        }

        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status }
        });
        revalidatePath("/tickets");
        revalidatePath("/kanban");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo actualizar el estado del ticket" };
    }
}

/**
 * Mueve un ticket a una nueva posición (status + order)
 */
export async function moveTicket(ticketId: string, newStatus: any, newIndex?: number) {
    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { subtasks: true }
        });

        if (!ticket) return { error: "Ticket no encontrado" };

        // 1. Rigorous Validation: No lead = No operation
        if ((newStatus === 'TODO' || newStatus === 'IN_PROGRESS') && !ticket.leadId) {
            return { error: "BLOQUEO DE SEGURIDAD: Se requiere asignar un responsable antes de mover el ticket a estados operativos." };
        }

        // 2. Automated Pause Logic
        if (newStatus === 'TODO' || newStatus === 'BACKLOG') {
            const activeSessions = await prisma.workSession.findMany({
                where: { ticketId: ticketId, endTime: null }
            });
            for (const session of activeSessions) {
                const endTime = new Date();
                const durationSeconds = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000);
                await prisma.$transaction([
                    prisma.workSession.update({
                        where: { id: session.id },
                        data: { endTime, duration: durationSeconds }
                    }),
                    prisma.ticket.update({
                        where: { id: ticketId },
                        data: { 
                            realTime: { increment: Math.max(1, Math.round(durationSeconds / 60)) },
                            isActive: false,
                            lastStartedAt: null
                        }
                    })
                ]);
            }
            
            // Ensure ticket is deactivated even if no sessions found
            await prisma.ticket.update({
                where: { id: ticketId },
                data: { isActive: false, lastStartedAt: null }
            });
        }

        // Obtenemos los tickets de la columna de destino ordenados por 'order'
        const ticketsInCol = await prisma.ticket.findMany({
            where: { status: newStatus },
            orderBy: { order: 'asc' }
        });

        const otherTickets = ticketsInCol.filter(t => t.id !== ticketId);
        
        if (newIndex !== undefined) {
            // Insertamos el ticket en la nueva posición
            otherTickets.splice(newIndex, 0, { id: ticketId } as any);
        } else {
            // Al final
            otherTickets.push({ id: ticketId } as any);
        }

        // Actualización atómica de todos los órdenes en esa columna
        await prisma.$transaction(
            otherTickets.map((t, idx) => 
                prisma.ticket.update({
                    where: { id: t.id },
                    data: { 
                        status: newStatus,
                        order: idx 
                    }
                })
            )
        );

        revalidatePath("/kanban");
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        console.error("Move Ticket Error:", e);
        return { error: "No se pudo mover el ticket" };
    }
}

export async function createTicket(formData: FormData, creatorId: string, options: { moduleId?: string, projectId?: string }) {
    try {
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as any;

        await prisma.ticket.create({
            data: {
                title,
                description,
                priority,
                moduleId: options.moduleId || null,
                projectId: options.projectId || null,
                creatorId,
                status: 'BACKLOG',
            }
        });
        
        revalidatePath(`/projects`);
        revalidatePath("/tickets");
        return { success: true };
    } catch (e) {
        console.error("Error creating ticket:", e);
        return { error: "No se pudo crear el requerimiento" };
    }
}

export async function getOrphanTickets() {
    return await prisma.ticket.findMany({
        where: { projectId: null, moduleId: null },
        orderBy: { createdAt: 'desc' }
    });
}

export async function linkTicketToProject(ticketId: string, options: { projectId?: string, moduleId?: string }) {
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                projectId: options.projectId || null,
                moduleId: options.moduleId || null 
            }
        });
        revalidatePath("/projects");
        revalidatePath("/tickets");
        if (options.projectId) revalidatePath(`/projects/${options.projectId}`);
        return { success: true };
    } catch(e) {
        return { error: "No se pudo enlazar el ticket" };
    }
}
export async function unlinkTicketFromProject(ticketId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                projectId: null,
                moduleId: null
            }
        });
        revalidatePath("/projects");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo desvincular el ticket" };
    }
}

export async function cancelTicket(ticketId: string, reason: string) {
    try {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                status: 'CANCELLED',
                cancelReason: reason,
                isActive: false,
                lastStartedAt: null
            }
        });
        revalidatePath("/");
        revalidatePath("/kanban");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo cancelar el ticket" };
    }
}

export async function completeTicket(ticketId: string, comment?: string) {
    try {
        // Close any active sessions
        const activeSessions = await prisma.workSession.findMany({
            where: { ticketId, endTime: null }
        });
        for (const session of activeSessions) {
            const endTime = new Date();
            const durationSeconds = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000);
            await prisma.workSession.update({
                where: { id: session.id },
                data: { endTime, duration: durationSeconds }
            });
        }

        await prisma.ticket.update({
            where: { id: ticketId },
            data: { 
                status: 'TESTING',
                completionComment: comment || null,
                isActive: false,
                lastStartedAt: null
            }
        });
        revalidatePath("/");
        revalidatePath("/kanban");
        return { success: true };
    } catch (e) {
        return { error: "No se pudo completar el ticket" };
    }
}
