"use client"

import { useState, useTransition } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/app/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Edit3 } from "lucide-react";

export function EditProjectDialog({ project }: { project: any }) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || "");
    const [status, setStatus] = useState(project.status || "active");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await updateProject(project.id, { name, description, status });
                toast.success("Proyecto actualizado correctamente");
                setOpen(false);
                router.refresh();
            } catch (error) {
                toast.error("Error al actualizar proyecto");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-black uppercase text-[10px] tracking-[0.2em] px-8 h-12 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none gap-3">
                    <Edit3 className="size-4" />
                    Editar Proyecto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden border-2 border-foreground rounded-none bg-background shadow-[20px_20px_0px_rgba(0,0,0,0.05)]">
                <div className="p-8">
                    <DialogHeader className="mb-8 space-y-1">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                            Parámetros del Sistema
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground/40 tracking-[0.2em]">
                            Update project configuration matrix
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Nombre del Proyecto</Label>
                            <Input 
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-12 rounded-none border-2 border-foreground/10 bg-muted/20 focus-visible:ring-0 focus-visible:border-foreground transition-colors font-bold uppercase text-xs shadow-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Descripción Técnica</Label>
                            <Textarea 
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Define el alcance de esta misión..."
                                className="resize-none min-h-[120px] rounded-none border-2 border-foreground/10 bg-muted/20 focus-visible:ring-0 focus-visible:border-foreground transition-colors font-medium text-sm shadow-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estado de la Misión</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger id="status" className="h-12 rounded-none border-2 border-foreground/10 bg-muted/20 focus:ring-0 focus:border-foreground transition-all font-bold uppercase text-xs shadow-none cursor-pointer hover:bg-muted/40 hover:border-foreground/20">
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent className="rounded-none border-2 border-foreground">
                                    <SelectItem value="active" className="text-xs font-bold uppercase cursor-pointer hover:bg-muted">Activo</SelectItem>
                                    <SelectItem value="paused" className="text-xs font-bold uppercase text-orange-500 cursor-pointer hover:bg-muted">Pausado</SelectItem>
                                    <SelectItem value="completed" className="text-xs font-bold uppercase text-green-500 cursor-pointer hover:bg-muted">Completado</SelectItem>
                                    <SelectItem value="cancelled" className="text-xs font-bold uppercase text-red-500 cursor-pointer hover:bg-muted">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-foreground/5">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setOpen(false)}
                                className="text-[10px] h-12 uppercase font-black tracking-widest rounded-none hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isPending}
                                className="h-12 px-10 bg-foreground text-background hover:bg-foreground/80 font-black uppercase text-[10px] tracking-widest rounded-none shadow-[6px_6px_0px_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none cursor-pointer"
                            >
                                {isPending ? "Sincronizando..." : "Actualizar Misión"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
