"use client"

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, Ticket as TicketIcon } from "lucide-react";
import { createModule } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateModuleDialogProps {
  projectId: string;
  availableTickets?: any[];
}

export function CreateModuleDialog({ projectId, availableTickets = [] }: CreateModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const router = useRouter();

  const toggleTicket = (id: string) => {
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append('ticketIds', JSON.stringify(selectedTicketIds));

    startTransition(async () => {
      try {
        await createModule(projectId, formData);
        toast.success("Módulo creado exitosamente");
        setOpen(false);
        setSelectedTicketIds([]);
        router.refresh();
      } catch (error) {
        toast.error("Error al crear el módulo");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all font-bold uppercase text-[10px] tracking-widest">
          <Plus className="h-3.5 w-3.5" />
          Añadir Módulo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-none border-2 border-primary/20 p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">Nuevo Módulo</DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold text-muted-foreground/60 tracking-wider">
                Organiza la estructura de tu proyecto agrupando requerimientos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre del Módulo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Módulo de Autenticación, Core API..."
                  required
                  className="rounded-none border-2 focus-visible:ring-primary h-11 text-sm font-medium"
                />
              </div>

              {availableTickets.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                    Vincular Tickets Existentes
                    <span className="text-primary">{selectedTicketIds.length} seleccionados</span>
                  </Label>
                  <ScrollArea className="h-[180px] border-2 border-foreground/5 bg-muted/30 p-2">
                    <div className="space-y-2">
                      {availableTickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className={cn(
                            "flex items-center gap-3 p-3 transition-all cursor-pointer border-2",
                            selectedTicketIds.includes(ticket.id) 
                              ? "bg-primary/10 border-primary/30" 
                              : "bg-background border-transparent hover:border-foreground/10"
                          )}
                          onClick={() => toggleTicket(ticket.id)}
                        >
                          <Checkbox 
                            id={`ticket-${ticket.id}`} 
                            checked={selectedTicketIds.includes(ticket.id)}
                            onCheckedChange={() => toggleTicket(ticket.id)}
                            className="rounded-none"
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={`ticket-${ticket.id}`}
                              className="text-xs font-bold leading-none cursor-pointer flex items-center gap-2"
                            >
                              <TicketIcon className="size-3 text-primary opacity-60" />
                              <span className="truncate">{ticket.title}</span>
                            </Label>
                            <p className="text-[9px] text-muted-foreground uppercase font-black mt-1 opacity-50">
                              Prioridad: {ticket.priority}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <p className="text-[9px] text-muted-foreground italic uppercase tracking-tighter">Solo se muestran tickets del proyecto que no pertenecen a ningún módulo.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-6 border-t flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)} className="rounded-none uppercase font-bold text-[10px] tracking-widest hover:bg-destructive/10 hover:text-destructive">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] tracking-[0.2em] px-8 h-11 shadow-lg shadow-primary/20">
              {isPending ? "Procesando..." : "Crear Módulo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
