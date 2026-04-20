import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  role: Role;
  email: string;
  username?: string | null;
};

export type Action = "create" | "read" | "update" | "delete" | "track_time";
export type ResourceType = "Project" | "Module" | "Ticket" | "Subtask" | "Expense" | "User";

export function can(
  user: AuthUser | null,
  action: Action,
  resourceType: ResourceType,
  resource?: any
): boolean {
  if (!user) return false;

  // CEO y ADMIN_DEV tienen permisos globales absolutos
  if (user.role === "CEO" || user.role === "ADMIN_DEV") return true;

  switch (resourceType) {
    case "Ticket":
      if (action === "read") {
        // External Client solo puede ver tickets que creó
        if (user.role === "EXTERNAL_CLIENT") {
          return resource?.creatorId === user.id;
        }
        return true; // Devs y Interns pueden ver todos los tickets (o según el módulo en el futuro)
      }
      
      if (action === "create") {
         // Developers y Clientes pueden crear tickets
         return ["DEVELOPER", "EXTERNAL_CLIENT"].includes(user.role);
      }

      if (action === "update") {
        if (user.role === "DEVELOPER") {
           // Developers pueden editar el ticket si son el responsable principal o colaboradores
           const isLead = resource?.leadId === user.id;
           const isCollab = resource?.collaborators?.some((c: any) => c.id === user.id);
           return isLead || isCollab;
        }
        return false;
      }
      return false;

    case "Subtask":
      if (action === "read") return user.role !== "EXTERNAL_CLIENT";
      
      if (action === "track_time" || action === "update") {
        // Solo un dev o intern con la tarea asignada explícitamente puede darle update o time tracking
        return resource?.assignedId === user.id;
      }
      return false;

    case "Expense":
        // CEO ya retornó true al inicio. Los demás roles no pueden ver ni editar gastos.
        return false;

    case "Project":
    case "Module":
      if (action === "read") {
        // Clientes externos no deben navegar libremente la jerarquía de proyectos
        return user.role !== "EXTERNAL_CLIENT";
      }
      if (action === "create") {
        // CEO ya está manejado. Permitimos que Developers también creen estructura inicial para propósitos de este sistema.
        return user.role === "DEVELOPER";
      }
      return false;

    default:
      return false;
  }
}
