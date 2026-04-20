import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateRole(role: string): string {
    const roles: Record<string, string> = {
        'DEVELOPER': 'Desarrollador',
        'ADMIN_DEV': 'Desarrollador',
        'INTERN': 'Pasante',
        'EXTERNAL_CLIENT': 'Cliente Externo',
        'CEO': 'CEO'
    };
    return roles[role] || role;
}
