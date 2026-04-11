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
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT"]
    },
    {
      title: "Asistente IA",
      url: "/ai-assistant",
      icon: <Sparkles />,
      roles: ["CEO", "DEVELOPER"]
    },
    {
      title: "Requerimientos",
      url: "#",
      icon: <Ticket />,
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT"],
      items: [
         { title: "Portal de Cliente", url: "/tickets/me", roles: ["EXTERNAL_CLIENT"] },
         { title: "Mis Tareas Asignadas", url: "/tickets/me", roles: ["CEO", "DEVELOPER", "INTERN"] },
         { title: "Tablero General", url: "/tickets", roles: ["CEO", "DEVELOPER", "INTERN"] }
      ]
    },
    {
      title: "Proyectos",
      url: "/projects",
      icon: <Briefcase />,
      roles: ["CEO", "DEVELOPER", "INTERN"]
    },
    {
      title: "Finanzas",
      url: "/finances",
      icon: <Wallet />,
      roles: ["CEO"],
      items: [
         { title: "Resumen Total", url: "/finances" },
         { title: "Gastos (Expenses)", url: "/finances/expenses" },
         { title: "Facturas (Invoices)", url: "/finances/invoices" }
      ]
    },
    {
      title: "Analíticas",
      url: "/analytics",
      icon: <LayoutDashboard />,
      roles: ["CEO"]
    },
    {
      title: "Configuración",
      url: "/settings",
      icon: <Settings2 />,
      roles: ["CEO"],
      items: [
         { title: "General", url: "/settings" },
         { title: "Gestión de Equipo", url: "/settings/team" }
      ]
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    getSession().then(setUser)
  }, [])

  const filteredNavMain = navItems
      .filter((item) => {
        if (!user) return false;
        return item.roles.includes(user.role);
      })
      .map((item) => {
        if (item.items) {
           return {
              ...item,
              items: item.items.filter((subItem: any) => !subItem.roles || subItem.roles.includes(user.role))
           };
        }
        return item;
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
