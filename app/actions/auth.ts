"use server"

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/permissions';

export async function login(formData: FormData) {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;

  if (identifier && password) {
    // Buscar usuario por email o username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (user && user.password === password) {
      const cookieStore = await cookies();
      
      const sessionUser: AuthUser = {
        id: user.id,
        role: user.role,
        email: user.email,
        username: user.username
      };

      cookieStore.set('session', JSON.stringify(sessionUser), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
      redirect('/dashboard');
    } else {
      console.error("Credenciales inválidas");
      return { error: "Credenciales inválidas" };
    }
  }
}

export async function signup(formData: FormData) {
  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirm-password') as string;

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden" };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return { error: "El email o nombre de usuario ya está en uso" };
    }

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password, // Nota: En producción, hashear la contraseña
        role: 'DEVELOPER'
      }
    });

    const cookieStore = await cookies();
      
    const sessionUser: AuthUser = {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username
    };

    cookieStore.set('session', JSON.stringify(sessionUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    redirect('/dashboard');
  } catch (error) {
    console.error("Error en registro:", error);
    return { error: "Ocurrió un error al crear la cuenta" };
  }
}

export async function updateProfile(userId: string, data: { name?: string, username?: string, image?: string }) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    const cookieStore = await cookies();
    const currentSession = await getSession();
    
    if (currentSession && currentSession.id === userId) {
      const updatedSession: AuthUser = {
        ...currentSession,
        username: updatedUser.username || currentSession.username
      };
      cookieStore.set('session', JSON.stringify(updatedSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return { data: updatedUser };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: "No se pudo actualizar el perfil. Quizás el nombre de usuario ya existe." };
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
