"use server"

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { can } from '@/lib/permissions';

export async function createProject(formData: FormData) {
  const session = await getSession();
  if (!can(session, 'create', 'Project')) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  return await prisma.project.create({
    data: { name, description }
  });
}

export async function createModule(projectId: string, formData: FormData) {
  const session = await getSession();
  if (!can(session, 'create', 'Module')) {
    throw new Error('Unauthorized');
  }

  const name = formData.get('name') as string;
  const ticketIdsJson = formData.get('ticketIds') as string;
  const ticketIds = ticketIdsJson ? JSON.parse(ticketIdsJson) : [];

  const createdModule = await prisma.module.create({
    data: { name, projectId }
  });

  if (ticketIds.length > 0) {
    await prisma.ticket.updateMany({
      where: { 
        id: { in: ticketIds },
        projectId: projectId // Seguridad extra: solo tickets de este proyecto
      },
      data: { moduleId: createdModule.id }
    });
  }

  return createdModule;
}

export async function assignTicketToModule(ticketId: string, moduleId: string) {
  const session = await getSession();
  
  return await prisma.ticket.update({
    where: { id: ticketId },
    data: { moduleId }
  });
}

export async function getProjects() {
  const session = await getSession();
  if (!can(session, 'read', 'Project')) {
     return [];
  }
  return await prisma.project.findMany({
    include: {
      modules: true,
      _count: { select: { modules: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateProject(id: string, data: { name?: string, description?: string, status?: string }) {
  const session = await getSession();
  if (!can(session, 'update', 'Project')) {
    throw new Error('Unauthorized');
  }

  const result = await prisma.project.update({
    where: { id },
    data
  });
  
  return result;
}
