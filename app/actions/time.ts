"use server"

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function getActiveTimers() {
    const session = await getSession();
    if (!session) return null;

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
        where: { userId: session.id, endTime: null },
        orderBy: { startTime: 'desc' }
    });

    // Get active work session (ticket)
    const activeSession = await prisma.workSession.findFirst({
        where: { userId: session.id, endTime: null, ticketId: { not: null } },
        include: { ticket: true },
        orderBy: { startTime: 'desc' }
    });

    return {
        shift: activeShift,
        ticketSession: activeSession
    };
}

export async function startShift(ticketId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Close any existing active shift
    const existingShifts = await prisma.shift.findMany({
        where: { userId: session.id, endTime: null }
    });
    
    for (const shift of existingShifts) {
        const duration = Math.round((new Date().getTime() - new Date(shift.startTime).getTime()) / 1000);
        await prisma.shift.update({
            where: { id: shift.id },
            data: { endTime: new Date(), duration }
        });
    }

    // Stop any active work sessions
    await pauseActiveTicket();

    // Start new shift
    const newShift = await prisma.shift.create({
        data: {
            userId: session.id,
            startTime: new Date()
        }
    });

    // Move ticket to IN_PROGRESS and start its session
    await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
    });

    await prisma.workSession.create({
        data: {
            userId: session.id,
            ticketId: ticketId,
            startTime: new Date()
        }
    });

    revalidatePath("/");
    return { success: true, shift: newShift };
}

export async function stopShift(ticketResolutionStatus: 'BACKLOG' | 'TODO' | 'DONE' = 'BACKLOG') {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Stop active ticket session FIRST to capture the time
    const pausedSession = await pauseActiveTicket();

    // Move the active ticket to the requested status
    if (pausedSession && pausedSession.ticketId) {
        await prisma.ticket.update({
            where: { id: pausedSession.ticketId },
            data: { status: ticketResolutionStatus }
        });
    }

    // Stop active shift
    const activeShift = await prisma.shift.findFirst({
        where: { userId: session.id, endTime: null }
    });

    if (activeShift) {
        const duration = Math.round((new Date().getTime() - new Date(activeShift.startTime).getTime()) / 1000);
        await prisma.shift.update({
            where: { id: activeShift.id },
            data: { endTime: new Date(), duration }
        });
    }

    revalidatePath("/");
    return { success: true };
}

export async function pauseActiveTicket() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const activeSession = await prisma.workSession.findFirst({
        where: { userId: session.id, endTime: null }
    });

    if (activeSession) {
        const now = new Date();
        const sessionDuration = Math.round((now.getTime() - new Date(activeSession.startTime).getTime()) / 1000);
        
        await prisma.workSession.update({
            where: { id: activeSession.id },
            data: { endTime: now, duration: sessionDuration }
        });

        // Update total real time on the ticket and stop telemetry
        if (activeSession.ticketId) {
            await prisma.ticket.update({
                where: { id: activeSession.ticketId },
                data: { 
                    realTime: { increment: sessionDuration },
                    isActive: false,
                    lastStartedAt: null
                }
            });
        }

        // Handle subtask if present
        if (activeSession.subtaskId) {
            await prisma.subtask.update({
                where: { id: activeSession.subtaskId },
                data: {
                    realTime: { increment: sessionDuration },
                    isActive: false,
                    lastStartedAt: null
                }
            });
        }
        
        revalidatePath("/");
        return activeSession;
    }
    return null;
}

export async function resumeTicket(ticketId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Must have an active shift to work on a ticket
    const activeShift = await prisma.shift.findFirst({
        where: { userId: session.id, endTime: null }
    });

    if (!activeShift) {
        return { error: "Debes iniciar turno primero" };
    }

    // Pause any currently active ticket
    await pauseActiveTicket();

    // Move to in progress and start telemetry
    await prisma.ticket.update({
        where: { id: ticketId },
        data: { 
            status: 'IN_PROGRESS',
            isActive: true,
            lastStartedAt: new Date()
        }
    });

    // Start new session
    await prisma.workSession.create({
        data: {
            userId: session.id,
            ticketId: ticketId,
            startTime: new Date()
        }
    });

    revalidatePath("/");
    return { success: true };
}

export async function getAvailableTicketsForShift() {
    const session = await getSession();
    if (!session) return [];

    // Prioritize tickets assigned to user or created by user that are in TODO
    return await prisma.ticket.findMany({
        where: {
            OR: [
                { leadId: session.id },
                { collaborators: { some: { id: session.id } } }
            ],
            status: 'TODO'
        },
        orderBy: { priority: 'desc' }
    });
}

export async function completeSubtask(subtaskId: string, realTimeSeconds: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Marcar como completada y actualizar tiempo real en segundos absolutos
    await prisma.subtask.update({
        where: { id: subtaskId },
        data: {
            status: 'DONE',
            realTime: { increment: realTimeSeconds }
        }
    });

    // Sumar ese tiempo directamente al ticket también
    const subtask = await prisma.subtask.findUnique({
        where: { id: subtaskId },
        select: { ticketId: true }
    });

    let allDone = false;

    if (subtask?.ticketId) {
        await prisma.ticket.update({
            where: { id: subtask.ticketId },
            data: { realTime: { increment: realTimeSeconds } }
        });

        // Verificar si todas las subtareas están completas (NO auto-cerrar)
        const remainingSubtasks = await prisma.subtask.count({
            where: {
                ticketId: subtask.ticketId,
                status: { in: ['TODO', 'DOING'] }
            }
        });

        allDone = remainingSubtasks === 0;
    }

    revalidatePath("/");
    return { success: true, allDone };
}

export async function pauseShift() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const activeShift = await prisma.shift.findFirst({
        where: { userId: session.id, endTime: null }
    });

    if (activeShift) {
        // First pause any active ticket/subtask
        await pauseActiveTicket();

        // Mark shift as paused
        await prisma.shift.update({
            where: { id: activeShift.id },
            data: { isPaused: true }
        });

        revalidatePath("/");
        return { success: true };
    }
    return { error: "No hay turno activo para pausar" };
}

export async function resumeShift() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const activeShift = await prisma.shift.findFirst({
        where: { userId: session.id, endTime: null }
    });

    if (activeShift) {
        await prisma.shift.update({
            where: { id: activeShift.id },
            data: { isPaused: false }
        });

        revalidatePath("/");
        return { success: true };
    }
    return { error: "No hay turno pausado para reanudar" };
}
