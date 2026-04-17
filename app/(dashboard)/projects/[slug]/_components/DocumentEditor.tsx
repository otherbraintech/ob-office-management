"use client"

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Wand2, Download, Ticket, Eye, Code, Copy, Sparkles } from "lucide-react";
import { updateDocument, generateTicketsFromDocument, assistDocumentGeneration } from "@/app/actions/documents";
import { useTransition } from "react";
import { toast } from "sonner";
import { exportDocumentsToZip } from "@/lib/utils/export";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentEditorProps {
  document: any;
  projectName: string;
}

export function DocumentEditor({ document, projectName }: DocumentEditorProps) {
  const [content, setContent] = useState(document.content);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssisting, setIsAssisting] = useState(false);

  useEffect(() => {
    setContent(document.content);
  }, [document]);

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateDocument(document.id, content);
        toast.success("Guardado");
      } catch (error) {
        toast.error("Error al guardar");
      }
    });
  };

  const handleExport = () => {
    exportDocumentsToZip(projectName, [{ name: document.name, content }]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado al portapapeles");
  };

  const handleGenerateTickets = () => {
    setIsGenerating(true);
    startTransition(async () => {
      try {
        const result = await generateTicketsFromDocument(document.id, document.projectId);
        toast.success(`Se han generado ${result.count} tickets en el módulo 'Planificación'`);
      } catch (error) {
        toast.error("Error al generar tickets");
      } finally {
        setIsGenerating(false);
      }
    });
  };

  const handleAssistGeneration = () => {
    setIsAssisting(true);
    startTransition(async () => {
       try {
           const updatedDoc = await assistDocumentGeneration(document.projectId, document.id);
           setContent(updatedDoc.content);
           toast.success("Plantilla generada con éxito");
       } catch (error) {
           toast.error("Error al generar la plantilla");
       } finally {
           setIsAssisting(false);
       }
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 h-[750px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-foreground/5 pb-4">
        <div>
           <h3 className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/40 mb-1">Archivo Nexus Activo</h3>
           <p className="font-black uppercase text-xl tracking-tighter">{document.name}.md</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" className="rounded-none border-2 font-black uppercase text-[9px] tracking-widest h-10 px-4" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-2" />
            Exportar
          </Button>
          <Button size="sm" variant="outline" className="rounded-none border-2 font-black uppercase text-[9px] tracking-widest h-10 px-4" onClick={handleCopy}>
             <Copy className="h-3.5 w-3.5 mr-2" />
             Copiar
          </Button>
          <Button size="sm" className="rounded-none bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-widest h-10 px-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]" onClick={handleGenerateTickets} disabled={isGenerating || isPending}>
            <Ticket className="h-3.5 w-3.5 mr-2" />
            {isGenerating ? "Procesando..." : "Generar Tickets"}
          </Button>
          <Button size="sm" className="rounded-none bg-foreground text-background font-black uppercase text-[9px] tracking-widest h-10 px-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]" onClick={handleSave} disabled={isPending}>
            <Save className="h-3.5 w-3.5 mr-2" />
            {isPending ? "Sincronizando..." : "Guardar"}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
            <TabsList className="bg-muted/30 p-1 rounded-none border-b-2 border-foreground/5 h-10">
                <TabsTrigger value="edit" className="rounded-none text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background"><Code className="h-3 w-3 mr-2" /> Editar</TabsTrigger>
                <TabsTrigger value="preview" className="rounded-none text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background"><Eye className="h-3 w-3 mr-2" /> Vista Previa</TabsTrigger>
            </TabsList>
            
            <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 rounded-none font-black uppercase text-[9px] tracking-widest h-10" onClick={handleAssistGeneration} disabled={isAssisting || isPending}>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {isAssisting ? "Consultando IA..." : "Generar Plantilla Nexus"}
            </Button>
        </div>

        <TabsContent value="edit" className="flex-1 mt-0 border-2 border-foreground/5 relative data-[state=active]:flex min-h-0 overflow-hidden">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-none h-full w-full font-mono text-sm p-6 leading-relaxed bg-muted/5 shadow-none focus-visible:ring-0 rounded-none"
              placeholder="# Inicia la planificación de arquitectura..."
            />
            <div className="absolute bottom-6 right-6 opacity-5 pointer-events-none">
              <Sparkles className="size-24" />
            </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0 border-2 border-foreground/5 p-8 bg-background overflow-y-auto data-[state=active]:block min-h-0 rounded-none scrollbar-thin">
            {content ? (
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none w-full prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-p:font-medium prose-p:text-muted-foreground/80">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center gap-4 opacity-10 border-4 border-dashed border-foreground/5 font-black uppercase text-[10px] tracking-widest">
                    <Wand2 className="size-16" />
                    <p>El documento requiere contenido técnico</p>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
