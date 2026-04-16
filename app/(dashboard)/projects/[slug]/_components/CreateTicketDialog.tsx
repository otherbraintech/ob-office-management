"use client"

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles, Link as LinkIcon, Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { getOrphanTickets, linkTicketToProject } from "@/app/actions/tickets";
import { useTransition } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function CreateTicketDialog({ 
    moduleId, 
    projectId, 
    currentUserId,
    availableProjectTickets = [],
    variant = "ghost" 
}: { 
    moduleId?: string,
    projectId?: string,
    currentUserId: string,
    availableProjectTickets?: any[],
    variant?: "default" | "ghost" | "outline" | "secondary"
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [orphanTickets, setOrphanTickets] = useState<any[]>([]);
  const [isLoadingOrphans, setIsLoadingOrphans] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [comboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    if (open && !moduleId) {
      setIsLoadingOrphans(true);
      getOrphanTickets().then(data => {
        setOrphanTickets(data);
        setIsLoadingOrphans(false);
      }).catch(() => {
        setIsLoadingOrphans(false);
      });
    }
  }, [open, moduleId]);

  // Si estamos en un módulo, los tickets a enlazar son los del proyecto
  const displayTickets = moduleId ? availableProjectTickets : orphanTickets;
  const loading = moduleId ? false : isLoadingOrphans;

  const router = useRouter();

  async function handleCreateWithAI(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";

    let prompt = title;
    if (description) {
        prompt += `\n\n${description}`;
    }

    const query = new URLSearchParams();
    if (prompt) query.set("prompt", prompt);
    if (moduleId) query.set("moduleId", moduleId);
    if (projectId) query.set("projectId", projectId);

    setOpen(false);
    router.push(`/ai-assistant?${query.toString()}`);
  }

  async function handleLinkOrphan() {
    if (!selectedTicketId) {
        toast.error("Selecciona un ticket primero");
        return;
    }

    startTransition(async () => {
      try {
        const result = await linkTicketToProject(selectedTicketId, { moduleId, projectId });
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Ticket enlazado correctamente");
            setOpen(false);
            setSelectedTicketId("");
        }
      } catch (error) {
        toast.error("Error al enlazar el ticket");
      }
    });
  }

  const selectedTicket = displayTickets.find((t) => t.id === selectedTicketId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size="sm" 
          className={cn(
            "h-9 gap-2 w-full justify-start transition-all border-2 border-primary/20 bg-primary/5 hover:bg-primary/10",
            variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="font-bold text-[10px] uppercase tracking-widest">Añadir Ticket</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden border-2 border-primary/20 rounded-none">
        <div className="p-6">
          <Tabs defaultValue="new" className="w-full">
            <DialogHeader className="mb-6 space-y-1">
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                Garantizar Requerimiento
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase text-muted-foreground/60 tracking-wider">
                {moduleId ? 'Gestionar estructura del módulo' : 'Planificar backlog del proyecto'}
              </DialogDescription>
            </DialogHeader>

            <TabsList className="grid w-full grid-cols-2 mb-6 h-11 p-1 bg-muted/60 border-2 border-foreground/5 rounded-none">
              <TabsTrigger value="new" className="text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xl rounded-none transition-all">
                <Sparkles className="h-3.5 w-3.5" />
                Crear Nuevo (IA)
              </TabsTrigger>
              <TabsTrigger value="link" className="text-[10px] font-black uppercase tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-xl rounded-none transition-all">
                <LinkIcon className="h-3.5 w-3.5" />
                Vincular {moduleId ? 'del Proyecto' : 'del Backlog'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-0 focus-visible:outline-none space-y-4">
              <form onSubmit={handleCreateWithAI} className="space-y-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">¿Cuál es el objetivo?</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      placeholder="Ej: Implementar Login OAuth" 
                      required 
                      className="h-10 text-sm font-medium border-2 focus-visible:ring-primary rounded-none shadow-none"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contexto del requerimiento</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe brevemente el objetivo..." 
                      className="resize-none min-h-[100px] text-sm font-medium border-2 focus-visible:ring-primary rounded-none shadow-none focus-visible:ring-offset-0" 
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-foreground/5">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-[10px] h-10 uppercase font-bold tracking-widest rounded-none"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm"
                    className="h-10 px-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold uppercase text-[10px] tracking-widest rounded-none shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ejecutar Análisis IA
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="link" className="mt-0 focus-visible:outline-none space-y-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Seleccionar Ticket {moduleId ? 'del Proyecto' : 'Existente'}</Label>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        disabled={loading}
                        className="w-full justify-between h-auto min-h-11 py-2 px-3 text-sm font-bold border-2 border-foreground/5 rounded-none shadow-none hover:bg-muted/80 flex items-center"
                      >
                        <span className="text-left whitespace-normal break-words leading-tight mr-2 uppercase tracking-tight">
                          {selectedTicket ? selectedTicket.title : (loading ? "Cargando..." : "Busca en el backlog...")}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-2 border-primary/20 overflow-hidden" align="start">
                      <Command className="border-none">
                        <CommandInput placeholder="Filtrar por título..." className="h-10 border-b-2 border-foreground/5 rounded-none font-bold uppercase text-xs" />
                        <CommandList className="max-h-[250px] overflow-y-auto">
                          <CommandEmpty className="p-4 text-center text-[10px] font-bold uppercase text-muted-foreground">
                            No se encontraron tickets compatibles.
                          </CommandEmpty>
                          <CommandGroup>
                            {displayTickets.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.title}
                                onSelect={() => {
                                  setSelectedTicketId(t.id);
                                  setComboboxOpen(false);
                                }}
                                className="flex items-start gap-3 py-3 px-4 cursor-pointer hover:bg-primary/10 transition-colors border-b border-foreground/5 last:border-0"
                              >
                                <Check
                                  className={cn(
                                    "mt-0.5 size-4 shrink-0 text-primary",
                                    selectedTicketId === t.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col gap-1 pr-2 min-w-0">
                                  <span className="font-extrabold uppercase text-[11px] leading-tight tracking-tight truncate">{t.title}</span>
                                  {t.priority && (
                                    <span className={cn(
                                        "text-[9px] uppercase tracking-widest font-black opacity-60",
                                        t.priority === 'URGENT' ? 'text-red-500' : 'text-primary'
                                    )}>
                                      {t.priority}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter italic">
                    {moduleId 
                      ? "Solo se muestran tickets en el backlog de este proyecto." 
                      : "Solo se muestran tickets que aún no pertenecen a ningún proyecto o módulo."}
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-foreground/5">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="text-[10px] h-10 uppercase font-bold tracking-widest rounded-none"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    size="sm"
                    disabled={isPending || !selectedTicketId} 
                    onClick={handleLinkOrphan}
                    className="h-10 px-8 gap-2 bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-[10px] tracking-widest rounded-none shadow-xl"
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <LinkIcon className="size-4" />
                    )}
                    Vincular Requerimiento
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
