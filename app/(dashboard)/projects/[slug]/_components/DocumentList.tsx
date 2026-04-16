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
    <div className="flex flex-col gap-2 w-full max-w-[250px] border-r pr-4 h-[calc(100vh-250px)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Documentos</h3>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCreate} disabled={isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={cn(
              "group flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors",
              selectedId === doc.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{doc.name}</span>
            </div>
            <button
              onClick={(e) => handleDelete(e, doc.id)}
              className={cn(
                "opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity",
                selectedId === doc.id && "text-primary-foreground hover:text-red-200"
              )}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-xs text-muted-foreground italic p-2 text-center">Sin documentos.</p>
        )}
      </div>
    </div>
  );
}
