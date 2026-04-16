import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTicketStatus } from "@/app/actions/tickets";
import { TicketStatus } from "@prisma/client";
import { Clock, AlertCircle, CheckCircle2, PlayCircle, ClipboardList, Ban, TestTube2 } from "lucide-react";
import { KanbanColumn } from "./kanban-column";

import { KanbanBoard } from "./kanban-board";

const COLUMNS = [
    { id: "BACKLOG", title: "Backlog", iconName: "backlog", color: "text-muted-foreground" },
    { id: "TODO", title: "Por Hacer", iconName: "todo", color: "text-blue-500" },
    { id: "IN_PROGRESS", title: "En Proceso", iconName: "progress", color: "text-amber-500" },
    { id: "TESTING", title: "Testing", iconName: "testing", color: "text-purple-500" },
    { id: "DONE", title: "Terminado", iconName: "done", color: "text-green-500" },
    { id: "CANCELLED", title: "Cancelado", iconName: "cancelled", color: "text-destructive" },
];

export default async function KanbanPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const tickets = await prisma.ticket.findMany({
        include: {
            module: { include: { project: true } },
            project: true,
            lead: true,
            collaborators: true,
            subtasks: true,
        },
        orderBy: { order: 'asc' }
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, email: true }
    });

    return (
        <div className="flex flex-col h-[calc(100vh-65px)] bg-muted/20 overflow-hidden">
            <div className="p-4 pb-2 shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight uppercase tracking-widest">Tablero Kanban</h1>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">Gestión de flujo de trabajo en tiempo real.</p>
                </div>
            </div>

            <div className="flex-1 w-full min-w-0 overflow-auto custom-scrollbar border-t">
                <KanbanBoard 
                    initialTickets={tickets}
                    COLUMNS={COLUMNS}
                    allUsers={allUsers}
                    currentUserId={session.id}
                />
            </div>
        </div>
    );
}
