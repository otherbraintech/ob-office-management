"use server"

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AuthUser } from '@/lib/permissions';
import bcrypt from 'bcryptjs';

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

    if (!user) {
      console.error("Credenciales inválidas");
      return { error: "Credenciales inválidas" };
    }

    let isValid = false;
    let needsHashing = false;

    // Comprobamos si el hash guardado es válido
    if (user.password) {
       if (user.password.startsWith('$2')) {
          isValid = await bcrypt.compare(password, user.password);
       } else {
          // Migración de legacy plain-text passwords
          if (user.password === password) {
             isValid = true;
             needsHashing = true;
          }
       }
    }

    if (isValid) {
      if (needsHashing) {
         const hashedPassword = await bcrypt.hash(password, 10);
         await prisma.user.update({
             where: { id: user.id },
             data: { password: hashedPassword }
         });
      }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
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
  } catch (error) {
    console.error("Error en registro:", error);
    return { error: "Ocurrió un error al crear la cuenta" };
  }
  
  redirect('/dashboard');
}

export async function updateProfile(userId: string, data: { name?: string, username?: string, image?: string, password?: string }) {
  try {
    let updateData: any = {
      name: data.name,
      username: data.username,
      image: data.image
    };

    if (data.password && data.password.trim().length > 0) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        image: true
      }
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
    // Si la cookie empieza por "ey" es un JWT de alguna sesión previa.
    if (session.value.startsWith('ey')) {
      console.warn("Invalid session cookie detected (JWT format instead of JSON).");
      return null;
    }
    const parsedSession = JSON.parse(session.value);
    
    // Auto-sync de rol con la DB para que no haya que re-logearse al cambiar rangos
    const dbUser = await prisma.user.findUnique({
      where: { id: parsedSession.id },
      select: { role: true }
    });
    
    if (dbUser && dbUser.role !== parsedSession.role) {
       parsedSession.role = dbUser.role;
    }

    return parsedSession;
  } catch (error) {
    console.error("Failed to parse session cookie:", error);
    return null;
  }
}

