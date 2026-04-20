import { getSession } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession();
    if (!session) redirect('/login');

    const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
            subtasks: { orderBy: { order: 'asc' } },
            module: { include: { project: true } },
            project: true,
            creator: true,
            lead: true,
            collaborators: true
        }
    });

    if (!ticket) notFound();

    const allUsers = await prisma.user.findMany({
        select: { id: true, username: true, email: true }
    });

    return (
        <div className="flex flex-col flex-1 bg-background min-h-screen">
            <div className="border-b-2 border-foreground/5 bg-muted/20 px-4 md:px-8 py-4 flex items-center justify-between">
                <Link href="/tickets">
                    <Button variant="ghost" size="sm" className="rounded-none font-black uppercase text-[10px] tracking-widest hover:bg-foreground/5 transition-all">
                        <ChevronLeft className="size-4 mr-2" /> Atrás / Bandeja
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 italic">Terminal de Operación de Requerimientos</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <TicketCard 
                    ticket={ticket} 
                    currentUserId={session.id} 
                    allUsers={allUsers} 
                    isSimple={false} 
                />
            </div>
        </div>
    );
}
