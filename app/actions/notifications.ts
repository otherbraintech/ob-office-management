"use server"

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: Date;
  read: boolean;
};

// Simulation of notifications logic
// In a real app, this would be a table in Prisma.
// For now, we simulate finding "new" items that would trigger notifications.

export async function getNotifications(): Promise<AppNotification[]> {
  const session = await getSession();
  if (!session) return [];

  // Simulate some notifications based on database state
  // e.g., tickets with high priority in backlog, or recently updated tickets
  const recentTickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { priority: 'URGENT' },
        { priority: 'HIGH', status: 'BACKLOG' }
      ]
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  const notifications: AppNotification[] = recentTickets.map(ticket => ({
    id: `ticket-${ticket.id}`,
    title: `Pending ${ticket.priority} Ticket`,
    message: `The ticket "${ticket.title}" needs attention.`,
    type: ticket.priority === 'URGENT' ? 'error' : 'warning',
    createdAt: ticket.createdAt,
    read: false,
  }));

  // Add a welcome notification
  notifications.push({
    id: 'welcome',
    title: 'Welcome back!',
    message: `Hello ${session.email}, ready for today's tasks?`,
    type: 'info',
    createdAt: new Date(),
    read: false,
  });

  return notifications;
}

export async function markNotificationAsRead(id: string) {
  // Logic to mark as read (would update DB in real app)
  console.log(`Marking notification ${id} as read`);
  return { success: true };
}
