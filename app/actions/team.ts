"use server"

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { getSession } from './auth';

export async function changeUserRole(userId: string, newRole: Role) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // TODO: Check if current user has permission (is CEO)

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });

  revalidatePath('/settings/team');
  return { success: true };
}
