"use server"

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { can } from '@/lib/permissions';

export async function getActiveSession() {
  const session = await getSession();
  if (!session) return null;

  return await prisma.workSession.findFirst({
    where: {
      userId: session.id,
      endTime: null
    },
    include: { subtask: true }
  });
}

export async function getAvailableSubtasks() {
  const session = await getSession();
  if (!session) return [];

  // Devs solo pueden tener time tracking en sus tareas
  return await prisma.subtask.findMany({
    where: {
      assignedId: session.id,
      status: { not: 'DONE' }
    }
  });
}

export async function startWorkSession(subtaskId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } });
  if (!subtask) throw new Error("Subtask not found");

  if (!can(session, 'track_time', 'Subtask', subtask)) {
      throw new Error("No tienes permiso de trackear horas ajenas.");
  }

  // Prevenir dobles turnos cerrando el anterior
  const activeSession = await getActiveSession();
  if (activeSession) {
      await stopWorkSession(activeSession.id);
  }

  // Cambiar status a doing si no lo está
  if (subtask.status === "TODO") {
      await prisma.subtask.update({ where: { id: subtaskId }, data: { status: 'DOING' } });
  }

  const newSession = await prisma.workSession.create({
    data: {
      userId: session.id,
      subtaskId: subtaskId,
    }
  });

  return newSession;
}

export async function stopWorkSession(sessionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const wSession = await prisma.workSession.findUnique({ where: { id: sessionId }, include: { subtask: true }});
  if (!wSession || wSession.userId !== session.id || wSession.endTime) {
     return; // Ya cerrada o no es del usuario
  }

  const endTime = new Date();
  const diffInMs = endTime.getTime() - wSession.startTime.getTime();
  const diffInMinutes = Math.round(diffInMs / 60000);

  // Cerrar sesion
  await prisma.workSession.update({
    where: { id: sessionId },
    data: {
      endTime,
      duration: diffInMinutes
    }
  });

  // Aumentar el realTime acumulado en la Subtarea
  await prisma.subtask.update({
    where: { id: wSession.subtaskId },
    data: {
      realTime: { increment: diffInMinutes }
    }
  });

  return true;
}
