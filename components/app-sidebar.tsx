"use client"

import * as React from "react"
import { getSession } from "@/app/actions/auth"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { ModeToggle } from "@/components/mode-toggle"
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
  Sparkles,
  HelpCircle
} from "lucide-react"

// This is the real structure of OB-Workspace.
const data = {
  user: {
    name: "Usuario",
    email: "user@ob-management.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "OB-Workspace",
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
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT", "ADMIN_DEV"]
    },
    {
      title: "Crear Ticket con IA",
      url: "/ai-assistant",
      icon: <Sparkles />,
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT", "ADMIN_DEV"]
    },
    {
      title: "Tickets Creados",
      url: "/tickets",
      icon: <Ticket />,
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT", "ADMIN_DEV"]
    },
    {
      title: "Control de Tiempos",
      url: "/time-tracking",
      icon: <Timer />,
      roles: ["CEO", "DEVELOPER", "INTERN", "ADMIN_DEV"]
    },
    {
      title: "Proyectos",
      url: "/projects",
      icon: <Briefcase />,
      roles: ["CEO", "DEVELOPER", "INTERN", "ADMIN_DEV"]
    },
    {
      title: "Equipo",
      url: "/team",
      icon: <Users />,
      roles: ["CEO", "DEVELOPER", "INTERN", "ADMIN_DEV"]
    },
    {
      title: "Finanzas",
      url: "/finances",
      icon: <Wallet />,
      roles: ["CEO", "ADMIN_DEV"],
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
      roles: ["CEO", "ADMIN_DEV"]
    },
    {
      title: "Guía de Estructura",
      url: "/help",
      icon: <HelpCircle />,
      roles: ["CEO", "DEVELOPER", "INTERN", "EXTERNAL_CLIENT", "ADMIN_DEV"]
    },
    {
      title: "Configuración",
      url: "/settings",
      icon: <Settings2 />,
      roles: ["CEO", "ADMIN_DEV"],
      items: [
         { title: "General", url: "/settings" },
         { title: "Seguridad y Accesos", url: "/settings/security" }
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
        return item.roles.includes(user.role as any);
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
      <SidebarHeader className="flex flex-row items-center justify-between">
        <div className="flex-1">
          <TeamSwitcher teams={data.teams} />
        </div>
        <div className="pr-4">
          <ModeToggle />
        </div>
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
