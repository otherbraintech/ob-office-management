import { getSession, updateProfile } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { ProfileHistory } from "./profile-history";

export default async function ProfilePage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: {
            shifts: true,
            workSessions: {
                include: { ticket: true }
            },
            ledTickets: {
                include: { subtasks: true, project: true, creator: true },
                orderBy: { updatedAt: 'desc' }
            },
            sharedTickets: {
                include: { subtasks: true, project: true, creator: true },
                orderBy: { updatedAt: 'desc' }
            }
        }
    });

    if (!user) redirect('/login');

    const totalSeconds = user.shifts.reduce((acc, shift) => acc + (shift.duration || 0), 0);
    const totalHours = Number((totalSeconds / 3600).toFixed(1));

    const completedTicketsSeconds = user.workSessions
        .filter(ws => ws.ticket?.status === 'DONE' || ws.ticket?.status === 'TESTING')
        .reduce((acc, ws) => acc + (ws.duration || 0), 0);
    const manHoursCompleted = Number((completedTicketsSeconds / 3600).toFixed(1));

    // Merge tickets from led and shared, removing duplicates
    const allTicketsMap = new Map();
    user.ledTickets.forEach(t => allTicketsMap.set(t.id, t));
    user.sharedTickets.forEach(t => allTicketsMap.set(t.id, t));
    const allTickets = Array.from(allTicketsMap.values())
        .map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            estimatedTime: t.estimatedTime,
            realTime: t.realTime,
            updatedAt: t.updatedAt,
            project: t.project ? { name: t.project.name } : null,
            creator: t.creator ? { name: t.creator.name } : null,
            subtasks: (t.subtasks || []).map((st: any) => ({
                id: st.id,
                title: st.title,
                status: st.status,
                estimatedTime: st.estimatedTime,
                realTime: st.realTime
            }))
        }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                    <p className="text-muted-foreground mt-2">Gestiona tu identidad en el sistema y revisa tu rendimiento operativo.</p>
                </div>

                <div className="bg-background border-2 border-foreground/5 p-8">
                    <ProfileForm user={{
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        image: user.image,
                        role: user.role,
                        email: user.email
                    }} />
                </div>
            </div>

            <div className="pt-8 border-t-2 border-foreground/5">
                <ProfileHistory 
                    totalHours={totalHours} 
                    manHoursCompleted={manHoursCompleted}
                    tickets={allTickets} 
                />
            </div>
        </div>
    );
}
