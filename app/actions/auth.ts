"use server"

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/permissions';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (email && password) {
    // Buscar usuario real en base de datos
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user && user.password === password) {
      const cookieStore = await cookies();
      
      const sessionUser: AuthUser = {
        id: user.id,
        role: user.role,
        email: user.email
      };

      cookieStore.set('session', JSON.stringify(sessionUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      redirect('/dashboard');
    } else {
      // Manejo de error de validación - en un entorno real se devuelve un error de action state
      console.error("Invalid credentials");
      return { error: "Invalid credentials" };
    }
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  if (!session || !session.value) return null;
  try {
    // Si la cookie empieza por "ey" es un JWT de alguna sesión previa (de otro proyecto tal vez).
    // Nuestra sesión es JSON stringificado, así que ignoraremos y borraremos si no es JSON válido.
    if (session.value.startsWith('ey')) {
      console.warn("Invalid session cookie detected (JWT format instead of JSON). Clearing cookie.");
      return null;
    }
    return JSON.parse(session.value);
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}
