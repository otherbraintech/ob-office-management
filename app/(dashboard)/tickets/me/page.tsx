import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export default function MyTicketsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis Tickets Asignados</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <CardDescription>Pendientes de iniciar o en proceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold leading-none tracking-tight">Lista de Tareas</h3>
          <p className="text-sm text-muted-foreground mt-2">Próximas tareas ordenadas por prioridad.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex flex-col">
                <span className="font-semibold">Refactorización Frontend</span>
                <span className="text-xs text-muted-foreground">Proyecto: Dashboard OB</span>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                Alta
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex flex-col">
                <span className="font-semibold">Corrección de bugs</span>
                <span className="text-xs text-muted-foreground">Proyecto: Cloud Platform</span>
              </div>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Media
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
