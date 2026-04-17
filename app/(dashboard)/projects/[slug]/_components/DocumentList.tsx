"use client"

import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2 } from "lucide-react";
import { createDocument, deleteDocument } from "@/app/actions/documents";
import { useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentListProps {
  projectId: string;
  documents: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function DocumentList({ projectId, documents, selectedId, onSelect }: DocumentListProps) {
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    const name = prompt("Nombre del documento:");
    if (!name) return;

    startTransition(async () => {
      try {
        const doc = await createDocument(projectId, name);
        onSelect(doc.id);
        toast.success("Documento creado");
      } catch (error) {
        toast.error("Error al crear documento");
      }
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar este documento?")) return;

    startTransition(async () => {
      try {
        await deleteDocument(id);
        if (selectedId === id) onSelect("");
        toast.success("Documento eliminado");
      } catch (error) {
        toast.error("Error al eliminar");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
               <div className="size-2 bg-primary/30 rounded-full" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Documentos Nexus</h2>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-none" onClick={handleCreate} disabled={isPending}>
            <Plus className="h-4 w-4" />
          </Button>
      </div>

      <div className={cn(
          "rounded-none border-2 border-primary/10 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col h-[750px] shadow-2xl relative",
      )}>
          <div className="p-4 border-b-2 border-foreground/5 bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Archivos de Planificación</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={cn(
                  "group flex items-center justify-between p-4 border-2 transition-all cursor-pointer relative overflow-hidden",
                  selectedId === doc.id 
                    ? "bg-foreground text-background border-foreground shadow-lg scale-[1.02] z-10" 
                    : "bg-background border-foreground/5 hover:border-primary/40 text-muted-foreground/80 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className={cn("size-4 flex-shrink-0", selectedId === doc.id ? "text-background" : "text-primary/60")} />
                  <span className="truncate font-black uppercase text-[12px] tracking-tight">{doc.name}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500 hover:text-white transition-all rounded-none shrink-0",
                    selectedId === doc.id && "bg-background/10 hover:bg-background/20 text-background"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center gap-4 opacity-10 border-4 border-dashed border-foreground/5 font-black uppercase text-[10px] tracking-widest">
                  <FileText className="size-12" />
                  <p>Sin Documentos</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
