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

  return await prisma.module.create({
    data: { name, projectId }
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
