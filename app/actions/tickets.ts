"use server"

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { can } from '@/lib/permissions';
import { TicketPriority, TicketStatus, SubtaskStatus } from '@prisma/client';

export async function createTicket(formData: FormData) {
  const session = await getSession();
  if (!can(session, 'create', 'Ticket')) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const moduleId = formData.get('moduleId') as string;
  const priority = (formData.get('priority') as TicketPriority) || 'MEDIUM';

  // TODO: Assign a real lead (maybe CEO or dev). For now, the creator itself or a system default if external client.
  const leadId = session.role === "EXTERNAL_CLIENT" ? "CEO_ID_HOLDER" : session.id;

  return await prisma.ticket.create({
    data: {
      title,
      description,
      moduleId,
      priority,
      creatorId: session.id,
      leadId: leadId
    }
  });
}

export async function createSubtask(ticketId: string, title: string, estimatedTime: number) {
   const session = await getSession();
   const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { collaborators: true } });
   
   if (!can(session, 'update', 'Ticket', ticket)) {
       throw new Error('Unauthorized');
   }

   return await prisma.subtask.create({
     data: {
        title,
        estimatedTime, // minutos
        ticketId
     }
   })
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
    const session = await getSession();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { collaborators: true } });
    if (!can(session, 'update', 'Ticket', ticket)) {
        throw new Error('Unauthorized');
    }
    return await prisma.ticket.update({
        where: { id: ticketId },
        data: { status }
    })
}

export async function getTickets(moduleId?: string) {
    const session = await getSession();
    if (!session) return [];

    let whereClause: any = {};
    if (moduleId) whereClause.moduleId = moduleId;
    
    if (session.role === "EXTERNAL_CLIENT") {
        whereClause.creatorId = session.id;
    }

    return await prisma.ticket.findMany({
        where: whereClause,
        include: {
           lead: true,
           subtasks: true,
           collaborators: true,
           module: {
              include: { project: true }
           }
        },
        orderBy: { createdAt: 'desc' }
    });
}
