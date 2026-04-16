"use server"

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";
import { can } from "@/lib/permissions";

export async function getTeamData() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Fetch all users with their relations to calculate stats
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            image: true,
            ledTickets: {
                select: {
                    id: true,
                    status: true,
                    projectId: true
                }
            },
            sharedTickets: {
                select: {
                    id: true,
                    status: true,
                    projectId: true
                }
            },
            workSessions: {
                select: {
                    startTime: true,
                    endTime: true
                }
            }
        },
        orderBy: {
            role: 'asc'
        }
    });

    return users.map(user => {
        const allTickets = [...user.ledTickets, ...user.sharedTickets];
        const uniqueProjects = new Set(allTickets.map(t => t.projectId).filter(Boolean));
        const finishedTickets = allTickets.filter(t => t.status === 'DONE').length;
        
        const totalMinutes = user.workSessions.reduce((acc, session) => {
            if (!session.endTime) return acc;
            return acc + (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000;
        }, 0);

        return {
            id: user.id,
            name: user.name || user.username || user.email,
            email: user.email,
            role: user.role,
            avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
            stats: {
                ticketsTaken: allTickets.length,
                ticketsFinished: finishedTickets,
                projectsInvolved: uniqueProjects.size,
                activeHours: Math.round(totalMinutes / 60)
            }
        };
    });
}
