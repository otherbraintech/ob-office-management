"use client"

import * as React from "react"
import { getSession } from "@/app/actions/auth"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Ticket,
  Timer,
  Wallet,
  Settings2,
  Globe,
  Briefcase,
  Building2,
  Users,
  Sparkles
} from "lucide-react"

// This is the real structure of OB-OfficeManagement.
const data = {
  user: {
    name: "Usuario",
    email: "user@ob-management.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "OB-OfficeManagement",
      logo: (
        <Building2 />
      ),
      plan: "Professional",
    },
  ],
}

const navItems = [
    {
      title: "Panel de Control",
      url: "/dashboard",
      icon: <LayoutDashboard />,
      roles: ["CEO", "DEVELOPER", "INTERN"]
    },
    {
      title: "Asistente IA",
      url: "/dashboard/ai-assistant",
      icon: <Sparkles />,
      roles: ["CEO", "DEVELOPER"]
    },
    {
      title: "Mis Tickets",
      url: "/dashboard/tickets/me",
      icon: <Ticket />,
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT"]
    },
    {
      title: "Proyectos",
      url: "/dashboard/projects",
      icon: <Briefcase />,
      roles: ["CEO", "DEVELOPER", "INTERN"]
    },
    {
      title: "Cronómetro",
      url: "/dashboard/timer",
      icon: <Timer />,
      roles: ["DEVELOPER", "INTERN"]
    },
    {
      title: "Finanzas",
      url: "/dashboard/finances",
      icon: <Wallet />,
      roles: ["CEO"]
    },
    {
      title: "Analíticas",
      url: "/dashboard/analytics",
      icon: <LayoutDashboard />,
      roles: ["CEO"]
    },
    {
      title: "Equipo",
      url: "/dashboard/settings/team",
      icon: <Users />,
      roles: ["CEO"]
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    getSession().then(setUser)
  }, [])

  const filteredNavMain = navItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {user ? <NavMain items={filteredNavMain} /> : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.email?.split('@')[0] || "Usuario",
          email: user?.email || "Cargando...",
          avatar: "/avatars/user.jpg"
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
