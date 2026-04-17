"use client"

import { useState } from "react";
import { DocumentList } from "./DocumentList";
import { DocumentEditor } from "./DocumentEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface PlanningTabProps {
  projectId: string;
  projectName: string;
  initialDocuments: any[];
}

export function PlanningTab({ projectId, projectName, initialDocuments }: PlanningTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDocuments.length > 0 ? initialDocuments[0].id : null
  );

  const selectedDocument = initialDocuments.find((d) => d.id === selectedId);

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr] animate-in fade-in duration-700">
      <DocumentList
        projectId={projectId}
        documents={initialDocuments}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      
      <div className="min-w-0">
        {selectedDocument ? (
          <DocumentEditor document={selectedDocument} projectName={projectName} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-4 border-dashed rounded-none p-12 text-center bg-muted/10 h-[750px] border-foreground/5">
            <Info className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-black uppercase tracking-tight">Selecciona un documento</h3>
            <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest max-w-sm mt-4">
              Crea o selecciona un archivo de planificación para comenzar a estructurar tu proyecto con ayuda de la IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
