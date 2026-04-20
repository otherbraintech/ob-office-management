import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket as TicketIcon, Search, Inbox, Plus } from "lucide-react";
import { getSession } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function TicketsGeneralPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const tickets = await prisma.ticket.findMany({
      include: { 
          module: { include: { project: true } },
          project: true,
          lead: true
      },
      orderBy: { createdAt: 'desc' }
  });

  const unassigned = tickets.filter(t => !t.leadId);
  const active = tickets.filter(t => t.leadId && t.status !== 'DONE');

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-10 max-w-[1600px] mx-auto w-full">
      {/* Header Sección */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-foreground pb-8">
          <div className="space-y-4">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary text-primary-foreground font-black text-2xl shadow-[6px_6px_0px_rgba(0,0,0,0.1)]">
                      TICKETS
                  </div>
                  <div className="space-y-1">
                      <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Bandeja de Requerimientos</h1>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Gestión global de tareas, incidencias y desarrollo.</p>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input className="h-10 pl-10 pr-4 bg-muted/20 border-2 border-foreground/5 rounded-none text-xs font-bold uppercase outline-none focus:border-primary w-64" placeholder="Buscar ticket..." />
              </div>
              <Button className="rounded-none font-black uppercase text-[10px] tracking-widest h-10 px-6">
                  <Plus className="size-4 mr-2" /> Nuevo
              </Button>
          </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-none border-2 border-foreground/5 bg-background shadow-none">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">En Espera</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-black">{unassigned.length}</div>
              </CardContent>
          </Card>
          <Card className="rounded-none border-2 border-foreground/5 bg-background shadow-none">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">En Ejecución</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-black">{active.length}</div>
              </CardContent>
          </Card>
          <Card className="rounded-none border-2 border-primary/20 bg-primary/5 shadow-none">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Completados</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-4xl font-black">{tickets.filter(t => t.status === 'DONE').length}</div>
              </CardContent>
          </Card>
      </div>

      {/* Listado de Tickets */}
      <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Inbox className="size-4 text-primary" /> Todos los Tickets ({tickets.length})
              </h2>
              <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-none text-[9px] font-bold uppercase tracking-tighter">Ordenar por Recientes</Badge>
              </div>
          </div>

          <div className="border-2 border-foreground/5 bg-background overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="border-b-2 border-foreground/5 bg-muted/30">
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad / ID</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Requerimiento</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Proyecto</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Responsable</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Acción</th>
                      </tr>
                  </thead>
                  <tbody>
                      {tickets.map((t) => (
                          <tr key={t.id} className="border-b border-foreground/5 hover:bg-muted/10 transition-colors group">
                              <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                      <div className={cn(
                                          "w-2 h-8",
                                          t.priority === 'URGENT' || t.priority === 'HIGH' ? "bg-red-500" : 
                                          t.priority === 'MEDIUM' ? "bg-amber-500" : "bg-blue-500"
                                      )} />
                                      <span className="font-mono text-[10px] font-bold text-muted-foreground">#{t.id.slice(-5).toUpperCase()}</span>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="flex flex-col max-w-sm">
                                      <span className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{t.title}</span>
                                      <span className="text-[10px] text-muted-foreground truncate opacity-60 leading-relaxed font-medium">{t.description || 'Sin descripción adicional'}</span>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <Badge variant="outline" className="rounded-none border-foreground/10 text-[9px] font-black uppercase tracking-tighter">
                                      {t.project?.name || t.module?.project?.name || 'GLOBAL'}
                                  </Badge>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                   <div className="flex items-center gap-2">
                                       <div className={cn(
                                           "size-1.5 rounded-full animate-pulse",
                                           t.status === 'DONE' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : 
                                           t.status === 'IN_PROGRESS' ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]" : "bg-muted-foreground"
                                       )} />
                                       <span className="text-[10px] font-black uppercase tracking-widest">{t.status}</span>
                                   </div>
                              </td>
                              <td className="p-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                      {t.lead ? (
                                           <span className="text-[10px] font-bold uppercase">{t.lead.username || t.lead.email}</span>
                                      ) : (
                                          <span className="text-[9px] font-black text-primary uppercase animate-pulse">Sin Asignar</span>
                                      )}
                                  </div>
                              </td>
                              <td className="p-4 text-right whitespace-nowrap">
                                  <Link href={`/tickets/${t.id}`}>
                                      <Button variant="outline" size="sm" className="rounded-none border-2 border-foreground/5 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest h-8 px-4 transition-all">
                                          Gestionar
                                      </Button>
                                  </Link>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {tickets.length === 0 && (
                  <div className="p-20 text-center space-y-4">
                      <TicketIcon className="size-12 mx-auto text-muted-foreground/20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No hay tickets registrados actualmente</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}
