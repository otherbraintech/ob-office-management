"use server"

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ExpenseType } from '@prisma/client';
import { getSession } from './auth';

export async function createExpense(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const amount = parseFloat(formData.get('amount') as string);
  const category = formData.get('category') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as ExpenseType;
  const billDate = new Date(formData.get('billDate') as string);
  const projectId = formData.get('projectId') as string || null;

  await prisma.expense.create({
    data: {
      amount,
      category,
      description,
      type,
      billDate,
      projectId: projectId === 'null' ? null : projectId,
      userId: session.id === 'mock-user-id' ? (await prisma.user.findFirst())?.id || "" : session.id,
    }
  });

  revalidatePath('/finances');
  revalidatePath('/finances/expenses');
}
