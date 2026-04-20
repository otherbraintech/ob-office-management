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
        <div className="min-h-screen bg-background pb-20">
            {/* Header / Cover Section */}
            <div className="h-48 md:h-72 bg-muted relative overflow-hidden">
                {/* Dynamic pattern background */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_50%,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Profile Card & Basic Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-background border-2 border-foreground/5 shadow-2xl overflow-hidden">
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

                    {/* Right Column: Performance & History */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-background/50 backdrop-blur-sm border-2 border-foreground/5 p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Centro de Operaciones</h2>
                                    <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1">Métricas de rendimiento y registro de actividad</p>
                                </div>
                            </div>
                            
                            <ProfileHistory 
                                totalHours={totalHours} 
                                manHoursCompleted={manHoursCompleted}
                                tickets={allTickets} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
