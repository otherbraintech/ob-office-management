"use server"

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { TicketStatus, TicketPriority, SubtaskStatus, ExpenseType } from '@prisma/client';

// Projects
export async function createProject(data: { name: string; description?: string }) {
  const project = await prisma.project.create({ data });
  revalidatePath('/projects');
  return project;
}

export async function updateProject(id: string, data: { name?: string; description?: string; status?: string }) {
  const project = await prisma.project.update({ where: { id }, data });
  revalidatePath('/projects');
  return project;
}

// Modules
export async function createModule(data: { name: string; projectId: string }) {
  const module = await prisma.module.create({ data });
  revalidatePath(`/projects/${data.projectId}`);
  return module;
}

// Tickets
export async function createTicket(data: {
  title: string;
  description?: string;
  priority: TicketPriority;
  moduleId: string;
  leadId?: string;
  creatorId: string;
}) {
  const ticket = await prisma.ticket.create({ data });
  revalidatePath(`/tickets`);
  return ticket;
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  const ticket = await prisma.ticket.update({ where: { id }, data: { status } });
  revalidatePath(`/tickets`);
  return ticket;
}

// Subtasks
export async function manageSubtask(data: {
  id?: string;
  title: string;
  estimatedTime: number;
  ticketId: string;
  status?: SubtaskStatus;
}) {
  if (data.id) {
    return await prisma.subtask.update({
      where: { id: data.id },
      data: { title: data.title, estimatedTime: data.estimatedTime, status: data.status },
    });
  }
  const subtask = await prisma.subtask.create({
    data: {
      title: data.title,
      estimatedTime: data.estimatedTime,
      ticketId: data.ticketId,
    },
  });
  revalidatePath(`/tickets/${data.ticketId}`);
  return subtask;
}

// Work Sessions (Time Tracking)
export async function startWorkSession(userId: string, subtaskId: string) {
  const session = await prisma.workSession.create({
    data: { userId, subtaskId, startTime: new Date() },
  });
  return session;
}

export async function stopWorkSession(sessionId: string) {
  const session = await prisma.workSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');

  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 60000); // in minutes

  const updatedSession = await prisma.workSession.update({
    where: { id: sessionId },
    data: { endTime, duration },
  });

  // Update subtask realTime
  await prisma.subtask.update({
    where: { id: session.subtaskId },
    data: { realTime: { increment: duration } },
  });

  return updatedSession;
}

// Expenses
export async function recordExpense(data: {
  amount: number;
  category: string;
  description?: string;
  type: ExpenseType;
  billDate: Date;
  userId: string;
  projectId?: string;
}) {
  const expense = await prisma.expense.create({ data });
  revalidatePath('/finances');
  return expense;
}

export async function getExpenses(filters?: { projectId?: string; userId?: string }) {
  return await prisma.expense.findMany({
    where: filters,
    include: { project: true, user: true },
    orderBy: { billDate: 'desc' },
  });
}
