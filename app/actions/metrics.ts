import { prisma } from '@/lib/prisma';
import { SubtaskStatus } from '@prisma/client';

export async function calculateProjectMetrics(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      modules: {
        include: {
          tickets: {
            include: {
              subtasks: {
                include: {
                  workSessions: true,
                },
              },
            },
          },
        },
      },
      expenses: true,
    },
  });

  if (!project) throw new Error('Project not found');

  let totalSubtasks = 0;
  let completedSubtasks = 0;
  let totalTime = 0; // in minutes

  project.modules.forEach((module) => {
    module.tickets.forEach((ticket) => {
      ticket.subtasks.forEach((subtask) => {
        totalSubtasks++;
        if (subtask.status === SubtaskStatus.DONE) {
          completedSubtasks++;
        }
        subtask.workSessions.forEach((session) => {
          totalTime += session.duration;
        });
      });
    });
  });

  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return {
    progress,
    totalTime, // total duration in minutes
    totalExpenses: project.expenses.reduce((acc, exp) => acc + exp.amount, 0),
  };
}

export async function calculateTicketMetrics(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      subtasks: {
        include: {
          workSessions: true,
        },
      },
    },
  });

  if (!ticket) throw new Error('Ticket not found');

  let totalSubtasks = ticket.subtasks.length;
  let completedSubtasks = ticket.subtasks.filter((s) => s.status === SubtaskStatus.DONE).length;
  let totalTime = 0;

  ticket.subtasks.forEach((subtask) => {
    subtask.workSessions.forEach((session) => {
      totalTime += session.duration;
    });
  });

  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return {
    progress,
    totalTime,
  };
}
